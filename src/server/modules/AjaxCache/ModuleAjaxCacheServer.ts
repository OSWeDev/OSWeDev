import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import ModuleAjaxCache from '../../../shared/modules/AjaxCache/ModuleAjaxCache';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';

export default class ModuleAjaxCacheServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleAjaxCacheServer.instance) {
            ModuleAjaxCacheServer.instance = new ModuleAjaxCacheServer();
        }
        return ModuleAjaxCacheServer.instance;
    }

    private static instance: ModuleAjaxCacheServer = null;

    private constructor() {
        super(ModuleAjaxCache.getInstance().name);
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleAjaxCache.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            fr: 'Cache de requêtes'
        }));

        let fo_access: AccessPolicyVO = new AccessPolicyVO();
        fo_access.group_id = group.id;
        fo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ANONYMOUS;
        fo_access.translatable_name = ModuleAjaxCache.POLICY_FO_ACCESS;
        fo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(fo_access, new DefaultTranslation({
            fr: 'Configuration sur le front'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }
}