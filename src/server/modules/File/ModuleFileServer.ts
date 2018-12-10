import ModuleFile from '../../../shared/modules/File/ModuleFile';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import ModuleFileServerBase from './ModuleFileServerBase';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModulesManagerServer from '../ModulesManagerServer';

export default class ModuleFileServer extends ModuleFileServerBase<FileVO> {

    public static getInstance(): ModuleFileServer {
        if (!ModuleFileServer.instance) {
            ModuleFileServer.instance = new ModuleFileServer();
        }
        return ModuleFileServer.instance;
    }

    private static instance: ModuleFileServer = null;

    protected constructor() {
        super('/ModuleFileServer/upload', ModuleFile.getInstance().name);
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleFile.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            fr: 'Fichiers'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleFile.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            fr: 'Administration des fichiers'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    protected getNewVo(): FileVO {
        return new FileVO();
    }
}