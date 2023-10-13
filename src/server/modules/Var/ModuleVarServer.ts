
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ContextFilterVOManager from '../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryFieldVO from '../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import ContextQueryVO, { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ParameterizedQueryWrapper from '../../../shared/modules/ContextFilter/vos/ParameterizedQueryWrapper';
import ManualTasksController from '../../../shared/modules/Cron/ManualTasksController';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import IRange from '../../../shared/modules/DataRender/interfaces/IRange';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import StatsController from '../../../shared/modules/Stats/StatsController';
import StatVO from '../../../shared/modules/Stats/vos/StatVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import VOsTypesManager from '../../../shared/modules/VO/manager/VOsTypesManager';
import ModuleVar from '../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarDAG from '../../../shared/modules/Var/graph/VarDAG';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import VarConfIds from '../../../shared/modules/Var/vos/VarConfIds';
import VarConfVO from '../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataInvalidatorVO from '../../../shared/modules/Var/vos/VarDataInvalidatorVO';
import VarDataValueResVO from '../../../shared/modules/Var/vos/VarDataValueResVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
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
import FieldFiltersVOManager from '../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import FieldFiltersVO from '../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';

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

    public update_varcacheconf_from_cache = ThrottleHelper.declare_throttle_with_stackable_args(
        this.update_varcacheconf_from_cache_throttled.bind(this), 200, { leading: true, trailing: true });

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
        /**
         * On checke la cohérence des confs qu'on a chargées pour les vars, en particulier s'assurer que les
         *  pixels sont correctement configurés
         */
        if (is_generator) {
            let has_errors = false;
            for (let var_id_str in VarsServerController.varcacheconf_by_var_ids) {
                let var_id = parseInt(var_id_str);
                let varcacheconf = VarsServerController.varcacheconf_by_var_ids[var_id_str];
                let varconf = VarsServerController.getVarConfById(var_id);

                if (!varconf) {
                    has_errors = true;
                    ConsoleHandler.error('Varconf not found for var_id ' + var_id);
                    continue;
                }

                if (varconf.pixel_activated) {
                    if (varcacheconf.cache_startegy != VarCacheConfVO.VALUE_CACHE_STRATEGY_PIXEL) {
                        ConsoleHandler.warn('Pixel varconf but varcacheconf strategy is not set to PIXEL for var_id :' + var_id + ': ' + varconf.name + ' - Correction automatique ...');

                        varcacheconf.cache_startegy = VarCacheConfVO.VALUE_CACHE_STRATEGY_PIXEL;
                        await ModuleDAO.getInstance().insertOrUpdateVO(varcacheconf);

                        ConsoleHandler.warn('Correction automatique terminée');
                        continue;
                    }

                    if ((!varconf.pixel_fields) || (!varconf.pixel_fields.length)) {
                        ConsoleHandler.error('Pixel varconf but no pixel fields for var_id :' + var_id + ': ' + varconf.name);
                        has_errors = true;
                        continue;
                    }

                    for (let i in varconf.pixel_fields) {
                        let pixel_field = varconf.pixel_fields[i];

                        if (!pixel_field.pixel_param_field_id) {
                            ConsoleHandler.error('Pixel varconf but no pixel_param_field_id for var_id :' + var_id + ': ' + varconf.name + ' - pixel_fields : ' + JSON.stringify(varconf.pixel_fields));
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

                        if (!pixel_field.pixel_vo_field_id) {
                            ConsoleHandler.error('Pixel varconf but no pixel_vo_field_id for var_id :' + var_id + ': ' + varconf.name + ' - pixel_fields : ' + JSON.stringify(varconf.pixel_fields));
                            has_errors = true;
                            continue;
                        }

                        if (pixel_field.pixel_range_type == null) {
                            ConsoleHandler.error('Pixel varconf but no pixel_range_type for var_id :' + var_id + ': ' + varconf.name + ' - pixel_fields : ' + JSON.stringify(varconf.pixel_fields));
                            has_errors = true;
                            continue;
                        }
                    }
                } else {
                    if (varcacheconf.cache_startegy == VarCacheConfVO.VALUE_CACHE_STRATEGY_PIXEL) {
                        ConsoleHandler.error('Non pixel varconf but varcacheconf strategy is set to PIXEL for var_id :' + var_id + ': ' + varconf.name);
                        has_errors = true;
                        continue;
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

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({ 'fr-fr': 'Valeur' }, 'var.desc_mode.var_data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({ 'fr-fr': 'Description' }, 'var.desc_mode.var_description.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({ 'fr-fr': 'Paramètres' }, 'var.desc_mode.var_params.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({ 'fr-fr': 'Dépendances' }, 'var.desc_mode.var_deps.___LABEL___'));

        let postCTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        let postUTrigger: DAOPostUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        let postDTrigger: DAOPostDeleteTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostDeleteTriggerHook.DAO_POST_DELETE_TRIGGER);
        let preCTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        let preUTrigger: DAOPreUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);

        // Trigger sur les varcacheconfs pour mettre à jour les confs en cache en même temps qu'on les modifie dans l'outil
        postCTrigger.registerHandler(VarCacheConfVO.API_TYPE_ID, this, this.onCVarCacheConf);
        postUTrigger.registerHandler(VarCacheConfVO.API_TYPE_ID, this, this.onUVarCacheConf);
        postDTrigger.registerHandler(VarCacheConfVO.API_TYPE_ID, this, this.onPostDVarCacheConf);

        postCTrigger.registerHandler(VarConfVO.API_TYPE_ID, this, this.onCVarConf);
        postUTrigger.registerHandler(VarConfVO.API_TYPE_ID, this, this.onUVarConf);
        postDTrigger.registerHandler(VarConfVO.API_TYPE_ID, this, this.onPostDVarConf);

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Calculée'
        }, 'var_data.value_type.computed'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Importée'
        }, 'var_data.value_type.import'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'TOUT supprimer ? Même les imports ?'
        }, 'vars_datas_explorer_actions.delete_cache_and_import_intersection.body.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'ATTENTION'
        }, 'vars_datas_explorer_actions.delete_cache_and_import_intersection.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Suppression en cours...'
        }, 'vars_datas_explorer_actions.delete_cache_and_import_intersection.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Suppression terminée'
        }, 'vars_datas_explorer_actions.delete_cache_and_import_intersection.ok.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'A tester'
        }, 'slow_var.type.needs_test'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Refusée'
        }, 'slow_var.type.denied'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'En cours de test'
        }, 'slow_var.type.tesing'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Datasources'
        }, 'var.desc_mode.var_datasources.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Vider l\'arbre'
        }, 'var_desc.clearDag.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Actualiser la HeatMap des deps'
        }, 'var_desc.refreshDependenciesHeatmap.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': '<b>Variable</b><hr><ul>'
        }, 'VarDataRefComponent.var_data_value_tooltip_prefix.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': '<li>Dernière mise à jour le <b>{formatted_date}</b><br><i>{value}</i></li>'
        }, 'VarDataRefComponent.var_data_value_tooltip.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': '<li>Import ou saisie le <b>{formatted_date}</b><br><i>{value}</i></li>'
        }, 'VarDataRefComponent.var_data_value_import_tooltip.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Index + Entrée'
        }, 'vars_datas_explorer_visualization.param_from_index.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer la valeur importée'
        }, 'VarDataRefComponent.contextmenu.clearimport.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Index + Entrée - Validez à vide pour réinitialiser.'
        }, 'vars_datas_explorer_visualization.param_from_index.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Index de la variable sélectionnée'
        }, 'vars_datas_explorer_visualization.chosen_index.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': '</ul>'
        }, 'VarDataRefComponent.var_data_value_tooltip_suffix.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'SlowVars'
        }, 'menu.menuelements.admin.SlowVarVO.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'En cours de test'
        }, 'slow_var.type.testing'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Matroids calculés'
        }, 'var.desc_mode.computed_datas_matroids.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Matroids chargés'
        }, 'var.desc_mode.loaded_datas_matroids.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Valeur totale des matroids chargés'
        }, 'var.desc_mode.loaded_datas_matroids_sum_value.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Tout en cache/pas de chunks'
        }, 'var_cache_conf.cache_strategy.cache_all_never_load_chunks'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Rien en cache'
        }, 'var_cache_conf.cache_strategy.cache_none'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Pixel'
        }, 'var_cache_conf.cache_strategy.pixel'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Variable invalidée, calcul en cours...'
        }, 'var.desc_mode.update_var_data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Invalidation impossible sur un import'
        }, 'var.desc_mode.update_var_data.not_allowed_on_imports.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Indicateurs - Objectif'
        }, 'fields.labels.ref.module_psa_primes_indicateur.___LABEL____var_objectif_id'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Indicateurs - Réalisé'
        }, 'fields.labels.ref.module_psa_primes_indicateur.___LABEL____var_realise_id'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Performance'
        }, 'fields.labels.ref.module_var_var_perf.___LABEL____var_id'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Variable lente'
        }, 'fields.labels.ref.module_var_slow_var.___LABEL____var_id'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Var conf cache'
        }, 'menu.menuelements.admin.VarCacheConfVO.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Nombre de deps'
        }, 'var.desc_mode.dependencies_number.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Deps en % de l\'arbre'
        }, 'var.desc_mode.dependencies_tree_prct.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': '% de vars enregistrées'
        }, 'var_desc_registrations.vardag_registered_prct.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': '% de vars enregistrées / var_id'
        }, 'var_desc_registrations.vardag_registered_prct_by_var_id.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Taille de l\'arbre'
        }, 'var_desc_registrations.vardag_size.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Données importées/aggrégées'
        }, 'var_desc.aggregated_var_datas.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Cache des modifications de VO vidé. Prêt pour le redémarrage'
        }, 'force_empty_vars_datas_vo_update_cache.done'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Import ?'
        }, 'var_desc.var_data_is_import.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Date màj : {last_update}'
        }, 'var_desc.var_data_last_update.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Explication du calcul'
        }, 'var_desc.explaination.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Markers'
        }, 'var.desc_mode.var_markers.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Actualiser le graph'
        }, 'var_desc.create_graph.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'StepByStep'
        }, 'var_desc.pause.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Limité à 10 deps affichées. Cliquer pour les voir toutes...'
        }, 'var_desc_explain_dep.limit_10.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Variable'
        }, 'var_desc.var_controller_label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Valeur non formatée'
        }, 'var_desc.var_data_label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Source de données'
        }, 'var_desc.var_ds_label.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer le cache par intersection'
        }, 'vars_datas_explorer_actions.delete_cache_intersection.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Afficher les données exactes'
        }, 'vars_datas_explorer_actions.get_exact.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Calculer ce paramètre'
        }, 'vars_datas_explorer_actions.show_exact.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Afficher les données incluses'
        }, 'vars_datas_explorer_actions.get_included.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Afficher les données intersectées'
        }, 'vars_datas_explorer_actions.get_intersection.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Invalider le cache par intersection'
        }, 'vars_datas_explorer_actions.invalidate_cache_intersection.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Invalider l\'arbre en cache par intersection'
        }, 'vars_datas_explorer_actions.invalidate_cache_intersection_and_depstree.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer le cache et les imports par intersection'
        }, 'vars_datas_explorer_actions.delete_cache_and_import_intersection.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Variables'
        }, 'vars_datas_explorer_filters.vars_confs.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Copier la valeur brute'
        }, 'VarDataRefComponent.contextmenu.copy_raw_value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Copier la valeur formatée'
        }, 'VarDataRefComponent.contextmenu.copy_formatted_value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Copier l\'index de la variable'
        }, 'VarDataRefComponent.contextmenu.copy_var_param_index.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Valeur importée supprimée'
        }, 'VarDataRefComponent.contextmenu.importcleared.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Afficher'
        }, 'var_desc_explain.show_help_tooltip.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Masquer'
        }, 'var_desc_explain.show_help_tooltip.hidden.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Explication synthétique publique'
        }, 'var_desc.public.___LABEL___'));

        // ForkedTasksController.register_task(ModuleVarServer.TASK_NAME_getSimpleVarDataCachedValueFromParam, this.getSimpleVarDataCachedValueFromParam.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(ModuleVarServer.TASK_NAME_delete_varconf_from_cache, this.delete_varconf_from_cache.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(ModuleVarServer.TASK_NAME_update_varconf_from_cache, this.update_varconf_from_cache.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(ModuleVarServer.TASK_NAME_delete_varcacheconf_from_cache, this.delete_varcacheconf_from_cache.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(ModuleVarServer.TASK_NAME_update_varcacheconf_from_cache, this.update_varcacheconf_from_cache.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(ModuleVarServer.TASK_NAME_force_delete_all_cache_except_imported_data, this.force_delete_all_cache_except_imported_data.bind(this));

        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(ModuleVarServer.TASK_NAME_invalidate_imports_for_u, this.invalidate_imports_for_u.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(ModuleVarServer.TASK_NAME_invalidate_imports_for_c, this.invalidate_imports_for_c.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(ModuleVarServer.TASK_NAME_invalidate_imports_for_d, this.invalidate_imports_for_d.bind(this));

        ModuleServiceBase.getInstance().post_modules_installation_hooks.push(() => {

            /**
             * Ajout des triggers d'invalidation des données de cache en BDD
             *  - on part de la liste des vars qui ont un cache et des datasources
             * api_type_id => les vos des datasources
             */
            for (let api_type_id in VarsServerController.registered_vars_controller_by_api_type_id) {


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

            /**
             * On ajoute les trigger preC et preU pour mettre à jour l'index bdd avant insert
             * api_type_id => les vos des vars datas
             */
            for (let api_type_id in VarsServerController.varcacheconf_by_api_type_ids) {

                preCTrigger.registerHandler(api_type_id, this, this.prepare_bdd_index_for_c);
                preUTrigger.registerHandler(api_type_id, this, this.prepare_bdd_index_for_u);

                // On invalide l'arbre par intersection si on passe un type en import, ou si on change la valeur d'un import, ou si on passe de import à calculé
                postCTrigger.registerHandler(api_type_id, this, this.invalidate_imports_for_c as any);
                postUTrigger.registerHandler(api_type_id, this, this.invalidate_imports_for_u as any);
                postDTrigger.registerHandler(api_type_id, this, this.invalidate_imports_for_d as any);
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

        let invalidators = [];
        for (let i in vos) {
            let vo = vos[i];

            if (!vo.check_param_is_valid(vo._type)) {
                ConsoleHandler.error('Les champs du matroid ne correspondent pas à son typage');
                continue;
            }

            // cas particulier de l'invalidation exacte où on accepte de supprimer un import ou un denied puisqu'on demande expressément de supprimer cette var

            let invalidator = VarDataInvalidatorVO.create_new(vo, VarDataInvalidatorVO.INVALIDATOR_TYPE_EXACT, false, vo.value_type == VarDataBaseVO.VALUE_TYPE_DENIED, vo.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT);
            invalidators.push(invalidator);
        }

        await VarsDatasVoUpdateHandler.push_invalidators(invalidators);
    }

    public async invalidate_cache_exact_and_parents(vos: VarDataBaseVO[]): Promise<boolean> {

        if ((!vos) || (!vos.length)) {
            return;
        }

        let invalidators = [];
        for (let i in vos) {
            let vo = vos[i];

            if (!vo.check_param_is_valid(vo._type)) {
                ConsoleHandler.error('Les champs du matroid ne correspondent pas à son typage');
                continue;
            }

            let invalidator = VarDataInvalidatorVO.create_new(vo, VarDataInvalidatorVO.INVALIDATOR_TYPE_EXACT, true, false, false);
            invalidators.push(invalidator);
        }

        await VarsDatasVoUpdateHandler.push_invalidators(invalidators);
    }

    public async invalidate_cache_intersection_and_parents(vos: VarDataBaseVO[]): Promise<boolean> {

        if ((!vos) || (!vos.length)) {
            return;
        }

        let invalidators = [];
        for (let i in vos) {
            let vo = vos[i];

            if (!vo.check_param_is_valid(vo._type)) {
                ConsoleHandler.error('Les champs du matroid ne correspondent pas à son typage');
                continue;
            }

            let invalidator = VarDataInvalidatorVO.create_new(vo, VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED, true, false, false);
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
        //     let moduletable = VOsTypesManager.moduleTables_by_voType[api_type_id];

        //     await ModuleDAOServer.getInstance().query('DELETE from ' + moduletable.full_name + ' where value_type = ' + VarDataBaseVO.VALUE_TYPE_COMPUTED + ';');
        // }
    }

    public async delete_cache_intersection(vos: VarDataBaseVO[]) {

        if ((!vos) || (!vos.length)) {
            return;
        }

        let invalidators = [];
        for (let i in vos) {
            let vo = vos[i];

            if (!vo.check_param_is_valid(vo._type)) {
                ConsoleHandler.error('Les champs du matroid ne correspondent pas à son typage');
                continue;
            }

            let invalidator = VarDataInvalidatorVO.create_new(vo, VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED, false, false, false);
            invalidators.push(invalidator);
        }

        await VarsDatasVoUpdateHandler.push_invalidators(invalidators);
    }

    public async delete_cache_and_imports_intersection(vos: VarDataBaseVO[]) {

        if ((!vos) || (!vos.length)) {
            return;
        }

        let invalidators = [];
        for (let i in vos) {
            let vo = vos[i];

            if (!vo.check_param_is_valid(vo._type)) {
                ConsoleHandler.error('Les champs du matroid ne correspondent pas à son typage');
                continue;
            }

            let invalidator = VarDataInvalidatorVO.create_new(vo, VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED, false, false, true);
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
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'Variables'
        }));

        let promises = [];

        promises.push((async () => {
            let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
            POLICY_FO_ACCESS.group_id = group.id;
            POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            POLICY_FO_ACCESS.translatable_name = ModuleVar.POLICY_FO_ACCESS;
            POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, new DefaultTranslation({
                'fr-fr': 'Accès aux Variables sur le front'
            }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        })());

        promises.push((async () => {
            let desc_mode_access: AccessPolicyVO = new AccessPolicyVO();
            desc_mode_access.group_id = group.id;
            desc_mode_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            desc_mode_access.translatable_name = ModuleVar.POLICY_DESC_MODE_ACCESS;
            desc_mode_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(desc_mode_access, new DefaultTranslation({
                'fr-fr': 'Accès au "Mode description"'
            }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        })());

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        promises.push((async () => {
            bo_access.group_id = group.id;
            bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            bo_access.translatable_name = ModuleVar.POLICY_BO_ACCESS;
            bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
                'fr-fr': 'Administration des vars'
            }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        })());

        let bo_imported_access: AccessPolicyVO = new AccessPolicyVO();
        promises.push((async () => {
            bo_imported_access.group_id = group.id;
            bo_imported_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            bo_imported_access.translatable_name = ModuleVar.POLICY_BO_IMPORTED_ACCESS;
            bo_imported_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_imported_access, new DefaultTranslation({
                'fr-fr': 'Configuration des données importées'
            }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        })());

        let bo_varconf_access: AccessPolicyVO = new AccessPolicyVO();
        promises.push((async () => {
            bo_varconf_access.group_id = group.id;
            bo_varconf_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            bo_varconf_access.translatable_name = ModuleVar.POLICY_BO_VARCONF_ACCESS;
            bo_varconf_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_varconf_access, new DefaultTranslation({
                'fr-fr': 'Configuration des types de vars'
            }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        })());
        await Promise.all(promises);
        promises = [];

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

            let promises = [];
            for (let api_type_id in VarsServerController.varcacheconf_by_api_type_ids) {

                let moduletable = VOsTypesManager.moduleTables_by_voType[api_type_id];
                promises.push(ModuleDAOServer.getInstance().query('DELETE from ' + moduletable.full_name + ' where value_type = ' + VarDataBaseVO.VALUE_TYPE_COMPUTED + ';'));
            }
            await all_promises(promises);

            CurrentVarDAGHolder.current_vardag = new VarDAG();
            CurrentBatchDSCacheHolder.current_batch_ds_cache = {};
        });
    }

    private async onCVarCacheConf(vcc: VarCacheConfVO) {
        if (!vcc) {
            return;
        }

        await ForkedTasksController.broadexec(ModuleVarServer.TASK_NAME_update_varcacheconf_from_cache, vcc);
    }

    private async onUVarCacheConf(vo_update_handler: DAOUpdateVOHolder<VarCacheConfVO>) {
        await ForkedTasksController.broadexec(ModuleVarServer.TASK_NAME_update_varcacheconf_from_cache, vo_update_handler.post_update_vo);
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
            let delete_cache_query = query(vo_update_handler.pre_update_vo.var_data_vo_type)
                .filter_by_num_eq('var_id', vo_update_handler.pre_update_vo.id)
                .filter_by_num_eq('value_type', VarDataBaseVO.VALUE_TYPE_COMPUTED);

            await ContextQueryServerController.delete_vos(delete_cache_query);
        }
    }

    private update_varcacheconf_from_cache_throttled(vccs: VarCacheConfVO[]) {
        for (let i in vccs) {
            let vcc = vccs[i];
            VarsServerController.update_registered_varcacheconf(vcc.var_id, vcc);
        }
    }

    private delete_varcacheconf_from_cache(vcc: VarCacheConfVO) {
        VarsServerController.delete_registered_varcacheconf(vcc.var_id);
    }

    private update_varconf_from_cache_throttled(vcs: VarConfVO[]) {
        for (let i in vcs) {
            let vc = vcs[i];
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

    private async onPostDVarCacheConf(vcc: VarCacheConfVO) {
        if (!vcc) {
            return;
        }

        await ForkedTasksController.broadexec(ModuleVarServer.TASK_NAME_delete_varcacheconf_from_cache, vcc);
    }

    private async get_var_id_by_names(): Promise<VarConfIds> {
        let res: VarConfIds = new VarConfIds();
        let var_confs: VarConfVO[] = await query(VarConfVO.API_TYPE_ID).select_vos<VarConfVO>();
        res.var_id_by_names = {};

        for (let i in var_confs) {
            let var_conf = var_confs[i];

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

        let uid = StackContext.get('UID');
        let client_tab_id = StackContext.get('CLIENT_TAB_ID');

        VarsTabsSubsController.register_sub(uid, client_tab_id, params ? params.map((param) => param.index) : []);

        if (ConfigurationService.node_configuration.DEBUG_VARS) {
            for (let i in params) {
                let param = params[i];

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
        let time_in = Dates.now_ms();

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

        let uid = StackContext.get('UID');
        let client_tab_id = StackContext.get('CLIENT_TAB_ID');

        let params_indexes = params ? params.map((param) => param.index) : [];

        VarsTabsSubsController.register_sub(uid, client_tab_id, params_indexes);

        if (ConfigurationService.node_configuration.DEBUG_VARS) {
            for (let i in params) {
                let param = params[i];

                ConsoleHandler.log('register_params:' + param.index + ':UID:' + uid + ':CLIENT_TAB_ID:' + client_tab_id);
            }
        }

        /**
         * Si on trouve des datas existantes et valides en base, on les envoie, sinon on indique qu'on attend ces valeurs
         */
        let notifyable_vars: VarDataBaseVO[] = [];

        notifyable_vars = await VarsDatasProxy.get_var_datas_or_ask_to_bgthread(params_indexes);

        if (notifyable_vars && notifyable_vars.length) {
            let vars_to_notif: VarDataValueResVO[] = [];
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

        let time_out = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('ModuleVarServer', 'register_params', 'OUT');
        StatsController.register_stat_DUREE('ModuleVarServer', 'register_params', 'OUT', time_out - time_in);
    }

    private filter_null_fields_params(params: VarDataBaseVO[]): VarDataBaseVO[] {
        let res: VarDataBaseVO[] = [];

        for (let i in params) {
            let param = params[i];

            if (!param) {
                continue;
            }

            let matroid_fields = MatroidController.getMatroidFields(param._type);
            if (!matroid_fields) {
                continue;
            }

            let filter_ = false;
            for (let j in matroid_fields) {
                let matroid_field = matroid_fields[j];

                if ((!param[matroid_field.field_id]) || (!(param[matroid_field.field_id] as IRange[]).length) ||
                    ((param[matroid_field.field_id] as IRange[]).indexOf(null) >= 0)) {
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

        let uid = StackContext.get('UID');
        let client_tab_id = StackContext.get('CLIENT_TAB_ID');
        VarsTabsSubsController.unregister_sub(uid, client_tab_id, params.map((param) => param.check_param_is_valid(param._type) ? param.index : null));

        if (ConfigurationService.node_configuration.DEBUG_VARS) {
            for (let i in params) {
                let param = params[i];

                ConsoleHandler.log('unregister_param:' + param.index + ':UID:' + uid + ':CLIENT_TAB_ID:' + client_tab_id);
            }
        }
    }

    private async getVarControllerDSDeps(text: string): Promise<string[]> {
        if ((!text) || (!VarsController.var_conf_by_name[text])) {
            return null;
        }

        let var_controller = VarsServerController.registered_vars_controller[text];

        return VarsServerController.get_datasource_deps_and_predeps_names(var_controller);
    }


    private async getVarControllerVarsDeps(text: string): Promise<{ [dep_name: string]: string }> {
        if ((!text) || (!VarsController.var_conf_by_name[text])) {
            return null;
        }

        let var_controller = VarsServerController.registered_vars_controller[text];

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
            ConsoleHandler.error('Les champs du matroid ne correspondent pas à son typage');
            return null;
        }

        let var_controller = VarsServerController.registered_vars_controller[VarsController.var_conf_by_id[param.var_id].name];

        if (!var_controller) {
            return null;
        }

        let dag: VarDAG = new VarDAG();
        let varDAGNode: VarDAGNode = await VarDAGNode.getInstance(dag, param, false);

        if (!varDAGNode) {
            return null;
        }

        let predeps = var_controller.getDataSourcesPredepsDependencies();
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
        let var_dag: VarDAG = new VarDAG();
        let deployed_vars_datas: { [index: string]: boolean } = {};
        let vars_datas: { [index: string]: VarDataBaseVO } = {
            [param.index]: param
        };

        let node = await VarDAGNode.getInstance(var_dag, param, false);

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
        let varconf = VarsController.var_conf_by_id[param.var_id];
        if (varconf.pixel_activated) {
            let is_pixel = true;
            for (let i in varconf.pixel_fields) {
                let pixel_field = varconf.pixel_fields[i];

                if (RangeHandler.getCardinalFromArray(param[pixel_field.pixel_param_field_id]) != 1) {
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
        let value_size_limit: number = 10000;

        if (!param.check_param_is_valid(param._type)) {
            ConsoleHandler.error('Les champs du matroid ne correspondent pas à son typage');
            return null;
        }

        let var_controller = VarsServerController.registered_vars_controller[VarsController.var_conf_by_id[param.var_id].name];

        if (!var_controller) {
            return null;
        }

        let datasources_values: { [ds_name: string]: any; } = {};
        let datasources_deps: DataSourceControllerBase[] = VarsServerController.get_datasource_deps_and_predeps(var_controller);

        // WARNING on se base sur un fake node par ce que je vois pas comment faire autrement...
        let dag: VarDAG = new VarDAG();
        let varDAGNode: VarDAGNode = await VarDAGNode.getInstance(dag, param, false);

        if (!varDAGNode) {
            return null;
        }

        for (let i in datasources_deps) {
            let datasource_dep = datasources_deps[i];

            await datasource_dep.load_node_data(varDAGNode);
            let data = varDAGNode.datasources[datasource_dep.name];

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
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } },
        accept_max_ranges: boolean = false
    ): Promise<VarDataBaseVO> {

        if (ConfigurationService.node_configuration.DEBUG_VARS_DB_PARAM_BUILDER) {
            ConsoleHandler.log('getVarParamFromContextFilters: ' + var_name + ':IN');
        }

        if (!var_name) {
            return null;
        }

        let var_conf = VarsController.var_conf_by_name[var_name];
        if (!var_conf) {
            return null;
        }

        let uid = StackContext.get('UID');

        return new Promise(async (resolve, reject) => {
            let param = new GetVarParamFromContextFiltersParam(
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
        let max_concurrent_promises: number = ConfigurationService.node_configuration.MAX_POOL / 2;

        /**
         * On fait un cache local pour les requêtes de cet appel
         */
        let cache_local: { [full_request: string]: Promise<any> } = {};

        let promise_pipeline = new PromisePipeline(max_concurrent_promises, 'ModuleVarServer.throttled_getVarParamsFromContextFilters');
        for (let i in params) {

            await promise_pipeline.push(async () => {
                await this.throttled_getVarParamFromContextFilters(params[i], cache_local);
            });
        }

        await promise_pipeline.end();
    }

    private async throttled_getVarParamFromContextFilters(param: GetVarParamFromContextFiltersParam, cache_local: { [full_request: string]: Promise<any> }) {

        let var_name = param.var_name;
        let get_active_field_filters = param.get_active_field_filters;
        let custom_filters = param.custom_filters;
        let active_api_type_ids = param.active_api_type_ids;
        let discarded_field_paths = param.discarded_field_paths;
        let accept_max_ranges = param.accept_max_ranges;
        let var_conf = VarsController.var_conf_by_name[var_name];
        let resolve = param.resolve;

        let var_param: VarDataBaseVO = VarDataBaseVO.createNew(var_name);

        let matroid_fields = MatroidController.getMatroidFields(var_conf.var_data_vo_type);
        let field_promises: Array<Promise<any>> = [];

        let cleaned_active_field_filters = FieldFiltersVOManager.clean_field_filters_for_request(get_active_field_filters);
        let refuse_param: boolean = false;

        for (let i in matroid_fields) {
            let matroid_field_ = matroid_fields[i];

            field_promises.push((async (matroid_field) => {
                // TODO FIXME les tsranges pour le moment on max_range il faut réfléchir à la meilleure solution pour gérer ces filtrages de dates
                switch (matroid_field.field_type) {
                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        if (matroid_field.has_relation) {

                            let alias = matroid_field.manyToOne_target_moduletable.vo_type + '__id';
                            let context_query: ContextQueryVO = query(matroid_field.manyToOne_target_moduletable.vo_type)
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

                                    let query_wrapper: ParameterizedQueryWrapper = await ModuleContextFilterServer.getInstance().build_select_query(context_query);
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
                                //     var_param[matroid_field.field_id] = [RangeHandler.getMaxNumRange()];
                                // }
                                refuse_param = true;
                                break;
                            }

                            let ids: number[] = [];
                            ids_db.forEach((id_db) => id_db[alias] ? ids.push(parseInt(id_db[alias])) : {});

                            var_param[matroid_field.field_id] = RangeHandler.get_ids_ranges_from_list(ids);
                        } else {
                            // Max range étant interdit sur les registers de var, on force un retour null
                            if (!accept_max_ranges) {

                                if (!refuse_param) {
                                    ConsoleHandler.error('getVarParamFromContextFilters: max range not allowed on registers of var');
                                    refuse_param = true;
                                }
                            } else {
                                var_param[matroid_field.field_id] = [RangeHandler.getMaxNumRange()];
                            }
                        }
                        break;
                    case ModuleTableField.FIELD_TYPE_hourrange_array:
                        if (!accept_max_ranges) {

                            if (!refuse_param) {
                                ConsoleHandler.error('getVarParamFromContextFilters: max range not allowed on registers of var');
                                refuse_param = true;
                            }
                        } else {
                            var_param[matroid_field.field_id] = [RangeHandler.getMaxHourRange()];
                        }
                        break;
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                        if (!!custom_filters[matroid_field.field_id]) {
                            // Sur ce système on a un problème il faut limiter à tout prix le nombre de possibilités renvoyées.
                            // on compte en nombre de range et non en cardinal
                            // et on limite à la limite configurée dans l'application
                            let limit_nb_range = await this.get_limit_nb_ts_ranges_on_param_by_context_filter();

                            if (ConfigurationService.node_configuration.DEBUG_VARS_DB_PARAM_BUILDER) {
                                ConsoleHandler.log('getVarParamFromContextFilters: ' + var_name + ':get_ts_ranges_from_custom_filter:IN');
                            }
                            var_param[matroid_field.field_id] = ModuleVar.getInstance().get_ts_ranges_from_custom_filter(custom_filters[matroid_field.field_id], limit_nb_range);
                            if (ConfigurationService.node_configuration.DEBUG_VARS_DB_PARAM_BUILDER) {
                                ConsoleHandler.log('getVarParamFromContextFilters: ' + var_name + ':get_ts_ranges_from_custom_filter:OUT');
                            }

                            if ((!var_param[matroid_field.field_id]) || (!var_param[matroid_field.field_id].length)) {
                                if (!accept_max_ranges) {

                                    if (!refuse_param) {
                                        ConsoleHandler.error('getVarParamFromContextFilters: max range not allowed on registers of var');
                                        refuse_param = true;
                                    }

                                } else {
                                    var_param[matroid_field.field_id] = [RangeHandler.getMaxNumRange()];
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
                            var_param[matroid_field.field_id] = [RangeHandler.getMaxTSRange()];
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
}