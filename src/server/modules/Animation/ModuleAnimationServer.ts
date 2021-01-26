import * as moment from 'moment';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import ModuleAnimation from '../../../shared/modules/Animation/ModuleAnimation';
import AnimationModuleParamVO from '../../../shared/modules/Animation/params/AnimationModuleParamVO';
import AnimationParamVO from '../../../shared/modules/Animation/params/AnimationParamVO';
import AnimationModuleVO from '../../../shared/modules/Animation/vos/AnimationModuleVO';
import AnimationQRVO from '../../../shared/modules/Animation/vos/AnimationQRVO';
import AnimationUserModuleVO from '../../../shared/modules/Animation/vos/AnimationUserModuleVO';
import AnimationUserQRVO from '../../../shared/modules/Animation/vos/AnimationUserQRVO';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
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
import DAOTriggerHook from '../DAO/triggers/DAOTriggerHook';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';

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
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAnimation.APINAME_getQRsByThemesAndModules, this.getQRsByThemesAndModules.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAnimation.APINAME_getUQRsByThemesAndModules, this.getUQRsByThemesAndModules.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAnimation.APINAME_startModule, this.startModule.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAnimation.APINAME_endModule, this.endModule.bind(this));
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
        admin_access_dependency_fo.src_pol_id = bo_access.id;
        admin_access_dependency_fo.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_FO_ACCESS).id;
        admin_access_dependency_fo = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency_fo);
    }

    public registerAccessHooks(): void {
        ModuleDAOServer.getInstance().registerAccessHook(AnimationModuleVO.API_TYPE_ID, ModuleDAO.DAO_ACCESS_TYPE_READ, this.filterAnimationModule.bind(this));
    }

    public async configure() {
        let preUpdateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        preUpdateTrigger.registerHandler(AnimationModuleVO.API_TYPE_ID, this.handleTriggerPreAnimationModuleVO.bind(this));

        let preCreateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_CREATE_TRIGGER);
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

    private async getQRsByThemesAndModules(param: AnimationParamVO): Promise<{ [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationQRVO } } }> {
        let res: { [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationQRVO } } } = {};

        let module_ids: number[] = await this.getAllModuleIds(param);
        let qrs: AnimationQRVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<AnimationQRVO>(AnimationQRVO.API_TYPE_ID, 'module_id', module_ids);

        let module_by_ids: { [id: number]: AnimationModuleVO } = VOsTypesManager.getInstance().vosArray_to_vosByIds(
            await ModuleDAO.getInstance().getVosByIds<AnimationModuleVO>(AnimationModuleVO.API_TYPE_ID, module_ids)
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

    private async getUQRsByThemesAndModules(param: AnimationParamVO): Promise<{ [theme_id: number]: { [module_id: number]: { [uqr_id: number]: AnimationUserQRVO } } }> {
        let res: { [theme_id: number]: { [module_id: number]: { [uqr_id: number]: AnimationUserQRVO } } } = {};

        let module_ids: number[] = await this.getAllModuleIds(param);
        let qrs: AnimationQRVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<AnimationQRVO>(AnimationQRVO.API_TYPE_ID, 'module_id', module_ids);
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
            [param.user_id]
        );

        let module_by_ids: { [id: number]: AnimationModuleVO } = VOsTypesManager.getInstance().vosArray_to_vosByIds(
            await ModuleDAO.getInstance().getVosByIds<AnimationModuleVO>(AnimationModuleVO.API_TYPE_ID, module_ids)
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
            res[module.theme_id][module.id][uqr.id] = uqr;
        }

        return res;
    }

    private async getAllModuleIds(param: AnimationParamVO): Promise<number[]> {
        let module_ids: number[] = [];

        if (param.module_ids) {
            module_ids = param.module_ids;
        }

        if (param.theme_ids) {
            let modules: AnimationModuleVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<AnimationModuleVO>(AnimationModuleVO.API_TYPE_ID, 'theme_id', param.theme_ids);

            if (modules && modules.length > 0) {
                module_ids = module_ids.concat(modules.map((m) => m.id));
            }
        }

        return module_ids;
    }

    private async startModule(param: AnimationModuleParamVO): Promise<AnimationUserModuleVO> {
        let res: AnimationUserModuleVO = await ModuleAnimation.getInstance().getUserModule(param.user_id, param.module_id);

        if (res) {
            return res;
        }

        let aum: AnimationUserModuleVO = new AnimationUserModuleVO();
        aum.start_date = moment().utc(true);
        aum.user_id = param.user_id;
        aum.module_id = param.module_id;
        await ModuleDAO.getInstance().insertOrUpdateVO(aum);

        return ModuleAnimation.getInstance().getUserModule(param.user_id, param.module_id);
    }

    private async endModule(param: AnimationModuleParamVO): Promise<AnimationUserModuleVO> {
        let res: AnimationUserModuleVO = await ModuleAnimation.getInstance().getUserModule(param.user_id, param.module_id);

        if (!res) {
            return null;
        }

        if (!res.end_date) {
            res.end_date = moment().utc(true);
        }

        await ModuleDAO.getInstance().insertOrUpdateVO(res);

        return ModuleAnimation.getInstance().getUserModule(param.user_id, param.module_id);
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
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Mes formations' }, 'client.menu-gauche.animation'));
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
    }
}