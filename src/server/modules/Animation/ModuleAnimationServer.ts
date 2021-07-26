import * as moment from 'moment';
import AccessPolicyController from '../../../shared/modules/AccessPolicy/AccessPolicyController';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import AnimationController from '../../../shared/modules/Animation/AnimationController';
import ModuleAnimation from '../../../shared/modules/Animation/ModuleAnimation';
import AnimationModuleParamVO from '../../../shared/modules/Animation/params/AnimationModuleParamVO';
import AnimationParamVO from '../../../shared/modules/Animation/params/AnimationParamVO';
import AnimationReportingParamVO from '../../../shared/modules/Animation/params/AnimationReportingParamVO';
import ThemeModuleDataRangesVO from '../../../shared/modules/Animation/params/theme_module/ThemeModuleDataRangesVO';
import AnimationModuleVO from '../../../shared/modules/Animation/vos/AnimationModuleVO';
import AnimationParametersVO from '../../../shared/modules/Animation/vos/AnimationParametersVO';
import AnimationQRVO from '../../../shared/modules/Animation/vos/AnimationQRVO';
import AnimationThemeVO from '../../../shared/modules/Animation/vos/AnimationThemeVO';
import AnimationUserModuleVO from '../../../shared/modules/Animation/vos/AnimationUserModuleVO';
import AnimationUserQRVO from '../../../shared/modules/Animation/vos/AnimationUserQRVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DataFilterOption from '../../../shared/modules/DataRender/vos/DataFilterOption';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import ModuleTable from '../../../shared/modules/ModuleTable';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ConfigurationService from '../../env/ConfigurationService';
import StackContext from '../../StackContext';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import DAOPreUpdateTriggerHook from '../DAO/triggers/DAOPreUpdateTriggerHook';
import DataExportServerController from '../DataExport/DataExportServerController';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import VarsServerCallBackSubsController from '../Var/VarsServerCallBackSubsController';
import AnimationReportingExportHandler from './exports/AnimationReportingExportHandler';
import VarDayPrctAtteinteSeuilAnimationController from './vars/VarDayPrctAtteinteSeuilAnimationController';
import VarDayPrctAvancementAnimationController from './vars/VarDayPrctAvancementAnimationController';
import VarDayPrctReussiteAnimationController from './vars/VarDayPrctReussiteAnimationController';
import VarDayTempsPasseAnimationController from './vars/VarDayTempsPasseAnimationController';
// Utilisé dans les commentaires @link
import UQRsRangesDatasourceController from './datasources/UQRsRangesDatasourceController';

export default class ModuleAnimationServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleAnimationServer.instance) {
            ModuleAnimationServer.instance = new ModuleAnimationServer();
        }
        return ModuleAnimationServer.instance;
    }

    private static instance: ModuleAnimationServer = null;

    private constructor() {
        super(ModuleAnimation.getInstance().name);
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAnimation.APINAME_getQRsByThemesAndModules, this.getQRsByThemesAndModules.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAnimation.APINAME_getUQRsByThemesAndModules, this.getUQRsByThemesAndModules.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAnimation.APINAME_startModule, this.startModule.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAnimation.APINAME_endModule, this.endModule.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAnimation.APINAME_getAumsFiltered, this.getAumsFiltered.bind(this));
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleAnimation.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            fr: 'Animation'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleAnimation.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            fr: 'Administration Animation'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency_bo: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency_bo.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency_bo.src_pol_id = bo_access.id;
        admin_access_dependency_bo.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency_bo = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency_bo);

        let fo_access: AccessPolicyVO = new AccessPolicyVO();
        fo_access.group_id = group.id;
        fo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        fo_access.translatable_name = ModuleAnimation.POLICY_FO_ACCESS;
        fo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(fo_access, new DefaultTranslation({
            fr: 'Front Animation'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency_fo: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency_fo.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency_fo.src_pol_id = fo_access.id;
        admin_access_dependency_fo.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_FO_ACCESS).id;
        admin_access_dependency_fo = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency_fo);

        let fo_inline_edit_access: AccessPolicyVO = new AccessPolicyVO();
        fo_inline_edit_access.group_id = group.id;
        fo_inline_edit_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        fo_inline_edit_access.translatable_name = ModuleAnimation.POLICY_FO_INLINE_EDIT_ACCESS;
        fo_inline_edit_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(fo_inline_edit_access, new DefaultTranslation({
            fr: 'Front Animation - Inline Edit'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency_fo_inline_edit: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency_fo_inline_edit.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency_fo_inline_edit.src_pol_id = fo_inline_edit_access.id;
        admin_access_dependency_fo_inline_edit.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_FO_ACCESS).id;
        admin_access_dependency_fo_inline_edit = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency_fo_inline_edit);

        let fo_reporting_access: AccessPolicyVO = new AccessPolicyVO();
        fo_reporting_access.group_id = group.id;
        fo_reporting_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        fo_reporting_access.translatable_name = ModuleAnimation.POLICY_FO_REPORTING_ACCESS;
        fo_reporting_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(fo_reporting_access, new DefaultTranslation({
            fr: 'Front Animation Reporting'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency_fo_reporting: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency_fo_reporting.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency_fo_reporting.src_pol_id = fo_reporting_access.id;
        admin_access_dependency_fo_reporting.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_FO_ACCESS).id;
        admin_access_dependency_fo_reporting = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency_fo_reporting);
    }

    public registerAccessHooks(): void {
        ModuleDAOServer.getInstance().registerAccessHook(AnimationModuleVO.API_TYPE_ID, ModuleDAO.DAO_ACCESS_TYPE_READ, this.filterAnimationModule.bind(this));
    }

    public async configure() {
        await this.configure_vars();
        DataExportServerController.getInstance().register_export_handler(ModuleAnimation.EXPORT_API_TYPE_ID, AnimationReportingExportHandler.getInstance());

        let preUpdateTrigger: DAOPreUpdateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        preUpdateTrigger.registerHandler(AnimationModuleVO.API_TYPE_ID, this.handleTriggerPreAnimationModuleVO.bind(this));

        let preCreateTrigger: DAOPreCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(AnimationModuleVO.API_TYPE_ID, this.handleTriggerPreAnimationModuleVO.bind(this));
        await this.initializeTranslations();
    }

    private async handleTriggerPreAnimationModuleVO(vo: AnimationModuleVO): Promise<boolean> {
        if (!vo) {
            return false;
        }

        vo.computed_name = vo.name;

        if (vo.role_id_ranges && vo.role_id_ranges.length) {
            let role_by_ids: { [id: number]: RoleVO } = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos<RoleVO>(RoleVO.API_TYPE_ID));
            let role_names: string[] = [];

            RangeHandler.getInstance().foreach_ranges_sync(vo.role_id_ranges, (role_id: number) => {
                if (!role_by_ids[role_id]) {
                    return;
                }

                role_names.push(role_by_ids[role_id].translatable_name);
            });

            let langs: LangVO[] = await ModuleDAO.getInstance().getVosByRefFieldsIdsAndFieldsString<LangVO>(
                LangVO.API_TYPE_ID,
                null,
                null,
                'code_lang',
                [ConfigurationService.getInstance().getNodeConfiguration().DEFAULT_LOCALE]
            );
            let lang: LangVO = langs ? langs[0] : null;

            if (lang) {
                for (let i in role_names) {
                    vo.computed_name += ' - ' + await ModuleTranslation.getInstance().label(role_names[i], lang.id);
                }
            }
        }

        return true;
    }

    private async getQRsByThemesAndModules(theme_ids: number[], module_ids: number[]): Promise<{ [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationQRVO } } }> {
        let res: { [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationQRVO } } } = {};

        let all_module_ids: number[] = await this.getAllModuleIds(theme_ids, module_ids);
        let qrs: AnimationQRVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<AnimationQRVO>(AnimationQRVO.API_TYPE_ID, 'module_id', all_module_ids);

        let module_by_ids: { [id: number]: AnimationModuleVO } = VOsTypesManager.getInstance().vosArray_to_vosByIds(
            await ModuleDAO.getInstance().getVosByIds<AnimationModuleVO>(AnimationModuleVO.API_TYPE_ID, all_module_ids)
        );

        for (let i in qrs) {
            let qr: AnimationQRVO = qrs[i];
            let module: AnimationModuleVO = module_by_ids[qr.module_id];

            if (!module) {
                continue;
            }

            if (!res[module.theme_id]) {
                res[module.theme_id] = {};
            }

            if (!res[module.theme_id][module.id]) {
                res[module.theme_id][module.id] = {};
            }
            res[module.theme_id][module.id][qr.id] = qr;
        }

        return res;
    }

    /**
     * Permet de charger les UQRs (réponses des utilisateurs).
     * Utilisé dans {@link UQRsRangesDatasourceController} pour le calcul de variables.
     * @param user_ids pour filtrer sur ces utilisateurs
     * @param theme_ids les thèmes à prendre en compte
     * @param module_ids les modules à prendre en compte
     * @returns AnimationUserQRVO[] by qr_id by module_id by theme_id
     */
    private async getUQRsByThemesAndModules(user_ids: number[], theme_ids: number[], module_ids: number[]): Promise<{ [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationUserQRVO[] } } }> {
        let res: { [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationUserQRVO[] } } } = {};

        let all_module_ids: number[] = await this.getAllModuleIds(theme_ids, module_ids);
        let qrs: AnimationQRVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<AnimationQRVO>(AnimationQRVO.API_TYPE_ID, 'module_id', all_module_ids);
        let qr_by_ids: { [id: number]: AnimationQRVO } = {};
        let qr_ids: number[] = [];

        for (let i in qrs) {
            qr_by_ids[qrs[i].id] = qrs[i];
            qr_ids.push(qrs[i].id);
        }

        let uqrs: AnimationUserQRVO[] = await ModuleDAO.getInstance().getVosByRefFieldsIds<AnimationUserQRVO>(
            AnimationUserQRVO.API_TYPE_ID,
            'qr_id',
            qr_ids,
            'user_id',
            user_ids
        );

        let module_by_ids: { [id: number]: AnimationModuleVO } = VOsTypesManager.getInstance().vosArray_to_vosByIds(
            await ModuleDAO.getInstance().getVosByIds<AnimationModuleVO>(AnimationModuleVO.API_TYPE_ID, all_module_ids)
        );

        for (let i in uqrs) {
            let uqr: AnimationUserQRVO = uqrs[i];
            let qr: AnimationQRVO = qr_by_ids[uqr.qr_id];

            if (!qr) {
                continue;
            }

            let module: AnimationModuleVO = module_by_ids[qr.module_id];

            if (!module) {
                continue;
            }

            if (!res[module.theme_id]) {
                res[module.theme_id] = {};
            }

            if (!res[module.theme_id][module.id]) {
                res[module.theme_id][module.id] = {};
            }

            if (!res[module.theme_id][module.id][qr.id]) {
                res[module.theme_id][module.id][qr.id] = [];
            }

            res[module.theme_id][module.id][qr.id].push(uqr);
        }

        return res;
    }

    /**
     * @param theme_ids les thèmes à passer en revue si module_ids est vide ou null
     * @param module_ids
     * @returns module_ids s'il est pas vide sinon les module_ids des thèmes
     */
    private async getAllModuleIds(theme_ids: number[], module_ids: number[]): Promise<number[]> {
        let res: number[] = [];

        if (module_ids && module_ids.length > 0) {
            res = module_ids;
        } else if (theme_ids && theme_ids.length > 0) {
            let modules: AnimationModuleVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<AnimationModuleVO>(AnimationModuleVO.API_TYPE_ID, 'theme_id', theme_ids);

            if (modules && modules.length > 0) {
                res = res.concat(modules.map((m) => m.id));
            }
        }

        return res;
    }

    private async startModule(user_id: number, module_id: number, support: number): Promise<AnimationUserModuleVO> {
        let res: AnimationUserModuleVO = await ModuleAnimation.getInstance().getUserModule(user_id, module_id);

        if (res) {
            return res;
        }

        let aum: AnimationUserModuleVO = new AnimationUserModuleVO();
        aum.start_date = moment().utc(true);
        aum.user_id = user_id;
        aum.module_id = module_id;
        aum.support = support;
        await ModuleDAO.getInstance().insertOrUpdateVO(aum);

        return ModuleAnimation.getInstance().getUserModule(user_id, module_id);
    }

    /**
     * Créé un {@link AnimationUserModuleVO} pour l'utilisateur et le module spécifié.
     * Calcule le pourcentage de réusite sur le module réalisé ({@link VarDayPrctReussiteAnimationController})
     * @param user_id
     * @param module_id
     * @returns Le {@link AnimationUserModuleVO} créé
     */
    private async endModule(user_id: number, module_id: number): Promise<AnimationUserModuleVO> {
        let res: AnimationUserModuleVO = await ModuleAnimation.getInstance().getUserModule(user_id, module_id);

        if (!res) {
            return null;
        }

        if (!res.end_date) {

            let themes: AnimationThemeVO[] = await ModuleDAO.getInstance().getVos<AnimationThemeVO>(AnimationThemeVO.API_TYPE_ID);

            let theme_id_ranges: NumRange[] = [];

            for (let i in themes) {
                theme_id_ranges.push(RangeHandler.getInstance().create_single_elt_NumRange(themes[i].id, NumSegment.TYPE_INT));
            }

            res.end_date = moment().utc(true);
            let data = await VarsServerCallBackSubsController.getInstance().get_var_data(ThemeModuleDataRangesVO.createNew(
                VarDayPrctReussiteAnimationController.getInstance().varConf.name,
                true,
                theme_id_ranges,
                [RangeHandler.getInstance().create_single_elt_NumRange(res.module_id, NumSegment.TYPE_INT)],
                [RangeHandler.getInstance().create_single_elt_NumRange(res.user_id, NumSegment.TYPE_INT)]
            ));
            res.prct_reussite = (data && data.value) ? data.value : 0;
        }

        await ModuleDAO.getInstance().insertOrUpdateVO(res);

        return ModuleAnimation.getInstance().getUserModule(user_id, module_id);
    }

    private async getAumsFiltered(
        filter_anim_theme_active_options: DataFilterOption[],
        filter_anim_module_active_options: DataFilterOption[],
        filter_role_active_options: DataFilterOption[],
        filter_user_active_options: DataFilterOption[],
        filter_module_termine_active_option: DataFilterOption,
        filter_module_valide_active_option: DataFilterOption,
    ): Promise<AnimationUserModuleVO[]> {
        let res: AnimationUserModuleVO[] = [];

        let theme_ids: number[] = filter_anim_theme_active_options ? filter_anim_theme_active_options.map((s) => s.id) : [];
        let module_ids: number[] = filter_anim_module_active_options ? filter_anim_module_active_options.map((s) => s.id) : [];
        let user_ids: number[] = filter_user_active_options ? filter_user_active_options.map((s) => s.id) : [];
        let role_ids: number[] = filter_role_active_options ? filter_role_active_options.map((s) => s.id) : [];
        let only_module_valide: boolean = null;
        let only_module_termine: boolean = null;

        let aums: AnimationUserModuleVO[] = null;

        if (module_ids.length > 0 && user_ids.length > 0) {
            aums = await ModuleDAO.getInstance().getVosByRefFieldsIds<AnimationUserModuleVO>(
                AnimationUserModuleVO.API_TYPE_ID,
                'module_id',
                module_ids,
                'user_id',
                user_ids,
            );
        } else if (module_ids.length > 0) {
            aums = await ModuleDAO.getInstance().getVosByRefFieldsIds<AnimationUserModuleVO>(
                AnimationUserModuleVO.API_TYPE_ID,
                'module_id',
                module_ids,
            );
        } else if (user_ids.length > 0) {
            aums = await ModuleDAO.getInstance().getVosByRefFieldsIds<AnimationUserModuleVO>(
                AnimationUserModuleVO.API_TYPE_ID,
                'user_id',
                user_ids,
            );
        } else {
            aums = await ModuleDAO.getInstance().getVos<AnimationUserModuleVO>(AnimationUserModuleVO.API_TYPE_ID);
        }

        if (!aums) {
            return res;
        }

        let anim_theme_by_ids: { [id: number]: AnimationThemeVO } = VOsTypesManager.getInstance().vosArray_to_vosByIds(
            await ModuleDAO.getInstance().getVos<AnimationThemeVO>(AnimationThemeVO.API_TYPE_ID)
        );
        let anim_module_by_ids: { [id: number]: AnimationModuleVO } = VOsTypesManager.getInstance().vosArray_to_vosByIds(
            await ModuleDAO.getInstance().getVos<AnimationModuleVO>(AnimationModuleVO.API_TYPE_ID)
        );
        let anim_param: AnimationParametersVO = await ModuleAnimation.getInstance().getParameters();

        if (!anim_param || !anim_theme_by_ids || !anim_module_by_ids) {
            return res;
        }

        if (filter_module_valide_active_option) {
            only_module_valide = filter_module_valide_active_option.id == AnimationController.OPTION_YES;
        }

        if (filter_module_termine_active_option) {
            only_module_termine = filter_module_termine_active_option.id == AnimationController.OPTION_YES;
        }

        for (let i in aums) {
            let aum: AnimationUserModuleVO = aums[i];

            // Test User IDS
            if (user_ids.length > 0) {
                if (user_ids.indexOf(aum.user_id) == -1) {
                    continue;
                }
            }

            // Test module terminé
            if (only_module_termine != null) {
                if (only_module_termine) {
                    if (!aum.end_date) {
                        continue;
                    }
                } else if (aum.end_date) {
                    continue;
                }
            }

            // Test module validé
            if (only_module_valide != null) {
                let is_module_valid: boolean = aum.prct_reussite >= anim_param.seuil_validation_module_prct;
                if (only_module_valide) {
                    if (!is_module_valid) {
                        continue;
                    }
                } else if (is_module_valid) {
                    continue;
                }
            }

            let module: AnimationModuleVO = anim_module_by_ids[aum.module_id];

            if (!module) {
                continue;
            }

            // Test module IDS
            if (module_ids.length > 0) {
                if (module_ids.indexOf(module.id) == -1) {
                    continue;
                }
            }

            let has_role: boolean = false;

            // Test Roles IDS sur les USERS
            if (role_ids.length > 0) {
                let roles: RoleVO[] = AccessPolicyServerController.getInstance().get_registered_user_roles_by_uid(aum.user_id);

                if (roles && roles.length > 0) {
                    for (let j in roles) {
                        if (role_ids.includes(roles[j].id)) {
                            has_role = true;
                            break;
                        }
                    }
                }
            } else {
                has_role = true;
            }

            if (!has_role) {
                continue;
            }

            let theme: AnimationThemeVO = anim_theme_by_ids[module.theme_id];

            if (!theme) {
                continue;
            }

            // Test Theme IDS
            if (theme_ids.length > 0) {
                if (theme_ids.indexOf(theme.id) == -1) {
                    continue;
                }
            }

            res.push(aum);
        }

        return res;
    }

    private async filterAnimationModule(datatable: ModuleTable<AnimationModuleVO>, vos: AnimationModuleVO[], uid: number): Promise<AnimationModuleVO[]> {
        if (this.isAdmin()) {
            return vos;
        }

        let user_roles: RoleVO[] = AccessPolicyServerController.getInstance().get_user_roles_by_uid(uid);
        let user_role_id_ranges: NumRange[] = [];

        for (let i in user_roles) {
            user_role_id_ranges.push(RangeHandler.getInstance().create_single_elt_NumRange(user_roles[i].id, NumSegment.TYPE_INT));

            let parent_role_id: number = user_roles[i].parent_role_id;

            while (parent_role_id) {
                user_role_id_ranges.push(RangeHandler.getInstance().create_single_elt_NumRange(parent_role_id, NumSegment.TYPE_INT));

                let parent_role: RoleVO = AccessPolicyServerController.getInstance().get_registered_role_by_id(parent_role_id);

                parent_role_id = (parent_role && parent_role.parent_role_id) ? parent_role.parent_role_id : null;
            }
        }

        let res: AnimationModuleVO[] = [];

        for (let i in vos) {
            let vo: AnimationModuleVO = vos[i];

            if (!vo.role_id_ranges || !vo.role_id_ranges.length) {
                res.push(vo);
                continue;
            }

            if (RangeHandler.getInstance().any_range_intersects_any_range(user_role_id_ranges, vo.role_id_ranges)) {
                res.push(vo);
                continue;
            }
        }

        return res;
    }

    private isAdmin(): boolean {
        if (!StackContext.getInstance().get('IS_CLIENT')) {
            return false;
        }

        let uid: number = StackContext.getInstance().get('UID');

        if (!uid) {
            return false;
        }

        let user_roles: RoleVO[] = AccessPolicyServerController.getInstance().get_user_roles_by_uid(uid);

        for (let i in user_roles) {
            if (user_roles[i].translatable_name == ModuleAccessPolicy.ROLE_ADMIN) {
                return true;
            }
        }
        return false;
    }

    private async initializeTranslations() {
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Mes formations' }, 'animation.titre.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Animation' }, 'client.menu-gauche.anim.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Mes formations' }, 'client.menu-gauche.anim.formation.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Reporting Formations' }, 'client.menu-gauche.anim.reporting.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Animation' }, 'menu.menuelements.AnimationAdminVueModule.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Modules' }, 'menu.menuelements.AnimationModuleVO.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Questions/Réponses' }, 'menu.menuelements.AnimationQRVO.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Thèmes' }, 'menu.menuelements.AnimationThemeVO.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'User Modules' }, 'menu.menuelements.AnimationUserModuleVO.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'User Questions/Réponses' }, 'menu.menuelements.AnimationUserQRVO.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Question ' }, 'animation.question.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'VALIDER' }, 'animation.validation.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Retour' }, 'animation.back.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Réponse' }, 'fields.labels.ref.module_animation_anim_reponse.name.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Valide' }, 'fields.labels.ref.module_animation_anim_reponse.valid.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'N°' }, 'fields.labels.ref.module_animation_anim_reponse.weight.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Réponses justes' }, 'animation.reponse.valid.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Mes réponses' }, 'animation.reponse.votre_reponse.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Vous avez totalisé un score de :' }, 'animation.prct_reussite.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Vous avez jugé ce module :' }, 'animation.feedback.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'VALIDER' }, 'animation.feedback.valider.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Accéder à mes formations' }, 'animation.retour_formations.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Pas très utile' }, 'animation_um.like_vote.bad'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Utile' }, 'animation_um.like_vote.good'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Très utile' }, 'animation_um.like_vote.very_good'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Mobile' }, 'animation_um.support.mobile'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Tablette' }, 'animation_um.support.tablette'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'PC' }, 'animation_um.support.pc'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: ' (en cours)' }, 'animation.module.en_cours.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Voulez-vous recommencer le module' }, 'animation.modal.restart_module.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Merci de confirmer si vous souhaitez redémarrer le module ou consulter le module' }, 'animation.modal.restart_module.body.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Consulter' }, 'animation.modal.restart_module.consulter.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Redémarrer' }, 'animation.modal.restart_module.restart.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'BRAVO!' }, 'animation.qr.is_validated.ok.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'OUPS' }, 'animation.qr.is_validated.nok.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Max' }, 'fields.labels.ref.module_animation_anim_message_module.max.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Message' }, 'fields.labels.ref.module_animation_anim_message_module.message.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Min' }, 'fields.labels.ref.module_animation_anim_message_module.min.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Questions' }, 'fields.labels.ref.module_animation_anim_qr.___LABEL____module_id'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Parametres' }, 'menu.menuelements.AnimationParametersVO.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Télécharger le document' }, 'animation.documents.download.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Documentations' }, 'animation.documents.titre.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Consultez la documentation' }, 'animation.module.document.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Modules' }, 'fields.labels.ref.module_animation_anim_module.___LABEL____theme_id'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Numéro' }, 'crud.container_mms.numero.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Numéro' }, 'crud.container_reponses.numero.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Commentaire' }, 'animation.reporting.commentaire.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Fin' }, 'animation.reporting.end.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Module' }, 'animation.reporting.filtre.anim_module.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Thème' }, 'animation.reporting.filtre.anim_theme.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Rôle' }, 'animation.reporting.filtre.role.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Utilisateur' }, 'animation.reporting.filtre.user.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Feedback' }, 'animation.reporting.like_vote.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Support utilisé' }, 'animation.reporting.support.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Module' }, 'animation.reporting.module.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Réussite' }, 'animation.reporting.prct_reussite.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Début' }, 'animation.reporting.start.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Thème' }, 'animation.reporting.theme.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Utilisateur' }, 'animation.reporting.user.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Roles' }, 'animation.reporting.roles.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Temps passé' }, 'animation.reporting.temps_passe.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Filtres' }, 'animation.reporting.filtre.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Afficher les modules terminés' }, 'animation.reporting.filtre.module_termine.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Afficher les modules validés' }, 'animation.reporting.filtre.module_valide.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Activer mode édition' }, 'animation.inline_input_mode.off.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Désactiver mode édition' }, 'animation.inline_input_mode.on.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Total' }, 'animation.reporting.total.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Import/Export Theme', en: 'Import/Export Theme', es: 'Importar/Exportar Tema' }, 'menu.menuelements.importThemeAnimation.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Import/Export Module', en: 'Import/Export Module', es: 'Importar/Exportar Módulo' }, 'menu.menuelements.importModuleAnimation.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Import/Export QR', en: 'Import/Export Q&A', es: 'Importar/Exportar Q&A' }, 'menu.menuelements.importQRAnimation.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Import/Export Theme', en: 'Import/Export Theme', es: 'Importar/Exportar Tema' }, 'anim_import_theme_import.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Import/Export Module', en: 'Import/Export Module', es: 'Importar/Exportar Módulo' }, 'anim_import_module_import.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Import/Export QR', en: 'Import/Export Q&A', es: 'Importar/Exportar Q&A' }, 'anim_import_qr_import.___LABEL___'));

    }

    private async configure_vars() {
        await VarDayPrctAvancementAnimationController.getInstance().initialize();
        await VarDayPrctReussiteAnimationController.getInstance().initialize();
        await VarDayPrctAtteinteSeuilAnimationController.getInstance().initialize();
        await VarDayTempsPasseAnimationController.getInstance().initialize();
    }
}