
import { Duration, Moment } from 'moment';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleContextFilter from '../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ManualTasksController from '../../../shared/modules/Cron/ManualTasksController';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DataFilterOption from '../../../shared/modules/DataRender/vos/DataFilterOption';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import MatroidBaseController from '../../../shared/modules/Matroid/MatroidBaseController';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import DAG from '../../../shared/modules/Var/graph/dagbase/DAG';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import ModuleVar from '../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import VarConfIds from '../../../shared/modules/Var/vos/VarConfIds';
import VarConfVO from '../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../shared/modules/Var/vos/VarDataValueResVO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import StackContext from '../../StackContext';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import BGThreadServerController from '../BGThread/BGThreadServerController';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import ModuleContextFilterServer from '../ContextFilter/ModuleContextFilterServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPostCreateTriggerHook from '../DAO/triggers/DAOPostCreateTriggerHook';
import DAOPostDeleteTriggerHook from '../DAO/triggers/DAOPostDeleteTriggerHook';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import DAOPreUpdateTriggerHook from '../DAO/triggers/DAOPreUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ForkedTasksController from '../Fork/ForkedTasksController';
import ModuleServerBase from '../ModuleServerBase';
import ModuleServiceBase from '../ModuleServiceBase';
import ModulesManagerServer from '../ModulesManagerServer';
import PerfMonAdminTasksController from '../PerfMon/PerfMonAdminTasksController';
import PerfMonConfController from '../PerfMon/PerfMonConfController';
import PushDataServerController from '../PushData/PushDataServerController';
import VarsdatasComputerBGThread from './bgthreads/VarsdatasComputerBGThread';
import DataSourceControllerBase from './datasource/DataSourceControllerBase';
import VarCronWorkersHandler from './VarCronWorkersHandler';
import VarsComputeController from './VarsComputeController';
import VarsDatasProxy from './VarsDatasProxy';
import VarsDatasVoUpdateHandler from './VarsDatasVoUpdateHandler';
import VarServerControllerBase from './VarServerControllerBase';
import VarsPerfMonServerController from './VarsPerfMonServerController';
import VarsServerCallBackSubsController from './VarsServerCallBackSubsController';
import VarsServerController from './VarsServerController';
import VarsTabsSubsController from './VarsTabsSubsController';





export default class ModuleVarServer extends ModuleServerBase {

    public static TASK_NAME_getSimpleVarDataCachedValueFromParam = 'Var.getSimpleVarDataCachedValueFromParam';
    public static TASK_NAME_delete_varcacheconf_from_cache = 'Var.delete_varcacheconf_from_cache';
    public static TASK_NAME_update_varcacheconf_from_cache = 'Var.update_varcacheconf_from_cache';
    public static TASK_NAME_wait_for_computation_hole = 'Var.wait_for_computation_hole';


    public static getInstance() {
        if (!ModuleVarServer.instance) {
            ModuleVarServer.instance = new ModuleVarServer();
        }
        return ModuleVarServer.instance;
    }

    private static instance: ModuleVarServer = null;

    private constructor() {
        super(ModuleVar.getInstance().name);
    }

    public async configure() {

        let PML__VarsdatasComputerBGThread__do_calculation_run = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsdatasComputerBGThread__do_calculation_run);

        let PML__VarServerControllerBase__computeValue = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarServerControllerBase__computeValue);

        let PML__VarsDatasProxy__handle_buffer = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsDatasProxy__handle_buffer);
        let PML__VarsDatasProxy__get_exact_param_from_buffer_or_bdd = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsDatasProxy__get_exact_param_from_buffer_or_bdd);
        let PML__VarsDatasProxy__prepend_var_datas = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsDatasProxy__prepend_var_datas);
        let PML__VarsDatasProxy__get_var_datas_or_ask_to_bgthread = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsDatasProxy__get_var_datas_or_ask_to_bgthread);
        let PML__VarsDatasProxy__append_var_datas = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsDatasProxy__append_var_datas);
        let PML__VarsDatasProxy__get_exact_params_from_buffer_or_bdd = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsDatasProxy__get_exact_params_from_buffer_or_bdd);
        let PML__VarsDatasProxy__get_vars_to_compute_from_buffer_or_bdd = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsDatasProxy__get_vars_to_compute_from_buffer_or_bdd);
        let PML__VarsDatasProxy__update_existing_buffered_older_datas = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsDatasProxy__update_existing_buffered_older_datas);
        let PML__VarsDatasProxy__get_vars_to_compute_from_bdd = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsDatasProxy__get_vars_to_compute_from_bdd);
        let PML__VarsDatasProxy__filter_var_datas_by_indexes = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsDatasProxy__filter_var_datas_by_indexes);

        let PML__VarsComputeController__compute = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsComputeController__compute);
        let PML__VarsComputeController__cache_datas = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsComputeController__cache_datas);
        let PML__VarsComputeController__deploy_deps = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsComputeController__deploy_deps);
        let PML__VarsComputeController__load_nodes_datas = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsComputeController__load_nodes_datas);
        let PML__VarsComputeController__compute_node = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsComputeController__compute_node);
        let PML__VarsComputeController__create_tree = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsComputeController__create_tree);
        let PML__VarsComputeController__handle_deploy_deps = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsComputeController__handle_deploy_deps);
        let PML__VarsComputeController__try_load_cache_complet = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsComputeController__try_load_cache_complet);
        let PML__VarsComputeController__try_load_cache_partiel = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsComputeController__try_load_cache_partiel);
        let PML__VarsComputeController__get_node_deps = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsComputeController__get_node_deps);

        let PML__DataSourcesController__load_node_datas = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__DataSourcesController__load_node_datas);

        let PML__DataSourceControllerBase__load_node_data = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__DataSourceControllerBase__load_node_data);

        let PML__VarsPerfsController__update_perfs_in_bdd = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsPerfsController__update_perfs_in_bdd);
        let PML__VarsDatasVoUpdateHandler__handle_buffer = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsDatasVoUpdateHandler__handle_buffer);
        let PML__VarsDatasVoUpdateHandler__invalidate_datas_and_parents = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsDatasVoUpdateHandler__invalidate_datas_and_parents);
        let PML__VarsDatasVoUpdateHandler__update_param = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsDatasVoUpdateHandler__update_param);
        let PML__VarsDatasVoUpdateHandler__find_invalid_datas_and_push_for_update = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsDatasVoUpdateHandler__find_invalid_datas_and_push_for_update);
        let PML__VarsCacheController__partially_clean_bdd_cache = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsCacheController__partially_clean_bdd_cache);
        let PML__VarsImportsHandler__load_imports_and_split_nodes = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsImportsHandler__load_imports_and_split_nodes);
        let PML__VarsImportsHandler__split_nodes = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsImportsHandler__split_nodes);
        let PML__VarsImportsHandler__aggregate_imports_and_remaining_datas = await PerfMonConfController.getInstance().registerPerformanceType(VarsPerfMonServerController.PML__VarsImportsHandler__aggregate_imports_and_remaining_datas);

        PerfMonAdminTasksController.getInstance().register_perfmon_pack("VARs", [
            PML__VarsdatasComputerBGThread__do_calculation_run,

            PML__VarServerControllerBase__computeValue,

            PML__VarsDatasProxy__handle_buffer,
            PML__VarsDatasProxy__get_exact_param_from_buffer_or_bdd,
            PML__VarsDatasProxy__prepend_var_datas,
            PML__VarsDatasProxy__get_var_datas_or_ask_to_bgthread,
            PML__VarsDatasProxy__append_var_datas,
            PML__VarsDatasProxy__get_exact_params_from_buffer_or_bdd,
            PML__VarsDatasProxy__get_vars_to_compute_from_buffer_or_bdd,
            PML__VarsDatasProxy__update_existing_buffered_older_datas,
            PML__VarsDatasProxy__get_vars_to_compute_from_bdd,
            PML__VarsDatasProxy__filter_var_datas_by_indexes,

            PML__VarsComputeController__compute,
            PML__VarsComputeController__cache_datas,
            PML__VarsComputeController__deploy_deps,
            PML__VarsComputeController__load_nodes_datas,
            PML__VarsComputeController__compute_node,
            PML__VarsComputeController__create_tree,
            PML__VarsComputeController__handle_deploy_deps,
            PML__VarsComputeController__try_load_cache_complet,
            PML__VarsComputeController__try_load_cache_partiel,
            PML__VarsComputeController__get_node_deps,

            PML__DataSourcesController__load_node_datas,
            PML__DataSourceControllerBase__load_node_data,

            PML__VarsPerfsController__update_perfs_in_bdd,
            PML__VarsDatasVoUpdateHandler__handle_buffer,
            PML__VarsDatasVoUpdateHandler__invalidate_datas_and_parents,
            PML__VarsDatasVoUpdateHandler__update_param,
            PML__VarsDatasVoUpdateHandler__find_invalid_datas_and_push_for_update,
            PML__VarsCacheController__partially_clean_bdd_cache,
            PML__VarsImportsHandler__load_imports_and_split_nodes,
            PML__VarsImportsHandler__split_nodes,
            PML__VarsImportsHandler__aggregate_imports_and_remaining_datas
        ]);

        VarsTabsSubsController.getInstance();
        VarsServerCallBackSubsController.getInstance();
        ModuleBGThreadServer.getInstance().registerBGThread(VarsdatasComputerBGThread.getInstance());

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Valeur' }, 'var.desc_mode.var_data.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Description' }, 'var.desc_mode.var_description.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Paramètres' }, 'var.desc_mode.var_params.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Dépendances' }, 'var.desc_mode.var_deps.___LABEL___'));

        let postCTrigger: DAOPostCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        let postUTrigger: DAOPostUpdateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        let postDTrigger: DAOPostDeleteTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPostDeleteTriggerHook.DAO_POST_DELETE_TRIGGER);
        let preCTrigger: DAOPreCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        let preUTrigger: DAOPreUpdateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);

        // Trigger sur les varcacheconfs pour mettre à jour les confs en cache en même temps qu'on les modifie dans l'outil
        postCTrigger.registerHandler(VarCacheConfVO.API_TYPE_ID, this.onCVarCacheConf);
        postUTrigger.registerHandler(VarCacheConfVO.API_TYPE_ID, this.onUVarCacheConf);
        postDTrigger.registerHandler(VarCacheConfVO.API_TYPE_ID, this.onPostDVarCacheConf);

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Calculée'
        }, 'var_data.value_type.computed'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Importée'
        }, 'var_data.value_type.import'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Datasources'
        }, 'var.desc_mode.var_datasources.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Vider l\'arbre'
        }, 'var_desc.clearDag.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Actualiser la HeatMap des deps'
        }, 'var_desc.refreshDependenciesHeatmap.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Valeur brute importée ou saisie manuellement le {formatted_date} : {value}'
        }, 'VarDataRefComponent.var_data_value_import_tooltip.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Matroids calculés'
        }, 'var.desc_mode.computed_datas_matroids.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Matroids chargés'
        }, 'var.desc_mode.loaded_datas_matroids.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Valeur totale des matroids chargés'
        }, 'var.desc_mode.loaded_datas_matroids_sum_value.___LABEL___'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Variable invalidée, calcul en cours...'
        }, 'var.desc_mode.update_var_data.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Invalidation impossible sur un import'
        }, 'var.desc_mode.update_var_data.not_allowed_on_imports.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Indicateurs - Objectif'
        }, 'fields.labels.ref.module_psa_primes_indicateur.___LABEL____var_objectif_id'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Indicateurs - Réalisé'
        }, 'fields.labels.ref.module_psa_primes_indicateur.___LABEL____var_realise_id'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Var conf cache'
        }, 'menu.menuelements.admin.VarCacheConfVO.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Nombre de deps'
        }, 'var.desc_mode.dependencies_number.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Deps en % de l\'arbre'
        }, 'var.desc_mode.dependencies_tree_prct.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: '% de vars enregistrées'
        }, 'var_desc_registrations.vardag_registered_prct.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: '% de vars enregistrées / var_id'
        }, 'var_desc_registrations.vardag_registered_prct_by_var_id.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Taille de l\'arbre'
        }, 'var_desc_registrations.vardag_size.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Données importées/aggrégées'
        }, 'var_desc.aggregated_var_datas.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Cache des modifications de VO vidé. Prêt pour le redémarrage'
        }, 'force_empty_vars_datas_vo_update_cache.done'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Import ?'
        }, 'var_desc.var_data_is_import.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Date màj : {last_update}'
        }, 'var_desc.var_data_last_update.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Explication du calcul'
        }, 'var_desc.explaination.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Markers'
        }, 'var.desc_mode.var_markers.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Actualiser le graph'
        }, 'var_desc.create_graph.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'StepByStep'
        }, 'var_desc.pause.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Variable'
        }, 'var_desc.var_controller_label.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Valeur non formatée'
        }, 'var_desc.var_data_label.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Source de données'
        }, 'var_desc.var_ds_label.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Supprimer le cache par intersection'
        }, 'vars_datas_explorer_actions.delete_cache_intersection.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Afficher les données exactes'
        }, 'vars_datas_explorer_actions.get_exact.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Calculer ce paramètre'
        }, 'vars_datas_explorer_actions.show_exact.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Afficher les données incluses'
        }, 'vars_datas_explorer_actions.get_included.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Afficher les données intersectées'
        }, 'vars_datas_explorer_actions.get_intersection.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Invalider le cache par intersection'
        }, 'vars_datas_explorer_actions.invalidate_cache_intersection.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Invalider l\'arbre en cache par intersection'
        }, 'vars_datas_explorer_actions.invalidate_cache_intersection_and_depstree.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Supprimer le cache et les imports par intersection'
        }, 'vars_datas_explorer_actions.delete_cache_and_import_intersection.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Variables'
        }, 'vars_datas_explorer_filters.vars_confs.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Performances'
        }, 'menu.menuelements.admin.VarPerfVO.___LABEL___'));


        // ForkedTasksController.getInstance().register_task(ModuleVarServer.TASK_NAME_getSimpleVarDataCachedValueFromParam, this.getSimpleVarDataCachedValueFromParam.bind(this));
        ForkedTasksController.getInstance().register_task(ModuleVarServer.TASK_NAME_wait_for_computation_hole, this.wait_for_computation_hole.bind(this));
        ForkedTasksController.getInstance().register_task(ModuleVarServer.TASK_NAME_delete_varcacheconf_from_cache, this.delete_varcacheconf_from_cache.bind(this));
        ForkedTasksController.getInstance().register_task(ModuleVarServer.TASK_NAME_update_varcacheconf_from_cache, this.update_varcacheconf_from_cache.bind(this));

        ModuleServiceBase.getInstance().post_modules_installation_hooks.push(() => {

            /**
             * Ajout des triggers d'invalidation des données de cache en BDD
             *  - on part de la liste des vars qui ont un cache et des datasources
             * api_type_id => les vos des datasources
             */
            for (let api_type_id in VarsServerController.getInstance().registered_vars_controller_by_api_type_id) {

                postCTrigger.registerHandler(api_type_id, this.invalidate_var_cache_from_vo_cd);
                postUTrigger.registerHandler(api_type_id, this.invalidate_var_cache_from_vo_u);
                postDTrigger.registerHandler(api_type_id, this.invalidate_var_cache_from_vo_cd);
            }

            /**
             * On ajoute les trigger preC et preU pour mettre à jour l'index bdd avant insert
             * api_type_id => les vos des vars datas
             */
            for (let api_type_id in VarsServerController.getInstance().varcacheconf_by_api_type_ids) {

                preCTrigger.registerHandler(api_type_id, this.prepare_bdd_index_for_c);
                preUTrigger.registerHandler(api_type_id, this.prepare_bdd_index_for_u);

                // On invalide l'arbre par intersection si on passe un type en import, ou si on change la valeur d'un import, ou si on passe de import à calculé
                postCTrigger.registerHandler(api_type_id, this.invalidate_imports_for_c);
                postUTrigger.registerHandler(api_type_id, this.invalidate_imports_for_u);
            }

            VarsServerController.getInstance().init_varcontrollers_dag();
        });

        ManualTasksController.getInstance().registered_manual_tasks_by_name[ModuleVar.MANUAL_TASK_NAME_force_empty_vars_datas_vo_update_cache] =
            VarsDatasVoUpdateHandler.getInstance().force_empty_vars_datas_vo_update_cache;
    }

    /**
     * Trigger qui gère l'invalidation des vars en fonction du vo passé en param
     *  On doit par ailleurs utiliser un buffer des invalidations pour pas tout invalider en boucle => exemple sur un import de 100 facture 1 jour,
     *      le CA du jour devrait être invalidé une fois
     * @param vo
     */
    public async invalidate_var_cache_from_vo_cd(vo: IDistantVOBase): Promise<void> {

        try {
            await VarsDatasVoUpdateHandler.getInstance().register_vo_cud(vo);
            VarsdatasComputerBGThread.getInstance().force_run_asap();
        } catch (error) {
            ConsoleHandler.getInstance().error('invalidate_var_cache_from_vo:type:' + vo._type + ':id:' + vo.id + ':' + vo + ':' + error);
        }
    }

    /**
     * Trigger qui gère l'invalidation des vars en fonction des vos passés en param
     *  On doit par ailleurs utiliser un buffer des invalidations pour pas tout invalider en boucle => exemple sur un import de 100 facture 1 jour,
     *      le CA du jour devrait être invalidé une fois
     * @param vo_update_handler
     */
    public async invalidate_var_cache_from_vo_u(vo_update_handler: DAOUpdateVOHolder<IDistantVOBase>): Promise<void> {

        try {
            await VarsDatasVoUpdateHandler.getInstance().register_vo_cud(vo_update_handler);
            VarsdatasComputerBGThread.getInstance().force_run_asap();
        } catch (error) {
            ConsoleHandler.getInstance().error('invalidate_var_cache_from_vo:type:' + vo_update_handler.post_update_vo._type + ':id:' + vo_update_handler.post_update_vo.id + ':' + vo_update_handler.post_update_vo + ':' + error);
        }
    }

    public async invalidate_imports_for_c(vo: VarDataBaseVO) {
        // Si on crée une data en import, on doit forcer le recalcul, si on crée en calcul aucun impact
        if (vo.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) {

            // Quand on reçoit un import / met à jour un import on doit aussi informer par notif tout le monde
            await VarsTabsSubsController.getInstance().notify_vardatas([vo]);
            VarsServerCallBackSubsController.getInstance().notify_vardatas([vo]);

            // et mettre à jour la version potentiellement en cache actuellement
            await VarsDatasProxy.getInstance().update_existing_buffered_older_datas([vo]);

            await ModuleVar.getInstance().invalidate_cache_intersection_and_parents([vo]);
        }
    }

    public async invalidate_imports_for_u(vo_update_handler: DAOUpdateVOHolder<VarDataBaseVO>) {
        // Si on modifier la valeur d'un import, ou si on change le type de valeur, on doit invalider l'arbre
        if ((vo_update_handler.post_update_vo.value_type != vo_update_handler.pre_update_vo.value_type) ||
            ((vo_update_handler.post_update_vo.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) && (vo_update_handler.post_update_vo.value != vo_update_handler.pre_update_vo.value))) {

            // Quand on reçoit un import / met à jour un import on doit aussi informer par notif tout le monde
            await VarsTabsSubsController.getInstance().notify_vardatas([vo_update_handler.post_update_vo]);
            VarsServerCallBackSubsController.getInstance().notify_vardatas([vo_update_handler.post_update_vo]);

            // et mettre à jour la version potentiellement en cache actuellement
            await VarsDatasProxy.getInstance().update_existing_buffered_older_datas([vo_update_handler.post_update_vo]);

            await ModuleVar.getInstance().invalidate_cache_intersection_and_parents([vo_update_handler.post_update_vo]);
        }
    }

    public async prepare_bdd_index_for_c(vo: VarDataBaseVO) {

        // Si on est sur un import et sans date, on force une date
        if ((vo.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) && (!vo.value_ts)) {
            vo.value_ts = Dates.now();
        }
        vo['_bdd_only_index'] = vo.bdd_only_index;
        return true;
    }

    public async prepare_bdd_index_for_u(vo_update_handler: DAOUpdateVOHolder<VarDataBaseVO>) {

        // Si on est sur un import et sans date, on force une date
        if ((vo_update_handler.post_update_vo.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) && (!vo_update_handler.post_update_vo.value_ts)) {
            vo_update_handler.post_update_vo.value_ts = Dates.now();
        }
        vo_update_handler.post_update_vo['_bdd_only_index'] = vo_update_handler.post_update_vo.bdd_only_index;
        return true;
    }

    public async invalidate_cache_exact(vos: VarDataBaseVO[]) {

        if ((!vos) || (!vos.length)) {
            return;
        }

        vos = vos.filter((vo) => {
            if (!vo.check_param_is_valid(vo._type)) {
                ConsoleHandler.getInstance().error('Les champs du matroid ne correspondent pas à son typage');
                return false;
            }
            return true;
        });

        let vos_by_type_id: { [api_type_id: string]: VarDataBaseVO[] } = {};
        for (let i in vos) {
            let vo = vos[i];

            if (!vos_by_type_id[vo._type]) {
                vos_by_type_id[vo._type] = [];
            }
            vos_by_type_id[vo._type].push(vo);
        }

        for (let api_type_id in vos_by_type_id) {
            let vos_type = vos_by_type_id[api_type_id];

            let bdd_vos: VarDataBaseVO[] = await ModuleDAO.getInstance().getVosByExactMatroids(api_type_id, vos_type, null);

            // Impossible d'invalider un import
            bdd_vos = bdd_vos.filter((bdd_vo) => bdd_vo.value_type !== VarDataBaseVO.VALUE_TYPE_IMPORT);

            if (bdd_vos && bdd_vos.length) {

                for (let j in bdd_vos) {
                    let bdd_vo = bdd_vos[j];
                    bdd_vo.value_ts = null;
                }
                await ModuleDAO.getInstance().insertOrUpdateVOs(bdd_vos);
                await VarsDatasProxy.getInstance().append_var_datas(bdd_vos);
            }
        }
    }

    public async invalidate_cache_exact_and_parents(vos: VarDataBaseVO[]) {

        if ((!vos) || (!vos.length)) {
            return;
        }

        vos = vos.filter((vo) => {
            if (!vo.check_param_is_valid(vo._type)) {
                ConsoleHandler.getInstance().error('Les champs du matroid ne correspondent pas à son typage');
                return false;
            }
            return true;
        });

        let vos_by_type_id: { [api_type_id: string]: VarDataBaseVO[] } = {};
        for (let i in vos) {
            let vo = vos[i];

            if (!vos_by_type_id[vo._type]) {
                vos_by_type_id[vo._type] = [];
            }
            vos_by_type_id[vo._type].push(vo);
        }

        let vos_by_var_id: { [var_id: number]: { [index: string]: VarDataBaseVO } } = {};
        for (let api_type_id in vos_by_type_id) {
            let vos_type = vos_by_type_id[api_type_id];

            let bdd_vos: VarDataBaseVO[] = await ModuleDAO.getInstance().getVosByExactMatroids(api_type_id, vos_type, null);

            if (bdd_vos && bdd_vos.length) {

                for (let j in bdd_vos) {
                    let bdd_vo = bdd_vos[j];

                    if (!vos_by_var_id[bdd_vo.var_id]) {
                        vos_by_var_id[bdd_vo.var_id] = {};
                    }
                    vos_by_var_id[bdd_vo.var_id][bdd_vo.index] = bdd_vo;
                }
            }
        }

        await VarsDatasVoUpdateHandler.getInstance().invalidate_datas_and_parents(vos_by_var_id);
    }

    public async invalidate_cache_intersection_and_parents(vos: VarDataBaseVO[]) {

        if ((!vos) || (!vos.length)) {
            return;
        }

        vos = vos.filter((vo) => {
            if (!vo.check_param_is_valid(vo._type)) {
                ConsoleHandler.getInstance().error('Les champs du matroid ne correspondent pas à son typage');
                return false;
            }
            return true;
        });

        let vos_by_var_id: { [var_id: number]: { [index: string]: VarDataBaseVO } } = {};
        for (let i in vos) {
            let vo = vos[i];

            if (!vos_by_var_id[vo.var_id]) {
                vos_by_var_id[vo.var_id] = {};
            }
            vos_by_var_id[vo.var_id][vo.index] = vo;
        }

        // invalidate intersected && parents
        await VarsDatasVoUpdateHandler.getInstance().invalidate_datas_and_parents(vos_by_var_id);
    }

    // public async invalidate_cache_intersection(vos: VarDataBaseVO[]) {

    //     if ((!vos) || (!vos.length)) {
    //         return;
    //     }

    //     this.invalidate_cache_intersection_and_parents(vos);


    //     for (let i in vos) {
    //         let vo = vos[i];

    //         if (!vo.check_param_is_valid(vo._type)) {
    //             ConsoleHandler.getInstance().error('Les champs du matroid ne correspondent pas à son typage');
    //             continue;
    //         }

    //         let moduletable_vardata = VOsTypesManager.getInstance().moduleTables_by_voType[vo._type];
    //         let query: string = ModuleDAOServer.getInstance().getWhereClauseForFilterByMatroidIntersection(vo._type, vo, null);

    //         if (moduletable_vardata.is_segmented) {

    //             let ranges: NumRange[] = ModuleDAOServer.getInstance().get_all_ranges_from_segmented_table(moduletable_vardata);

    //             await RangeHandler.getInstance().foreach_ranges(ranges, async (segment: number | Duration | Moment) => {
    //                 let request: string = 'update ' + moduletable_vardata.get_segmented_full_name(segment) + ' t set value=null, value_ts=null where ' +
    //                     query + ' and value_type=' + VarDataBaseVO.VALUE_TYPE_COMPUTED + ';';
    //                 await ModuleServiceBase.getInstance().db.query(request);

    //                 TODO mettre à jour le cache aussi
    //             }, moduletable_vardata.table_segmented_field_segment_type);

    //         } else {
    //             let request: string = 'update ' + moduletable_vardata.full_name + ' t set value=null, value_ts=null where ' +
    //                 query + ' and value_type=' + VarDataBaseVO.VALUE_TYPE_COMPUTED + ';';
    //             await ModuleServiceBase.getInstance().db.query(request);

    //             TODO mettre à jour le cache aussi
    //         }
    //     }
    // }

    public async delete_cache_intersection(vos: VarDataBaseVO[]) {

        if ((!vos) || (!vos.length)) {
            return;
        }

        for (let i in vos) {
            let vo = vos[i];

            if (!vo.check_param_is_valid(vo._type)) {
                ConsoleHandler.getInstance().error('Les champs du matroid ne correspondent pas à son typage');
                continue;
            }

            let moduletable_vardata = VOsTypesManager.getInstance().moduleTables_by_voType[vo._type];
            let query: string = ModuleDAOServer.getInstance().getWhereClauseForFilterByMatroidIntersection(vo._type, vo, null);

            if (moduletable_vardata.is_segmented) {

                let ranges: NumRange[] = ModuleDAOServer.getInstance().get_all_ranges_from_segmented_table(moduletable_vardata);

                await RangeHandler.getInstance().foreach_ranges(ranges, async (segment: number) => {
                    let request: string = 'delete from ' + moduletable_vardata.get_segmented_full_name(segment) + ' t where ' +
                        query + ' and value_type=' + VarDataBaseVO.VALUE_TYPE_COMPUTED + ';';
                    await ModuleServiceBase.getInstance().db.query(request);
                }, moduletable_vardata.table_segmented_field_segment_type);

            } else {
                let request: string = 'delete from ' + moduletable_vardata.full_name + ' t where ' +
                    query + ' and value_type=' + VarDataBaseVO.VALUE_TYPE_COMPUTED + ';';
                await ModuleServiceBase.getInstance().db.query(request);
            }
        }
    }

    public async delete_cache_and_imports_intersection(vos: VarDataBaseVO[]) {

        if ((!vos) || (!vos.length)) {
            return;
        }

        for (let i in vos) {
            let vo = vos[i];

            if (!vo.check_param_is_valid(vo._type)) {
                ConsoleHandler.getInstance().error('Les champs du matroid ne correspondent pas à son typage');
                continue;
            }

            let moduletable_vardata = VOsTypesManager.getInstance().moduleTables_by_voType[vo._type];
            let query: string = ModuleDAOServer.getInstance().getWhereClauseForFilterByMatroidIntersection(vo._type, vo, null);

            if (moduletable_vardata.is_segmented) {

                let ranges: NumRange[] = ModuleDAOServer.getInstance().get_all_ranges_from_segmented_table(moduletable_vardata);

                await RangeHandler.getInstance().foreach_ranges(ranges, async (segment: number) => {
                    let request: string = 'delete from ' + moduletable_vardata.get_segmented_full_name(segment) + ' t where ' +
                        query + ';';
                    await ModuleServiceBase.getInstance().db.query(request);
                }, moduletable_vardata.table_segmented_field_segment_type);

            } else {
                let request: string = 'delete from ' + moduletable_vardata.full_name + ' t where ' +
                    query + ';';
                await ModuleServiceBase.getInstance().db.query(request);
            }
        }
    }

    public registerServerApiHandlers() {
        // APIControllerWrapper.getInstance().registerServerApiHandler(ModuleVar.APINAME_INVALIDATE_MATROID, this.invalidate_matroid.bind(this));
        // APIControllerWrapper.getInstance().registerServerApiHandler(ModuleVar.APINAME_register_matroid_for_precalc, this.register_matroid_for_precalc.bind(this));
        // APIControllerWrapper.getInstance().registerServerApiHandler(ModuleVar.APINAME_getSimpleVarDataValueSumFilterByMatroids, this.getSimpleVarDataValueSumFilterByMatroids.bind(this));
        // APIControllerWrapper.getInstance().registerServerApiHandler(ModuleVar.APINAME_getSimpleVarDataCachedValueFromParam, this.getSimpleVarDataCachedValueFromParam.bind(this));
        // APIControllerWrapper.getInstance().registerServerApiHandler(ModuleVar.APINAME_configureVarCache, this.configureVarCache.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleVar.APINAME_register_params, this.register_params.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleVar.APINAME_unregister_params, this.unregister_params.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleVar.APINAME_get_var_id_by_names, this.get_var_id_by_names.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleVar.APINAME_getVarControllerVarsDeps, this.getVarControllerVarsDeps.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleVar.APINAME_getVarControllerDSDeps, this.getVarControllerDSDeps.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleVar.APINAME_getParamDependencies, this.getParamDependencies.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleVar.APINAME_getVarParamDatas, this.getVarParamDatas.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleVar.APINAME_getVarParamFromContextFilters, this.getVarParamFromContextFilters.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleVar.APINAME_getAggregatedVarDatas, this.getAggregatedVarDatas.bind(this));
        // APIControllerWrapper.getInstance().registerServerApiHandler(ModuleVar.APINAME_invalidate_cache_intersection, this.invalidate_cache_intersection.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleVar.APINAME_delete_cache_intersection, this.delete_cache_intersection.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleVar.APINAME_delete_cache_and_imports_intersection, this.delete_cache_and_imports_intersection.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleVar.APINAME_invalidate_cache_exact, this.invalidate_cache_exact.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleVar.APINAME_invalidate_cache_exact_and_parents, this.invalidate_cache_exact_and_parents.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleVar.APINAME_invalidate_cache_intersection_and_parents, this.invalidate_cache_intersection_and_parents.bind(this));
    }
    public registerCrons(): void {
        VarCronWorkersHandler.getInstance();
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleVar.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            fr: 'Variables'
        }));

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModuleVar.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, new DefaultTranslation({
            fr: 'Accès aux Variables sur le front'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let desc_mode_access: AccessPolicyVO = new AccessPolicyVO();
        desc_mode_access.group_id = group.id;
        desc_mode_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        desc_mode_access.translatable_name = ModuleVar.POLICY_DESC_MODE_ACCESS;
        desc_mode_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(desc_mode_access, new DefaultTranslation({
            fr: 'Accès au "Mode description"'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleVar.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            fr: 'Administration des vars'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let bo_varconf_access: AccessPolicyVO = new AccessPolicyVO();
        bo_varconf_access.group_id = group.id;
        bo_varconf_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_varconf_access.translatable_name = ModuleVar.POLICY_BO_VARCONF_ACCESS;
        bo_varconf_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_varconf_access, new DefaultTranslation({
            fr: 'Configuration des types de vars'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        access_dependency.src_pol_id = bo_varconf_access.id;
        access_dependency.depends_on_pol_id = bo_access.id;
        access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(access_dependency);


        let bo_imported_access: AccessPolicyVO = new AccessPolicyVO();
        bo_imported_access.group_id = group.id;
        bo_imported_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_imported_access.translatable_name = ModuleVar.POLICY_BO_IMPORTED_ACCESS;
        bo_imported_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_imported_access, new DefaultTranslation({
            fr: 'Configuration des données importées'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        access_dependency = new PolicyDependencyVO();
        access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        access_dependency.src_pol_id = bo_imported_access.id;
        access_dependency.depends_on_pol_id = bo_access.id;
        access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(access_dependency);
    }

    /**
     * Fonction ayant pour but d'être appelée sur le thread de computation des vars
     */
    public async wait_for_computation_hole(): Promise<boolean> {

        return new Promise(async (resolve, reject) => {

            if (!ForkedTasksController.getInstance().exec_self_on_main_process_and_return_value(
                VarsServerCallBackSubsController.TASK_NAME_get_vars_datas, resolve)) {
                return;
            }

            let start_time = Dates.now();
            let real_start_time = start_time;
            while (
                ObjectHandler.getInstance().hasAtLeastOneAttribute(VarsDatasVoUpdateHandler.getInstance().ordered_vos_cud)
                ||
                ObjectHandler.getInstance().hasAtLeastOneAttribute(await VarsDatasProxy.getInstance().get_vars_to_compute_from_buffer_or_bdd(1, 1, 1, 1))
            ) {
                await ThreadHandler.getInstance().sleep(10000);
                let actual_time = Dates.now();

                if (actual_time > (start_time + 60)) {
                    start_time = actual_time;
                    ConsoleHandler.getInstance().warn('ModuleVarServer:wait_for_computation_hole:Risque de boucle infinie:' + real_start_time + ':' + actual_time);
                }
            }
            resolve(true);
        });
    }

    private async onCVarCacheConf(vcc: VarCacheConfVO) {
        if (!vcc) {
            return;
        }

        await ForkedTasksController.getInstance().broadexec(ModuleVarServer.TASK_NAME_update_varcacheconf_from_cache, vcc);
    }

    private async onUVarCacheConf(vo_update_handler: DAOUpdateVOHolder<VarCacheConfVO>) {
        await ForkedTasksController.getInstance().broadexec(ModuleVarServer.TASK_NAME_update_varcacheconf_from_cache, vo_update_handler.post_update_vo);
    }

    private update_varcacheconf_from_cache(vcc: VarCacheConfVO) {
        VarsServerController.getInstance().varcacheconf_by_var_ids[vcc.var_id] = vcc;

        if (!VarsServerController.getInstance().getVarConfById(vcc.var_id)) {
            return;
        }

        if (!VarsServerController.getInstance().varcacheconf_by_api_type_ids[VarsServerController.getInstance().getVarConfById(vcc.var_id).var_data_vo_type]) {
            VarsServerController.getInstance().varcacheconf_by_api_type_ids[VarsServerController.getInstance().getVarConfById(vcc.var_id).var_data_vo_type] = {};
        }
        VarsServerController.getInstance().varcacheconf_by_api_type_ids[VarsServerController.getInstance().getVarConfById(vcc.var_id).var_data_vo_type][vcc.var_id] = vcc;
    }

    private delete_varcacheconf_from_cache(vcc: VarCacheConfVO) {
        delete VarsServerController.getInstance().varcacheconf_by_var_ids[vcc.var_id];

        if ((!!VarsServerController.getInstance().varcacheconf_by_api_type_ids[VarsServerController.getInstance().getVarConfById(vcc.var_id).var_data_vo_type]) &&
            (!!VarsServerController.getInstance().varcacheconf_by_api_type_ids[VarsServerController.getInstance().getVarConfById(vcc.var_id).var_data_vo_type][vcc.var_id])) {
            delete VarsServerController.getInstance().varcacheconf_by_api_type_ids[VarsServerController.getInstance().getVarConfById(vcc.var_id).var_data_vo_type][vcc.var_id];
        }
    }

    private async onPostDVarCacheConf(vcc: VarCacheConfVO) {
        if (!vcc) {
            return;
        }

        await ForkedTasksController.getInstance().broadexec(ModuleVarServer.TASK_NAME_delete_varcacheconf_from_cache, vcc);
    }

    private async get_var_id_by_names(): Promise<VarConfIds> {
        let res: VarConfIds = new VarConfIds();
        let var_confs: VarConfVO[] = await ModuleDAO.getInstance().getVos<VarConfVO>(VarConfVO.API_TYPE_ID);
        res.var_id_by_names = {};

        for (let i in var_confs) {
            let var_conf = var_confs[i];

            res.var_id_by_names[var_conf.name] = var_conf.id;
        }

        return res;
    }

    /**
     * Fonction qui demande l'abonnement d'un socket (celui par lequel arrive la demande) sur la mise à jour des
     *  valeurs des vardatas correspondants aux params. Et si on a déjà une valeur à fournir, alors on l'envoie directement
     * @param api_param
     */
    private async register_params(params: VarDataBaseVO[]): Promise<void> {

        if (!params) {
            return;
        }

        let uid = StackContext.getInstance().get('UID');
        let client_tab_id = StackContext.getInstance().get('CLIENT_TAB_ID');

        VarsTabsSubsController.getInstance().register_sub(uid, client_tab_id, params ? params.map((param) => param.index) : []);

        /**
         * Si on trouve des datas existantes et valides en base, on les envoie, sinon on indique qu'on attend ces valeurs
         */
        let notifyable_vars: VarDataBaseVO[] = [];
        let needs_computation: VarDataBaseVO[] = [];

        await VarsDatasProxy.getInstance().get_var_datas_or_ask_to_bgthread(params, notifyable_vars, needs_computation);

        if (notifyable_vars && notifyable_vars.length) {
            let vars_to_notif: VarDataValueResVO[] = [];
            notifyable_vars.forEach((notifyable_var) => vars_to_notif.push(new VarDataValueResVO().set_from_vardata(notifyable_var)));

            await PushDataServerController.getInstance().notifyVarsDatas(uid, client_tab_id, vars_to_notif);
        }





        // let promises = [];

        // let vars_to_notif: VarDataValueResVO[] = [];
        // let needs_var_computation: boolean = false;
        // for (let i in params) {
        //     let param = params[i];

        //     if (!param.check_param_is_valid(param._type)) {
        //         ConsoleHandler.getInstance().error('Les champs du matroid ne correspondent pas à son typage');
        //         continue;
        //     }

        //     // TODO FIXME promises.length
        //     if (promises.length >= 10) {
        //         await Promise.all(promises);
        //         promises = [];
        //     }

        //     promises.push((async () => {

        //         let in_db_data: VarDataBaseVO = await ModuleVarServer.getInstance().get_var_data_or_ask_to_bgthread(param);
        //         if (!in_db_data) {
        //             needs_var_computation = true;
        //             return;
        //         }

        //         vars_to_notif.push(new VarDataValueResVO().set_from_vardata(in_db_data));
        //     })());
        // }

        // await Promise.all(promises);

        // if (vars_to_notif && vars_to_notif.length) {
        //     await PushDataServerController.getInstance().notifyVarsDatas(uid, client_tab_id, vars_to_notif);
        // }
    }

    /**
     * Fonction qui demande la suppression de l'abonnement d'un socket (celui par lequel arrive la demande) sur la mise à jour des
     *  valeurs des vardatas correspondants aux params. Donc on les supprime de l'abonnement et c'est tout
     * @param api_param
     */
    private async unregister_params(params: VarDataBaseVO[]): Promise<void> {

        if (!params) {
            return;
        }

        let uid = StackContext.getInstance().get('UID');
        let client_tab_id = StackContext.getInstance().get('CLIENT_TAB_ID');
        VarsTabsSubsController.getInstance().unregister_sub(uid, client_tab_id, params.map((param) => param.check_param_is_valid(param._type) ? param.index : null));
    }

    private async getVarControllerDSDeps(text: string): Promise<string[]> {
        if ((!text) || (!VarsController.getInstance().var_conf_by_name[text])) {
            return null;
        }

        let var_controller = VarsServerController.getInstance().registered_vars_controller_[text];

        let res: string[] = [];
        let deps: DataSourceControllerBase[] = var_controller.getDataSourcesDependencies();

        for (let i in deps) {
            res.push(deps[i].name);
        }
        return res;
    }


    private async getVarControllerVarsDeps(text: string): Promise<{ [dep_name: string]: string }> {
        if ((!text) || (!VarsController.getInstance().var_conf_by_name[text])) {
            return null;
        }

        let var_controller = VarsServerController.getInstance().registered_vars_controller_[text];

        let res: { [dep_name: string]: string } = {};
        let deps: { [dep_name: string]: VarServerControllerBase<any> } = var_controller.getVarControllerDependencies();

        for (let i in deps) {
            res[i] = deps[i].varConf.name;
        }
        return res;
    }

    private async getParamDependencies(param: VarDataBaseVO): Promise<{ [dep_id: string]: VarDataBaseVO }> {
        if (!param) {
            return null;
        }

        if (!param.check_param_is_valid(param._type)) {
            ConsoleHandler.getInstance().error('Les champs du matroid ne correspondent pas à son typage');
            return null;
        }

        let var_controller = VarsServerController.getInstance().registered_vars_controller_[VarsController.getInstance().var_conf_by_id[param.var_id].name];

        if (!var_controller) {
            return null;
        }

        let dag: DAG<VarDAGNode> = new DAG();
        let varDAGNode: VarDAGNode = VarDAGNode.getInstance(dag, param);

        let predeps = var_controller.getDataSourcesPredepsDependencies();
        if (predeps) {
            for (let i in predeps) {
                let predep = predeps[i];
                let cache = {};
                await predep.get_data(param, cache);
                await predep.load_node_data(varDAGNode, cache);
            }
        }

        return var_controller.getParamDependencies(varDAGNode);
    }

    private async getAggregatedVarDatas(param: VarDataBaseVO): Promise<{ [var_data_index: string]: VarDataBaseVO }> {
        let var_dag: DAG<VarDAGNode> = new DAG();
        let deployed_vars_datas: { [index: string]: boolean } = {};
        let vars_datas: { [index: string]: VarDataBaseVO } = {
            [param.index]: param
        };
        let ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } } = {};
        let node = VarDAGNode.getInstance(var_dag, param);
        await VarsComputeController.getInstance().deploy_deps(node, deployed_vars_datas, vars_datas, ds_cache);

        return node.aggregated_datas;
    }

    private async getVarParamDatas(param: VarDataBaseVO): Promise<{ [ds_name: string]: string }> {
        if (!param) {
            return null;
        }

        /**
         * On limite à 10k caractères par ds et si on dépasse on revoie '[... >10k ...]' pour indiquer qu'on
         *  a filtré et garder un json valide
         */
        let value_size_limit: number = 10000;

        if (!param.check_param_is_valid(param._type)) {
            ConsoleHandler.getInstance().error('Les champs du matroid ne correspondent pas à son typage');
            return null;
        }

        let var_controller = VarsServerController.getInstance().registered_vars_controller_[VarsController.getInstance().var_conf_by_id[param.var_id].name];

        if (!var_controller) {
            return null;
        }

        let datasources_values: { [ds_name: string]: any; } = {};
        let datasources_deps: DataSourceControllerBase[] = var_controller.getDataSourcesDependencies();

        // WARNING on se base sur un fake node par ce que je vois pas comment faire autrement...
        let dag: DAG<VarDAGNode> = new DAG();
        let varDAGNode: VarDAGNode = VarDAGNode.getInstance(dag, param);

        for (let i in datasources_deps) {
            let datasource_dep = datasources_deps[i];

            let cache = {};
            await datasource_dep.get_data(param, cache);
            await datasource_dep.load_node_data(varDAGNode, cache);
            let data = varDAGNode.datasources[datasource_dep.name];

            let data_jsoned: string = null;
            try {
                data_jsoned = JSON.stringify(data);
            } catch (error) {
                ConsoleHandler.getInstance().error('getVarParamDatas:failed JSON:' + error);
            }

            if ((!data_jsoned) || (!data_jsoned.length)) {
                continue;
            }
            if (data_jsoned.length > value_size_limit) {
                datasources_values[datasource_dep.name] = "[... >10ko ...]";
            } else {
                datasources_values[datasource_dep.name] = data_jsoned;
            }
        }
        return datasources_values;
    }

    private async getVarParamFromContextFilters(
        var_name: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[]
    ): Promise<VarDataBaseVO> {

        if (!var_name) {
            return null;
        }

        let var_conf = VarsController.getInstance().var_conf_by_name[var_name];
        if (!var_conf) {
            return null;
        }

        let var_param: VarDataBaseVO = VarDataBaseVO.createNew(
            var_name);

        let matroid_fields = MatroidController.getInstance().getMatroidFields(var_conf.var_data_vo_type);
        let field_promises: Array<Promise<any>> = [];

        for (let i in matroid_fields) {
            let matroid_field_ = matroid_fields[i];

            field_promises.push((async (matroid_field) => {
                // TODO FIXME les tsranges pour le moment on max_range il faut réfléchir à la meilleure solution pour gérer ces filtrages de dates
                switch (matroid_field.field_type) {
                    case ModuleTableField.FIELD_TYPE_numrange_array:
                        if (matroid_field.has_relation) {
                            let ids_db: any[] = await ModuleContextFilterServer.getInstance().query_from_active_filters(
                                matroid_field.manyToOne_target_moduletable.vo_type,
                                matroid_field.target_field,
                                get_active_field_filters,
                                active_api_type_ids,
                                0,
                                0
                            );

                            if (!ids_db) {
                                var_param[matroid_field.field_id] = [RangeHandler.getInstance().getMaxNumRange()];
                                break;
                            }

                            let ids: number[] = [];
                            ids_db.forEach((id) => ids.push(parseInt(id.toString())));

                            var_param[matroid_field.field_id] = RangeHandler.getInstance().get_ids_ranges_from_list(ids);
                        } else {
                            var_param[matroid_field.field_id] = [RangeHandler.getInstance().getMaxNumRange()];
                        }
                        break;
                    case ModuleTableField.FIELD_TYPE_hourrange_array:
                        var_param[matroid_field.field_id] = [RangeHandler.getInstance().getMaxHourRange()];
                        break;
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                        var_param[matroid_field.field_id] = [RangeHandler.getInstance().getMaxTSRange()];
                        break;
                }
            })(matroid_field_));
        }

        await Promise.all(field_promises);

        return var_param;
    }
}