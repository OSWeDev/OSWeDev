import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleFile from '../../../shared/modules/File/ModuleFile';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import DAOTriggerHook from '../DAO/triggers/DAOTriggerHook';
import ModulesManagerServer from '../ModulesManagerServer';
import PushDataServerController from '../PushData/PushDataServerController';
import ModuleFileServerBase from './ModuleFileServerBase';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';

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

    public async configure() {
        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Impossible de déclarer un fichier sécurisé sans associer un droit d\'accès' },
            'ModuleFileServer.check_secured_files_conf.file_access_policy_name_missing'
        ));

        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Le chemin d\'accès actuel du fichier semble invalide, il devrait commencer par [' + ModuleFile.FILES_ROOT + '] ou [' + ModuleFile.SECURED_FILES_ROOT + ']. Les fichiers temporaires ne peuvent pas être sécurisés.' },
            'ModuleFileServer.check_secured_files_conf.f_path_start_unknown'
        ));

        let preCreateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_CREATE_TRIGGER);
        let preUpdateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        preCreateTrigger.registerHandler(FileVO.API_TYPE_ID, this.check_secured_files_conf.bind(this));
        preUpdateTrigger.registerHandler(FileVO.API_TYPE_ID, this.check_secured_files_conf.bind(this));
    }

    protected getNewVo(): FileVO {
        return new FileVO();
    }

    private async check_secured_files_conf(f: FileVO): Promise<boolean> {
        let uid = ModuleAccessPolicyServer.getInstance().getLoggedUserId();

        if (f.is_secured && !f.file_access_policy_name) {

            if (!!uid) {
                await PushDataServerController.getInstance().notifySimpleERROR(uid, 'ModuleFileServer.check_secured_files_conf.file_access_policy_name_missing');
            }
            return false;
        }

        if (f.is_secured && (!f.path.startsWith(ModuleFile.SECURED_FILES_ROOT))) {
            /**
             * Fichier qu'on vient de sécuriser, et qui n'est pas dans le bon répertoire, il faut le déplacer
             */

            if (!f.path.startsWith(ModuleFile.FILES_ROOT)) {
                if (!!uid) {
                    await PushDataServerController.getInstance().notifySimpleERROR(uid, 'ModuleFileServer.check_secured_files_conf.f_path_start_unknown');
                }
                return false;
            }

            let new_path = ModuleFile.SECURED_FILES_ROOT + f.path.substring(ModuleFile.FILES_ROOT.length);
            let new_folder = new_path.substring(0, new_path.lastIndexOf('/') + 1);

            await this.makeSureThisFolderExists(new_folder);
            await this.moveFile(f.path, new_folder);
            f.path = new_path;
            return true;
        }

        if ((!f.is_secured) && (!f.path.startsWith(ModuleFile.FILES_ROOT))) {
            /**
             * Fichier qu'on vient de sécuriser, et qui n'est pas dans le bon répertoire, il faut le déplacer
             */

            if (!f.path.startsWith(ModuleFile.SECURED_FILES_ROOT)) {
                if (!!uid) {
                    await PushDataServerController.getInstance().notifySimpleERROR(uid, 'ModuleFileServer.check_secured_files_conf.f_path_start_unknown');
                }
                return false;
            }

            let new_path = ModuleFile.FILES_ROOT + f.path.substring(ModuleFile.SECURED_FILES_ROOT.length);
            let new_folder = new_path.substring(0, new_path.lastIndexOf('/') + 1);

            await this.makeSureThisFolderExists(new_folder);
            await this.moveFile(f.path, new_folder);
            f.path = new_path;
            return true;
        }

        return true;
    }
}