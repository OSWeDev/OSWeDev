import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import ModuleSendInBlue from '../../../shared/modules/SendInBlue/ModuleSendInBlue';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';

export default class ModuleSendInBlueServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleSendInBlueServer.instance) {
            ModuleSendInBlueServer.instance = new ModuleSendInBlueServer();
        }
        return ModuleSendInBlueServer.instance;
    }

    private static instance: ModuleSendInBlueServer = null;

    private constructor() {
        super(ModuleSendInBlue.getInstance().name);
    }

    public async configure() {
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'SendInBlue'
        }, 'menu.menuelements.SendInBlueAdminVueModule.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Paramètres'
        }, 'menu.menuelements.SendInBlueVO.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'API'
        }, 'sendinblue.account.api'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'PARTNER'
        }, 'sendinblue.account.partner'));
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleSendInBlue.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            fr: 'SendInBlue'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleSendInBlue.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            fr: 'Administration de SendInBlue'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }
}