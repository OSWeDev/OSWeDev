import * as moment from 'moment';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleAnimation from '../../../shared/modules/Animation/ModuleAnimation';
import AnimationModuleParamVO from '../../../shared/modules/Animation/params/AnimationModuleParamVO';
import AnimationParamVO from '../../../shared/modules/Animation/params/AnimationParamVO';
import AnimationModuleVO from '../../../shared/modules/Animation/vos/AnimationModuleVO';
import AnimationQRVO from '../../../shared/modules/Animation/vos/AnimationQRVO';
import AnimationUserModuleVO from '../../../shared/modules/Animation/vos/AnimationUserModuleVO';
import AnimationUserQRVO from '../../../shared/modules/Animation/vos/AnimationUserQRVO';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
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

    public async configure() {
        await this.initializeTranslations();
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

    private async initializeTranslations() {
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Vos formations' }, 'animation.titre.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'E-Learning' }, 'client.menu-gauche.animation'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Photo' }, 'animation_qr.type_qr.photo'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Quizz' }, 'animation_qr.type_qr.quizz'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Vidéo' }, 'animation_qr.type_qr.video'));
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
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Réponse valide' }, 'animation.reponse.valid.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Votre réponse' }, 'animation.reponse.votre_reponse.___LABEL___'));
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
    }
}