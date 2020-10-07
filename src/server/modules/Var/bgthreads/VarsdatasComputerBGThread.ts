import * as moment from 'moment';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import VarsComputeController from '../VarsComputeController';
import VarsDatasProxy from '../VarsDatasProxy';
import VarsSocketsSubsController from '../VarsSocketsSubsController';

export default class VarsdatasComputerBGThread implements IBGThread {

    public static getInstance() {
        if (!VarsdatasComputerBGThread.instance) {
            VarsdatasComputerBGThread.instance = new VarsdatasComputerBGThread();
        }
        return VarsdatasComputerBGThread.instance;
    }

    private static instance: VarsdatasComputerBGThread = null;

    public current_timeout: number = 500;
    public MAX_timeout: number = 5000;
    public MIN_timeout: number = 100;

    public timeout: number = 500;
    public request_limit: number = 500;

    private enabled: boolean = true;
    private invalidations: number = 0;

    private silent: boolean = false;

    private semaphore: boolean = false;

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

    /**
     * ATTENTION à n'appeler cette fonction que dans le thread dédié à ce bgthread
     * On veut un système d'appel un peu particulier qui permette de dire si le front demande une valeur de var, on veut dépiler la demande
     *  asap, et sans qu'on puisse avec des lancements en parralèle donc quelque chose qui puisse couper le délai entre 2 appels au bgthread
     *  mais qui en revanche s'assure d'utiliser un sémaphore pour ne jamais lancer 2 fois le calcul
     */
    public async work(): Promise<number> {

        if (!this.enabled) {
            return ModuleBGThreadServer.TIMEOUT_COEF_NEUTRAL;
        }

        if (!this.semaphore) {
            this.semaphore = true;
            let res = await this.do_calculation_run();
            this.semaphore = false;
            return res;
        }
        return ModuleBGThreadServer.TIMEOUT_COEF_RUN;
    }

    private async do_calculation_run(): Promise<number> {
        try {

            /**
             * TODO FIXME REFONTE VARS à voir si on supprime ou pas le timeout suivant la stratégie de dépilage des vars à calculer au final
             *  soit on fait un batch par appel au bgthread soit on dépile x vars, soit on se donne x ms et on essaie d'estimer le temps de calcul en fonction des vars en attente, ...
             *  Dans tous les cas la plus grosse optimisation est certainement sur le choix des vars à grouper pour un calcul le plus efficace possible et dans la limite
             *      de temps par batch qu'on veut se donner (si le plus efficace c'est de calculer toute la base d'un coup mais que ça prend 1H on fera pas ça dans tous les cas)
             */
            // On se donne timeout ms pour calculer des vars, après on arrête et on rend la main.
            //  On indique le nombre de var qu'on a pu calculer en info, et si on a timeout et pas fini, on retourne true pour continuer rapidement
            let start: number;
            let end_selection: number;
            let end_computation: number;
            let end_notification: number;
            let end_update: number;

            let nb_computed: number = 0;

            if (!this.silent) {
                start = moment().utc(true).valueOf();
            }

            let vars_datas: { [index: string]: VarDataBaseVO } = await VarsDatasProxy.getInstance().get_vars_to_compute_from_buffer_or_bdd(this.request_limit);
            if ((!vars_datas) || (!ObjectHandler.getInstance().hasAtLeastOneAttribute(vars_datas))) {
                return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
            }

            if (!this.silent) {
                end_selection = moment().utc(true).valueOf();
            }

            /**
             * Fonctionnement :
             *  - On a sélectionné une liste de vars à calculer.
             *  - On demande au VarsComputeController de faire les calculs et de renvoyer la data
             *  - Une fois le calcul fait, on renvoie l'info aux sockets abonnés
             *  - Et on met à jour la bdd asap => insert or update puisqu'on peut avoir des demandes qui sont en mémoires et pas en base
             *      => attention pour sécuriser ce point il faudrait déclarer une clé unique sur les var datas et sécuriser le insert or update pour qu'en cas d'insertion ratée pour
             *          clé dupliquée, on retrouve le vo avec la même clé unique et on le mette à jour du coup au lieu d'insérer
             *      => La mise à jour asap est nécessaire uniquement si on a pas de cache de vars datas en mémoire en instance d'insertion en base, mais
             *          on peut imaginer d'avoir un bgthread qui traite les insert or update de vars datas en base et que les calculs par exemple prenne en compte aussi cette stack en attente
             *  - on libère le bgthread, en indiquant qu'on a eu des choses à gérer donc il faut revenir très rapidement
             */

            await VarsComputeController.getInstance().compute(vars_datas);

            if (!this.silent) {
                end_computation = moment().utc(true).valueOf();
            }

            VarsSocketsSubsController.getInstance().notify_vardatas(vars_datas);

            if (!this.silent) {
                end_notification = moment().utc(true).valueOf();
            }

            let vars_array = Object.values(vars_datas);
            await ModuleDAO.getInstance().insertOrUpdateVOs(vars_array);

            if (!this.silent) {
                end_update = moment().utc(true).valueOf();

                let length_total = end_update - start;
                let length_selection = end_selection - start;
                let length_computation = end_computation - end_selection;
                let length_notif = end_notification - end_computation;
                let length_update = end_update - end_notification;

                ConsoleHandler.getInstance().log('VarsdatasComputerBGThread computed :' + nb_computed + ': vars : took [' +
                    moment.duration(length_total).humanize() + '] total : [' +
                    moment.duration(length_selection).humanize() + '] selecting [' +
                    moment.duration(length_computation).humanize() + '] computing [' +
                    moment.duration(length_notif).humanize() + '] notifying [' +
                    moment.duration(length_update).humanize() + '] updating');
            }


            // return ModuleBGThreadServer.TIMEOUT_COEF_RUN;


            // let vars_datas_by_ids: { [id: number]: VarDataBaseVO } = VOsTypesManager.getInstance().vosArray_to_vosByIds(vars_datas);
            // while (vars_datas && vars_datas.length) {

            //     if (!this.enabled) {
            //         return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;
            //     }

            //     // On doit stocker le lien entre index et id pour ensuite pouvoir supprimer les anciens ids potentiellement ou mettre à jour les valeurs
            //     let index_to_id: { [index: string]: number } = {};
            //     for (let i in vars_datas) {
            //         let var_data = vars_datas[i];

            //         index_to_id[var_data.index] = var_data.id;
            //     }

            //     let computed_datas: VarDataBaseVO[] = await VarsController.getInstance().registerDataParamsAndReturnVarDatas(vars_datas, true, true);
            //     VarsController.getInstance().clean_caches_and_vardag();

            //     // if (!this.enabled) {
            //     //     return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;
            //     // }

            //     // On tente de supprimer les vars dont la value est 0 après calcul. ATTENTION aux effets de bord potentiels ...
            //     let computed_datas_to_delete: VarDataBaseVO[] = [];
            //     let computed_datas_to_update: VarDataBaseVO[] = [];
            //     let datas_notif: VarDataBaseVO[] = [];

            //     for (let i in computed_datas) {
            //         let computed_data = computed_datas[i];
            //         let var_index: string = computed_data.index;
            //         let var_data: VarDataBaseVO = vars_datas_by_ids[index_to_id[var_index]];

            //         if (!var_data) {
            //             ConsoleHandler.getInstance().error('VarsdatasComputerBGThread:Impossible de retrouver la data source...');
            //             continue;
            //         }

            //         // A SUPPRIMER si suppression de consider_null_as_0_and_auto_clean_0_in_cache dans VarCacheConfVO
            //         // if (ModuleVarServer.getInstance().varcacheconf_by_var_ids[computed_data.var_id] && ModuleVarServer.getInstance().varcacheconf_by_var_ids[computed_data.var_id].consider_null_as_0_and_auto_clean_0_in_cache && !computed_data.value) {
            //         //     computed_datas_to_delete.push(var_data);
            //         // } else {
            //         var_data.value = (!computed_data.value) ? 0 : computed_data.value;
            //         computed_datas_to_update.push(var_data);
            //         // }

            //         var_data.value_ts = moment().utc(true);
            //         var_data.value_type = VarDataBaseVO.VALUE_TYPE_COMPUTED;

            //         datas_notif.push(var_data);
            //     }

            //     VarServerController.getInstance().notify_computedvardatas(datas_notif);
            //     await ModuleDAO.getInstance().insertOrUpdateVOs(computed_datas_to_update);
            //     await ModuleDAO.getInstance().deleteVOs(computed_datas_to_delete);

            //     nb_computed += computed_datas.length;

            //     let now: number = moment().utc(true).valueOf();
            //     let elapsed = now - start;

            //     if (elapsed > this.timeout) {

            //         if (nb_computed == this.request_limit) {
            //             if (!this.silent) {
            //                 ConsoleHandler.getInstance().log('VarsdatasComputerBGThread computed :' + nb_computed + ': vars. To be continued...');
            //             }
            //             return ModuleBGThreadServer.TIMEOUT_COEF_RUN;
            //         } else {
            //             if (!this.silent) {
            //                 ConsoleHandler.getInstance().log('VarsdatasComputerBGThread computed :' + nb_computed + ': vars. The End.');
            //             }
            //             return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
            //         }
            //     }

            //     vars_datas = await this.get_vars_to_compute();
            //     if ((!vars_datas) || (!vars_datas.length)) {
            //         return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;
            //     }
            //     vars_datas_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(vars_datas);
            // }

            // if (nb_computed > 0) {
            //     if (!this.silent) {
            //         ConsoleHandler.getInstance().log('VarsdatasComputerBGThread computed :' + nb_computed + ': vars. The End.');
            //     }
            // }
            // return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
        } catch (error) {
            console.error(error);
        }

        return ModuleBGThreadServer.TIMEOUT_COEF_RUN;
    }
}