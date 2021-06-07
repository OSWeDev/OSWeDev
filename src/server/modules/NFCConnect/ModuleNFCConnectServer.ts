import { readFileSync } from 'fs';
import { IAuthOptions } from 'sp-request';
import { FileOptions, ICoreOptions, spsave } from "spsave";
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModuleNFCConnect from '../../../shared/modules/NFCConnect/ModuleNFCConnect';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import FileHandler from '../../../shared/tools/FileHandler';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDataExportServer from '../DataExport/ModuleDataExportServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import NFCTagVO from '../../../shared/modules/NFCConnect/vos/NFCTagVO';
import NFCTagUserVO from '../../../shared/modules/NFCConnect/vos/NFCTagUserVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';

export default class ModuleNFCConnectServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleNFCConnectServer.instance) {
            ModuleNFCConnectServer.instance = new ModuleNFCConnectServer();
        }
        return ModuleNFCConnectServer.instance;
    }

    private static instance: ModuleNFCConnectServer = null;

    private ps = null;

    private constructor() {
        super(ModuleNFCConnect.getInstance().name);
    }

    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleNFCConnect.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            fr: 'NFCConnect'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleNFCConnect.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            fr: 'Administration NFCConnect'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModuleNFCConnect.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, new DefaultTranslation({
            fr: 'Accès front - NFCConnect'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    public async configure() {
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Erreur à la lecture du Tag NFC. Réessayer.'
        }, 'NFCHandler.readingerror.readingerror.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Le numéro de série du Tag NFC est illisible. Réessayer.'
        }, 'NFCHandler.readingerror.serialNumber.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Le tag NFC est inconnu, connectez-vous d\'abord à votre compte pour le lier.'
        }, 'NFCHandler.readinginfo.tag_not_registered.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Voulez-vous changer de compte connecté ?'
        }, 'NFCHandler.switchconfirmation.body.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Connexion par Tag NFC à un autre compte'
        }, 'NFCHandler.switchconfirmation.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Connexion en cours...'
        }, 'NFCHandler.switchconfirmation.start.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Voulez-vous lier ce Tag NFC à votre compte ?'
        }, 'NFCHandler.addconfirmation.body.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Lier le Tag à votre compte'
        }, 'NFCHandler.addconfirmation.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Ajout du Tag NFC en cours...'
        }, 'NFCHandler.addconfirmation.start.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Echec lors de l\'ajout du Tag. Réessayer.'
        }, 'NFCHandler.addconfirmation.failed_add_tag.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Echec lors de l\'ajout du Tag. Réessayer.'
        }, 'NFCHandler.addconfirmation.failed_add_tag_user.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Le Tag NFC est lié à votre compte. Vous pouvez l\'utiliser pour vous connecter.'
        }, 'NFCHandler.addconfirmation.ended.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'NFC activé, passer le Tag pour continuer'
        }, 'login.nfcconnect.on.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Lecture NFC impossible'
        }, 'login.nfcconnect.off.___LABEL___'));

    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleNFCConnect.APINAME_connect, this.connect.bind(this));
    }

    private async connect(serial_number: string) {

        let tag = await ModuleDAO.getInstance().getNamedVoByName<NFCTagVO>(NFCTagVO.API_TYPE_ID, serial_number);
        if (!tag) {
            ConsoleHandler.getInstance().error('TAG inconnu:' + serial_number);
            return;
        }

        let tags_user: NFCTagUserVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<NFCTagUserVO>(NFCTagUserVO.API_TYPE_ID, 'nfc_tag_id', [tag.id]);
        if ((!tags_user) || (tags_user.length != 1)) {
            ConsoleHandler.getInstance().error('TAG pas lié à un utilisateur ou pas un seul:' + serial_number);
            return;
        }

        let tag_user = tags_user[0];
        if (!tag_user.user_id) {
            ConsoleHandler.getInstance().error('TAG pas lié à un utilisateur ou pas un seul:' + serial_number);
            return;
        }

        await ModuleAccessPolicyServer.getInstance().login(tag_user.user_id);
    }
}