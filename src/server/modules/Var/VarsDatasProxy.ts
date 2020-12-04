import * as moment from 'moment';
import { Moment } from 'moment';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleVar from '../../../shared/modules/Var/ModuleVar';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../shared/tools/DateHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import StackContext from '../../StackContext';
import BGThreadServerController from '../BGThread/BGThreadServerController';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ForkedTasksController from '../Fork/ForkedTasksController';
import VarsdatasComputerBGThread from './bgthreads/VarsdatasComputerBGThread';
import VarsServerController from './VarsServerController';
import VarsTabsSubsController from './VarsTabsSubsController';

/**
 * L'objectif est de créer un proxy d'accès aux données des vars_datas en base pour qu'on puisse intercaler un buffer de mise à jour progressif en BDD
 *  De cette manière, on peut ne pas attendre de mettre à ajour en bdd avant de refaire un batch de calcul et pour autant profiter de ces valeurs calculées et pas en base
 *  On cherchera alors à dépiler ce buffer dès qu'on a moins de calculs en cours et donc moins besoin de ressources pour les calculs
 */
export default class VarsDatasProxy {

    public static TASK_NAME_prepend_var_datas = 'VarsDatasProxy.prepend_var_datas';
    public static TASK_NAME_append_var_datas = 'VarsDatasProxy.append_var_datas';

    /**
     * Multithreading notes :
     *  - There's only one bgthread doing all the computations, and separated from the other threads if the project decides to do so
     *  - Everything in this controller is running in the var calculation bg thread
     */
    public static getInstance(): VarsDatasProxy {
        if (!VarsDatasProxy.instance) {
            VarsDatasProxy.instance = new VarsDatasProxy();
        }
        return VarsDatasProxy.instance;
    }

    private static instance: VarsDatasProxy = null;

    /**
     * Version liste pour prioriser les demandes
     */
    private vars_datas_buffer: VarDataBaseVO[] = [];
    private vars_datas_buffer_indexes: { [index: string]: VarDataBaseVO } = {};

    protected constructor() {
        ForkedTasksController.getInstance().register_task(VarsDatasProxy.TASK_NAME_prepend_var_datas, this.prepend_var_datas.bind(this));
        ForkedTasksController.getInstance().register_task(VarsDatasProxy.TASK_NAME_append_var_datas, this.append_var_datas.bind(this));
    }

    /**
     * ATTENTION - Appeler uniquement sur le thread du VarsComputer
     * A utiliser pour prioriser normalement la demande - FIFO
     *  Cas standard
     */
    public append_var_datas(var_datas: VarDataBaseVO[]) {
        if ((!var_datas) || (!var_datas.length)) {
            return;
        }

        if (!ForkedTasksController.getInstance().exec_self_on_bgthread(VarsdatasComputerBGThread.getInstance().name, VarsDatasProxy.TASK_NAME_append_var_datas, var_datas)) {
            return;
        }

        var_datas = this.filter_var_datas_by_indexes(var_datas, false);
    }

    /**
     * ATTENTION - Appeler uniquement sur le thread du VarsComputer
     * A utiliser pour prioriser la demande par rapport à toutes les autres - LIFO
     *  Principalement pour le cas d'une demande du navigateur client, on veut répondre ASAP
     *  et si on doit ajuster le calcul on renverra l'info plus tard
     */
    public prepend_var_datas(var_datas: VarDataBaseVO[]) {
        if ((!var_datas) || (!var_datas.length)) {
            return;
        }

        if (!ForkedTasksController.getInstance().exec_self_on_bgthread(VarsdatasComputerBGThread.getInstance().name, VarsDatasProxy.TASK_NAME_prepend_var_datas, var_datas)) {
            return;
        }

        var_datas = this.filter_var_datas_by_indexes(var_datas, true);

        if ((!var_datas) || (!var_datas.length)) {
            return;
        }

        // On lance le calcul quand on prepend ici ça veut dire qu'on attend une réponse rapide
        BGThreadServerController.getInstance().executeBGThread(VarsdatasComputerBGThread.getInstance().name);
    }

    /**
     * On indique en param le nombre de vars qu'on accepte de gérer dans le buffer
     *  Le dépilage se fait dans l'ordre de la déclaration, via une itération
     *  Si un jour l'ordre diffère dans JS, on passera sur une liste en FIFO, c'est le but dans tous les cas
     * @returns 0 si on a géré limit éléments dans le buffer, != 0 sinon
     */
    public async handle_buffer(): Promise<void> {

        // let handled: VarDataBaseVO[] = [];

        let vars_datas_buffer_copy = Array.from(this.vars_datas_buffer);

        let i = 0;
        while (i < vars_datas_buffer_copy.length) {

            let handle_var = vars_datas_buffer_copy[i];
            // Si on a des vars à gérer (!has_valid_value) qui s'insèrent en début de buffer, on doit arrêter le dépilage => surtout pas sinon on tourne en boucle
            if (!VarsServerController.getInstance().has_valid_value(handle_var)) {
                // break;
                i++;
                continue;
            }

            // ConsoleHandler.getInstance().log('REMOVETHIS:handle_buffer:' + handle_var.index + ':');
            // handled.push(handle_var);
            let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(handle_var);
            if ((!res) || (!res.id)) {
                ConsoleHandler.getInstance().error("VarsDatasProxy:handle_buffer:FAILED update vo:index:" + handle_var.index + ":id:" + handle_var.id + ":");
                /**
                 * Si l'insère/update échoue c'est très probablement par ce qu'on a déjà une data en base sur cet index,
                 *  dans ce cas on résoud le conflit en forçant la nouvelle valeur sur l'ancien index
                 */
                let datas: VarDataBaseVO[] = await ModuleDAO.getInstance().getVosByExactMatroids<VarDataBaseVO, VarDataBaseVO>(handle_var._type, [handle_var], null);
                if (datas && datas.length && datas[0] && (datas[0].value_type != VarDataBaseVO.VALUE_TYPE_IMPORT) &&
                    ((!datas[0].value_ts) || (datas[0].value_ts < handle_var.value_ts))) {
                    handle_var.id = datas[0].id;
                    res = await ModuleDAO.getInstance().insertOrUpdateVO(handle_var);
                    if ((!res) || (!res.id)) {
                        ConsoleHandler.getInstance().error("VarsDatasProxy:handle_buffer:FAILED SECOND update vo:index:" + handle_var.index + ":id:" + handle_var.id + ":");
                    }
                }
            }
            delete this.vars_datas_buffer_indexes[handle_var.index];
            this.vars_datas_buffer.splice(this.vars_datas_buffer.indexOf(handle_var), 1);
            i++;
        }
    }

    /**
     * On a explicitement pas l'id à ce niveau donc on cherche par l'index plutôt
     */
    public async get_exact_param_from_buffer_or_bdd<T extends VarDataBaseVO>(var_data: T): Promise<T> {

        if (this.vars_datas_buffer_indexes[var_data.index]) {
            return this.vars_datas_buffer_indexes[var_data.index] as T;
        }

        if (var_data.id) {
            return await ModuleDAO.getInstance().getVoById<T>(var_data._type, var_data.id, VOsTypesManager.getInstance().moduleTables_by_voType[var_data._type].get_segmented_field_raw_value_from_vo(var_data));
        }

        let res: T[] = await ModuleDAO.getInstance().getVosByExactMatroids<T, T>(var_data._type, [var_data], null);

        if (res && res.length) {
            return res[0];
        }
        return null;
    }

    /**
     * On a explicitement pas l'id à ce niveau donc on cherche par l'index plutôt
     * On optimise la recherche en base en faisant un seul appel
     */
    public async get_exact_params_from_buffer_or_bdd<T extends VarDataBaseVO>(var_datas: T[]): Promise<T[]> {

        let res: T[] = [];
        let check_in_bdd_per_type: { [type: string]: T[] } = {};
        for (let i in var_datas) {
            let var_data = var_datas[i];

            let e = null;
            if (this.vars_datas_buffer_indexes[var_data.index]) {
                e = this.vars_datas_buffer_indexes[var_data.index] as T;
            }

            if (e) {
                res.push(e);
            } else {

                if (!var_data.check_param_is_valid(var_data._type)) {
                    ConsoleHandler.getInstance().error('Les champs du matroid ne correspondent pas à son typage:' + var_data.index);
                    continue;
                }

                if (!check_in_bdd_per_type[var_data._type]) {
                    check_in_bdd_per_type[var_data._type] = [];
                }
                check_in_bdd_per_type[var_data._type].push(var_data);
            }
        }

        let promises = [];
        for (let _type in check_in_bdd_per_type) {
            let check_in_bdd = check_in_bdd_per_type[_type];

            promises.push((async () => {
                let bdd_res: T[] = await ModuleDAO.getInstance().getVosByExactMatroids<T, T>(_type, check_in_bdd, null);

                if (bdd_res && bdd_res.length) {
                    res = (res && res.length) ? res.concat(bdd_res) : bdd_res;
                }
            })());
        }
        await Promise.all(promises);

        return res;
    }

    /**
     * On charge en priorité depuis le buffer, puisque si le client demande des calculs on va les mettre en priorité ici, avant de calculer puis les remettre en attente d'insertion en base
     *  (dont en fait elles partent juste jamais)
     * @param request_limit nombre max de vars_datas à renvoyer
     */
    public async get_vars_to_compute_from_buffer_or_bdd(request_limit: number): Promise<{ [index: string]: VarDataBaseVO }> {

        let res: { [index: string]: VarDataBaseVO } = {};

        /**
         * On commence par collecter le max de datas depuis le buffer : Les conditions de sélection d'un var :
         *  - est-ce que la data a une valeur undefined ? oui => sélectionnée
         *  - est-ce que la data peut expirer et a expiré ? oui => sélectionnée
         */
        for (let i in this.vars_datas_buffer) {

            if (request_limit <= 0) {
                return res;
            }

            let var_data = this.vars_datas_buffer[i];

            if (!VarsServerController.getInstance().has_valid_value(var_data)) {
                res[var_data.index] = var_data;

                // ConsoleHandler.getInstance().log('REMOVETHIS:get_vars_to_compute_from_buffer_or_bdd:' + var_data.index + ':');

                request_limit--;
                continue;
            }
        }

        /**
         * Si on a des datas en attente dans le buffer on commence par ça
         */
        if (ObjectHandler.getInstance().hasAtLeastOneAttribute(res)) {
            return res;
        }

        let bdd_datas: { [index: string]: VarDataBaseVO } = await this.get_vars_to_compute_from_bdd(request_limit);
        for (let i in bdd_datas) {
            let bdd_data = bdd_datas[i];

            /**
             * Attention : à ce stade en base on va trouver des datas qui sont pas computed mais qu'on retrouve par exemple comme computed
             *  et valide (donc pas sélectionnées) dans le buffer d'attente de mise à jour en bdd. Donc on doit ignorer tous les ids
             *  des vars qui sont dans le buffer... (avantage ça concerne pas celles qui sont pas créées puisqu'il faut un id et la liste
             *  des ids reste relativement dense)...
             */
            if (!!this.vars_datas_buffer.find((var_data: VarDataBaseVO) => var_data.index == bdd_data.index)) {
                continue;
            }

            res[bdd_data.index] = bdd_data;
        }

        /**
         * Si on fait les calculs depuis la Bdd, on mets les vardats dans la pile de mise en cache
         */
        if (bdd_datas && ObjectHandler.getInstance().hasAtLeastOneAttribute(bdd_datas)) {
            this.prepend_var_datas(Object.values(bdd_datas));
        }

        return res;
    }

    /**
     * TODO FIXME REFONTE VARS c'est à que la plus grosse opti doit se faire, et peut-etre via du machine learning par ce que pas évident de savoir quelle est la bonne strat
     *  Il faut à tout prix pouvoir monitorer la performance de cette fonction
     */
    private async get_vars_to_compute_from_bdd(request_limit: number): Promise<{ [index: string]: VarDataBaseVO }> {
        let vars_datas: { [index: string]: VarDataBaseVO } = {};
        let nb_vars_datas: number = 0;

        for (let api_type_id in VarsServerController.getInstance().varcacheconf_by_api_type_ids) {

            if (request_limit <= nb_vars_datas) {
                return vars_datas;
            }

            let varcacheconf_by_var_ids = VarsServerController.getInstance().varcacheconf_by_api_type_ids[api_type_id];
            let condition = '(';
            let first: boolean = true;

            for (let var_id in varcacheconf_by_var_ids) {
                let varcacheconf: VarCacheConfVO = varcacheconf_by_var_ids[var_id];

                if (!first) {
                    condition += ' OR (';
                } else {
                    condition += '(';
                }
                first = false;

                if (!!varcacheconf.cache_timeout_ms) {
                    let timeout: Moment = moment().utc(true).add(-varcacheconf.cache_timeout_ms, 'ms');
                    condition += 'var_id = ' + varcacheconf.var_id + ' and (value_ts is null or value_ts < ' + DateHandler.getInstance().getUnixForBDD(timeout) + ')';
                } else {
                    condition += 'var_id = ' + varcacheconf.var_id + ' and value_ts is null';
                }

                condition += ')';
            }
            condition += ')';

            condition += ' and value_type = ' + VarDataBaseVO.VALUE_TYPE_COMPUTED + ' limit ' + request_limit + ';';

            // On doit aller chercher toutes les varsdatas connues pour être cachables (on se fout du var_id à ce stade on veut juste des api_type_ids des varsdatas compatibles)
            //  Attention les données importées ne doivent pas être remises en question
            let vars_datas_tmp: VarDataBaseVO[] = [];
            vars_datas_tmp = await ModuleDAOServer.getInstance().selectAll<VarDataBaseVO>(api_type_id, ' where ' + condition);

            for (let vars_datas_tmp_i in vars_datas_tmp) {
                if (nb_vars_datas >= request_limit) {
                    return vars_datas;
                }

                let var_data_tmp = vars_datas_tmp[vars_datas_tmp_i];

                nb_vars_datas++;
                vars_datas[var_data_tmp.index] = var_data_tmp;
            }
            if (nb_vars_datas >= request_limit) {
                return vars_datas;
            }
        }

        return vars_datas;
    }

    /**
     * On filtre les demande de append ou prepend par les indexes déjà en attente par ce qu'on peut pas avoir 2 fois le même index dans la liste
     * Du coup si on demande quelque chose sur un index déjà listé, on ignore juste la demande pour le moment
     * On met à jour la map des indexs au passage
     * @param var_datas
     */
    private filter_var_datas_by_indexes(var_datas: VarDataBaseVO[], prepend: boolean): VarDataBaseVO[] {

        let self = this;

        let res: VarDataBaseVO[] = [];
        for (let i in var_datas) {
            let var_data = var_datas[i];

            if (this.vars_datas_buffer_indexes[var_data.index]) {
                continue;
            }
            this.vars_datas_buffer_indexes[var_data.index] = var_data;
            res.push(var_data);
        }

        if (prepend) {
            var_datas.forEach((vd) => self.vars_datas_buffer.unshift(vd));
        } else {
            this.vars_datas_buffer = this.vars_datas_buffer.concat(var_datas);
        }

        return res;
    }
}