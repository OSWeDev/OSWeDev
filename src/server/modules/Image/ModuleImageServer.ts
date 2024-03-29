import ImageVO from '../../../shared/modules/Image/vos/ImageVO';
import ModuleImage from '../../../shared/modules/Image/ModuleImage';
import ModuleFileServerBase from '../File/ModuleFileServerBase';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModulesManagerServer from '../ModulesManagerServer';

export default class ModuleImageServer extends ModuleFileServerBase<ImageVO> {

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleImageServer {
        if (!ModuleImageServer.instance) {
            ModuleImageServer.instance = new ModuleImageServer();
        }
        return ModuleImageServer.instance;
    }

    private static instance: ModuleImageServer = null;

    protected constructor() {
        super('/ModuleImageServer/upload', ModuleImage.getInstance().name);
    }

    /**
     * On définit les droits d'accès du module
     */
    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleImage.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'Images'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleImage.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration des images'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    protected get_vo_type(): string {
        return ImageVO.API_TYPE_ID;
    }

    protected getNewVo(): ImageVO {
        return new ImageVO();
    }
}