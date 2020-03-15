import moment = require('moment');
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import ISimpleNumberVarData from '../../../../shared/modules/Var/interfaces/ISimpleNumberVarData';
import ModuleVar from '../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../shared/modules/Var/VarsController';
import VarCacheConfVO from '../../../../shared/modules/Var/vos/VarCacheConfVO';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../../shared/tools/DateHandler';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModulePushDataServer from '../../PushData/ModulePushDataServer';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';

export default class VarsdatasComputerBGThread implements IBGThread {

    public static getInstance() {
        if (!VarsdatasComputerBGThread.instance) {
            VarsdatasComputerBGThread.instance = new VarsdatasComputerBGThread();
        }
        return VarsdatasComputerBGThread.instance;
    }

    private static instance: VarsdatasComputerBGThread = null;

    public server_ready: boolean = false;

    public uid_waiting_for_indexes: { [index: string]: { [uid: number]: boolean } } = {};

    public current_timeout: number = 2000;
    public MAX_timeout: number = 2000;
    public MIN_timeout: number = 100;

    public timeout: number = 500;
    public request_limit: number = 500;

    private enabled: boolean = true;
    private invalidations: number = 0;

    private silent: boolean = false;

    private constructor() {
    }

    public disable() {
        this.invalidations++;
        this.enabled = false;
    }

    public enable() {
        this.invalidations--;
        this.enabled = (this.invalidations == 0);
    }

    get name(): string {
        return "VarsdatasComputerBGThread";
    }

    public async work(): Promise<number> {

        try {

            if (!this.server_ready) {
                return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;
            }

            // On se donne timeout ms pour calculer des vars, après on arrête et on rend la main.
            //  On indique le nombre de var qu'on a pu calculer en info, et si on a timeout et pas fini, on retourne true pour continuer rapidement
            let start: number = moment().utc(true).valueOf();
            let nb_computed: number = 0;

            let vars_datas: ISimpleNumberVarData[] = await this.get_vars_to_compute();
            if ((!vars_datas) || (!vars_datas.length)) {
                return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;
            }

            // TODO FIXME Pour le cas de la table segmented et du limit qui s'applique en fait à chaque requete... à optimiser...
            vars_datas = vars_datas.splice(0, this.request_limit);

            let vars_datas_by_ids: { [id: number]: ISimpleNumberVarData } = VOsTypesManager.getInstance().vosArray_to_vosByIds(vars_datas);
            while (vars_datas && vars_datas.length) {

                if (!this.enabled) {
                    return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;
                }

                // On doit stocker le lien entre index et id pour ensuite pouvoir supprimer les anciens ids potentiellement ou mettre à jour les valeurs
                let index_to_id: { [index: string]: number } = {};
                for (let i in vars_datas) {
                    let var_data = vars_datas[i];

                    index_to_id[VarsController.getInstance().getIndex(var_data)] = var_data.id;
                }


                // On est le seul thread de l'appli à faire des calculs, on se permet de vider l'arbre entre chaque calcul
                VarsController.getInstance().varDAG.clearDAG();
                let computed_datas: ISimpleNumberVarData[] = await VarsController.getInstance().registerDataParamsAndReturnVarDatas(vars_datas, true, true);

                if (!this.enabled) {
                    return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;
                }

                // On tente de supprimer les vars dont la value est 0 après calcul. ATTENTION aux effets de bord potentiels ...
                let computed_datas_to_delete: ISimpleNumberVarData[] = [];
                let computed_datas_to_update: ISimpleNumberVarData[] = [];

                for (let i in computed_datas) {
                    let computed_data = computed_datas[i];
                    let var_index: string = VarsController.getInstance().getIndex(computed_data);
                    let var_data: ISimpleNumberVarData = vars_datas_by_ids[index_to_id[var_index]];

                    if (!var_data) {
                        ConsoleHandler.getInstance().error('VarsdatasComputerBGThread:Impossible de retrouver la data source...');
                        continue;
                    }

                    if (ModuleVar.varcacheconf_by_var_ids[computed_data.var_id] && ModuleVar.varcacheconf_by_var_ids[computed_data.var_id].consider_null_as_0_and_auto_clean_0_in_cache && !computed_data.value) {
                        computed_datas_to_delete.push(var_data);
                    } else {
                        var_data.value = (!computed_data.value) ? 0 : computed_data.value;
                        computed_datas_to_update.push(var_data);
                    }

                    var_data.value_ts = moment().utc(true);
                    var_data.value_type = VarsController.VALUE_TYPE_COMPUTED;

                    if (this.uid_waiting_for_indexes[var_index]) {
                        for (let uid in this.uid_waiting_for_indexes[var_index]) {

                            ModulePushDataServer.getInstance().notifyVarData(parseInt(uid.toString()), var_data);
                        }
                        delete this.uid_waiting_for_indexes[var_index];
                    }
                }

                await ModuleDAO.getInstance().insertOrUpdateVOs(computed_datas_to_update);
                await ModuleDAO.getInstance().deleteVOs(computed_datas_to_delete);

                nb_computed += computed_datas.length;

                let now: number = moment().utc(true).valueOf();
                let elapsed = now - start;

                if (elapsed > this.timeout) {

                    if (nb_computed == this.request_limit) {
                        if (!this.silent) {
                            ConsoleHandler.getInstance().log('VarsdatasComputerBGThread computed :' + nb_computed + ': vars. To be continued...');
                        }
                        return ModuleBGThreadServer.TIMEOUT_COEF_RUN;
                    } else {
                        if (!this.silent) {
                            ConsoleHandler.getInstance().log('VarsdatasComputerBGThread computed :' + nb_computed + ': vars. The End.');
                        }
                        return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
                    }
                }

                vars_datas = await this.get_vars_to_compute();
                if ((!vars_datas) || (!vars_datas.length)) {
                    return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;
                }
                vars_datas_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(vars_datas);
            }

            if (nb_computed > 0) {
                if (!this.silent) {
                    ConsoleHandler.getInstance().log('VarsdatasComputerBGThread computed :' + nb_computed + ': vars. The End.');
                }
            }
            return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
        } catch (error) {
            console.error(error);
        }

        return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;
    }

    private async get_vars_to_compute(): Promise<ISimpleNumberVarData[]> {
        let vars_datas: ISimpleNumberVarData[] = [];
        // OPTI TODO : possible de regrouper les requetes d'une meme api_type_id, en préparant en amont les condition de la requête et en faisant pour tous les var_id en 1 fois
        for (let api_type_id in ModuleVar.varcacheconf_by_api_type_ids) {
            let varcacheconf_by_var_ids = ModuleVar.varcacheconf_by_api_type_ids[api_type_id];
            for (let var_id in varcacheconf_by_var_ids) {
                let varcacheconf: VarCacheConfVO = varcacheconf_by_var_ids[var_id];

                if (!this.enabled) {
                    return null;
                }

                // On doit aller chercher toutes les varsdatas connues pour être cachables (on se fout du var_id à ce stade on veut juste des api_type_ids des varsdatas compatibles)
                let vars_datas_tmp: ISimpleNumberVarData[] = [];
                if (!!varcacheconf.cache_timeout_ms) {
                    let timeout: moment.Moment = moment().utc(true).add(-varcacheconf.cache_timeout_ms, 'ms');
                    vars_datas_tmp = await ModuleDAOServer.getInstance().selectAll<ISimpleNumberVarData>(api_type_id, ' where var_id = ' + varcacheconf.var_id + ' and (value_ts is null or value_ts < ' + DateHandler.getInstance().getUnixForBDD(timeout) + ') limit ' + this.request_limit + ';');
                } else {
                    vars_datas_tmp = await ModuleDAOServer.getInstance().selectAll<ISimpleNumberVarData>(api_type_id, ' where value_ts is null and var_id = ' + varcacheconf.var_id + ' limit ' + this.request_limit + ';');
                }

                vars_datas = ((!!vars_datas_tmp) && vars_datas_tmp.length) ? vars_datas.concat(vars_datas_tmp) : vars_datas;

                if (vars_datas && (vars_datas.length >= this.request_limit)) {
                    break;
                }
            }
            if (vars_datas && (vars_datas.length >= this.request_limit)) {
                break;
            }
        }

        // TODO FIXME Pour le cas de la table segmented et du limit qui s'applique en fait à chaque requete... à optimiser...
        vars_datas = vars_datas.splice(0, this.request_limit);

        return vars_datas;
    }
}