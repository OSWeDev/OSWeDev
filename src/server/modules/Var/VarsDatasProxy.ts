import * as moment from 'moment';
import { Moment } from 'moment';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import DAGController from '../../../shared/modules/Var/graph/dagbase/DAGController';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataProxyWrapperVO from '../../../shared/modules/Var/vos/VarDataProxyWrapperVO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../shared/tools/DateHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import BGThreadServerController from '../BGThread/BGThreadServerController';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ForkedTasksController from '../Fork/ForkedTasksController';
import VarsdatasComputerBGThread from './bgthreads/VarsdatasComputerBGThread';
import VarCtrlDAGNode from './controllerdag/VarCtrlDAGNode';
import VarsServerController from './VarsServerController';

/**
 * L'objectif est de créer un proxy d'accès aux données des vars_datas en base pour qu'on puisse intercaler un buffer de mise à jour progressif en BDD
 *  De cette manière, on peut ne pas attendre de mettre à ajour en bdd avant de refaire un batch de calcul et pour autant profiter de ces valeurs calculées et pas en base
 *  On cherchera alors à dépiler ce buffer dès qu'on a moins de calculs en cours et donc moins besoin de ressources pour les calculs
 */
export default class VarsDatasProxy {

    public static TASK_NAME_prepend_var_datas = 'VarsDatasProxy.prepend_var_datas';
    public static TASK_NAME_append_var_datas = 'VarsDatasProxy.append_var_datas';
    public static TASK_NAME_update_existing_buffered_older_datas = 'VarsDatasProxy.update_existing_buffered_older_datas';

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
    private vars_datas_buffer_wrapped_indexes: { [index: string]: VarDataProxyWrapperVO<VarDataBaseVO> } = {};

    private semaphore_handle_buffer: boolean = false;

    protected constructor() {
        ForkedTasksController.getInstance().register_task(VarsDatasProxy.TASK_NAME_prepend_var_datas, this.prepend_var_datas.bind(this));
        ForkedTasksController.getInstance().register_task(VarsDatasProxy.TASK_NAME_append_var_datas, this.append_var_datas.bind(this));
        ForkedTasksController.getInstance().register_task(VarsDatasProxy.TASK_NAME_update_existing_buffered_older_datas, this.update_existing_buffered_older_datas.bind(this));
    }

    public has_cached_index(index: string) {
        return !!this.vars_datas_buffer_wrapped_indexes[index];
    }

    public async get_var_datas_or_ask_to_bgthread(params: VarDataBaseVO[], notifyable_vars: VarDataBaseVO[], needs_computation: VarDataBaseVO[]): Promise<void> {

        let varsdata: VarDataBaseVO[] = await VarsDatasProxy.getInstance().get_exact_params_from_buffer_or_bdd(params);

        if (varsdata) {

            varsdata.forEach((vardata) => {
                if (VarsServerController.getInstance().has_valid_value(vardata)) {
                    notifyable_vars.push(vardata);
                }
            });
            // On insère quand même dans le cache par ce qu'on veut stocker l'info du read
            VarsDatasProxy.getInstance().prepend_var_datas(varsdata, true);
        }

        if ((!varsdata) || (varsdata.length != params.length)) {

            /**
             * On doit chercher les datas manquantes, et les prepend sur le proxy
             */
            let vars_datas_by_index: { [index: string]: VarDataBaseVO } = {};
            if (varsdata) {
                varsdata.forEach((vardata) => {
                    vars_datas_by_index[vardata.index] = vardata;
                });
            }

            let to_prepend: VarDataBaseVO[] = [];
            for (let i in params) {
                let param = params[i];

                let vardata = vars_datas_by_index[param.index];
                if (vardata) {
                    continue;
                }

                // On a rien en base, on le crée et on attend le résultat
                param.value_ts = null;
                param.value = null;
                param.value_type = VarDataBaseVO.VALUE_TYPE_COMPUTED;

                to_prepend.push(param);
                needs_computation.push(param);
            }

            // On push dans le buffer de mise à jour de la BDD
            VarsDatasProxy.getInstance().prepend_var_datas(to_prepend, false);
        }
    }

    /**
     * ATTENTION - Appeler uniquement sur le thread du VarsComputer
     * A utiliser pour prioriser normalement la demande - FIFO
     *  Cas standard
     */
    public async append_var_datas(var_datas: VarDataBaseVO[]) {
        if ((!var_datas) || (!var_datas.length)) {
            return;
        }

        if (!ForkedTasksController.getInstance().exec_self_on_bgthread(VarsdatasComputerBGThread.getInstance().name, VarsDatasProxy.TASK_NAME_append_var_datas, var_datas)) {
            return;
        }

        var_datas = await this.filter_var_datas_by_indexes(var_datas, false, false, false);
    }

    /**
     * ATTENTION - Appeler uniquement sur le thread du VarsComputer
     * A utiliser pour prioriser la demande par rapport à toutes les autres - LIFO
     *  Principalement pour le cas d'une demande du navigateur client, on veut répondre ASAP
     *  et si on doit ajuster le calcul on renverra l'info plus tard
     */
    public async prepend_var_datas(var_datas: VarDataBaseVO[], does_not_need_insert_or_update: boolean) {
        if ((!var_datas) || (!var_datas.length)) {
            return;
        }

        if (!ForkedTasksController.getInstance().exec_self_on_bgthread(VarsdatasComputerBGThread.getInstance().name, VarsDatasProxy.TASK_NAME_prepend_var_datas, var_datas)) {
            return;
        }

        var_datas = await this.filter_var_datas_by_indexes(var_datas, true, false, does_not_need_insert_or_update);

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

        while (this.semaphore_handle_buffer) {
            await ThreadHandler.getInstance().sleep(9);
        }
        this.semaphore_handle_buffer = true;

        let indexes = Object.keys(this.vars_datas_buffer_wrapped_indexes);
        let self = this;
        let promises = [];

        for (let i in indexes) {
            let index = indexes[i];
            let wrapper = this.vars_datas_buffer_wrapped_indexes[index];
            let handle_var = wrapper.var_data;

            // Si on a des vars à gérer (!has_valid_value) qui s'insèrent en début de buffer, on doit arrêter le dépilage => surtout pas sinon on tourne en boucle
            if (!VarsServerController.getInstance().has_valid_value(handle_var)) {
                // break;
                continue;
            }

            // Si on a pas de modif à gérer et que le dernier accès date, on nettoie
            if ((!wrapper.needs_insert_or_update) && (!wrapper.nb_reads_since_last_insert_or_update) && (wrapper.last_insert_or_update && wrapper.last_insert_or_update.isBefore(moment().utc(true).add(-5, 'minute')))) {
                this.vars_datas_buffer.splice(this.vars_datas_buffer.findIndex((e) => e.index == index), 1);
                delete this.vars_datas_buffer_wrapped_indexes[index];
                continue;
            }

            // Si on a pas de modif à gérer && (pas assez de read à mettre à jour en base ou pas assez anciens) on ignore
            if (
                (!wrapper.needs_insert_or_update) &&
                (!(
                    (wrapper.nb_reads_since_last_insert_or_update >= 10) ||
                    (wrapper.nb_reads_since_last_insert_or_update && ((!wrapper.last_insert_or_update) || wrapper.last_insert_or_update.isBefore(moment().utc(true).add(-2, 'minute'))))))) {
                continue;
            }

            /**
             * On fait des packs de 10 promises...
             */
            if (promises.length >= 50) {
                await Promise.all(promises);
                promises = [];
            }

            promises.push((async () => {

                let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(handle_var);
                if ((!res) || (!res.id)) {
                    ConsoleHandler.getInstance().error("VarsDatasProxy:handle_buffer:FAILED update vo:index:" + handle_var.index + ":id:" + handle_var.id + ":");
                    /**
                     * Si l'insère/update échoue c'est très probablement par ce qu'on a déjà une data en base sur cet index,
                     *  dans ce cas on résoud le conflit en forçant la nouvelle valeur sur l'ancien index
                     */
                    let datas: VarDataBaseVO[] = await ModuleDAO.getInstance().getVosByExactMatroids<VarDataBaseVO, VarDataBaseVO>(handle_var._type, [handle_var], null);
                    if (datas && datas.length && datas[0] && (datas[0].value_type != VarDataBaseVO.VALUE_TYPE_IMPORT) &&
                        ((!datas[0].value_ts) || (handle_var.value_ts && (datas[0].value_ts.unix() < handle_var.value_ts.unix())))) {
                        handle_var.id = datas[0].id;
                        res = await ModuleDAO.getInstance().insertOrUpdateVO(handle_var);
                        if ((!res) || (!res.id)) {
                            ConsoleHandler.getInstance().error("VarsDatasProxy:handle_buffer:FAILED SECOND update vo:index:" + handle_var.index + ":id:" + handle_var.id + ":");
                        }
                    }
                }

                wrapper.nb_reads_since_last_insert_or_update = 0;
                wrapper.needs_insert_or_update = false;
                wrapper.last_insert_or_update = moment().utc(true);

                // let index_to_delete: number = -1;
                // for (let buffered_i in self.vars_datas_buffer) {

                //     if (self.vars_datas_buffer[buffered_i].index == handle_var.index) {
                //         index_to_delete = parseInt(buffered_i.toString());
                //         break;
                //     }
                // }

                // self.vars_datas_buffer.splice(index_to_delete, 1);
                // delete self.vars_datas_buffer_wrapped_indexes[handle_var.index];
            })());
        }

        if (promises.length) {
            await Promise.all(promises);
        }

        this.semaphore_handle_buffer = false;
    }

    /**
     * On a explicitement pas l'id à ce niveau donc on cherche par l'index plutôt
     */
    public async get_exact_param_from_buffer_or_bdd<T extends VarDataBaseVO>(var_data: T): Promise<T> {

        if (this.vars_datas_buffer_wrapped_indexes[var_data.index]) {

            // TODO On stocke l'info de l'accès
            let wrapper = this.vars_datas_buffer_wrapped_indexes[var_data.index];
            this.add_read_stat(wrapper);
            return wrapper.var_data as T;
        }

        if (var_data.id) {
            let e = await ModuleDAO.getInstance().getVoById<T>(var_data._type, var_data.id, VOsTypesManager.getInstance().moduleTables_by_voType[var_data._type].get_segmented_field_raw_value_from_vo(var_data));

            if (e) {
                await this.filter_var_datas_by_indexes([e], false, false, true);
                return e;
            }
        }

        let res: T[] = await ModuleDAO.getInstance().getVosByExactMatroids<T, T>(var_data._type, [var_data], null);

        if (res && res.length) {
            await this.filter_var_datas_by_indexes([res[0]], false, false, true);
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

            if ((!var_data) || (!var_data.check_param_is_valid)) {
                ConsoleHandler.getInstance().error('Paramètre invalide dans get_exact_params_from_buffer_or_bdd:' + JSON.stringify(var_data));
                continue;
            }

            let e = null;
            if (this.vars_datas_buffer_wrapped_indexes[var_data.index]) {

                // Stocker l'info de lecture
                let wrapper = this.vars_datas_buffer_wrapped_indexes[var_data.index];
                this.add_read_stat(wrapper);
                e = wrapper.var_data as T;
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
     * On force l'appel sur le thread du computer de vars
     */
    public async update_existing_buffered_older_datas(var_datas: VarDataBaseVO[]) {

        if ((!var_datas) || (!var_datas.length)) {
            return;
        }

        if (!ForkedTasksController.getInstance().exec_self_on_bgthread(VarsdatasComputerBGThread.getInstance().name, VarsDatasProxy.TASK_NAME_update_existing_buffered_older_datas, var_datas)) {
            return;
        }

        await this.filter_var_datas_by_indexes(var_datas, false, true, false);
    }

    /**
     * On charge en priorité depuis le buffer, puisque si le client demande des calculs on va les mettre en priorité ici, avant de calculer puis les remettre en attente d'insertion en base
     *  (dont en fait elles partent juste jamais)
     * On utilise l'extimation de coût pour 1000 card pour se limiter au temps imposé (la dernière var prise dépasse du temps imposé)
     * @param client_request_estimated_ms_limit poids de calcul autorisé (en ms estimées) pour des demandes issues du client
     * @param bg_estimated_ms_limit poids de calcul autorisé (en ms estimées) pour des demandes issues d'une invalidation en bdd
     */
    public async get_vars_to_compute_from_buffer_or_bdd(
        client_request_estimated_ms_limit: number,
        client_request_min_nb_vars: number,
        bg_estimated_ms_limit: number,
        bg_min_nb_vars: number
    ): Promise<{ [index: string]: VarDataBaseVO }> {

        let res: { [index: string]: VarDataBaseVO } = {};
        let estimated_ms: number = 0;
        let nb_vars: number = 0;

        /**
         * On commence par collecter le max de datas depuis le buffer : Les conditions de sélection d'un var :
         *  - est-ce que la data a une valeur undefined ? oui => sélectionnée
         *  - est-ce que la data peut expirer et a expiré ? oui => sélectionnée
         */
        for (let i in this.vars_datas_buffer) {

            // ajout cas spécifique isolement d'une var trop gourmande
            if ((estimated_ms >= client_request_estimated_ms_limit) && (nb_vars >= client_request_min_nb_vars)) {
                ConsoleHandler.getInstance().log('get_vars_to_compute:buffer:nb:' + nb_vars + ':estimated_ms:' + estimated_ms + ':');
                return res;
            }

            let var_data = this.vars_datas_buffer[i];

            if (!VarsServerController.getInstance().has_valid_value(var_data)) {

                let estimated_ms_var = (MatroidController.getInstance().get_cardinal(var_data) / 1000)
                    * VarsServerController.getInstance().varcacheconf_by_var_ids[var_data.var_id].calculation_cost_for_1000_card;
                // // cas spécifique isolement d'une var trop gourmande
                // if ((estimated_ms_var > client_request_estimated_ms_limit) && (nb_vars > 0) && (nb_vars < client_request_min_nb_vars)) {
                //     continue;
                // }

                nb_vars += res[var_data.index] ? 0 : 1;
                res[var_data.index] = var_data;
                estimated_ms += estimated_ms_var;
                continue;
            }
        }

        /**
         * Si on a des datas en attente dans le buffer on commence par ça
         */
        if (ObjectHandler.getInstance().hasAtLeastOneAttribute(res)) {
            ConsoleHandler.getInstance().log('get_vars_to_compute:buffer:nb:' + nb_vars + ':estimated_ms:' + estimated_ms + ':');
            return res;
        }

        let params = {
            bg_estimated_ms_limit: bg_estimated_ms_limit,
            bg_min_nb_vars: bg_min_nb_vars,
            bg_estimated_ms: 0,
            bg_nb_vars: 0
        };
        let bdd_datas: { [index: string]: VarDataBaseVO } = await this.get_vars_to_compute_from_bdd(params);
        for (let i in bdd_datas) {
            let bdd_data = bdd_datas[i];

            /**
             * Attention : à ce stade en base on va trouver des datas qui sont pas computed mais qu'on retrouve par exemple comme computed
             *  et valide (donc pas sélectionnées) dans le buffer d'attente de mise à jour en bdd. Donc on doit ignorer tous les ids
             *  des vars qui sont dans le buffer... (avantage ça concerne pas celles qui sont pas créées puisqu'il faut un id et la liste
             *  des ids reste relativement dense)...
             */
            if (!!this.vars_datas_buffer_wrapped_indexes[bdd_data.index]) {
                let buffered = this.vars_datas_buffer_wrapped_indexes[bdd_data.index];
                if (VarsServerController.getInstance().has_valid_value(buffered.var_data)) {
                    continue;
                }
            }

            res[bdd_data.index] = bdd_data;
        }

        /**
         * Si on fait les calculs depuis la Bdd, on mets les vardats dans la pile de mise en cache
         */
        if (bdd_datas && ObjectHandler.getInstance().hasAtLeastOneAttribute(bdd_datas)) {
            await this.prepend_var_datas(Object.values(bdd_datas), true);
        }

        if (params.bg_nb_vars) {
            ConsoleHandler.getInstance().log('get_vars_to_compute:bdd:nb:' + params.bg_nb_vars + ':estimated_ms:' + params.bg_estimated_ms + ':');
        }
        return res;
    }

    /**
     * On récupère des packets max de 500 vars, et si besoin on en récupèrera d'autres pour remplir le temps limit
     * -- 02/21 Changement méthode on parcours l'arbre des var controller en commençant par le bas pour remonter depuis les DS vers les calculs
     */
    private async get_vars_to_compute_from_bdd(
        params: {
            bg_estimated_ms_limit: number,
            bg_min_nb_vars: number,
            bg_estimated_ms: number,
            bg_nb_vars: number
        }): Promise<{ [index: string]: VarDataBaseVO }> {

        let vars_datas: { [index: string]: VarDataBaseVO } = {};

        for (let i in VarsServerController.getInstance().varcontrollers_dag.leafs) {
            let leaf = VarsServerController.getInstance().varcontrollers_dag.leafs[i];

            await DAGController.getInstance().visit_bottom_up_from_node(leaf, async (Ny: VarCtrlDAGNode) => {

                let may_have_more_datas: boolean = true;
                let limit: number = 500;
                let offset: number = 0;

                while (may_have_more_datas && ((params.bg_estimated_ms < params.bg_estimated_ms_limit) || (params.bg_nb_vars < params.bg_min_nb_vars))) {
                    may_have_more_datas = false;

                    let condition = '';

                    let varcacheconf: VarCacheConfVO = Ny.var_controller.var_cache_conf;

                    if (!!varcacheconf.cache_timeout_ms) {
                        let timeout: Moment = moment().utc(true).add(-varcacheconf.cache_timeout_ms, 'ms');
                        condition += 'var_id = ' + varcacheconf.var_id + ' and (value_ts is null or value_ts < ' + DateHandler.getInstance().getUnixForBDD(timeout) + ')';
                    } else {
                        condition += 'var_id = ' + varcacheconf.var_id + ' and value_ts is null';
                    }

                    condition += ' and value_type = ' + VarDataBaseVO.VALUE_TYPE_COMPUTED + ' limit ' + limit + ' offset ' + offset + ';';
                    offset += limit;

                    // On doit aller chercher toutes les varsdatas connues pour être cachables (on se fout du var_id à ce stade on veut juste des api_type_ids des varsdatas compatibles)
                    //  Attention les données importées ne doivent pas être remises en question
                    let vars_datas_tmp: VarDataBaseVO[] = [];
                    vars_datas_tmp = await ModuleDAOServer.getInstance().selectAll<VarDataBaseVO>(Ny.var_controller.varConf.var_data_vo_type, ' where ' + condition);
                    may_have_more_datas = (vars_datas_tmp && (vars_datas_tmp.length == limit));

                    for (let vars_datas_tmp_i in vars_datas_tmp) {
                        if ((params.bg_estimated_ms >= params.bg_estimated_ms_limit) && (params.bg_nb_vars >= params.bg_min_nb_vars)) {
                            return;
                        }

                        let var_data_tmp = vars_datas_tmp[vars_datas_tmp_i];

                        // Si la data est déjà dans le cache on doit surtout pas la prendre en compte à ce stade, car ça veut dire qu'on a peut-etre juste pas encore mis la bdd à jour
                        if (this.vars_datas_buffer_wrapped_indexes[var_data_tmp.index]) {
                            continue;
                        }

                        let estimated_ms_var = (MatroidController.getInstance().get_cardinal(var_data_tmp) / 1000)
                            * VarsServerController.getInstance().varcacheconf_by_var_ids[var_data_tmp.var_id].calculation_cost_for_1000_card;

                        params.bg_estimated_ms += estimated_ms_var;
                        params.bg_nb_vars += vars_datas[var_data_tmp.index] ? 0 : 1;
                        vars_datas[var_data_tmp.index] = var_data_tmp;
                    }
                }
                if ((params.bg_estimated_ms >= params.bg_estimated_ms_limit) && (params.bg_nb_vars >= params.bg_min_nb_vars)) {
                    return;
                }
            }, (node: VarDAGNode) => {
                return (params.bg_estimated_ms < params.bg_estimated_ms_limit) || (params.bg_nb_vars < params.bg_min_nb_vars);
            });

            if ((params.bg_estimated_ms >= params.bg_estimated_ms_limit) && (params.bg_nb_vars >= params.bg_min_nb_vars)) {
                return vars_datas;
            }
        }
        return vars_datas;
    }

    /**
     * On filtre les demande de append ou prepend par les indexes déjà en attente par ce qu'on peut pas avoir 2 fois le même index dans la liste
     * Du coup si on demande quelque chose sur un index déjà listé, on ignore juste la demande pour le moment
     * On met à jour la map des indexs au passage
     * On doit s'assurer par contre de pas rentrer en conflit avec un handle du buffer
     * @param var_datas
     */
    private async filter_var_datas_by_indexes(var_datas: VarDataBaseVO[], prepend: boolean, donot_insert_if_absent: boolean, just_been_loaded_from_db: boolean): Promise<VarDataBaseVO[]> {

        while (this.semaphore_handle_buffer) {
            await ThreadHandler.getInstance().sleep(9);
        }
        this.semaphore_handle_buffer = true;

        let res: VarDataBaseVO[] = [];
        for (let i in var_datas) {
            let var_data = var_datas[i];

            if (this.vars_datas_buffer_wrapped_indexes[var_data.index]) {

                let wrapper = this.vars_datas_buffer_wrapped_indexes[var_data.index];

                /**
                 * Si ça existe déjà dans la liste d'attente on l'ajoute pas mais on met à jour pour intégrer les calculs faits le cas échéant
                 *  Si on vide le value_ts on prend la modif aussi ça veut dire qu'on invalide la valeur en cache
                 */
                if ((!var_data.value_ts) || ((!!var_data.value_ts) && ((!wrapper.var_data.value_ts) ||
                    (var_data.value_ts && (wrapper.var_data.value_ts.unix() < var_data.value_ts.unix()))))) {

                    // Si on avait un id et que la nouvelle valeur n'en a pas, on concerve l'id précieusement
                    if ((!var_data.id) && (wrapper.var_data.id)) {
                        var_data.id = wrapper.var_data.id;
                    }

                    // FIXME On devrait checker les champs pour voir si il y a une différence non ?
                    wrapper.needs_insert_or_update = !just_been_loaded_from_db;

                    // Si on dit qu'on vient de la charger de la base, on peut stocker l'info de dernière mise à jour en bdd
                    if (just_been_loaded_from_db) {
                        wrapper.last_insert_or_update = moment().utc(true);
                    }
                    wrapper.var_data = var_data;
                    this.add_read_stat(wrapper);
                    this.vars_datas_buffer[this.vars_datas_buffer.findIndex((e) => e.index == var_data.index)] = var_data;
                    // On push pas puisque c'était déjà en attente d'action
                }
                continue;
            }

            if (donot_insert_if_absent) {
                continue;
            }

            this.vars_datas_buffer_wrapped_indexes[var_data.index] = new VarDataProxyWrapperVO(var_data, !just_been_loaded_from_db, 0);
            this.add_read_stat(this.vars_datas_buffer_wrapped_indexes[var_data.index]);
            res.push(var_data);
        }

        if ((!donot_insert_if_absent) && res && res.length) {

            if (prepend) {
                this.vars_datas_buffer.unshift(...res);
            } else {
                this.vars_datas_buffer = this.vars_datas_buffer.concat(res);
            }
        }

        this.semaphore_handle_buffer = false;

        return res;
    }

    private add_read_stat(var_data_wrapper: VarDataProxyWrapperVO<VarDataBaseVO>) {
        var_data_wrapper.nb_reads_since_last_insert_or_update++;
        if (!var_data_wrapper.var_data.last_reads_ts) {
            var_data_wrapper.var_data.last_reads_ts = [];
        }
        var_data_wrapper.var_data.last_reads_ts.push(moment().utc(true));
        if (var_data_wrapper.var_data.last_reads_ts.length > 20) {
            var_data_wrapper.var_data.last_reads_ts.shift();
        }
    }
}