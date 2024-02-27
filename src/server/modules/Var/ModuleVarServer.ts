
import VarDAG from '../../../server/modules/Var/vos/VarDAG';
import VarDAGNode from '../../../server/modules/Var/vos/VarDAGNode';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ContextFilterVOManager from '../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryFieldVO from '../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import ContextQueryVO, { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ParameterizedQueryWrapper from '../../../shared/modules/ContextFilter/vos/ParameterizedQueryWrapper';
import ManualTasksController from '../../../shared/modules/Cron/ManualTasksController';
import FieldFiltersVOManager from '../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import FieldFiltersVO from '../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import IRange from '../../../shared/modules/DataRender/interfaces/IRange';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleGPT from '../../../shared/modules/GPT/ModuleGPT';
import GPTCompletionAPIConversationVO from '../../../shared/modules/GPT/vos/GPTCompletionAPIConversationVO';
import GPTCompletionAPIMessageVO from '../../../shared/modules/GPT/vos/GPTCompletionAPIMessageVO';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import StatsController from '../../../shared/modules/Stats/StatsController';
import StatVO from '../../../shared/modules/Stats/vos/StatVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import VOsTypesManager from '../../../shared/modules/VO/manager/VOsTypesManager';
import ModuleVar from '../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarsInitController from '../../../shared/modules/Var/VarsInitController';
import VarConfIds from '../../../shared/modules/Var/vos/VarConfIds';
import VarConfVO from '../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataInvalidatorVO from '../../../shared/modules/Var/vos/VarDataInvalidatorVO';
import VarDataValueResVO from '../../../shared/modules/Var/vos/VarDataValueResVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import { all_promises } from '../../../shared/tools/PromiseTools';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import StackContext from '../../StackContext';
import ConfigurationService from '../../env/ConfigurationService';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import ContextQueryServerController from '../ContextFilter/ContextQueryServerController';
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
import PushDataServerController from '../PushData/PushDataServerController';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import CurrentBatchDSCacheHolder from './CurrentBatchDSCacheHolder';
import CurrentVarDAGHolder from './CurrentVarDAGHolder';
import GetVarParamFromContextFiltersParam from './GetVarParamFromContextFiltersParam';
import VarCronWorkersHandler from './VarCronWorkersHandler';
import VarServerControllerBase from './VarServerControllerBase';
import VarsBGThreadNameHolder from './VarsBGThreadNameHolder';
import VarsDatasProxy from './VarsDatasProxy';
import VarsDatasVoUpdateHandler from './VarsDatasVoUpdateHandler';
import VarsDeployDepsHandler from './VarsDeployDepsHandler';
import VarsServerCallBackSubsController from './VarsServerCallBackSubsController';
import VarsServerController from './VarsServerController';
import VarsTabsSubsController from './VarsTabsSubsController';
import VarsdatasComputerBGThread from './bgthreads/VarsdatasComputerBGThread';
import VarsComputationHole from './bgthreads/processes/VarsComputationHole';
import DataSourceControllerBase from './datasource/DataSourceControllerBase';
import DataSourcesController from './datasource/DataSourcesController';
import NotifVardatasParam from './notifs/NotifVardatasParam';

export default class ModuleVarServer extends ModuleServerBase {

    public static TASK_NAME_getSimpleVarDataCachedValueFromParam = 'Var.getSimpleVarDataCachedValueFromParam';
    public static TASK_NAME_delete_varconf_from_cache = 'Var.delete_varconf_from_cache';
    public static TASK_NAME_update_varconf_from_cache = 'Var.update_varconf_from_cache';
    public static TASK_NAME_delete_varcacheconf_from_cache = 'Var.delete_varcacheconf_from_cache';
    public static TASK_NAME_update_varcacheconf_from_cache = 'Var.update_varcacheconf_from_cache';
    public static TASK_NAME_force_delete_all_cache_except_imported_data = 'Var.force_delete_all_cache_except_imported_data';

    public static TASK_NAME_invalidate_imports_for_u = 'VarsDatasProxy.invalidate_imports_for_u';
    public static TASK_NAME_invalidate_imports_for_c = 'VarsDatasProxy.invalidate_imports_for_c';
    public static TASK_NAME_invalidate_imports_for_d = 'VarsDatasProxy.invalidate_imports_for_d';

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleVarServer.instance) {
            ModuleVarServer.instance = new ModuleVarServer();
        }
        return ModuleVarServer.instance;
    }

    private static instance: ModuleVarServer = null;

    public cpt_for_datasources: { [datasource_name: string]: number } = {}; // TEMP DEBUG JFE

    public update_varconf_from_cache = ThrottleHelper.declare_throttle_with_stackable_args(
        this.update_varconf_from_cache_throttled.bind(this), 200, { leading: true, trailing: true });

    private throttle_getVarParamFromContextFilters = ThrottleHelper.declare_throttle_with_stackable_args(this.throttled_getVarParamsFromContextFilters.bind(this), 10, { leading: true, trailing: true });

    private limit_nb_ts_ranges_on_param_by_context_filter: number = null;
    private limit_nb_ts_ranges_on_param_by_context_filter_last_update: number = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleVar.getInstance().name);
    }

    /**
     * Called after all modules have been configured and initialized
     */
    public async late_configuration(is_generator: boolean): Promise<void> {

        VarsInitController.activate_pre_registered_var_data_api_type_id_modules_list();

        const postCTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        const postUTrigger: DAOPostUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        const postDTrigger: DAOPostDeleteTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostDeleteTriggerHook.DAO_POST_DELETE_TRIGGER);
        const preCTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        const preUTrigger: DAOPreUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);


        /**
         * On ajoute les trigger preC et preU pour mettre à jour l'index bdd avant insert
         * api_type_id => les vos des vars datas
         */
        for (const api_type_id of VarsInitController.registered_vars_datas_api_type_ids) {

            preCTrigger.registerHandler(api_type_id, this, this.prepare_bdd_index_for_c);
            preUTrigger.registerHandler(api_type_id, this, this.prepare_bdd_index_for_u);

            // On invalide l'arbre par intersection si on passe un type en import, ou si on change la valeur d'un import, ou si on passe de import à calculé
            postCTrigger.registerHandler(api_type_id, this, this.invalidate_imports_for_c as any);
            postUTrigger.registerHandler(api_type_id, this, this.invalidate_imports_for_u as any);
            postDTrigger.registerHandler(api_type_id, this, this.invalidate_imports_for_d as any);
        }


        /**
         * On checke la cohérence des confs qu'on a chargées pour les vars, en particulier s'assurer que les
         *  pixels sont correctement configurés
         */
        if (is_generator) {
            let has_errors = false;
            for (const var_id_str in VarsController.var_conf_by_id) {
                const var_id = parseInt(var_id_str);
                const varconf = VarsController.var_conf_by_id[var_id];

                if (!varconf) {
                    has_errors = true;
                    ConsoleHandler.error('Varconf not found for var_id ' + var_id);
                    continue;
                }

                if (varconf.pixel_activated) {

                    if ((!varconf.pixel_fields) || (!varconf.pixel_fields.length)) {
                        ConsoleHandler.error('Pixel varconf but no pixel fields for var_id :' + var_id + ': ' + varconf.name);
                        has_errors = true;
                        continue;
                    }

                    for (const i in varconf.pixel_fields) {
                        const pixel_field = varconf.pixel_fields[i];

                        if (!pixel_field.pixel_param_field_name) {
                            ConsoleHandler.error('Pixel varconf but no pixel_param_field_name for var_id :' + var_id + ': ' + varconf.name + ' - pixel_fields : ' + JSON.stringify(varconf.pixel_fields));
                            has_errors = true;
                            continue;
                        }

                        if (pixel_field.pixel_segmentation_type == null) {
                            ConsoleHandler.error('Pixel varconf but no pixel_segmentation_type for var_id :' + var_id + ': ' + varconf.name + ' - pixel_fields : ' + JSON.stringify(varconf.pixel_fields));
                            has_errors = true;
                            continue;
                        }

                        if (!pixel_field.pixel_vo_api_type_id) {
                            ConsoleHandler.error('Pixel varconf but no pixel_vo_api_type_id for var_id :' + var_id + ': ' + varconf.name + ' - pixel_fields : ' + JSON.stringify(varconf.pixel_fields));
                            has_errors = true;
                            continue;
                        }

                        if (!pixel_field.pixel_vo_field_name) {
                            ConsoleHandler.error('Pixel varconf but no pixel_vo_field_name for var_id :' + var_id + ': ' + varconf.name + ' - pixel_fields : ' + JSON.stringify(varconf.pixel_fields));
                            has_errors = true;
                            continue;
                        }

                        if (pixel_field.pixel_range_type == null) {
                            ConsoleHandler.error('Pixel varconf but no pixel_range_type for var_id :' + var_id + ': ' + varconf.name + ' - pixel_fields : ' + JSON.stringify(varconf.pixel_fields));
                            has_errors = true;
                            continue;
                        }
                    }
                }
            }

            if (has_errors) {
                throw new Error('Failed varconf / varcacheconf consistency check. See logs to get more details');
            }
        }
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

        VarsTabsSubsController.init();
        VarsServerCallBackSubsController.init();
        ModuleBGThreadServer.getInstance().registerBGThread(VarsdatasComputerBGThread.getInstance());

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({ 'fr-fr': 'Valeur' }, 'var.desc_mode.var_data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({ 'fr-fr': 'Description' }, 'var.desc_mode.var_description.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({ 'fr-fr': 'Paramètres' }, 'var.desc_mode.var_params.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({ 'fr-fr': 'Dépendances' }, 'var.desc_mode.var_deps.___LABEL___'));

        const postCTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        const postUTrigger: DAOPostUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        const postDTrigger: DAOPostDeleteTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostDeleteTriggerHook.DAO_POST_DELETE_TRIGGER);

        // Trigger sur les varcacheconfs pour mettre à jour les confs en cache en même temps qu'on les modifie dans l'outil

        postCTrigger.registerHandler(VarConfVO.API_TYPE_ID, this, this.onCVarConf);
        postUTrigger.registerHandler(VarConfVO.API_TYPE_ID, this, this.onUVarConf);
        postDTrigger.registerHandler(VarConfVO.API_TYPE_ID, this, this.onPostDVarConf);

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Calculée'
        }, 'var_data.value_type.computed'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Importée'
        }, 'var_data.value_type.import'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'TOUT supprimer ? Même les imports ?'
        }, 'vars_datas_explorer_actions.delete_cache_and_import_intersection.body.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'ATTENTION'
        }, 'vars_datas_explorer_actions.delete_cache_and_import_intersection.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Suppression en cours...'
        }, 'vars_datas_explorer_actions.delete_cache_and_import_intersection.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Suppression terminée'
        }, 'vars_datas_explorer_actions.delete_cache_and_import_intersection.ok.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'A tester'
        }, 'slow_var.type.needs_test'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Refusée'
        }, 'slow_var.type.denied'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'En cours de test'
        }, 'slow_var.type.tesing'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Datasources'
        }, 'var.desc_mode.var_datasources.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Vider l\'arbre'
        }, 'var_desc.clearDag.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Actualiser la HeatMap des deps'
        }, 'var_desc.refreshDependenciesHeatmap.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': '<b>Variable</b><hr><ul>'
        }, 'VarDataRefComponent.var_data_value_tooltip_prefix.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': '<li>Dernière mise à jour le <b>{formatted_date}</b><br><i>{value}</i></li>'
        }, 'VarDataRefComponent.var_data_value_tooltip.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': '<li>Import ou saisie le <b>{formatted_date}</b><br><i>{value}</i></li>'
        }, 'VarDataRefComponent.var_data_value_import_tooltip.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Index + Entrée'
        }, 'vars_datas_explorer_visualization.param_from_index.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Supprimer la valeur importée'
        }, 'VarDataRefComponent.contextmenu.clearimport.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Index + Entrée - Validez à vide pour réinitialiser.'
        }, 'vars_datas_explorer_visualization.param_from_index.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Index de la variable sélectionnée'
        }, 'vars_datas_explorer_visualization.chosen_index.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': '</ul>'
        }, 'VarDataRefComponent.var_data_value_tooltip_suffix.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'SlowVars'
        }, 'menu.menuelements.admin.SlowVarVO.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'En cours de test'
        }, 'slow_var.type.testing'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Matroids calculés'
        }, 'var.desc_mode.computed_datas_matroids.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Matroids chargés'
        }, 'var.desc_mode.loaded_datas_matroids.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Valeur totale des matroids chargés'
        }, 'var.desc_mode.loaded_datas_matroids_sum_value.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Tout en cache/pas de chunks'
        }, 'var_cache_conf.cache_strategy.cache_all_never_load_chunks'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Rien en cache'
        }, 'var_cache_conf.cache_strategy.cache_none'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pixel'
        }, 'var_cache_conf.cache_strategy.pixel'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Variable invalidée, calcul en cours...'
        }, 'var.desc_mode.update_var_data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Invalidation impossible sur un import'
        }, 'var.desc_mode.update_var_data.not_allowed_on_imports.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Indicateurs - Objectif'
        }, 'fields.labels.ref.module_psa_primes_indicateur.___LABEL____var_objectif_id'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Indicateurs - Réalisé'
        }, 'fields.labels.ref.module_psa_primes_indicateur.___LABEL____var_realise_id'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Performance'
        }, 'fields.labels.ref.module_var_var_perf.___LABEL____var_id'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Variable lente'
        }, 'fields.labels.ref.module_var_slow_var.___LABEL____var_id'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Nombre de deps'
        }, 'var.desc_mode.dependencies_number.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Deps en % de l\'arbre'
        }, 'var.desc_mode.dependencies_tree_prct.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': '% de vars enregistrées'
        }, 'var_desc_registrations.vardag_registered_prct.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': '% de vars enregistrées / var_id'
        }, 'var_desc_registrations.vardag_registered_prct_by_var_id.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Taille de l\'arbre'
        }, 'var_desc_registrations.vardag_size.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Données importées/aggrégées'
        }, 'var_desc.aggregated_var_datas.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Cache des modifications de VO vidé. Prêt pour le redémarrage'
        }, 'force_empty_vars_datas_vo_update_cache.done'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Import ?'
        }, 'var_desc.var_data_is_import.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Date màj : {last_update}'
        }, 'var_desc.var_data_last_update.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Explication du calcul'
        }, 'var_desc.explaination.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Markers'
        }, 'var.desc_mode.var_markers.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Actualiser le graph'
        }, 'var_desc.create_graph.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'StepByStep'
        }, 'var_desc.pause.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Limité à 10 deps affichées. Cliquer pour les voir toutes...'
        }, 'var_desc_explain_dep.limit_10.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Variable'
        }, 'var_desc.var_controller_label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Valeur non formatée'
        }, 'var_desc.var_data_label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Source de données'
        }, 'var_desc.var_ds_label.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Supprimer le cache par intersection'
        }, 'vars_datas_explorer_actions.delete_cache_intersection.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher les données exactes'
        }, 'vars_datas_explorer_actions.get_exact.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Calculer ce paramètre'
        }, 'vars_datas_explorer_actions.show_exact.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher les données incluses'
        }, 'vars_datas_explorer_actions.get_included.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher les données intersectées'
        }, 'vars_datas_explorer_actions.get_intersection.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Invalider le cache par intersection'
        }, 'vars_datas_explorer_actions.invalidate_cache_intersection.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Invalider l\'arbre en cache par intersection'
        }, 'vars_datas_explorer_actions.invalidate_cache_intersection_and_depstree.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Supprimer le cache et les imports par intersection'
        }, 'vars_datas_explorer_actions.delete_cache_and_import_intersection.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Variables'
        }, 'vars_datas_explorer_filters.vars_confs.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Expliquer cette valeur / ce calcul'
        }, 'VarDataRefComponent.contextmenu.explain_var.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Copier la valeur brute'
        }, 'VarDataRefComponent.contextmenu.copy_raw_value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Copier la valeur formatée'
        }, 'VarDataRefComponent.contextmenu.copy_formatted_value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Copier l\'index de la variable'
        }, 'VarDataRefComponent.contextmenu.copy_var_param_index.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Valeur importée supprimée'
        }, 'VarDataRefComponent.contextmenu.importcleared.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher'
        }, 'var_desc_explain.show_help_tooltip.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Masquer'
        }, 'var_desc_explain.show_help_tooltip.hidden.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Explication synthétique publique'
        }, 'var_desc.public.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': '[BETA] Get ChatGPT prompt to explain value in console.log'
        }, 'var_desc.get_chatgpt_prompt.___LABEL___'));

        // ForkedTasksController.register_task(ModuleVarServer.TASK_NAME_getSimpleVarDataCachedValueFromParam, this.getSimpleVarDataCachedValueFromParam.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(ModuleVarServer.TASK_NAME_delete_varconf_from_cache, this.delete_varconf_from_cache.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(ModuleVarServer.TASK_NAME_update_varconf_from_cache, this.update_varconf_from_cache.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(ModuleVarServer.TASK_NAME_force_delete_all_cache_except_imported_data, this.force_delete_all_cache_except_imported_data.bind(this));

        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(ModuleVarServer.TASK_NAME_invalidate_imports_for_u, this.invalidate_imports_for_u.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(ModuleVarServer.TASK_NAME_invalidate_imports_for_c, this.invalidate_imports_for_c.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(ModuleVarServer.TASK_NAME_invalidate_imports_for_d, this.invalidate_imports_for_d.bind(this));

        ModuleServiceBase.getInstance().post_modules_installation_hooks.push(async () => {

            /**
             * Ajout des triggers d'invalidation des données de cache en BDD
             *  - on part de la liste des vars qui ont un cache et des datasources
             * api_type_id => les vos des datasources
             */
            for (const api_type_id in VarsServerController.registered_vars_controller_by_api_type_id) {


                /**
                 * On isole un cas, celui des stats qui ne doivent pas invalider les caches pour des raisons de perfs, et
                 *  on invalide directement dans le module stats via un bgthread qui invalide par intersection toutes les perfs
                 *  de la minute précédente et de la minute en cours toutes les 30 secondes par exemple indépendemment des
                 *  modifications de données
                 */
                if (api_type_id == StatVO.API_TYPE_ID) {
                    continue;
                }

                postCTrigger.registerHandler(api_type_id, this, this.invalidate_var_cache_from_vo_cd);
                postUTrigger.registerHandler(api_type_id, this, this.invalidate_var_cache_from_vo_u);
                postDTrigger.registerHandler(api_type_id, this, this.invalidate_var_cache_from_vo_cd);
            }

            VarsServerController.init_varcontrollers_dag();
        });

        ManualTasksController.getInstance().registered_manual_tasks_by_name[ModuleVar.MANUAL_TASK_NAME_force_empty_vars_datas_vo_update_cache] =
            VarsDatasVoUpdateHandler.force_empty_vars_datas_vo_update_cache;
    }

    /**
     * Trigger qui gère l'invalidation des vars en fonction du vo passé en param
     *  On doit par ailleurs utiliser un buffer des invalidations pour pas tout invalider en boucle => exemple sur un import de 100 facture 1 jour,
     *      le CA du jour devrait être invalidé une fois
     * @param vo
     */
    public async invalidate_var_cache_from_vo_cd(vo: IDistantVOBase): Promise<void> {

        try {
            VarsDatasVoUpdateHandler.register_vo_cud([vo]);
        } catch (error) {
            ConsoleHandler.error('invalidate_var_cache_from_vo:type:' + vo._type + ':id:' + vo.id + ':' + vo + ':' + error);
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
            VarsDatasVoUpdateHandler.register_vo_cud([vo_update_handler]);
        } catch (error) {
            ConsoleHandler.error('invalidate_var_cache_from_vo:type:' + vo_update_handler.post_update_vo._type + ':id:' + vo_update_handler.post_update_vo.id + ':' + vo_update_handler.post_update_vo + ':' + error);
        }
    }

    public async invalidate_imports_for_c(vo: VarDataBaseVO): Promise<string> {

        return new Promise(async (resolve, reject) => {

            if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
                reject,
                VarsBGThreadNameHolder.bgthread_name,
                ModuleVarServer.TASK_NAME_invalidate_imports_for_c,
                resolve,
                vo)) {
                return;
            }

            // Si on crée une data en import, on doit forcer le recalcul, si on crée en calcul aucun impact
            if (vo.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) {

                // Quand on reçoit un import / met à jour un import on doit aussi informer par notif tout le monde
                await VarsTabsSubsController.notify_vardatas([new NotifVardatasParam([vo])]);
                await VarsServerCallBackSubsController.notify_vardatas([vo]);

                await ModuleVar.getInstance().invalidate_cache_intersection_and_parents([vo]);
            }
            resolve('invalidate_imports_for_c');
        });
    }

    public async invalidate_imports_for_d(vo: VarDataBaseVO): Promise<string> {

        return new Promise(async (resolve, reject) => {

            if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
                reject,
                VarsBGThreadNameHolder.bgthread_name,
                ModuleVarServer.TASK_NAME_invalidate_imports_for_d,
                resolve,
                vo)) {
                return;
            }

            // Si on delete une data en import, on doit forcer le recalcul, sinon osef
            if (vo.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) {

                await ModuleVar.getInstance().invalidate_cache_intersection_and_parents([vo]);
            }
            resolve('invalidate_imports_for_d');
        });
    }


    public async invalidate_imports_for_u(vo_update_handler: DAOUpdateVOHolder<VarDataBaseVO>): Promise<string> {

        return new Promise(async (resolve, reject) => {

            if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
                reject,
                VarsBGThreadNameHolder.bgthread_name,
                ModuleVarServer.TASK_NAME_invalidate_imports_for_u,
                resolve,
                vo_update_handler)) {
                return;
            }

            // Si on modifier la valeur d'un import, ou si on change le type de valeur, on doit invalider l'arbre
            if ((vo_update_handler.post_update_vo.value_type != vo_update_handler.pre_update_vo.value_type) ||
                ((vo_update_handler.post_update_vo.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) && (vo_update_handler.post_update_vo.value != vo_update_handler.pre_update_vo.value))) {

                // Quand on reçoit un import / met à jour un import on doit aussi informer par notif tout le monde
                await VarsTabsSubsController.notify_vardatas([new NotifVardatasParam([vo_update_handler.post_update_vo])]);
                await VarsServerCallBackSubsController.notify_vardatas([vo_update_handler.post_update_vo]);

                await ModuleVar.getInstance().invalidate_cache_intersection_and_parents([vo_update_handler.post_update_vo]);
            }
            resolve('invalidate_imports_for_u');
        });
    }

    public async prepare_bdd_index_for_c(vo: VarDataBaseVO) {

        // Si on est sur un import et sans date, on force une date
        if (
            (
                (vo.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) || (vo.value_type == VarDataBaseVO.VALUE_TYPE_DENIED)
            ) && (!vo.value_ts)) {
            vo.value_ts = Dates.now();
        }
        // vo['_bdd_only_index'] = vo._bdd_only_index;
        return true;
    }

    public async prepare_bdd_index_for_u(vo_update_handler: DAOUpdateVOHolder<VarDataBaseVO>) {

        // Si on est sur un import et sans date, on force une date
        if (
            (
                (vo_update_handler.post_update_vo.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) ||
                (vo_update_handler.post_update_vo.value_type == VarDataBaseVO.VALUE_TYPE_DENIED)
            ) && (!vo_update_handler.post_update_vo.value_ts)) {
            vo_update_handler.post_update_vo.value_ts = Dates.now();
        }
        // vo_update_handler.post_update_vo['_bdd_only_index'] = vo_update_handler.post_update_vo._bdd_only_index;
        return true;
    }

    /**
     * Demande MANUELLE d'invalidation
     */
    public async invalidate_cache_exact(vos: VarDataBaseVO[]) {

        if ((!vos) || (!vos.length)) {
            return;
        }

        const invalidators = [];
        for (const i in vos) {
            const vo = vos[i];

            if (!vo.check_param_is_valid(vo._type)) {
                ConsoleHandler.error('Les champs du matroid ne correspondent pas à son typage');
                continue;
            }

            // cas particulier de l'invalidation exacte où on accepte de supprimer un import ou un denied puisqu'on demande expressément de supprimer cette var

            const invalidator = VarDataInvalidatorVO.create_new(vo, VarDataInvalidatorVO.INVALIDATOR_TYPE_EXACT, false, vo.value_type == VarDataBaseVO.VALUE_TYPE_DENIED, vo.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT);
            invalidators.push(invalidator);
        }

        await VarsDatasVoUpdateHandler.push_invalidators(invalidators);
    }

    public async invalidate_cache_exact_and_parents(vos: VarDataBaseVO[]): Promise<boolean> {

        if ((!vos) || (!vos.length)) {
            return;
        }

        const invalidators = [];
        for (const i in vos) {
            const vo = vos[i];

            if (!vo.check_param_is_valid(vo._type)) {
                ConsoleHandler.error('Les champs du matroid ne correspondent pas à son typage');
                continue;
            }

            const invalidator = VarDataInvalidatorVO.create_new(vo, VarDataInvalidatorVO.INVALIDATOR_TYPE_EXACT, true, false, false);
            invalidators.push(invalidator);
        }

        await VarsDatasVoUpdateHandler.push_invalidators(invalidators);
    }

    public async invalidate_cache_intersection_and_parents(vos: VarDataBaseVO[]): Promise<boolean> {

        if ((!vos) || (!vos.length)) {
            return;
        }

        const invalidators = [];
        for (const i in vos) {
            const vo = vos[i];

            if (!vo.check_param_is_valid(vo._type)) {
                ConsoleHandler.error('Les champs du matroid ne correspondent pas à son typage');
                continue;
            }

            const invalidator = VarDataInvalidatorVO.create_new(vo, VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED, true, false, false);
            invalidators.push(invalidator);
        }

        await VarsDatasVoUpdateHandler.push_invalidators(invalidators);
    }

    /**
     * On vide le cache des vars, pas les imports
     */
    public async delete_all_cache() {

        throw new Error('Not implemented');
        // // On peut pas supprimer comme ça directement ça enfreint les règles de thread, de cache des vars, ....
        // for (let api_type_id in VarsServerController.varcacheconf_by_api_type_ids) {
        //     let moduletable = ModuleTableController.module_tables_by_vo_type[api_type_id];

        //     await ModuleDAOServer.getInstance().query('DELETE from ' + moduletable.full_name + ' where value_type = ' + VarDataBaseVO.VALUE_TYPE_COMPUTED + ';');
        // }
    }

    public async delete_cache_intersection(vos: VarDataBaseVO[]) {

        if ((!vos) || (!vos.length)) {
            return;
        }

        const invalidators = [];
        for (const i in vos) {
            const vo = vos[i];

            if (!vo.check_param_is_valid(vo._type)) {
                ConsoleHandler.error('Les champs du matroid ne correspondent pas à son typage');
                continue;
            }

            const invalidator = VarDataInvalidatorVO.create_new(vo, VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED, false, false, false);
            invalidators.push(invalidator);
        }

        await VarsDatasVoUpdateHandler.push_invalidators(invalidators);
    }

    public async delete_cache_and_imports_intersection(vos: VarDataBaseVO[]) {

        if ((!vos) || (!vos.length)) {
            return;
        }

        const invalidators = [];
        for (const i in vos) {
            const vo = vos[i];

            if (!vo.check_param_is_valid(vo._type)) {
                ConsoleHandler.error('Les champs du matroid ne correspondent pas à son typage');
                continue;
            }

            const invalidator = VarDataInvalidatorVO.create_new(vo, VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED, false, false, true);
            invalidators.push(invalidator);
        }

        await VarsDatasVoUpdateHandler.push_invalidators(invalidators);
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleVar.APINAME_register_params, this.register_params.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleVar.APINAME_update_params_registration, this.update_params_registration.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleVar.APINAME_unregister_params, this.unregister_params.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleVar.APINAME_get_var_id_by_names, this.get_var_id_by_names.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleVar.APINAME_get_var_data, this.get_var_data.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleVar.APINAME_explain_var, this.explain_var.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleVar.APINAME_getVarControllerVarsDeps, this.getVarControllerVarsDeps.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleVar.APINAME_getVarControllerDSDeps, this.getVarControllerDSDeps.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleVar.APINAME_getParamDependencies, this.getParamDependencies.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleVar.APINAME_getVarParamDatas, this.getVarParamDatas.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleVar.APINAME_getVarParamFromContextFilters, this.getVarParamFromContextFilters.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleVar.APINAME_getAggregatedVarDatas, this.getAggregatedVarDatas.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleVar.APINAME_delete_cache_intersection, this.delete_cache_intersection.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleVar.APINAME_delete_cache_and_imports_intersection, this.delete_cache_and_imports_intersection.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleVar.APINAME_invalidate_cache_intersection_and_parents, this.invalidate_cache_intersection_and_parents.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleVar.APINAME_invalidate_cache_exact, this.invalidate_cache_exact.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleVar.APINAME_invalidate_cache_exact_and_parents, this.invalidate_cache_exact_and_parents.bind(this));
    }
    // istanbul ignore next: cannot test registerCrons
    public registerCrons(): void {
        VarCronWorkersHandler.getInstance();
    }

    /**
     * On définit les droits d'accès du module
     */
    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleVar.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'Variables'
        }));

        let promises = [];

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        promises.push((async () => {
            POLICY_FO_ACCESS.group_id = group.id;
            POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            POLICY_FO_ACCESS.translatable_name = ModuleVar.POLICY_FO_ACCESS;
            POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, DefaultTranslationVO.create_new({
                'fr-fr': 'Accès aux Variables sur le front'
            }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        })());

        let POLICY_FO_VAR_EXPLAIN_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        promises.push((async () => {
            POLICY_FO_VAR_EXPLAIN_ACCESS.group_id = group.id;
            POLICY_FO_VAR_EXPLAIN_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            POLICY_FO_VAR_EXPLAIN_ACCESS.translatable_name = ModuleVar.POLICY_FO_VAR_EXPLAIN_ACCESS;
            POLICY_FO_VAR_EXPLAIN_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_VAR_EXPLAIN_ACCESS, DefaultTranslationVO.create_new({
                'fr-fr': 'Explication des vars - GPT'
            }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        })());

        promises.push((async () => {
            let desc_mode_access: AccessPolicyVO = new AccessPolicyVO();
            desc_mode_access.group_id = group.id;
            desc_mode_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            desc_mode_access.translatable_name = ModuleVar.POLICY_DESC_MODE_ACCESS;
            desc_mode_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(desc_mode_access, DefaultTranslationVO.create_new({
                'fr-fr': 'Accès au "Mode description"'
            }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        })());

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        promises.push((async () => {
            bo_access.group_id = group.id;
            bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            bo_access.translatable_name = ModuleVar.POLICY_BO_ACCESS;
            bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, DefaultTranslationVO.create_new({
                'fr-fr': 'Administration des vars'
            }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        })());

        let bo_imported_access: AccessPolicyVO = new AccessPolicyVO();
        promises.push((async () => {
            bo_imported_access.group_id = group.id;
            bo_imported_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            bo_imported_access.translatable_name = ModuleVar.POLICY_BO_IMPORTED_ACCESS;
            bo_imported_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_imported_access, DefaultTranslationVO.create_new({
                'fr-fr': 'Configuration des données importées'
            }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        })());

        let bo_varconf_access: AccessPolicyVO = new AccessPolicyVO();
        promises.push((async () => {
            bo_varconf_access.group_id = group.id;
            bo_varconf_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            bo_varconf_access.translatable_name = ModuleVar.POLICY_BO_VARCONF_ACCESS;
            bo_varconf_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_varconf_access, DefaultTranslationVO.create_new({
                'fr-fr': 'Configuration des types de vars'
            }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        })());
        await Promise.all(promises);
        promises = [];

        promises.push((async () => {
            let access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
            access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
            access_dependency.src_pol_id = POLICY_FO_VAR_EXPLAIN_ACCESS.id;
            access_dependency.depends_on_pol_id = POLICY_FO_ACCESS.id;
            access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(access_dependency);
        })());

        promises.push((async () => {
            let access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
            access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
            access_dependency.src_pol_id = bo_varconf_access.id;
            access_dependency.depends_on_pol_id = bo_access.id;
            access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(access_dependency);
        })());

        promises.push((async () => {
            let access_dependency = new PolicyDependencyVO();
            access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
            access_dependency.src_pol_id = bo_imported_access.id;
            access_dependency.depends_on_pol_id = bo_access.id;
            access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(access_dependency);
        })());
        await Promise.all(promises);
    }

    public async get_limit_nb_ts_ranges_on_param_by_context_filter(): Promise<number> {
        /**
         * On recharge toutes les 5 minutes
         */
        if ((this.limit_nb_ts_ranges_on_param_by_context_filter == null) || (this.limit_nb_ts_ranges_on_param_by_context_filter_last_update < (Dates.now() - 300))) {
            this.limit_nb_ts_ranges_on_param_by_context_filter = await ModuleParams.getInstance().getParamValueAsInt(ModuleVar.PARAM_NAME_limit_nb_ts_ranges_on_param_by_context_filter, 100, 180000);
            this.limit_nb_ts_ranges_on_param_by_context_filter_last_update = Dates.now();
        }
        return this.limit_nb_ts_ranges_on_param_by_context_filter;
    }

    /**
     * Objectif : vider tout le cache des vars, y compris les pixels qu'on supprime théoriquement pas
     */
    public async force_delete_all_cache_except_imported_data(): Promise<void> {

        if (!await ForkedTasksController.exec_self_on_bgthread(
            VarsBGThreadNameHolder.bgthread_name,
            ModuleVarServer.TASK_NAME_force_delete_all_cache_except_imported_data)) {
            return;
        }

        await VarsComputationHole.exec_in_computation_hole(async () => {

            const promises = [];
            for (const api_type_id of VarsInitController.registered_vars_datas_api_type_ids) {

                const moduletable = ModuleTableController.module_tables_by_vo_type[api_type_id];
                promises.push(ModuleDAOServer.getInstance().query('DELETE from ' + moduletable.full_name + ' where value_type = ' + VarDataBaseVO.VALUE_TYPE_COMPUTED + ';'));
            }
            await all_promises(promises);

            CurrentVarDAGHolder.current_vardag = new VarDAG();
            CurrentBatchDSCacheHolder.current_batch_ds_cache = {};
        });
    }

    private async onCVarConf(vcc: VarConfVO) {
        if (!vcc) {
            return;
        }

        await ForkedTasksController.broadexec(ModuleVarServer.TASK_NAME_update_varconf_from_cache, vcc);
    }

    private async onUVarConf(vo_update_handler: DAOUpdateVOHolder<VarConfVO>) {
        await ForkedTasksController.broadexec(ModuleVarServer.TASK_NAME_update_varconf_from_cache, vo_update_handler.post_update_vo);

        /**
         * On invalide les caches si on pixellise la var
         */
        if (vo_update_handler && vo_update_handler.pre_update_vo && vo_update_handler.post_update_vo &&
            ((!vo_update_handler.pre_update_vo.pixel_activated) && vo_update_handler.post_update_vo.pixel_activated)) {
            const delete_cache_query = query(vo_update_handler.pre_update_vo.var_data_vo_type)
                .filter_by_num_eq('var_id', vo_update_handler.pre_update_vo.id)
                .filter_by_num_eq('value_type', VarDataBaseVO.VALUE_TYPE_COMPUTED);

            await ContextQueryServerController.delete_vos(delete_cache_query);
        }
    }

    private update_varconf_from_cache_throttled(vcs: VarConfVO[]) {
        for (const i in vcs) {
            const vc = vcs[i];
            VarsServerController.update_registered_varconf(vc.id, vc);
        }
    }

    private delete_varconf_from_cache(vc: VarConfVO) {
        VarsServerController.delete_registered_varconf(vc.id);
    }

    private async onPostDVarConf(vc: VarConfVO) {
        if (!vc) {
            return;
        }

        await ForkedTasksController.broadexec(ModuleVarServer.TASK_NAME_delete_varconf_from_cache, vc);
    }

    private async get_var_id_by_names(): Promise<VarConfIds> {
        const res: VarConfIds = new VarConfIds();
        const var_confs: VarConfVO[] = await query(VarConfVO.API_TYPE_ID).select_vos<VarConfVO>();
        res.var_id_by_names = {};

        for (const i in var_confs) {
            const var_conf = var_confs[i];

            res.var_id_by_names[var_conf.name] = var_conf.id;
        }

        return res;
    }

    /**
     * On ne fait que mettre à jour la date de sub pour s'assurer qu'on expire pas car l'onglet est toujours actif
     * @param params
     */
    private async update_params_registration(params: VarDataBaseVO[]): Promise<void> {
        if (!params) {
            return;
        }

        /**
         * On commence par refuser les params mal construits (champs null)
         */
        params = this.filter_null_fields_params(params);

        const uid = StackContext.get('UID');
        const client_tab_id = StackContext.get('CLIENT_TAB_ID');

        VarsTabsSubsController.register_sub(uid, client_tab_id, params ? params.map((param) => param.index) : []);

        if (ConfigurationService.node_configuration.DEBUG_VARS) {
            for (const i in params) {
                const param = params[i];

                ConsoleHandler.log('update_params_registration:' + param.index + ':UID:' + uid + ':CLIENT_TAB_ID:' + client_tab_id);
            }
        }
    }

    /**
     * Fonction qui demande l'abonnement d'un socket (celui par lequel arrive la demande) sur la mise à jour des
     *  valeurs des vardatas correspondants aux params. Et si on a déjà une valeur à fournir, alors on l'envoie directement
     * @param api_param
     */
    private async register_params(params: VarDataBaseVO[]): Promise<void> {

        if ((!params) || (!params.length)) {
            return;
        }

        StatsController.register_stat_COMPTEUR('ModuleVarServer', 'register_params', 'IN');
        StatsController.register_stat_QUANTITE('ModuleVarServer', 'register_params', 'nb_IN_varsdatas', params.length);
        const time_in = Dates.now_ms();

        /**
         * On commence par refuser les params mal construits (champs null)
         */
        params = this.filter_null_fields_params(params);

        if ((!params) || (!params.length)) {
            return;
        }

        /**
         * On check qu'on essaie pas d'ajouter une var avec un maxrange quelque part qui casserait tout
         */
        params = params.filter((param) => {
            if (!MatroidController.check_bases_not_max_ranges(param)) {
                ConsoleHandler.error('VarDAGNode.getInstance:!check_bases_not_max_ranges:' + param.index);
                return false;
            }
            return true;
        });

        if ((!params) || (!params.length)) {
            return;
        }

        StatsController.register_stat_QUANTITE('ModuleVarServer', 'register_params', 'nb_valid_registered_varsdatas', params.length);

        const uid = StackContext.get('UID');
        const client_tab_id = StackContext.get('CLIENT_TAB_ID');

        const params_indexes = params ? params.map((param) => param.index) : [];

        VarsTabsSubsController.register_sub(uid, client_tab_id, params_indexes);

        if (ConfigurationService.node_configuration.DEBUG_VARS) {
            for (const i in params) {
                const param = params[i];

                ConsoleHandler.log('register_params:' + param.index + ':UID:' + uid + ':CLIENT_TAB_ID:' + client_tab_id);
            }
        }

        /**
         * Si on trouve des datas existantes et valides en base, on les envoie, sinon on indique qu'on attend ces valeurs
         */
        let notifyable_vars: VarDataBaseVO[] = [];

        notifyable_vars = await VarsDatasProxy.get_var_datas_or_ask_to_bgthread(params_indexes);

        if (notifyable_vars && notifyable_vars.length) {
            const vars_to_notif: VarDataValueResVO[] = [];
            notifyable_vars.forEach((notifyable_var) => vars_to_notif.push(new VarDataValueResVO().set_from_vardata(notifyable_var)));

            await PushDataServerController.getInstance().notifyVarsDatas(uid, client_tab_id, vars_to_notif);

            StatsController.register_stat_QUANTITE('ModuleVarServer', 'register_params', 'nb_cache_notified_varsdatas', notifyable_vars.length);

            // if (ConfigurationService.node_configuration.DEBUG_VARS) {
            //     for (let i in notifyable_vars) {
            //         let param = notifyable_vars[i];

            //         ConsoleHandler.log('register_param:NOTIFIED:' + param.index + ':UID:' + uid + ':CLIENT_TAB_ID:' + client_tab_id);
            //     }
            // }
        }

        const time_out = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('ModuleVarServer', 'register_params', 'OUT');
        StatsController.register_stat_DUREE('ModuleVarServer', 'register_params', 'OUT', time_out - time_in);
    }

    private filter_null_fields_params(params: VarDataBaseVO[]): VarDataBaseVO[] {
        const res: VarDataBaseVO[] = [];

        for (const i in params) {
            const param = params[i];

            if (!param) {
                continue;
            }

            const matroid_fields = MatroidController.getMatroidFields(param._type);
            if (!matroid_fields) {
                continue;
            }

            let filter_ = false;
            for (const j in matroid_fields) {
                const matroid_field = matroid_fields[j];

                if ((!param[matroid_field.field_name]) || (!(param[matroid_field.field_name] as IRange[]).length) ||
                    ((param[matroid_field.field_name] as IRange[]).indexOf(null) >= 0)) {
                    filter_ = true;
                    ConsoleHandler.error("Registered wrong Matroid:" + JSON.stringify(param) + ':refused');
                    break;
                }
            }

            if (filter_) {
                continue;
            }

            res.push(param);
        }

        return res;
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

        const uid = StackContext.get('UID');
        const client_tab_id = StackContext.get('CLIENT_TAB_ID');
        VarsTabsSubsController.unregister_sub(uid, client_tab_id, params.map((param) => param.check_param_is_valid(param._type) ? param.index : null));

        if (ConfigurationService.node_configuration.DEBUG_VARS) {
            for (const i in params) {
                const param = params[i];

                ConsoleHandler.log('unregister_param:' + param.index + ':UID:' + uid + ':CLIENT_TAB_ID:' + client_tab_id);
            }
        }
    }

    private async getVarControllerDSDeps(text: string): Promise<string[]> {
        if ((!text) || (!VarsController.var_conf_by_name[text])) {
            return null;
        }

        const var_controller = VarsServerController.registered_vars_controller[text];

        return VarsServerController.get_datasource_deps_and_predeps_names(var_controller);
    }


    private async getVarControllerVarsDeps(text: string): Promise<{ [dep_name: string]: string }> {
        if ((!text) || (!VarsController.var_conf_by_name[text])) {
            return null;
        }

        const var_controller = VarsServerController.registered_vars_controller[text];

        const res: { [dep_name: string]: string } = {};
        const deps: { [dep_name: string]: VarServerControllerBase<any> } = var_controller.getVarControllerDependencies();

        for (const i in deps) {
            res[i] = deps[i].varConf.name;
        }
        return res;
    }

    private async getParamDependencies(param: VarDataBaseVO): Promise<{ [dep_id: string]: VarDataBaseVO }> {
        if (!param) {
            return null;
        }

        if (!param.check_param_is_valid(param._type)) {
            ConsoleHandler.error('Les champs du matroid ne correspondent pas à son typage');
            return null;
        }

        const var_controller = VarsServerController.registered_vars_controller[VarsController.var_conf_by_id[param.var_id].name];

        if (!var_controller) {
            return null;
        }

        const dag: VarDAG = new VarDAG();
        const varDAGNode: VarDAGNode = await VarDAGNode.getInstance(dag, param, false);

        if (!varDAGNode) {
            return null;
        }

        const predeps = var_controller.getDataSourcesPredepsDependencies();
        if (predeps && predeps.length) {
            await DataSourcesController.load_node_datas(predeps, varDAGNode);
        }

        // TEMP DEBUG JFE :
        // ConsoleHandler.log("cpt_for_datasources :: " + JSON.stringify(this.cpt_for_datasources));

        return var_controller.getParamDependencies(varDAGNode);
    }

    /**
     * Appelé côté client et sur le main thread pour obtenir des infos sur les imports / données aggrégées de ce paramètre.
     *  On ajoute à un arbre fictif, qui sera donc drop en sortant de la fonction.
     * @param param
     * @returns
     */
    private async getAggregatedVarDatas(param: VarDataBaseVO): Promise<{ [var_data_index: string]: VarDataBaseVO }> {
        const var_dag: VarDAG = new VarDAG();
        const deployed_vars_datas: { [index: string]: boolean } = {};
        const vars_datas: { [index: string]: VarDataBaseVO } = {
            [param.index]: param
        };

        const node = await VarDAGNode.getInstance(var_dag, param, false);

        if (!node) {
            return null;
        }

        await VarsDeployDepsHandler.load_caches_and_imports_on_var_to_deploy(
            node,
            true);

        return node.aggregated_datas ? node.aggregated_datas : {};
    }

    private async getVarParamDatas(param: VarDataBaseVO): Promise<{ [ds_name: string]: string }> {
        if (!param) {
            return null;
        }

        /**
         * Si le calcul est pixellisé, et qu'on est pas sur un pixel, on refuse la demande
         */
        const varconf = VarsController.var_conf_by_id[param.var_id];
        if (varconf.pixel_activated) {
            let is_pixel = true;
            for (const i in varconf.pixel_fields) {
                const pixel_field = varconf.pixel_fields[i];

                if (RangeHandler.getCardinalFromArray(param[pixel_field.pixel_param_field_name]) != 1) {
                    is_pixel = false;
                    break;
                }
            }

            if (!is_pixel) {
                ConsoleHandler.warn('refused getVarParamDatas on pixellised varconf but param is not a pixel');
                return null;
            }
        }

        /**
         * On limite à 10k caractères par ds et si on dépasse on revoie '[... >10k ...]' pour indiquer qu'on
         *  a filtré et garder un json valide
         */
        const value_size_limit: number = 10000;

        if (!param.check_param_is_valid(param._type)) {
            ConsoleHandler.error('Les champs du matroid ne correspondent pas à son typage');
            return null;
        }

        const var_controller = VarsServerController.registered_vars_controller[VarsController.var_conf_by_id[param.var_id].name];

        if (!var_controller) {
            return null;
        }

        const datasources_values: { [ds_name: string]: any; } = {};
        const datasources_deps: DataSourceControllerBase[] = VarsServerController.get_datasource_deps_and_predeps(var_controller);

        // WARNING on se base sur un fake node par ce que je vois pas comment faire autrement...
        const dag: VarDAG = new VarDAG();
        const varDAGNode: VarDAGNode = await VarDAGNode.getInstance(dag, param, false);

        if (!varDAGNode) {
            return null;
        }

        for (const i in datasources_deps) {
            const datasource_dep = datasources_deps[i];

            await datasource_dep.load_node_data(varDAGNode);
            const data = varDAGNode.datasources[datasource_dep.name];

            let data_jsoned: string = null;
            try {
                data_jsoned = JSON.stringify(data);
            } catch (error) {
                ConsoleHandler.error('getVarParamDatas:failed JSON:' + error);
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

        // TEMP DEBUG JFE :
        // ConsoleHandler.log("cpt_for_datasources :: " + JSON.stringify(this.cpt_for_datasources));

        return datasources_values;
    }

    /**
     * FIXME TODO WARNING gros risque de perte de contexte client sur le throttle à TESTER / DEBUG
     * Virer le throttle ?
     *             await StackContext.runPromise({
     * IS_CLIENT: true, UID: target_user_id
     * }, async () => {
     */
    private async getVarParamFromContextFilters(
        var_name: string,
        get_active_field_filters: FieldFiltersVO,
        custom_filters: { [var_param_field_name: string]: ContextFilterVO },
        active_api_type_ids: string[],
        discarded_field_paths: { [vo_type: string]: { [field_name: string]: boolean } },
        accept_max_ranges: boolean = false
    ): Promise<VarDataBaseVO> {

        if (ConfigurationService.node_configuration.DEBUG_VARS_DB_PARAM_BUILDER) {
            ConsoleHandler.log('getVarParamFromContextFilters: ' + var_name + ':IN');
        }

        if (!var_name) {
            return null;
        }

        const var_conf = VarsController.var_conf_by_name[var_name];
        if (!var_conf) {
            return null;
        }

        const uid = StackContext.get('UID');

        return new Promise(async (resolve, reject) => {
            const param = new GetVarParamFromContextFiltersParam(
                var_name,
                get_active_field_filters,
                custom_filters,
                active_api_type_ids,
                discarded_field_paths,
                accept_max_ranges,
                resolve,
                uid
            );

            await this.throttle_getVarParamFromContextFilters(param);
        });

    }

    private async throttled_getVarParamsFromContextFilters(params: GetVarParamFromContextFiltersParam[]) {
        const max_concurrent_promises: number = ConfigurationService.node_configuration.MAX_POOL / 2;

        /**
         * On fait un cache local pour les requêtes de cet appel
         */
        const cache_local: { [full_request: string]: Promise<any> } = {};

        const promise_pipeline = new PromisePipeline(max_concurrent_promises, 'ModuleVarServer.throttled_getVarParamsFromContextFilters');
        for (const i in params) {

            await promise_pipeline.push(async () => {
                await this.throttled_getVarParamFromContextFilters(params[i], cache_local);
            });
        }

        await promise_pipeline.end();
    }

    private async throttled_getVarParamFromContextFilters(param: GetVarParamFromContextFiltersParam, cache_local: { [full_request: string]: Promise<any> }) {

        const var_name = param.var_name;
        const get_active_field_filters = param.get_active_field_filters;
        const custom_filters = param.custom_filters;
        const active_api_type_ids = param.active_api_type_ids;
        const discarded_field_paths = param.discarded_field_paths;
        const accept_max_ranges = param.accept_max_ranges;
        const var_conf = VarsController.var_conf_by_name[var_name];
        const resolve = param.resolve;

        const var_param: VarDataBaseVO = VarDataBaseVO.createNew(var_name);

        const matroid_fields = MatroidController.getMatroidFields(var_conf.var_data_vo_type);
        const field_promises: Array<Promise<any>> = [];

        const cleaned_active_field_filters = FieldFiltersVOManager.clean_field_filters_for_request(get_active_field_filters);
        let refuse_param: boolean = false;

        for (const i in matroid_fields) {
            const matroid_field_ = matroid_fields[i];

            field_promises.push((async (matroid_field) => {
                // TODO FIXME les tsranges pour le moment on max_range il faut réfléchir à la meilleure solution pour gérer ces filtrages de dates
                switch (matroid_field.field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        if (matroid_field.has_relation) {

                            const alias = matroid_field.manyToOne_target_moduletable.vo_type + '__id';
                            const context_query: ContextQueryVO = query(matroid_field.manyToOne_target_moduletable.vo_type)
                                .using(active_api_type_ids)
                                .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(cleaned_active_field_filters))
                                .set_query_distinct()
                                .add_fields([
                                    new ContextQueryFieldVO(matroid_field.manyToOne_target_moduletable.vo_type, matroid_field.target_field, alias)
                                ]);
                            context_query.discarded_field_paths = discarded_field_paths;

                            if (ConfigurationService.node_configuration.DEBUG_VARS_DB_PARAM_BUILDER) {
                                ConsoleHandler.log('getVarParamFromContextFilters: ' + var_name + ':select_vos:IN');
                            }

                            let ids_db: Array<{ id: number }> = null;
                            if (!refuse_param) {

                                /**
                                 * Utilisation du cache local
                                 * On réinsère le contexte client pour les requêtes
                                 */
                                await StackContext.runPromise({ IS_CLIENT: true, UID: param.uid }, async () => {

                                    const query_wrapper: ParameterizedQueryWrapper = await ModuleContextFilterServer.getInstance().build_select_query(context_query);
                                    if (!cache_local[query_wrapper.query]) {
                                        cache_local[query_wrapper.query] = ContextQueryServerController.select_vos(context_query, query_wrapper);
                                    }

                                    ids_db = await cache_local[query_wrapper.query];
                                });
                            }
                            if (ConfigurationService.node_configuration.DEBUG_VARS_DB_PARAM_BUILDER) {
                                ConsoleHandler.log('getVarParamFromContextFilters: ' + var_name + ':select_vos:OUT');
                            }

                            if ((!ids_db) || !ids_db.length) {

                                /**
                                 * Alors si on a pas d'éléments pour un champs lié à la var on est pas vraiment sur un maxrange a priori mais plutôt sur un
                                 *  'minrange', donc on refuse mais sans logger d'erreur
                                 */
                                // // Max range étant interdit sur les registers de var, on force un retour null
                                // if (!accept_max_ranges) {

                                //     if (!refuse_param) {
                                //         ConsoleHandler.error('getVarParamFromContextFilters: max range not allowed on registers of var');
                                //         refuse_param = true;
                                //     }
                                // } else {
                                //     var_param[matroid_field.field_name] = [RangeHandler.getMaxNumRange()];
                                // }
                                refuse_param = true;
                                break;
                            }

                            const ids: number[] = [];
                            ids_db.forEach((id_db) => id_db[alias] ? ids.push(parseInt(id_db[alias])) : {});

                            var_param[matroid_field.field_name] = RangeHandler.get_ids_ranges_from_list(ids);
                        } else {
                            // Max range étant interdit sur les registers de var, on force un retour null
                            if (!accept_max_ranges) {

                                if (!refuse_param) {
                                    ConsoleHandler.error('getVarParamFromContextFilters: max range not allowed on registers of var');
                                    refuse_param = true;
                                }
                            } else {
                                var_param[matroid_field.field_name] = [RangeHandler.getMaxNumRange()];
                            }
                        }
                        break;
                    case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                        if (!accept_max_ranges) {

                            if (!refuse_param) {
                                ConsoleHandler.error('getVarParamFromContextFilters: max range not allowed on registers of var');
                                refuse_param = true;
                            }
                        } else {
                            var_param[matroid_field.field_name] = [RangeHandler.getMaxHourRange()];
                        }
                        break;
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                        if (custom_filters[matroid_field.field_name]) {
                            // Sur ce système on a un problème il faut limiter à tout prix le nombre de possibilités renvoyées.
                            // on compte en nombre de range et non en cardinal
                            // et on limite à la limite configurée dans l'application
                            const limit_nb_range = await this.get_limit_nb_ts_ranges_on_param_by_context_filter();

                            if (ConfigurationService.node_configuration.DEBUG_VARS_DB_PARAM_BUILDER) {
                                ConsoleHandler.log('getVarParamFromContextFilters: ' + var_name + ':get_ts_ranges_from_custom_filter:IN');
                            }
                            var_param[matroid_field.field_name] = ModuleVar.getInstance().get_ts_ranges_from_custom_filter(custom_filters[matroid_field.field_name], limit_nb_range);
                            if (ConfigurationService.node_configuration.DEBUG_VARS_DB_PARAM_BUILDER) {
                                ConsoleHandler.log('getVarParamFromContextFilters: ' + var_name + ':get_ts_ranges_from_custom_filter:OUT');
                            }

                            if ((!var_param[matroid_field.field_name]) || (!var_param[matroid_field.field_name].length)) {
                                if (!accept_max_ranges) {

                                    if (!refuse_param) {
                                        ConsoleHandler.error('getVarParamFromContextFilters: max range not allowed on registers of var');
                                        refuse_param = true;
                                    }

                                } else {
                                    var_param[matroid_field.field_name] = [RangeHandler.getMaxNumRange()];
                                }
                            }
                            break;
                        }

                        // Max range étant interdit sur les registers de var, on force un retour null
                        if (!accept_max_ranges) {

                            if (!refuse_param) {
                                ConsoleHandler.error('getVarParamFromContextFilters: max range not allowed on registers of var');
                                refuse_param = true;
                            }

                        } else {
                            var_param[matroid_field.field_name] = [RangeHandler.getMaxTSRange()];
                        }
                        break;
                }
            })(matroid_field_));
        }

        await all_promises(field_promises);

        if (ConfigurationService.node_configuration.DEBUG_VARS_DB_PARAM_BUILDER) {
            ConsoleHandler.log('getVarParamFromContextFilters: ' + var_name + ':OUT');
        }

        resolve(refuse_param ? null : var_param);
    }

    private async get_var_data(var_data_index: string): Promise<VarDataBaseVO> {
        return await VarsServerCallBackSubsController.get_var_data(var_data_index);
    }

    /**
     * TODO FIXME Handler errors
     * @param var_data_index
     * @param user_id
     * @param lang_id
     * @returns
     */
    private async explain_var(
        var_data_index: string
        // user_id: number = null,
        // lang_id: number = null
    ): Promise<string> {

        const var_param = VarDataBaseVO.from_index(var_data_index);
        if (!var_param) {
            return null;
        }

        const var_data = await this.get_var_data(var_data_index);

        if (!var_data) {
            return null;
        }

        // PARAMS ? mais attention à l'api on peut pas avoir des params facultatifs sur l'api
        let user_id: number = null;
        let lang_id: number = null;


        if (!user_id) {
            user_id = StackContext.get('UID');
        }

        if ((!lang_id) && (!!user_id)) {
            const user: UserVO = await ModuleAccessPolicy.getInstance().getSelfUser();
            lang_id = user ? user.lang_id : lang_id;
        }

        // let filtered_value = this.get_filtered_value(var_data);
        const controller = VarsServerController.registered_vars_controller_by_var_id[var_data.var_id];

        const public_explaination_code_text: string = VarsController.get_translatable_public_explaination_by_var_id(var_data.var_id);
        const explaination_code_text: string = VarsController.get_translatable_explaination_by_var_id(var_data.var_id);

        const var_dep_names: { [dep_name: string]: string } = await ModuleVar.getInstance().getVarControllerVarsDeps(VarsController.var_conf_by_id[var_data.var_id].name);
        const var_dep_values: { [dep_id: string]: VarDataBaseVO } = await ModuleVar.getInstance().getParamDependencies(var_data);

        const has_deps_params = ObjectHandler.hasAtLeastOneAttribute(var_dep_values);

        // TODO FIXME la trad côté serveur est pas compatible avec les paramètres a priori ....
        // let explaination_sample_param = VarsController.get_explaination_sample_param(var_data, var_dep_names, var_dep_values);
        const explaination: string = explaination_code_text ? await ModuleTranslation.getInstance().t(explaination_code_text, lang_id) : null;

        const public_explaination: string = public_explaination_code_text ? await ModuleTranslation.getInstance().t(public_explaination_code_text, lang_id) : null;

        const has_public_explaination: boolean = (VarsController.get_translatable_public_explaination_by_var_id(var_data.var_id) != public_explaination);
        const has_explaination: boolean = (VarsController.get_translatable_explaination_by_var_id(var_data.var_id) != explaination);

        const aggregated_var_datas = await ModuleVar.getInstance().getAggregatedVarDatas(var_data);
        const is_aggregator: boolean = ObjectHandler.hasAtLeastOneAttribute(aggregated_var_datas);

        /**
         * Objectif : fournir un prompt pour GPT qui contienne un maximum d'informations sur la variable, ses deps, le param, les datasources.
         *  avec pour objectif de lui demander d'expliquer le calcul et la valeur actuelle avec ces éléments.
         */
        let prompt = "L'objectif est de fournir une explication d'un calcul réalisé sur un outil nommé Crescendo+, à son utilisateur actuel. Un calcul et la fonction associée sont aussi appelés 'variable'.\n";
        prompt += "Crescendo+ est un outil d'analyse de données de facturation dans des concessions et points de vente de la marque Stellantis.\n";
        prompt += "La valeur brute actuelle de la variable est : " + var_data.value + ".\n";
        // prompt += "La valeur formattée actuelle de la variable est : " + filtered_value + ".\n";
        prompt += "Le nom de la variable est " + controller.varConf.name.substring(controller.varConf.name.indexOf('|') + 1, controller.varConf.name.length) + ".\n";
        if (controller.varConf.show_help_tooltip && !!public_explaination_code_text) {
            prompt += "Cette variable a une description faite pour un affichage à l\'utilisateur dans l'outil.\n";
            prompt += "Son contenu peut être librement utilisé: " + public_explaination_code_text + ".\n";
        }
        // if (this.has_explaination) {
        //     prompt += "Cette variable a une description technique.\nSon contenu est dédié à la compréhension interne des devs et MOAs, elle n'a pas forcément vocation à être affichée telle que à l'utilisateur : " + this.explaination + ".\n";
        // }

        prompt += 'Le calcul est paramétré par les éléments/champs de segmentation suivants : \n';

        const var_data_fields = MatroidController.getMatroidFields(var_data._type);
        for (const i in var_data_fields) {
            const field = var_data_fields[i];

            prompt += " - Le champs '" + await ModuleTranslation.getInstance().label('fields.labels.ref.' + ModuleTableController.module_tables_by_vo_type[var_data._type].name + '.' + field.field_name, lang_id) + "' qui filtre sur un ou plusieurs intervales de " +
                ((field.field_type == ModuleTableFieldVO.FIELD_TYPE_tstzrange_array) ? 'dates' : 'données') + " : [\n";
            const ranges = var_data[field.field_name] as IRange[];
            for (const j in ranges) {
                const range = ranges[j];
                const segmented_min = RangeHandler.getSegmentedMin(range);
                const segmented_max = RangeHandler.getSegmentedMax(range);

                switch (field.field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                        prompt += "[" + Dates.format_segment(segmented_min, range.segment_type) + ", " + Dates.format_segment(segmented_max, range.segment_type) + "] - segmenté par " +
                            TimeSegment.TYPE_NAMES[range.segment_type] + " -,\n";
                        break;
                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:

                        let segmented_min_str = null;
                        let segmented_max_str = null;

                        // TODO FIXME move NumRangeComponentController to SHARED, and register enum handlers in the shared too
                        // if (!((segmented_min == RangeHandler.MIN_INT) && (segmented_max == RangeHandler.MAX_INT)) &&
                        //     NumRangeComponentController.getInstance().num_ranges_enum_handler &&
                        //     NumRangeComponentController.getInstance().num_ranges_enum_handler[var_data._type] &&
                        //     NumRangeComponentController.getInstance().num_ranges_enum_handler[var_data._type][field.field_name]) {
                        //     segmented_min_str = segmented_min + ' | ' + await NumRangeComponentController.getInstance().num_ranges_enum_handler[var_data._type][field.field_name].label_handler(
                        //         segmented_min
                        //     );
                        //     if (segmented_min != segmented_max) {
                        //         segmented_max_str = segmented_max + ' | ' +
                        //             await NumRangeComponentController.getInstance().num_ranges_enum_handler[var_data._type][field.field_name].label_handler(
                        //                 RangeHandler.getSegmentedMax(range)
                        //             );
                        //     } else {
                        //         segmented_max_str = segmented_min;
                        //     }
                        // } else {
                        segmented_min_str = segmented_min.toString();
                        segmented_max_str = segmented_max.toString();
                        // }

                        prompt += "[" + segmented_min_str + ", " + segmented_max_str + "] - tu ne peux pas faire référence à cette information en disant de ... à ..., tu dois obligatoirement faire la liste exhaustive ou si tu n'as pas les éléments pour, indiquer le nombre d'éléments concernés -,\n";
                        break;
                }
            }
            prompt += "]\n";
        }

        if (has_deps_params) {
            if (is_aggregator) {
                prompt += "Cette variable est un agrégat de plusieurs autres variables, dont voici le détail : ";
                throw new Error('Not implemented');
                // for (let i in this.aggregated_var_datas) {
                //     let aggregated_var_data = this.aggregated_var_datas[i];

                //     prompt += "La variable " + aggregated_var_data. + " est un agrégat de plusieurs autres variables, dont voici le détail : ";
                // }
            }

            for (const i in var_dep_values) {
                const var_dep_value = var_dep_values[i];

                // TODO
            }
        }

        prompt += "Génère une explication simple destinée à l'utilisateur de l'application - donc avec un language adapté aux garagistes et gestionnaires de concessions.\n";
        prompt += "L'explication doit avoir au maximum 100 mots, et expliquer clairement la valeur actuelle de la variable, en utilisant les éléments ci-dessus.\n";
        ConsoleHandler.log('prompt:' + prompt);

        const gpt_msg = await ModuleGPT.getInstance().generate_response(new GPTCompletionAPIConversationVO(), GPTCompletionAPIMessageVO.createNew(GPTCompletionAPIMessageVO.GPTMSG_ROLE_TYPE_USER, user_id, prompt));

        return gpt_msg?.content;
    }

    // private get_filtered_value(var_data: VarDataBaseVO): string {
    //     let params = [var_data.value];

    //     if (!!this.filter_additional_params) {
    //         params = params.concat(this.filter_additional_params);
    //     }

    //     return this.filter.apply(null, params);
    // }
}