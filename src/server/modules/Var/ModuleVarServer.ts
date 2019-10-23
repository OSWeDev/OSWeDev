import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleVar from '../../../shared/modules/Var/ModuleVar';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';

export default class ModuleVarServer extends ModuleServerBase {

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
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Valeur' }, 'var.desc_mode.var_data.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Description' }, 'var.desc_mode.var_description.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Paramètres' }, 'var.desc_mode.var_params.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Dépendances' }, 'var.desc_mode.var_deps.___LABEL___'));

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
    }

    public registerServerApiHandlers() {
        // ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_INVALIDATE_MATROID, this.invalidate_matroid.bind(this));
        // ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_register_matroid_for_precalc, this.register_matroid_for_precalc.bind(this));
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

    // public async invalidate_matroid<TData extends IVarMatroidDataVO, TParam extends IVarMatroidDataParamVO & TData>(matroid_param: TParam): Promise<void> {
    //     if ((!matroid_param) || (!matroid_param._type)) {
    //         return;
    //     }

    //     let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[matroid_param._type];

    //     if ((!moduletable) || (!moduletable.isMatroidTable)) {
    //         return;
    //     }

    //     let vos: TData[] = await ModuleDAO.getInstance().filterVosByMatroidsIntersections<TData, TParam>(moduletable.vo_type, [matroid_param], {});

    //     // L'invalidation se fait en supprimant la date de création de la data
    //     for (let i in vos) {
    //         let vo = vos[i];

    //         delete vo.value_ts;
    //     }

    //     await ModuleDAO.getInstance().insertOrUpdateVOs(vos);
    // }

    // public async register_matroid_for_precalc(matroid_param: IVarMatroidDataParamVO): Promise<void> {
    //     if ((!matroid_param) || (!matroid_param._type)) {
    //         return;
    //     }

    //     let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[matroid_param._type];

    //     if ((!moduletable) || (!moduletable.isMatroidTable)) {
    //         return;
    //     }

    //     let fields: Array<ModuleTableField<any>> = await MatroidController.getInstance().getMatroidFields(moduletable.vo_type);
    //     let ranges: Array<FieldRange<any>> = [];

    //     for (let i in fields) {

    //         // ATTENTION, si un matroid à plusieurs ranges sur le même field, on refuse la demande pour le moment.
    //         //  a priori c'est pas le cas standard
    //         let field = fields[i];

    //         let matroid_field_range: Array<FieldRange<any>> = FieldRangeHandler.getInstance().getFieldRangesFromRanges(moduletable.vo_type, field.field_id, matroid_param[field.field_id]);

    //         if ((!matroid_field_range) || (matroid_field_range.length != 1)) {
    //             console.error('Impossible de questionner un matroid qui possède plusieurs ranges sur un de ses fields');
    //             return null;
    //         }

    //         ranges.push(matroid_field_range[0]);
    //     }

    //     // On doit pas créer de data si il existe un matroid en bdd exactement comme celui demandé
    //     let vos: IVarMatroidDataVO[] = await ModuleDAO.getInstance().getVosByExactFieldRange<IVarMatroidDataVO>(moduletable.vo_type, ranges);

    //     if ((vos) && (vos.length > 0)) {
    //         return null;
    //     }

    //     let empty_shell: IVarMatroidDataVO = MatroidController.getInstance().cloneFrom(matroid_param) as IVarMatroidDataVO;
    //     empty_shell._type = moduletable.vo_type;
    //     empty_shell.missing_datas_infos = [];
    //     empty_shell.value_ts = null;
    //     empty_shell.value_type = VarsController.VALUE_TYPE_COMPUTED;

    //     await ModuleDAO.getInstance().insertOrUpdateVO(empty_shell);
    // }
}