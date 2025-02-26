import { PostThrottleParam, PreThrottleParam } from '../../../shared/annotations/Throttle';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleTableController from '../../../shared/modules/DAO/ModuleTableController';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import EventsController from '../../../shared/modules/Eventify/EventsController';
import EventifyEventInstanceVO from '../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
import EventifyEventListenerConfVO from '../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import { StatThisArrayLength } from '../../../shared/modules/Stats/annotations/StatThisArrayLength';
import { get_keys_length } from '../../../shared/modules/Stats/annotations/StatThisMapKeys';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataInvalidatorVO from '../../../shared/modules/Var/vos/VarDataInvalidatorVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler, { field_names } from '../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import { all_promises } from '../../../shared/tools/PromiseTools';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import StackContext from '../../StackContext';
import ThrottleExecAsServerRunsOnBgThread from '../../annotations/ThrottleExecAsServerRunsOnBgThread';
import ConfigurationService from '../../env/ConfigurationService';
import VarDAGNode from '../../modules/Var/vos/VarDAGNode';
import { RunsOnBgThread } from '../BGThread/annotations/RunsOnBGThread';
import DAOServerController from '../DAO/DAOServerController';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ParamsServerController from '../Params/ParamsServerController';
import PushDataServerController from '../PushData/PushDataServerController';
import CurrentVarDAGHolder from './CurrentVarDAGHolder';
import VarsBGThreadNameHolder from './VarsBGThreadNameHolder';
import VarsCacheController from './VarsCacheController';
import VarsServerCallBackSubsController from './VarsServerCallBackSubsController';
import VarsServerController from './VarsServerController';
import VarsClientsSubsCacheHolder from './bgthreads/processes/VarsClientsSubsCacheHolder';
import VarsClientsSubsCacheManager from './bgthreads/processes/VarsClientsSubsCacheManager';
import VarsProcessInvalidator from './bgthreads/processes/VarsProcessInvalidator';

/**
 * On gère le buffer des mises à jour de vos en lien avec des vars pour invalider au plus vite les vars en cache en cas de modification d'un VO
 *  tout en empilant quelques centaines d'updates à la fois, pour ne pas invalider 100 fois les mêmes params, cette étape est coûteuse
 *  on sépare en revanche les vos par type_id et par type de modification (si on modifie 3 fois un vo on veut toutes les modifications pour l'invalidation donc on ignore rien par contre)
 */
export default class VarsDatasVoUpdateHandler {

    // public static VarsDatasVoUpdateHandler_ordered_vos_cud_PARAM_NAME = 'VarsDatasVoUpdateHandler.ordered_vos_cud';
    public static VarsDatasVoUpdateHandler_has_ordered_vos_cud_PARAM_NAME = 'VarsDatasVoUpdateHandler.has_ordered_vos_cud';
    public static VarsDatasVoUpdateHandler_block_ordered_vos_cud_PARAM_NAME = 'VarsDatasVoUpdateHandler.block_ordered_vos_cud';
    public static delete_instead_of_invalidating_unregistered_var_datas_PARAM_NAME = 'VarsDatasVoUpdateHandler.delete_instead_of_invalidating_unregistered_var_datas';

    /**
     * Multithreading notes :
     *  - There's only one bgthread doing all the computations, and separated from the other threads if the project decides to do so
     *  - Everything in this controller needs to be running in the var calculation bg thread
     */
    public static last_call_handled_something: boolean = false;

    public static block_ordered_vos_cud: boolean = false;

    /**
     * La liste des invalidations en attente de traitement
     */
    @StatThisArrayLength('VarsDatasVoUpdateHandler')
    public static invalidators: VarDataInvalidatorVO[] = [];

    @StatThisArrayLength('VarsDatasVoUpdateHandler')
    public static ordered_vos_cud: Array<DAOUpdateVOHolder<IDistantVOBase> | IDistantVOBase> = [];


    // private static last_registration: number = null;

    public static init() {
    }

    // /**
    //  * Demander l'invalidation par intersecteurs (mais sans remonter l'arbre)
    //  * @param invalidate_intersectors
    //  * @returns
    //  */
    // public static async push_invalidate_intersectors(invalidate_intersectors: VarDataBaseVO[]): Promise<void> {
    //     return new Promise(async (resolve, reject) => {

    //         if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
    //             reject,
    //             VarsBGThreadNameHolder.bgthread_name,
    //             VarsDatasVoUpdateHandler.TASK_NAME_push_invalidate_intersectors,
    //             resolve,
    //             invalidate_intersectors)) {
    //             return;
    //         }

    //         VarsDatasVoUpdateHandler.throttle_push_invalidate_intersectors(invalidate_intersectors);
    //         resolve();
    //     });
    // }

    // /**
    //  * Demander l'invalidation de matroids exacts (mais sans remonter l'arbre)
    //  * @param invalidate_matroids
    //  * @returns
    //  */
    // public static async push_invalidate_matroids(invalidate_matroids: VarDataBaseVO[]): Promise<void> {
    //     return new Promise(async (resolve, reject) => {

    //         if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
    //             reject,
    //             VarsBGThreadNameHolder.bgthread_name,
    //             VarsDatasVoUpdateHandler.TASK_NAME_push_invalidate_matroids,
    //             resolve,
    //             invalidate_matroids)) {
    //             return;
    //         }

    //         VarsDatasVoUpdateHandler.throttle_push_invalidate_matroids(invalidate_matroids);
    //         resolve();
    //     });
    // }



    /**
     * Objectif : Déployer les invalidateurs, pour permettre d'avoir une liste complète d'intersecteurs niveau par niveau
     *  donc si on a un invalidateur de niveau 3 dans l'arbre en invalidate parents, on se retrouve avec 3 invalidateurs de niveau 1 2 et 3 en sortie
     */
    public static async deploy_invalidators(invalidators: VarDataInvalidatorVO[]): Promise<{ [invalidator_id: string]: VarDataInvalidatorVO }> {

        const treated_deployed_invalidators: { [invalidator_id: string]: boolean } = {};
        const res_deployed_invalidators: { [invalidator_id: string]: VarDataInvalidatorVO } = {};
        let actual_invalidators: { [invalidator_id: string]: VarDataInvalidatorVO } = {};

        for (const i in invalidators) {
            const invalidator = invalidators[i];

            actual_invalidators[VarsController.get_validator_config_id(invalidator)] = invalidator;
        }

        // Pour booster ce passage, au lieu d'attendre toutes les promises de la boucle, on veut en fait attendre le plus rapide entre un event sur un push de actual_invalidators, et la fin de toutes les promises. Comme ça on peut rapidement reprendre l'empilage de promises
        //  sans attendre de tout résoudre.
        let is_looking_for_more_resolver = null;
        const promise_pipeline = PromisePipeline.get_semaphore_pipeline('VarsDatasVoUpdateHandler.handle_intersectors', ConfigurationService.node_configuration.max_pool);
        // On charge tout en // et on compte sur le promise pipeline pour limiter un peu la charge dans get_deps_intersectors
        const promises = [];

        while (ObjectHandler.hasAtLeastOneAttribute(actual_invalidators)) {

            /**
             * Subtilité pour les perfs :
             *  La version simple : on await promise_pipeline.end(); et donc après on checke si on a des nouveaux invalidators à traiter
             *  La version opti : on race entre le await promise_pipeline.end(); et un event sur actual_invalidators lancé par le push d'un nouveau invalidateur, qu'on gère en resolvant une promise qu'on init ici
             */
            const has_new_invalidator = new Promise((resolve) => {
                is_looking_for_more_resolver = resolve;
            });

            // On regroupe les invalidateurs par varconf_id et par conf d'invalidation, et on demande les deps sur chaque groupe
            const tmp = Object.values(actual_invalidators);
            actual_invalidators = {};

            for (const i in tmp) {
                treated_deployed_invalidators[VarsController.get_validator_config_id(tmp[i])] = true;
            }

            const invalidators_by_varconf_id: { [invalidation_conf_key: string]: VarDataInvalidatorVO[] } = this.union_invalidators(tmp);

            for (const invalidator_conf in invalidators_by_varconf_id) {
                const this_type_invalidators = invalidators_by_varconf_id[invalidator_conf];

                for (const i in this_type_invalidators) {
                    treated_deployed_invalidators[VarsController.get_validator_config_id(this_type_invalidators[i])] = true;
                    res_deployed_invalidators[VarsController.get_validator_config_id(this_type_invalidators[i])] = this_type_invalidators[i];
                }

                promises.push((async () => {

                    const invalidateurs: VarDataInvalidatorVO[] = await VarsCacheController.get_deps_invalidators(this_type_invalidators, promise_pipeline);

                    if ((!invalidateurs) || (!invalidateurs.length)) {
                        return;
                    }

                    for (const j in invalidateurs) {
                        const new_invalidator = invalidateurs[j];
                        const new_invalidator_id = VarsController.get_validator_config_id(new_invalidator);

                        if (treated_deployed_invalidators[new_invalidator_id]) {
                            continue;
                        }

                        if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                            ConsoleHandler.log('VarsDatasVoUpdateHandler.deploy_invalidators:DEPLOYING:' + new_invalidator_id + ':by:' + invalidator_conf);
                            new_invalidator.console_log();
                        }

                        actual_invalidators[new_invalidator_id] = new_invalidator;

                        if (is_looking_for_more_resolver) {
                            is_looking_for_more_resolver();
                            is_looking_for_more_resolver = null;
                        }

                    }
                })());
            }

            await Promise.race([
                all_promises(promises),
                has_new_invalidator,
            ]);
        }

        return res_deployed_invalidators;
    }

    /**
     * Opti de suppression des vars, sans triggers !
     *  WARN ça signifie que les triggers sur suppression de vardata sont interdits à ce stade
     *  !! Ne peut être utilisé safe que par handle_invalidation
     */
    public static async delete_vars_pack_without_triggers(vars_to_delete: VarDataBaseVO[]) {

        // on regroupe par type de var
        const varindexes_by_api_type_id: { [api_type_id: string]: string[] } = {};

        for (const i in vars_to_delete) {
            const var_to_delete = vars_to_delete[i];

            if (!varindexes_by_api_type_id[var_to_delete._type]) {
                varindexes_by_api_type_id[var_to_delete._type] = [];
            }

            varindexes_by_api_type_id[var_to_delete._type].push(var_to_delete.index);
        }

        const max = Math.max(1, Math.floor(ConfigurationService.node_configuration.max_pool / 2));
        const promise_pipeline = new PromisePipeline(max, 'VarsDatasVoUpdateHandler.delete_vars_pack_without_triggers');

        for (const api_type_id in varindexes_by_api_type_id) {
            const indexes = varindexes_by_api_type_id[api_type_id];

            if ((!indexes) || (!indexes.length)) {
                continue;
            }

            await promise_pipeline.push(async () => {
                const moduleTable = ModuleTableController.module_tables_by_vo_type[api_type_id];
                const request = "DELETE FROM " + moduleTable.full_name + " WHERE _bdd_only_index in ('" + indexes.join("','") + "');";
                await ModuleDAOServer.instance.query(request);
            });
        }

        await promise_pipeline.end();
    }

    /**
     * On supprime les noeuds qui correspondent à l'invalidator en DB
     * Cas spécifique des vars pixels never delete : on doit d'abord charger avant de les supprimer et on retourne les vars chargées
     * @param invalidator
     */
    private static async apply_invalidator_in_db(invalidator: VarDataInvalidatorVO, conditions_by_type: { [api_type_id: string]: string[] }): Promise<VarDataBaseVO[]> {

        let pixels_never_delete = [];
        const controller = VarsController.var_conf_by_id[invalidator.var_data.var_id];

        if (controller.pixel_activated && controller.pixel_never_delete) {
            pixels_never_delete = await VarsDatasVoUpdateHandler.load_invalidateds_from_bdd(invalidator);
        }

        VarsDatasVoUpdateHandler.get_condition_for_delete_var_by_intersectors_without_triggers(controller.var_data_vo_type, invalidator, conditions_by_type);

        return pixels_never_delete;
    }

    /**
     * On charge depuis la bdd en fonction des types de datas recherchées. En revanche on doit déjà cibler un seul api_type_id
     */
    private static async load_invalidateds_from_bdd(invalidator: VarDataInvalidatorVO): Promise<VarDataBaseVO[]> {

        const var_data = invalidator.var_data;
        const query_ = query(var_data._type);

        switch (invalidator.invalidator_type) {
            case VarDataInvalidatorVO.INVALIDATOR_TYPE_EXACT:
                query_.filter_by_text_eq(field_names<VarDataBaseVO>()._bdd_only_index, var_data.index);
                break;
            case VarDataInvalidatorVO.INVALIDATOR_TYPE_INCLUDED_OR_EXACT:
                throw new Error('Not Implemented');
            case VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED:

                query_.filter_by_num_eq(field_names<VarDataBaseVO>().var_id, var_data.var_id);
                const matroid_fields = MatroidController.getMatroidFields(var_data._type);
                for (const j in matroid_fields) {
                    const matroid_field = matroid_fields[j];
                    query_.filter_by_num_x_ranges(matroid_field.field_id, var_data[matroid_field.field_id]);
                }
                break;
        }

        const valid_types = [RangeHandler.create_single_elt_NumRange(VarDataBaseVO.VALUE_TYPE_COMPUTED, NumSegment.TYPE_INT)];
        if (invalidator.invalidate_denied) {
            valid_types.push(RangeHandler.create_single_elt_NumRange(VarDataBaseVO.VALUE_TYPE_DENIED, NumSegment.TYPE_INT));
        }
        if (invalidator.invalidate_imports) {
            valid_types.push(RangeHandler.create_single_elt_NumRange(VarDataBaseVO.VALUE_TYPE_IMPORT, NumSegment.TYPE_INT));
        }

        query_.filter_by_num_x_ranges(field_names<VarDataBaseVO>().value_type, valid_types);
        query_.exec_as_server();

        return query_.select_vos<VarDataBaseVO>();
    }


    /**
     * Opti de suppression des vars, sans triggers !
     *  WARN ça signifie que les triggers sur suppression de vardata sont interdits à ce stade
     *  !! Ne peut être utilisé safe que par handle_invalidation
     */
    private static get_condition_for_delete_var_by_intersectors_without_triggers(
        api_type_id: string,
        invalidator: VarDataInvalidatorVO,
        conditions_by_type: { [api_type_id: string]: string[] },
    ) {

        switch (invalidator.invalidator_type) {
            case VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED:
                VarsDatasVoUpdateHandler.get_condition_for_delete_var_by_intersected_without_triggers(api_type_id, invalidator, conditions_by_type);
                break;
            case VarDataInvalidatorVO.INVALIDATOR_TYPE_EXACT:
                VarsDatasVoUpdateHandler.get_condition_for_delete_var_by_exact_without_triggers(api_type_id, invalidator, conditions_by_type);
                break;
            default:
                ConsoleHandler.error('invalidator_type not implemented: ' + invalidator.invalidator_type);
                break;
        }
    }

    private static get_condition_for_delete_var_by_intersected_without_triggers(
        api_type_id: string,
        invalidator: VarDataInvalidatorVO,
        conditions_by_type: { [api_type_id: string]: string[] },
    ) {

        let request = ModuleDAOServer.instance.getWhereClauseForFilterByMatroidIntersection(api_type_id, invalidator.var_data, null);

        const list_valid_value_types = [VarDataBaseVO.VALUE_TYPE_COMPUTED];
        if (invalidator.invalidate_denied) {
            list_valid_value_types.push(VarDataBaseVO.VALUE_TYPE_DENIED);
        }
        if (invalidator.invalidate_imports) {
            list_valid_value_types.push(VarDataBaseVO.VALUE_TYPE_IMPORT);
        }
        request += " AND " + field_names<VarDataBaseVO>().value_type + " IN (" + list_valid_value_types.join(',') + ")";

        if (!conditions_by_type[api_type_id]) {
            conditions_by_type[api_type_id] = [];
        }

        conditions_by_type[api_type_id].push(request);
    }

    private static get_condition_for_delete_var_by_exact_without_triggers(
        api_type_id: string,
        invalidator: VarDataInvalidatorVO,
        conditions_by_type: { [api_type_id: string]: string[] }) {

        let request = "_bdd_only_index = '" + invalidator.var_data.index + "'";

        const list_valid_value_types = [VarDataBaseVO.VALUE_TYPE_COMPUTED];
        if (invalidator.invalidate_denied) {
            list_valid_value_types.push(VarDataBaseVO.VALUE_TYPE_DENIED);
        }
        if (invalidator.invalidate_imports) {
            list_valid_value_types.push(VarDataBaseVO.VALUE_TYPE_IMPORT);
        }
        request += " AND " + field_names<VarDataBaseVO>().value_type + " IN (" + list_valid_value_types.join(',') + ")";

        if (!conditions_by_type[api_type_id]) {
            conditions_by_type[api_type_id] = [];
        }

        conditions_by_type[api_type_id].push(request);
    }

    /**
     * Pour chaque vo_type, on prend tous les varcontrollers concernés et on demande les intersecteurs en CD et en U
     */
    private static async init_leaf_intersectors(
        vo_types: string[],
        vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> },
        vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] }): Promise<{ [index: string]: VarDataBaseVO }> {

        const intersectors_by_index: { [index: string]: VarDataBaseVO } = {};

        // let vardag = new VarDAG();
        // for (let i in vo_types) {
        //     let vo_type = vo_types[i];

        //     let vos = vos_create_or_delete_buffer[vo_type].concat(
        //         vos_update_buffer[vo_type].map((e) => e.pre_update_vo),
        //         vos_update_buffer[vo_type].map((e) => e.post_update_vo));
        // }

        const promise_pipeline = new PromisePipeline(Math.max(ConfigurationService.node_configuration.max_pool / 3, 5), 'VarsDatasVoUpdateHandler.init_leaf_intersectors');

        for (const i in vo_types) {
            const vo_type = vo_types[i];

            for (const j in VarsServerController.registered_vars_controller_by_api_type_id[vo_type]) {
                const var_controller = VarsServerController.registered_vars_controller_by_api_type_id[vo_type][j];

                if ((!!vos_create_or_delete_buffer[vo_type]) && vos_create_or_delete_buffer[vo_type].length) {

                    if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                        ConsoleHandler.log(
                            'init_leaf_intersectors:get_invalid_params_intersectors_on_POST_C_POST_D_group:' +
                            var_controller.varConf.id + ':' + var_controller.varConf.name + ':' + vos_create_or_delete_buffer[vo_type].length);
                    }

                    await promise_pipeline.push(async () => {

                        if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                            for (const k in vos_create_or_delete_buffer[vo_type]) {
                                const vo = vos_create_or_delete_buffer[vo_type][k];
                                ConsoleHandler.log(
                                    'init_leaf_intersectors:get_invalid_params_intersectors_on_POST_C_POST_D_group:' +
                                    var_controller.varConf.id + ':' + var_controller.varConf.name + ':' + vo.id + ':' + vo._type + ':IN');

                            }
                        }

                        const tmp = await var_controller.get_invalid_params_intersectors_on_POST_C_POST_D_group_stats_wrapper(vos_create_or_delete_buffer[vo_type]);

                        if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                            for (const k in vos_create_or_delete_buffer[vo_type]) {
                                const vo = vos_create_or_delete_buffer[vo_type][k];
                                ConsoleHandler.log(
                                    'init_leaf_intersectors:get_invalid_params_intersectors_on_POST_C_POST_D_group:' +
                                    var_controller.varConf.id + ':' + var_controller.varConf.name + ':' + vo.id + ':' + vo._type + ':OUT');

                            }
                        }

                        if (tmp && !!tmp.length) {
                            tmp.forEach((e) => e ? intersectors_by_index[e.index] = e : null);

                            if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                                for (const k in tmp) {
                                    const invalidator = tmp[k];
                                    ConsoleHandler.log(
                                        'init_leaf_intersectors:get_invalid_params_intersectors_on_POST_C_POST_D_group:' +
                                        var_controller.varConf.id + ':' + var_controller.varConf.name + ':=> INVALIDATOR =>:' + invalidator.index);
                                }
                            }
                        }
                    });
                }

                if ((!!vos_update_buffer[vo_type]) && vos_update_buffer[vo_type].length) {

                    if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                        ConsoleHandler.log(
                            'init_leaf_intersectors:get_invalid_params_intersectors_on_POST_U_group:' +
                            var_controller.varConf.id + ':' + var_controller.varConf.name + ':' + vos_update_buffer[vo_type].length);
                    }

                    await promise_pipeline.push(async () => {

                        if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                            for (const k in vos_create_or_delete_buffer[vo_type]) {
                                const vo = vos_create_or_delete_buffer[vo_type][k];
                                ConsoleHandler.log(
                                    'init_leaf_intersectors:get_invalid_params_intersectors_on_POST_U_group:' +
                                    var_controller.varConf.id + ':' + var_controller.varConf.name + ':' + vo.id + ':' + vo._type + ':IN');

                            }
                        }

                        const tmp = await var_controller.get_invalid_params_intersectors_on_POST_U_group_stats_wrapper(vos_update_buffer[vo_type]);

                        if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                            for (const k in vos_create_or_delete_buffer[vo_type]) {
                                const vo = vos_create_or_delete_buffer[vo_type][k];
                                ConsoleHandler.log(
                                    'init_leaf_intersectors:get_invalid_params_intersectors_on_POST_U_group:' +
                                    var_controller.varConf.id + ':' + var_controller.varConf.name + ':' + vo.id + ':' + vo._type + ':OUT');

                            }
                        }

                        if (tmp && !!tmp.length) {
                            tmp.forEach((e) => e ? intersectors_by_index[e.index] = e : null);

                            if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                                for (const k in tmp) {
                                    const invalidator = tmp[k];
                                    ConsoleHandler.log(
                                        'init_leaf_intersectors:get_invalid_params_intersectors_on_POST_U_group:' +
                                        var_controller.varConf.id + ':' + var_controller.varConf.name + ':=> INVALIDATOR =>:' + invalidator.index);
                                }
                            }
                        }
                    });
                }
            }
        }

        await promise_pipeline.end();

        return intersectors_by_index;
    }

    /**
     * Pour l'union des invalidators, on union par type de conf (et var_id) et on union les var_datas :
     *  - un var_id identique
     *  - une conf de types de var_data à supprimer identiques (donc denied / imports identiques)
     */
    private static union_invalidators(invalidators: VarDataInvalidatorVO[]): { [conf_id: string]: VarDataInvalidatorVO[] } {
        const union_invalidators: { [conf_id: string]: VarDataInvalidatorVO[] } = {};

        /**
         * On commence par regrouper par confs de types de var_data à supprimer
         */
        const invalidators_by_conf: { [conf_id: string]: VarDataInvalidatorVO[] } = {};

        for (const i in invalidators) {
            const invalidator = invalidators[i];

            const conf_id = VarsController.get_validator_config_id(invalidator, false);
            if (!invalidators_by_conf[conf_id]) {
                invalidators_by_conf[conf_id] = [];
            }
            invalidators_by_conf[conf_id].push(invalidator);
        }

        for (const conf_id in invalidators_by_conf) {
            const this_conf_invalidators = invalidators_by_conf[conf_id];

            if (!union_invalidators[conf_id]) {
                union_invalidators[conf_id] = [];
            }

            if (this_conf_invalidators.length == 1) {
                union_invalidators[conf_id].push(this_conf_invalidators[0]);
                continue;
            }

            /**
             * L'union est faite en sélectionnant le premier invalidator pour sa conf, et en union les var_datas.
             *  Le reste de la conf est sensé être identique par définition donc ça devrait marcher.
             */
            const exemple_invalidator = this_conf_invalidators[0];
            const union_var_datas = MatroidController.union(this_conf_invalidators.map((invalidator) => invalidator.var_data));

            for (const i in union_var_datas) {
                const union_var_data = union_var_datas[i];
                const union_invalidator = VarDataInvalidatorVO.create_new(union_var_data, exemple_invalidator.invalidator_type, exemple_invalidator.propagate_to_parents, exemple_invalidator.invalidate_denied, exemple_invalidator.invalidate_imports);
                union_invalidators[conf_id].push(union_invalidator);
            }
        }

        return union_invalidators;
    }

    @RunsOnBgThread(VarsBGThreadNameHolder.bgthread_name, null)//static
    public static async has_vos_cud_or_intersectors(): Promise<boolean> {
        return (VarsDatasVoUpdateHandler.ordered_vos_cud && (VarsDatasVoUpdateHandler.ordered_vos_cud.length > 0)) ||
            (VarsDatasVoUpdateHandler.invalidators && (VarsDatasVoUpdateHandler.invalidators.length > 0));
    }

    /**
     * Objectif on bloque le ModuleDAO en modification, et on informe via notif quand on a à la fois bloqué les updates et vidé le cache de ce module
     */
    @RunsOnBgThread(VarsBGThreadNameHolder.bgthread_name, null)//static
    public static async force_empty_vars_datas_vo_update_cache() {

        DAOServerController.GLOBAL_UPDATE_BLOCKER = true;
        let max_sleeps = 100;

        // eslint-disable-next-line no-constant-condition
        while (true) {

            if ((!VarsDatasVoUpdateHandler.ordered_vos_cud) ||
                (!VarsDatasVoUpdateHandler.ordered_vos_cud.length)) {

                const uid: number = StackContext.get('UID');
                const CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');
                if (uid) {
                    await PushDataServerController.notifySimpleERROR(uid, CLIENT_TAB_ID, 'force_empty_vars_datas_vo_update_cache.done', true);
                }
                ConsoleHandler.warn("Cache des modifications de VO vidé. Prêt pour le redémarrage");
                return;
            }
            await ThreadHandler.sleep(5000, 'VarsDatasVoUpdateHandler.force_empty_vars_datas_vo_update_cache');
            max_sleeps--;
            if (max_sleeps <= 0) {
                throw new Error('Unable to force_empty_vars_datas_vo_update_cache');
            }
        }
    }

    /***
     *
     */
    @ThrottleExecAsServerRunsOnBgThread(
        {
            param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
            throttle_ms: 1000,
            leading: false,
        },
        VarsBGThreadNameHolder.bgthread_name,
        null, // static
    )
    public static async throttled_update_param() {

        // On flag, si c'est pas déjà le cas, le fait que des cuds sont en attente, ou pas
        const new_tag_value = VarsDatasVoUpdateHandler.ordered_vos_cud && (VarsDatasVoUpdateHandler.ordered_vos_cud.length > 0);
        let old_tag_value = null;

        await all_promises([ // Attention Promise[] ne maintient pas le stackcontext a priori de façon systématique, contrairement au PromisePipeline. Ce n'est pas un contexte client donc OSEF ici
            (async () => {
                old_tag_value = await ParamsServerController.getParamValueAsBoolean(VarsDatasVoUpdateHandler.VarsDatasVoUpdateHandler_has_ordered_vos_cud_PARAM_NAME);
            })(),
            (async () => {
                // On en profite aussi pour mettre à jour régulièrement le param de blocage
                VarsDatasVoUpdateHandler.block_ordered_vos_cud = await ParamsServerController.getParamValueAsBoolean(
                    VarsDatasVoUpdateHandler.VarsDatasVoUpdateHandler_block_ordered_vos_cud_PARAM_NAME,
                    false,
                    10000, // 10 sec
                );
            })(),
        ]);

        if (new_tag_value == old_tag_value) {
            return;
        }

        await ParamsServerController.setParamValueAsBoolean(VarsDatasVoUpdateHandler.VarsDatasVoUpdateHandler_has_ordered_vos_cud_PARAM_NAME, new_tag_value);
    }

    @ThrottleExecAsServerRunsOnBgThread(
        {
            param_type: EventifyEventListenerConfVO.PARAM_TYPE_STACK,
            throttle_ms: 20,
            leading: true,
        },
        VarsBGThreadNameHolder.bgthread_name,
        null, // static
    )
    public static async register_vo_cud(
        @PreThrottleParam vo_cud: DAOUpdateVOHolder<IDistantVOBase> | IDistantVOBase | Array<DAOUpdateVOHolder<IDistantVOBase>> | IDistantVOBase[],
        @PostThrottleParam vos_cud: Array<DAOUpdateVOHolder<IDistantVOBase> | IDistantVOBase> = null,
    ) {


        if (VarsDatasVoUpdateHandler.block_ordered_vos_cud) {
            return;
        }

        if ((!vos_cud) || (!vos_cud.length)) {
            return;
        }

        VarsDatasVoUpdateHandler.ordered_vos_cud = VarsDatasVoUpdateHandler.ordered_vos_cud.concat(vos_cud);
        // VarsDatasVoUpdateHandler.last_registration = Dates.now();

        EventsController.emit_event(EventifyEventInstanceVO.new_event(VarsProcessInvalidator.WORK_EVENT_NAME));

        VarsDatasVoUpdateHandler.throttled_update_param();
    }

    /**
    * Demander une ou des invalidations
    * @param invalidators
    * @returns
    */
    @ThrottleExecAsServerRunsOnBgThread(
        {
            param_type: EventifyEventListenerConfVO.PARAM_TYPE_STACK,
            throttle_ms: 20,
            leading: false,
        },
        VarsBGThreadNameHolder.bgthread_name,
        null, // static
        false,
    )
    public static push_invalidators(
        @PreThrottleParam invalidator: VarDataInvalidatorVO | VarDataInvalidatorVO[],
        @PostThrottleParam invalidators: VarDataInvalidatorVO[] = null,
    ) {
        if ((!invalidators) || (!invalidators.length)) {
            return;
        }

        VarsDatasVoUpdateHandler.invalidators.push(...invalidators);

        EventsController.emit_event(EventifyEventInstanceVO.new_event(VarsProcessInvalidator.WORK_EVENT_NAME));
    }

    /**
     * On passe en param le nombre max de cud qu'on veut gérer, et on dépile en FIFO
     * @returns true si on a des invalidations trop récentes et qu'on veut donc éviter de calculer des vars
     */
    @RunsOnBgThread(VarsBGThreadNameHolder.bgthread_name, null)//static
    public static async handle_buffer(ordered_vos_cud: Array<IDistantVOBase | DAOUpdateVOHolder<IDistantVOBase>>): Promise<{ [invalidator_id: string]: VarDataInvalidatorVO }> {

        VarsDatasVoUpdateHandler.last_call_handled_something = false;

        if ((!ordered_vos_cud) || (!ordered_vos_cud.length)) {
            VarsDatasVoUpdateHandler.throttled_update_param();
            return null;
        }

        VarsDatasVoUpdateHandler.last_call_handled_something = true;

        const vo_types: string[] = [];
        const vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
        const vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};

        await VarsDatasVoUpdateHandler.prepare_updates(ordered_vos_cud, vos_update_buffer, vos_create_or_delete_buffer, vo_types);

        const intersectors_by_index: { [index: string]: VarDataBaseVO } = await VarsDatasVoUpdateHandler.init_leaf_intersectors(vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        const leaf_invalidators_by_index: { [conf_id: string]: VarDataInvalidatorVO } = {};

        for (const i in intersectors_by_index) {
            const intersector = intersectors_by_index[i];

            const invalidator = VarDataInvalidatorVO.create_new(intersector, VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED, true, false, false);
            const conf_id = VarsController.get_validator_config_id(invalidator);
            leaf_invalidators_by_index[conf_id] = invalidator;
        }

        // On met à jour le param en base pour refléter les modifs qui restent en attente de traitement
        VarsDatasVoUpdateHandler.throttled_update_param();

        // Si on continue d'invalider des Vos on attend sagement avant de relancer les calculs
        return leaf_invalidators_by_index;
    }

    /**
     * On doit faire une union sur les intersecteurs, mais ni sur les inclusions ni sur les exacts
     * Pour le moment on implémente pas les inclusions, qui n'ont pas une utilité évidente (on a pas d'interface pour faire ça pour le moment a priori en plus)
     */
    @RunsOnBgThread(VarsBGThreadNameHolder.bgthread_name, null)//static
    public static async handle_invalidators(deployed_invalidators: { [invalidator_id: string]: VarDataInvalidatorVO }) {

        const invalidators_array = Object.values(deployed_invalidators);

        if (!invalidators_array || !invalidators_array.length) {
            return;
        }
        ConsoleHandler.log('VarsDatasVoUpdateHandler.handle_invalidators:IN:' + invalidators_array.length);

        // On fait l'union et on regroupe par conf d'invalidation
        const invalidators_by_varconf_id: { [invalidation_conf_key: string]: VarDataInvalidatorVO[] } = this.union_invalidators(invalidators_array);
        if (ConfigurationService.node_configuration.debug_vars_invalidation) {
            ConsoleHandler.log('VarsDatasVoUpdateHandler.handle_invalidators:UNION:KEYS:' + Object.keys(invalidators_by_varconf_id).length + get_keys_length(invalidators_by_varconf_id, null, null, 1, true));
        }

        /**
         * En // invalider en DB et dans l'arbre
         * Puis réinsérer dans l'arbre : les registers (clients et serveurs) + les vars pixel never delete qui ont été invalidées en db
         */
        const invalidated_pixels_never_delete: VarDataBaseVO[] = [];
        const promise_pipeline: PromisePipeline = new PromisePipeline(ConfigurationService.node_configuration.max_vars_invalidators, 'VarsDatasVoUpdateHandler.handle_invalidators');

        // On doit pouvoir génrer une requete unique par type de var_data à supprimer, avec toutes les conditions sous la forme (A) OR (B) OR (C) ...
        const conditions_by_type: { [api_type_id: string]: string[] } = {};

        for (const conf_type in invalidators_by_varconf_id) {
            const invalidators = invalidators_by_varconf_id[conf_type];
            for (const i in invalidators) {
                const invalidator = invalidators[i];

                await promise_pipeline.push(async () => {
                    const this_invalidated_pixels_never_delete = await this.apply_invalidator_in_db(invalidator, conditions_by_type);
                    if (this_invalidated_pixels_never_delete && this_invalidated_pixels_never_delete.length) {
                        invalidated_pixels_never_delete.push(...this_invalidated_pixels_never_delete);

                        if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                            this_invalidated_pixels_never_delete.forEach((pixel_never_delete) => {
                                ConsoleHandler.log('VarsDatasVoUpdateHandler.handle_invalidators:this_invalidated_pixels_never_delete:' + pixel_never_delete.index + ':by:');
                                invalidator.console_log();
                            });
                        }
                    }
                });

                // Attention on ne doit pas unlink en //, sinon il faut semaphore comme le getInstance()
                await this.apply_invalidator_in_tree(invalidator);
            }
        }

        await promise_pipeline.end();

        // On applique les delete by type
        for (const api_type_id in conditions_by_type) {
            const conditions = conditions_by_type[api_type_id];

            if (!conditions || !conditions.length) {
                continue;
            }

            const moduleTable = ModuleTableController.module_tables_by_vo_type[api_type_id];
            const request = '(' + conditions.join(') OR (') + ')';
            await promise_pipeline.push(async () => ModuleDAOServer.instance.query("DELETE FROM " + moduleTable.full_name + " WHERE " + request + ";"));
        }

        await promise_pipeline.end();

        const nodes_to_unlock: VarDAGNode[] = [];
        const all_vardagnode_promises = [];

        // On réinsère les vars pixel never delete qui ont été invalidées en db
        if (invalidated_pixels_never_delete && invalidated_pixels_never_delete.length) {
            for (const i in invalidated_pixels_never_delete) {
                const invalidated_pixel_never_delete = invalidated_pixels_never_delete[i];

                all_vardagnode_promises.push((async () => {
                    nodes_to_unlock.push(await VarDAGNode.getInstance(CurrentVarDAGHolder.current_vardag, VarDataBaseVO.from_index(invalidated_pixel_never_delete.index), true/*, true*/));
                })());
            }
        }

        // On réinsère les registers (clients et serveurs)
        await VarsClientsSubsCacheManager.update_clients_subs_indexes_cache(true);
        // Server
        const subs: string[] = Object.keys(VarsServerCallBackSubsController.cb_subs);
        // Clients
        subs.push(...Object.keys(VarsClientsSubsCacheHolder.clients_subs_indexes_cache));

        for (const j in subs) {

            const index = subs[j];

            // On peut pas réinsérer tous les éléments registered, il faut qu'on réinsère uniquement ceux qui sont concernés par l'invalidation
            const registered_var = VarDataBaseVO.from_index(index);

            if (!registered_var) {
                continue;
            }

            let invalidated = false;
            for (const conf_type in invalidators_by_varconf_id) {
                const invalidators = invalidators_by_varconf_id[conf_type];
                for (const i in invalidators) {
                    const invalidator = invalidators[i];

                    switch (invalidator.invalidator_type) {
                        case VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED:
                            if (!MatroidController.matroid_intersects_matroid(registered_var, invalidator.var_data)) {
                                continue;
                            }
                            break;
                        case VarDataInvalidatorVO.INVALIDATOR_TYPE_EXACT:
                            if (registered_var.index != invalidator.var_data.index) {
                                continue;
                            }
                            break;
                    }

                    if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                        ConsoleHandler.log('VarsDatasVoUpdateHandler.handle_invalidators:SUBInvalidated:' + index + ':by:');
                        invalidator.console_log();
                    }

                    invalidated = true;
                }
            }

            if (!invalidated) {
                continue;
            }

            if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                ConsoleHandler.log('VarsDatasVoUpdateHandler.handle_invalidators:REINSERT:' + index);
            }
            // Attention : bien forcer de recharger de la base puisque la version qu'on a ici est issue d'un cache local, pas de la base à date
            all_vardagnode_promises.push((async () => {
                nodes_to_unlock.push(await VarDAGNode.getInstance(CurrentVarDAGHolder.current_vardag, VarDataBaseVO.from_index(index), false/*, true*/));
            })());
        }

        await all_promises(all_vardagnode_promises); // Attention Promise[] ne maintient pas le stackcontext a priori de façon systématique, contrairement au PromisePipeline. Ce n'est pas un contexte client donc OSEF ici

        VarDAGNode.unlock_nodes(nodes_to_unlock);

        ConsoleHandler.log('VarsDatasVoUpdateHandler.handle_invalidators:OUT');
    }

    /**
     * On supprime les noeuds qui correspondent à l'invalidator
     * @param invalidator
     * @returns
     */
    @RunsOnBgThread(VarsBGThreadNameHolder.bgthread_name, null)//static
    private static async apply_invalidator_in_tree(invalidator: VarDataInvalidatorVO) {
        const invalid_nodes: VarDAGNode[] = await this.filter_varsdatas_cache_by_invalidator(invalidator);

        if (!invalid_nodes) {
            return;
        }

        for (const i in invalid_nodes) {
            const node = invalid_nodes[i];

            if (!node) {
                continue;
            }
            if (!node.var_dag) {
                continue;
            }

            // Sauf que normalement à ce stade la liste des invalideurs est appliquées, et elle est déjà déployées sur l'arbre de deps.
            // Donc là c'est un doublon
            // /**
            //  * On doit tout invalider vers le haut aussi
            //  */
            // let list_nodes = [];
            // DAGController.visit_bottom_up_from_node(node, async (n: VarDAGNode) => {
            //     list_nodes.push(n);
            // });

            // for (let j in list_nodes) {

            //     list_nodes[j].unlinkFromDAG(true);
            //     if (ConfigurationService.node_configuration.debug_vars_invalidation) {
            //         ConsoleHandler.log('VarsDatasVoUpdateHandler.apply_invalidator_in_tree:UNLINKED:' + list_nodes[j].var_data.index);
            //     }
            // }
            node.unlinkFromDAG(true);
            if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                ConsoleHandler.log('VarsDatasVoUpdateHandler.apply_invalidator_in_tree:UNLINKED:' + node.var_data.index + ':by:');
                invalidator.console_log();
            }
        }
    }

    /**
     * Doit être lancé depuis le thread des vars
     */
    @RunsOnBgThread(VarsBGThreadNameHolder.bgthread_name, null)//static
    private static async filter_varsdatas_cache_by_invalidator(invalidator: VarDataInvalidatorVO): Promise<VarDAGNode[]> {

        if (!invalidator) {
            return null;
        }

        if (ConfigurationService.node_configuration.debug_vars_invalidation) {
            ConsoleHandler.log('VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_invalidator:' + invalidator.var_data.index + ':');
        }

        if (invalidator.invalidator_type == VarDataInvalidatorVO.INVALIDATOR_TYPE_EXACT) {

            const node: VarDAGNode = CurrentVarDAGHolder.current_vardag.nodes[invalidator.var_data.index];

            if (!node) {
                if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                    ConsoleHandler.log('VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_invalidator:EXACT:' + invalidator.var_data.index + ': NOT FOUND');
                }

                return null;
            }

            if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                ConsoleHandler.log('VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_invalidator:EXACT:' + invalidator.var_data.index +
                    ':!!node:' + !!node + ':!!node.var_data:' + !!node.var_data + ':value_type:' + node.var_data.value_type +
                    ':invalidate_denied:' + invalidator.invalidate_denied + ':invalidate_imports:' + invalidator.invalidate_imports);
            }

            if ((node.var_data.value_type == VarDataBaseVO.VALUE_TYPE_DENIED) && (!invalidator.invalidate_denied)) {
                return null;
            }

            if ((node.var_data.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) && (!invalidator.invalidate_imports)) {
                return null;
            }

            if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                ConsoleHandler.log('VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_invalidator:EXACT:' + invalidator.var_data.index + ': INVALIDATED');
            }

            return [node];
        }

        const res: VarDAGNode[] = [];


        for (const i in CurrentVarDAGHolder.current_vardag.nodes) {
            const node: VarDAGNode = CurrentVarDAGHolder.current_vardag.nodes[i];

            if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                ConsoleHandler.log('VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_invalidator:INTERSECTED:' + invalidator.var_data.index +
                    ':!!node:' + !!node + ':!!node.var_data:' + !!node.var_data + ':value_type:' + node.var_data.value_type +
                    ':node_index:' + node.var_data.index + ':node_var_id:' + node.var_data.var_id + ':invalidator_var_id:' + invalidator.var_data.var_id +
                    ':invalidate_denied:' + invalidator.invalidate_denied + ':invalidate_imports:' + invalidator.invalidate_imports);
            }

            if (node.var_data._type != invalidator.var_data._type) {
                continue;
            }

            if (node.var_data.var_id != invalidator.var_data.var_id) {
                continue;
            }

            if ((node.var_data.value_type == VarDataBaseVO.VALUE_TYPE_DENIED) && (!invalidator.invalidate_denied)) {
                continue;
            }

            if ((node.var_data.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) && (!invalidator.invalidate_imports)) {
                continue;
            }

            if ((invalidator.invalidator_type == VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED) && !MatroidController.matroid_intersects_matroid(node.var_data, invalidator.var_data)) {
                continue;
            }

            if (invalidator.invalidator_type == VarDataInvalidatorVO.INVALIDATOR_TYPE_INCLUDED_OR_EXACT) {
                throw new Error('Not Implemented');
            }

            if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                ConsoleHandler.log('VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_invalidator:INTERSECTED:' + invalidator.var_data.index +
                    ':node_index:' + node.var_data.index + ': INVALIDATED');
            }

            res.push(node);
        }

        return res;
    }

    // /**
    //  * Se lance sur le thread des vars
    //  */
    // private static filter_varsdatas_cache_by_exact_matroids(
    //     matroids: VarDataBaseVO[]): Promise<VarDataBaseVO[]> {

    //     return new Promise(async (resolve, reject) => {

    //         let thrower = (error) => {
    //             //TODO fixme do something to inform user
    //             ConsoleHandler.error('failed filter_varsdatas_cache_by_exact_matroids' + error);
    //             resolve([]);
    //         };

    //         if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
    //             thrower,
    //             VarsBGThreadNameHolder.bgthread_name,
    //             VarsDatasVoUpdateHandler.TASK_NAME_filter_varsdatas_cache_by_exact_matroids,
    //             resolve,
    //             matroids)) {
    //             return;
    //         }

    //         let res: VarDataBaseVO[] = [];

    //         for (let i in matroids) {
    //             let param = VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_exact_matroid(matroids[i]);
    //             if (!!param) {
    //                 res.push(param);
    //             }
    //         }

    //         resolve(res);
    //     });
    // }

    // /**
    //  * Doit être lancé depuis le thread des vars
    //  */
    // private static filter_varsdatas_cache_by_exact_matroid(matroid: VarDataBaseVO): VarDataBaseVO {
    //     let wrapper = VarsDatasProxy.vars_datas_buffer_wrapped_indexes[matroid.index];

    //     return wrapper ? wrapper.var_data : null;
    // }


    /**
     * Préparation du batch d'invalidation des vars suite à des CUD de vos
     * @param vos_update_buffer les updates par type à remplir
     * @param vos_create_or_delete_buffer les creates / deletes par type à remplir
     * @param vo_types la liste des vo_types à remplir
     * @returns 0 si on a géré limit éléments dans le buffer, != 0 sinon (et donc le buffer est vide)
     */
    @RunsOnBgThread(VarsBGThreadNameHolder.bgthread_name, null)//static
    private static async prepare_updates(
        ordered_vos_cud: Array<IDistantVOBase | DAOUpdateVOHolder<IDistantVOBase>>,
        vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> },
        vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] },
        vo_types: string[]
    ) {

        if (ordered_vos_cud && ordered_vos_cud.length) {
            ConsoleHandler.log('VarsDatasVoUpdateHandler:prepare_updates:IN :ordered_vos_cud length:' + ordered_vos_cud.length);
        } else {
            return;
        }

        const vo_ids_by_api_type_id_for_log: { [api_type_id: string]: number[] } = {};

        while (ordered_vos_cud && ordered_vos_cud.length) {

            const vo_cud = ordered_vos_cud.shift();

            // Si on a un champ _type, on est sur un VO, sinon c'est un update
            if ((vo_cud as IDistantVOBase)._type) {
                if (!vos_create_or_delete_buffer[(vo_cud as IDistantVOBase)._type]) {
                    vo_types.push((vo_cud as IDistantVOBase)._type);
                    vos_create_or_delete_buffer[(vo_cud as IDistantVOBase)._type] = [];
                }

                vos_create_or_delete_buffer[(vo_cud as IDistantVOBase)._type].push(vo_cud as IDistantVOBase);

                if (!vo_ids_by_api_type_id_for_log[(vo_cud as IDistantVOBase)._type]) {
                    vo_ids_by_api_type_id_for_log[(vo_cud as IDistantVOBase)._type] = [];
                }

                vo_ids_by_api_type_id_for_log[(vo_cud as IDistantVOBase)._type].push((vo_cud as IDistantVOBase).id);
            } else {
                const update_holder: DAOUpdateVOHolder<IDistantVOBase> = vo_cud as DAOUpdateVOHolder<IDistantVOBase>;
                if (!vos_update_buffer[update_holder.post_update_vo._type]) {
                    if (!vos_create_or_delete_buffer[update_holder.post_update_vo._type]) {
                        vo_types.push(update_holder.post_update_vo._type);
                    }

                    vos_update_buffer[update_holder.post_update_vo._type] = [];
                }

                vos_update_buffer[update_holder.post_update_vo._type].push(update_holder);

                if (!vo_ids_by_api_type_id_for_log[update_holder.post_update_vo._type]) {
                    vo_ids_by_api_type_id_for_log[update_holder.post_update_vo._type] = [];
                }

                vo_ids_by_api_type_id_for_log[update_holder.post_update_vo._type].push(update_holder.post_update_vo.id);
            }
        }

        ConsoleHandler.log('VarsDatasVoUpdateHandler:prepare_updates:OUT:ordered_vos_cud length:' + ordered_vos_cud.length + ':vo_ids_by_api_type_id_for_log:' + JSON.stringify(vo_ids_by_api_type_id_for_log));
    }

    // @ThrottleExecAsServerRunsOnBgThread(
    //     {
    //         param_type: THROTTLED_METHOD_PARAM_TYPE.STACKABLE,
    //         leading: true,
    //         trailing: true,
    //         throttle_ms: 100,
    //     },
    //     VarsBGThreadNameHolder.bgthread_name,
    //     false
    // )

}