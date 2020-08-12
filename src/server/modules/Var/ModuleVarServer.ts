import { Duration, Moment } from 'moment';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import APIDAOApiTypeAndMatroidsParamsVO from '../../../shared/modules/DAO/vos/APIDAOApiTypeAndMatroidsParamsVO';
import APISimpleVOParamVO from '../../../shared/modules/DAO/vos/APISimpleVOParamVO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import IRange from '../../../shared/modules/DataRender/interfaces/IRange';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import DataSourceMatroidControllerBase from '../../../shared/modules/DataSource/DataSourceMatroidControllerBase';
import DataSourcesController from '../../../shared/modules/DataSource/DataSourcesController';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import IMatroid from '../../../shared/modules/Matroid/interfaces/IMatroid';
import ModuleTable from '../../../shared/modules/ModuleTable';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import IVarDataVOBase from '../../../shared/modules/Var/interfaces/IVarDataVOBase';
import ModuleVar from '../../../shared/modules/Var/ModuleVar';
import ConfigureVarCacheParamVO from '../../../shared/modules/Var/params/ConfigureVarCacheParamVO';
import SimpleVarDataValueRes from '../../../shared/modules/Var/simple_vars/SimpleVarDataValueRes';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import VarConfVOBase from '../../../shared/modules/Var/vos/VarConfVOBase';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ServerBase from '../../ServerBase';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOTriggerHook from '../DAO/triggers/DAOTriggerHook';
import ForkedTasksController from '../Fork/ForkedTasksController';
import ModuleServerBase from '../ModuleServerBase';
import ModuleServiceBase from '../ModuleServiceBase';
import ModulesManagerServer from '../ModulesManagerServer';
import VarsdatasComputerBGThread from './bgthreads/VarsdatasComputerBGThread';
import VarCronWorkersHandler from './VarCronWorkersHandler';
import VarServerController from './VarServerController';

export default class ModuleVarServer extends ModuleServerBase {

    public static TASK_NAME_getSimpleVarDataCachedValueFromParam = ModuleVar.getInstance().name + '.getSimpleVarDataCachedValueFromParam';
    public static TASK_NAME_delete_varcacheconf_from_cache = ModuleVar.getInstance().name + '.delete_varcacheconf_from_cache';
    public static TASK_NAME_update_varcacheconf_from_cache = ModuleVar.getInstance().name + '.update_varcacheconf_from_cache';

    public static getInstance() {
        if (!ModuleVarServer.instance) {
            ModuleVarServer.instance = new ModuleVarServer();
        }
        return ModuleVarServer.instance;
    }

    private static instance: ModuleVarServer = null;

    /**
     * Global application cache - Brocasted CUD - Local R -----
     */

    private varcacheconf_by_var_ids_: { [var_id: number]: VarCacheConfVO } = {};
    private varcacheconf_by_api_type_ids_: { [api_type_id: string]: { [var_id: number]: VarCacheConfVO } } = {};

    /**
     * ----- Global application cache - Brocasted CUD - Local R
     */

    private constructor() {
        super(ModuleVar.getInstance().name);
        VarServerController.getInstance();
    }

    get varcacheconf_by_var_ids(): { [var_id: number]: VarCacheConfVO } {
        return this.varcacheconf_by_var_ids_;
    }

    get varcacheconf_by_api_type_ids(): { [api_type_id: string]: { [var_id: number]: VarCacheConfVO } } {
        return this.varcacheconf_by_api_type_ids_;
    }

    public async configure() {

        ModuleBGThreadServer.getInstance().registerBGThread(VarsdatasComputerBGThread.getInstance());

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Valeur' }, 'var.desc_mode.var_data.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Description' }, 'var.desc_mode.var_description.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Paramètres' }, 'var.desc_mode.var_params.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Dépendances' }, 'var.desc_mode.var_deps.___LABEL___'));

        let postCTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_POST_CREATE_TRIGGER);
        let preUTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        let postUTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_POST_UPDATE_TRIGGER);
        let preDTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_DELETE_TRIGGER);

        // Trigger sur les varcacheconfs pour mettre à jour les confs en cache en même temps qu'on les modifie dans l'outil
        postCTrigger.registerHandler(VarCacheConfVO.API_TYPE_ID, this.onCUVarCacheConf.bind(this));
        postUTrigger.registerHandler(VarCacheConfVO.API_TYPE_ID, this.onCUVarCacheConf.bind(this));
        preDTrigger.registerHandler(VarCacheConfVO.API_TYPE_ID, this.onPreDVarCacheConf.bind(this));

        // Tentative de trigger pour mettre à jour en ato l'imported existant avec la nouvelle valeur si pârams isos mais ça marche que pour simplevar et c'est pas le but
        // let preCreateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_CREATE_TRIGGER);
        // let preUpdateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_UPDATE_TRIGGER);

        // for (let api_type in VarsController.getInstance().registered_var_data_api_types){

        //     preCreateTrigger.registerHandler(api_type, this.onCreateVarData.bind(this));
        //     preUpdateTrigger.registerHandler(api_type, this.onUpdateVarData.bind(this));
        // }

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
            fr: 'Datas manquantes'
        }, 'var.desc_mode.var_missing_datas.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Vider l\'arbre'
        }, 'var_desc.clearDag.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Actualiser la HeatMap des deps'
        }, 'var_desc.refreshDependenciesHeatmap.___LABEL___'));


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
            fr: 'Indicateurs - Objectif'
        }, 'fields.labels.ref.module_psa_primes_indicateur.___LABEL____var_objectif_id'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Indicateurs - Réalisé'
        }, 'fields.labels.ref.module_psa_primes_indicateur.___LABEL____var_realise_id'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Var conf cache'
        }, 'menu.menuelements.VarCacheConfVO.___LABEL___'));

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
            fr: 'Markers'
        }, 'var.desc_mode.var_markers.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Actualiser le graph'
        }, 'var_desc.create_graph.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'StepByStep'
        }, 'var_desc.pause.___LABEL___'));

        ForkedTasksController.getInstance().register_task(ModuleVarServer.TASK_NAME_getSimpleVarDataCachedValueFromParam, this.getSimpleVarDataCachedValueFromParam.bind(this));
        ForkedTasksController.getInstance().register_task(ModuleVarServer.TASK_NAME_delete_varcacheconf_from_cache, this.delete_varcacheconf_from_cache.bind(this));
        ForkedTasksController.getInstance().register_task(ModuleVarServer.TASK_NAME_update_varcacheconf_from_cache, this.update_varcacheconf_from_cache.bind(this));

        ModuleServiceBase.getInstance().post_modules_installation_hooks.push(() => {
            /**
             * Ajout des triggers d'invalidation des données de cache en BDD
             *  - on part de la liste des vars qui ont un cache et des datasources
             */
            for (let api_type_id in VarsController.getInstance().cached_var_id_by_datasource_by_api_type_id) {

                postCTrigger.registerHandler(api_type_id, this.invalidate_var_cache_from_vo.bind(this));
                preUTrigger.registerHandler(api_type_id, this.invalidate_var_cache_from_vo.bind(this));
                postUTrigger.registerHandler(api_type_id, this.invalidate_var_cache_from_vo.bind(this));
                preDTrigger.registerHandler(api_type_id, this.invalidate_var_cache_from_vo.bind(this));
            }
        });
    }

    public async invalidate_var_cache_from_vo(vo: IDistantVOBase): Promise<boolean> {

        try {

            let to_check_interceptors_by_var_ids: { [var_id: number]: { [index: string]: IVarDataVOBase } } = {};
            for (let ds_name in VarsController.getInstance().cached_var_id_by_datasource_by_api_type_id[vo._type]) {

                // Pour chaque DS on doit demander les intercepteurs, sans filtre
                //  ensuite on va remonter les deps parents sur chaque var_id des intersecteurs, et on remonte jusqu'en haut des deps
                //  quand on a tout checké, on peut invalider en base les var_id qui sont effectivement en cache, les autres osef c'est côté client qu'il faut les invalider

                // Pour l'instant on ne sait faire ça que sur des DS matroids
                let ds: DataSourceMatroidControllerBase<any> = DataSourcesController.getInstance().registeredDataSourcesController[ds_name] as DataSourceMatroidControllerBase<any>;
                let interceptors_by_var_ids: { [var_id: number]: { [index: string]: IVarDataVOBase } } = ds.get_param_intersectors_from_vo_update_by_var_id(vo);

                for (let interceptors_by_var_idi in interceptors_by_var_ids) {
                    let interceptors = interceptors_by_var_ids[interceptors_by_var_idi];

                    for (let interceptori in interceptors) {
                        let interceptor = interceptors[interceptori];

                        if (!to_check_interceptors_by_var_ids[interceptor.var_id]) {
                            to_check_interceptors_by_var_ids[interceptor.var_id] = {};
                        }
                        to_check_interceptors_by_var_ids[interceptor.var_id][interceptor.index] = interceptor;
                    }
                }
            }

            let checked_interceptors_by_var_ids: { [var_id: number]: { [index: string]: IVarDataVOBase } } = {};

            while (ObjectHandler.getInstance().hasAtLeastOneAttribute(to_check_interceptors_by_var_ids)) {
                let var_id: number = parseInt(ObjectHandler.getInstance().getFirstAttributeName(to_check_interceptors_by_var_ids));
                let interceptors: { [index: string]: IVarDataVOBase } = to_check_interceptors_by_var_ids[var_id];
                let controller = VarsController.getInstance().getVarControllerById(var_id);

                while (ObjectHandler.getInstance().hasAtLeastOneAttribute(interceptors)) {
                    let index: string = ObjectHandler.getInstance().getFirstAttributeName(interceptors);
                    let interceptor = interceptors[index];

                    // On récupère les deps parents, qu'on ajoute à check
                    let deps_parents: IVarDataVOBase[] = controller.getParamDependents(interceptor);

                    for (let deps_parenti in deps_parents) {
                        let dep_parent = deps_parents[deps_parenti];

                        if (!to_check_interceptors_by_var_ids[dep_parent.var_id]) {
                            to_check_interceptors_by_var_ids[dep_parent.var_id] = {};
                        }
                        to_check_interceptors_by_var_ids[dep_parent.var_id][dep_parent.index] = dep_parent;
                    }

                    // On supprime ce param des params à check
                    delete to_check_interceptors_by_var_ids[var_id][index];

                    // On ajout ce param dans les params checked
                    if (!checked_interceptors_by_var_ids[var_id]) {
                        checked_interceptors_by_var_ids[var_id] = {};
                    }
                    checked_interceptors_by_var_ids[var_id][index] = interceptor;
                }
            }

            // on a tous les intercepteurs on doit s'intéresser à ceux qui sont en base et aller invalider
            for (let cached_var_by_var_idi in VarsController.getInstance().cached_var_by_var_id) {
                let cached_var = VarsController.getInstance().cached_var_by_var_id[cached_var_by_var_idi];
                let moduletable_vardata: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[cached_var.varConf.var_data_vo_type];

                if (!checked_interceptors_by_var_ids[cached_var_by_var_idi]) {
                    continue;
                }

                let checked_interceptors = checked_interceptors_by_var_ids[cached_var_by_var_idi];
                for (let checked_interceptori in checked_interceptors) {
                    let checked_interceptor = checked_interceptors[checked_interceptori];

                    let moduletable_interceptor: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[checked_interceptor._type];

                    let needs_mapping: boolean = moduletable_vardata.vo_type != moduletable_interceptor.vo_type;
                    let mappings: { [field_id_a: string]: string } = moduletable_interceptor.mapping_by_api_type_ids[moduletable_vardata.vo_type];

                    if (needs_mapping && (typeof mappings === 'undefined')) {
                        throw new Error('Mapping missing:from:' + checked_interceptor._type + ":to:" + moduletable_vardata.vo_type + ":");
                    }

                    //En mettant null on dit qu'on veut pas mapper, donc on veut tout invalider
                    //  par exemple en cas de modif(undefined pas de mapping, null mapping impossible donc dans le doute on invalide tout)
                    if (needs_mapping && !mappings) {

                        await this.invalider_tout(moduletable_vardata);

                    } else {

                        if (moduletable_vardata.is_segmented) {

                            // Si segmenté, on cherche le segment et on fait une requête par segment
                            let moduletable_vardata_segment_field_name: string = moduletable_vardata.table_segmented_field.field_id;

                            // On prend l'équivalent dans le matroid
                            let mapping_intersector_to_vardata: { [field_id_a: string]: string; } = moduletable_interceptor.mapping_by_api_type_ids[moduletable_vardata.vo_type];
                            let intersector_segment_field_name: string = moduletable_vardata_segment_field_name;
                            for (let field_a in mapping_intersector_to_vardata) {
                                let field_b = mapping_intersector_to_vardata[field_a];

                                if (field_b == moduletable_vardata_segment_field_name) {
                                    intersector_segment_field_name = field_a;
                                }
                            }

                            // et on foreach sur le champ de l'intersector qui est segmenté
                            await RangeHandler.getInstance().foreach_ranges(checked_interceptor[intersector_segment_field_name], async (segment: number | Duration | Moment) => {

                                // On enlève le filtrage sur le champ segmenté, inutile
                                let segment_interceptor = Object.assign({}, checked_interceptor);
                                delete segment_interceptor[intersector_segment_field_name];

                                let request: string = 'update ' + moduletable_vardata.get_segmented_full_name(segment) + ' t set value_ts=null where ' +
                                    ModuleDAOServer.getInstance().getWhereClauseForFilterByMatroidIntersection(
                                        moduletable_vardata.vo_type,
                                        checked_interceptor,
                                        mappings
                                    ) + ';';
                                await ModuleServiceBase.getInstance().db.query(request);
                            }, moduletable_vardata.table_segmented_field_segment_type);
                        } else {
                            let request: string = 'update ' + moduletable_vardata.full_name + ' t set value_ts=null where ' +
                                ModuleDAOServer.getInstance().getWhereClauseForFilterByMatroidIntersection(
                                    moduletable_vardata.vo_type,
                                    checked_interceptor,
                                    mappings
                                ) + ';';
                            await ModuleServiceBase.getInstance().db.query(request);
                        }
                    }
                }
            }
        } catch (error) {
            ConsoleHandler.getInstance().error('invalidate_var_cache_from_vo:type:' + vo._type + ':id:' + vo.id + vo + ':' + error);
        }
        return true;
    }

    public async invalider_tout(moduletable_vardata: ModuleTable<IVarDataVOBase>) {
        if (moduletable_vardata.is_segmented) {

            let ranges: NumRange[] = ModuleDAOServer.getInstance().get_all_ranges_from_segmented_table(moduletable_vardata);

            await RangeHandler.getInstance().foreach_ranges(ranges, async (segment: number | Duration | Moment) => {
                let request: string = 'update ' + moduletable_vardata.get_segmented_full_name(segment) + ' t set value_ts=null;';
                await ModuleServiceBase.getInstance().db.query(request);
            }, moduletable_vardata.table_segmented_field_segment_type);

        } else {
            let request: string = 'update ' + moduletable_vardata.full_name + ' t set value_ts=null;';
            await ModuleServiceBase.getInstance().db.query(request);
        }
    }

    public registerServerApiHandlers() {
        // ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_INVALIDATE_MATROID, this.invalidate_matroid.bind(this));
        // ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_register_matroid_for_precalc, this.register_matroid_for_precalc.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_getSimpleVarDataValueSumFilterByMatroids, this.getSimpleVarDataValueSumFilterByMatroids.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_getSimpleVarDataCachedValueFromParam, this.getSimpleVarDataCachedValueFromParam.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_configureVarCache, this.configureVarCache.bind(this));

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

    private async getSimpleVarDataCachedValueFromParam(param: APISimpleVOParamVO): Promise<SimpleVarDataValueRes> {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(ModuleVarServer.TASK_NAME_getSimpleVarDataCachedValueFromParam, param)) {
            return;
        }

        if ((!param) || (!param.vo)) {
            return new SimpleVarDataValueRes();
        }

        VarsdatasComputerBGThread.getInstance().disable();
        let disabled: boolean = true;

        try {
            let vo: IVarDataVOBase = param ? param.vo as IVarDataVOBase : null;
            let varsdata: IVarDataVOBase[] = await ModuleDAO.getInstance().getVosByExactMatroids<IVarDataVOBase, IVarDataVOBase>(vo._type, [vo as any], {});

            let vardata: IVarDataVOBase = varsdata && (varsdata.length == 1) ? varsdata[0] : null;

            if (!vardata) {

                // On a rien en base, on le crée et on attend le résultat
                vardata = Object.assign(VOsTypesManager.getInstance().moduleTables_by_voType[vo._type].voConstructor(), vo);
                vardata.value_ts = null;
                vardata.value = null;
                vardata.value_type = VarsController.VALUE_TYPE_IMPORT;

                let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(vardata);
                if ((!res) || (!res.id)) {
                    disabled = false;
                    VarsdatasComputerBGThread.getInstance().enable();
                    return new SimpleVarDataValueRes();
                }

                vardata.id = parseInt(res.id.toString());
            } else {

                if (!!vardata.value_ts) {
                    disabled = false;
                    VarsdatasComputerBGThread.getInstance().enable();
                    return new SimpleVarDataValueRes(true, vardata.value);
                }
            }

            // Si on a un vardata mais pas de value_ts,
            //  On stocke l'info pour le batch BG de recompilation qu'on veut renvoyer le res de ces vars datas à l'utilisateur et /ou aux
            //  utilisateurs qui sont à l'origine de la demande. Et c'est le bgthread qui gère de notifier du coup
            let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
            if (!!httpContext) {

                let uid: number = httpContext ? httpContext.get('UID') : null;
                if (!!uid) {
                    let var_index: string = vardata.index;
                    VarServerController.getInstance().add_uid_waiting_for_indexes(uid, var_index);
                }
            }

            // // Si on a un vardata mais pas de value_ts, on attend qu'il se remplisse, au max 20 secondes
            // //  pour pas dépasser les timeouts de 30 secondes sur les requetes
            // let started: Moment = moment().utc(true);
            // let interval: number = 500;
            // let timeout: number = 20000;
            // let delta: number = 0;

            // disabled = false;
            // VarsdatasComputerBGThread.getInstance().enable();
            // do {

            //     await ThreadHandler.getInstance().sleep(interval);
            //     vardata = await ModuleDAO.getInstance().getVoById(vo._type, vardata.id);

            //     if (!vardata) {
            //         return null;
            //     }

            //     if (!!vardata.value_ts) {
            //         return vardata.value;
            //     }

            //     delta = Math.abs(moment().utc(true).diff(started, 'ms'));
            // } while (delta < timeout);

        } catch (error) {
            ConsoleHandler.getInstance().error("getSimpleVarDataCachedValueFromParam:" + error);
        }

        if (disabled) {
            disabled = false;
            VarsdatasComputerBGThread.getInstance().enable();
        }

        // ConsoleHandler.getInstance().warn('TIMEOUT on var data request:' + JSON.stringify(vo) + ':');
        return new SimpleVarDataValueRes();
    }

    private async getSimpleVarDataValueSumFilterByMatroids<T extends IVarDataVOBase>(param: APIDAOApiTypeAndMatroidsParamsVO): Promise<number> {

        let matroids: IMatroid[] = param ? param.matroids as IMatroid[] : null;
        let api_type_id: string = param ? param.API_TYPE_ID : null;
        let fields_ids_mapper: { [matroid_field_id: string]: string } = param ? param.fields_ids_mapper : null;

        if ((!matroids) || (!matroids.length)) {
            return null;
        }

        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

        if (!datatable) {
            return null;
        }

        // On vérifie qu'on peut faire un select
        if (!await ModuleDAOServer.getInstance().checkAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let res: number = 0;
        for (let matroid_i in matroids) {
            let matroid: IVarDataVOBase = matroids[matroid_i] as IVarDataVOBase;

            if (!matroid) {
                ConsoleHandler.getInstance().error('Matroid vide:' + api_type_id + ':' + (matroid ? matroid._type : null) + ':');
                return null;
            }

            res += await this.getSimpleVarDataValueSumFilterByMatroid<T>(api_type_id, matroid, fields_ids_mapper);
        }

        return res;
    }

    private async getSimpleVarDataValueSumFilterByMatroid<T extends IVarDataVOBase>(api_type_id: string, matroid: IVarDataVOBase, fields_ids_mapper: { [matroid_field_id: string]: string }): Promise<number> {

        if (!matroid) {
            return null;
        }

        if (!api_type_id) {
            return null;
        }

        if (!fields_ids_mapper) {
            return null;
        }

        let moduleTable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

        if (!moduleTable) {
            return null;
        }

        let exact_search_fields = {};
        if (!!matroid.var_id) {

            exact_search_fields = VarsController.getInstance().getVarControllerById(matroid.var_id).datas_fields_type_combinatory;
        }

        let res = null;

        if (moduleTable.is_segmented) {

            // TODO FIXME : on part du principe que si on a segmenté sur une var, on doit avoir des cardinaux atomiques sur la segmentation
            // donc pas de union ou autre, ya qu'une table cible suffit de la trouver

            // On cherche dans le matroid le field qui est la segmentation. Si on a pas, on refuse de chercher en masse
            let segmented_matroid_filed_id = moduleTable.table_segmented_field.field_id;
            for (let matroid_field_id in fields_ids_mapper) {
                let field_id = fields_ids_mapper[matroid_field_id];

                if (field_id == moduleTable.table_segmented_field.field_id) {
                    segmented_matroid_filed_id = matroid_field_id;
                    break;
                }
            }

            if (!segmented_matroid_filed_id) {
                throw new Error('Not Implemented');
            }

            let segmentations: Array<IRange<any>> = matroid[segmented_matroid_filed_id];

            // Si c'est un matroid on devrait avoir un cas simple de ranges directement mais on pourrait adapter à tous les types de field matroid
            // let matroid_moduleTable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[matroid._type];
            // let matroid_field = matroid_moduleTable.getFieldFromId(segmented_matroid_filed_id);

            // switch (matroid_field.field_type) {
            // }

            for (let segmentation_i in segmentations) {
                let segmentation: NumRange = segmentations[segmentation_i];
                let segmented_value = segmentation.min;

                if (!ModuleDAOServer.getInstance().has_segmented_known_database(moduleTable, segmented_value)) {
                    continue;
                }

                let full_name = moduleTable.database + '.' + moduleTable.get_segmented_name(segmented_value);
                let filter_by_matroid_clause: string = ModuleDAOServer.getInstance().getWhereClauseForFilterByMatroid(api_type_id, matroid, fields_ids_mapper, 't', full_name, exact_search_fields);

                if (!filter_by_matroid_clause) {
                    return null;
                }

                let local_res = null;
                try {
                    local_res = await ModuleServiceBase.getInstance().db.query("SELECT sum(t.value) res FROM " + full_name + " t WHERE " + filter_by_matroid_clause + ";");
                } catch (error) {
                }

                if ((!local_res) || (!local_res[0]) || (local_res[0]['res'] === null) || (typeof local_res[0]['res'] == 'undefined')) {
                    local_res = null;
                } else {
                    local_res = local_res[0]['res'];
                }

                if (res == null) {
                    res = local_res;
                } else {
                    if (!!local_res) {
                        res += local_res;
                    }
                }
            }

            return res;

        } else {

            let filter_by_matroid_clause: string = ModuleDAOServer.getInstance().getWhereClauseForFilterByMatroid(api_type_id, matroid, fields_ids_mapper, 't', moduleTable.full_name, exact_search_fields);

            if (!filter_by_matroid_clause) {
                return null;
            }

            try {
                res = await ModuleServiceBase.getInstance().db.query("SELECT sum(t.value) res FROM " + moduleTable.full_name + " t WHERE " + filter_by_matroid_clause + ";");
            } catch (error) {
            }

            if ((!res) || (!res[0]) || (res[0]['res'] === null) || (typeof res[0]['res'] == 'undefined')) {
                return null;
            }

            return res[0]['res'];
        }
    }

    private async configureVarCache(param: ConfigureVarCacheParamVO): Promise<VarCacheConfVO> {
        let var_conf: VarConfVOBase = param.var_conf;
        let var_cache_conf: VarCacheConfVO = param.var_cache_conf;

        let existing_bdd_conf: VarCacheConfVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<VarCacheConfVO>(VarCacheConfVO.API_TYPE_ID, 'var_id', [var_cache_conf.var_id]);

        if ((!!existing_bdd_conf) && existing_bdd_conf.length) {

            if (existing_bdd_conf.length == 1) {
                this.varcacheconf_by_var_ids_[var_conf.id] = existing_bdd_conf[0];
                if (!this.varcacheconf_by_api_type_ids_[var_conf.var_data_vo_type]) {
                    this.varcacheconf_by_api_type_ids_[var_conf.var_data_vo_type] = {};
                }
                this.varcacheconf_by_api_type_ids_[var_conf.var_data_vo_type][var_conf.id] = existing_bdd_conf[0];
                return existing_bdd_conf[0];
            }
            return null;
        }

        let insert_or_update_result: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(var_cache_conf);

        if ((!insert_or_update_result) || (!insert_or_update_result.id)) {
            ConsoleHandler.getInstance().error('Impossible de configurer le cache de la var :' + var_conf.id + ':');
            return null;
        }

        var_cache_conf.id = parseInt(insert_or_update_result.id.toString());

        this.varcacheconf_by_var_ids_[var_conf.id] = var_cache_conf;
        if (!this.varcacheconf_by_api_type_ids_[var_conf.var_data_vo_type]) {
            this.varcacheconf_by_api_type_ids_[var_conf.var_data_vo_type] = {};
        }
        this.varcacheconf_by_api_type_ids_[var_conf.var_data_vo_type][var_conf.id] = var_cache_conf;
        return var_cache_conf;
    }

    private async onCUVarCacheConf(vcc: VarCacheConfVO) {
        if (!vcc) {
            return;
        }

        await ForkedTasksController.getInstance().broadexec(ModuleVarServer.TASK_NAME_update_varcacheconf_from_cache, vcc);
    }

    private update_varcacheconf_from_cache(vcc: VarCacheConfVO) {
        this.varcacheconf_by_var_ids_[vcc.var_id] = vcc;
        if (!this.varcacheconf_by_api_type_ids_[VarsController.getInstance().getVarConfById(vcc.var_id).var_data_vo_type]) {
            this.varcacheconf_by_api_type_ids_[VarsController.getInstance().getVarConfById(vcc.var_id).var_data_vo_type] = {};
        }
        this.varcacheconf_by_api_type_ids_[VarsController.getInstance().getVarConfById(vcc.var_id).var_data_vo_type][vcc.var_id] = vcc;
    }

    private delete_varcacheconf_from_cache(vcc: VarCacheConfVO) {
        delete this.varcacheconf_by_var_ids_[vcc.var_id];

        if ((!!this.varcacheconf_by_api_type_ids_[VarsController.getInstance().getVarConfById(vcc.var_id).var_data_vo_type]) &&
            (!!this.varcacheconf_by_api_type_ids_[VarsController.getInstance().getVarConfById(vcc.var_id).var_data_vo_type][vcc.var_id])) {
            delete this.varcacheconf_by_api_type_ids_[VarsController.getInstance().getVarConfById(vcc.var_id).var_data_vo_type][vcc.var_id];
        }
    }

    private async onPreDVarCacheConf(vcc: VarCacheConfVO) {
        if (!vcc) {
            return;
        }

        await ForkedTasksController.getInstance().broadexec(ModuleVarServer.TASK_NAME_delete_varcacheconf_from_cache, vcc);
    }
}