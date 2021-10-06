import { Response } from 'express';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleNFCConnect from '../../../shared/modules/NFCConnect/ModuleNFCConnect';
import NFCTagUserVO from '../../../shared/modules/NFCConnect/vos/NFCTagUserVO';
import NFCTagVO from '../../../shared/modules/NFCConnect/vos/NFCTagVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import StackContext from '../../StackContext';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';

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
            'fr-fr': 'NFCConnect'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleNFCConnect.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration NFCConnect'
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
            'fr-fr': 'Accès front - NFCConnect'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    public async configure() {
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Erreur à la lecture du Tag NFC. Réessayer.'
        }, 'NFCHandler.readingerror.readingerror.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Le numéro de série du Tag NFC est illisible. Réessayer.'
        }, 'NFCHandler.readingerror.serialNumber.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Le tag NFC est inconnu, connectez-vous d\'abord à votre compte pour le lier.'
        }, 'NFCHandler.readinginfo.tag_not_registered.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Voulez-vous changer de compte connecté ?'
        }, 'NFCHandler.switchconfirmation.body.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Connexion par Tag NFC à un autre compte'
        }, 'NFCHandler.switchconfirmation.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Connexion en cours...'
        }, 'NFCHandler.switchconfirmation.start.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Tag déjà lié au compte'
        }, 'NFCHandler.tag_already_added.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Voulez-vous lier ce Tag NFC à votre compte ?'
        }, 'NFCHandler.addconfirmation.body.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Lier le Tag à votre compte'
        }, 'NFCHandler.addconfirmation.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Ajout du Tag NFC en cours...'
        }, 'NFCHandler.addconfirmation.start.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Echec lors de l\'ajout du Tag. Réessayer.'
        }, 'NFCHandler.addconfirmation.failed_add_tag.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Echec lors de l\'ajout du Tag. Réessayer.'
        }, 'NFCHandler.addconfirmation.failed_add_tag_user.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Le Tag NFC est lié à votre compte. Vous pouvez l\'utiliser pour vous connecter.'
        }, 'NFCHandler.addconfirmation.ended.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'NFC activé, passer le Tag pour continuer'
        }, 'login.nfcconnect.on.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Lecture NFC impossible'
        }, 'login.nfcconnect.off.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Activer NFC Connect'
        }, 'login.nfcconnect.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'NFC Connect activé'
        }, 'login.nfcconnected.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Actualiser'
        }, 'nfcconnect_user_tag_list.update_list.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'NFC'
        }, 'nfcconnect_user_tag_list.nfc_header.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Ecrire le lien de connexion sur le Tag NFC ?'
        }, 'NFCHandler.writeurlconfirmation.body.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Lien de connexion automatique'
        }, 'NFCHandler.writeurlconfirmation.title.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Passer le Tag NFC pour le mettre à jour...'
        }, 'NFCHandler.writeurlconfirmation.start.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Echec ecriture du Tag NFC.'
        }, 'NFCHandler.writeurlconfirmation.failed.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Tag mis à jour'
        }, 'NFCHandler.writeurlconfirmation.ended.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'NFC'
        }, 'menu.menuelements.admin.NFCConnectAdminVueModule.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'NFC Tags'
        }, 'menu.menuelements.admin.nfc_tag.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'NFC Tags User'
        }, 'menu.menuelements.admin.nfc_tag_user.___LABEL___'));
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleNFCConnect.APINAME_connect, this.connect.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleNFCConnect.APINAME_connect_and_redirect, this.connect_and_redirect.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleNFCConnect.APINAME_checktag_user, this.checktag_user.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleNFCConnect.APINAME_add_tag, this.add_tag.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleNFCConnect.APINAME_remove_user_tag, this.remove_user_tag.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleNFCConnect.APINAME_get_own_tags, this.get_own_tags.bind(this));
    }

    private async get_own_tags(): Promise<NFCTagVO[]> {
        let user_id = await ModuleAccessPolicyServer.getInstance().getLoggedUserId();

        if (!user_id) {
            ConsoleHandler.getInstance().error("Impossible de lister les tags. Pas de user_id:" + user_id);
            return null;
        }

        try {
            let user_tags: NFCTagUserVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<NFCTagUserVO>(NFCTagUserVO.API_TYPE_ID, 'user_id', [user_id]);
            if ((!user_tags) || (!user_tags.length)) {
                return null;
            }

            let tags_ids: number[] = user_tags.map((tag: NFCTagUserVO) => tag.nfc_tag_id);
            return await ModuleDAO.getInstance().getVosByIds<NFCTagVO>(NFCTagVO.API_TYPE_ID, tags_ids);
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        return null;
    }

    private async connect_and_redirect(serial_number: string, res: Response): Promise<boolean> {
        if (!await this.connect(serial_number)) {
            return false;
        }

        if (res) {
            res.redirect("/");
        }
    }

    private async connect(serial_number: string): Promise<boolean> {

        return await StackContext.getInstance().runPromise({ IS_CLIENT: false }, async () => {

            let tag = await ModuleDAO.getInstance().getNamedVoByName<NFCTagVO>(NFCTagVO.API_TYPE_ID, serial_number);
            if (!tag) {
                ConsoleHandler.getInstance().error('TAG inconnu:' + serial_number);
                return false;
            }

            let tags_user: NFCTagUserVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<NFCTagUserVO>(NFCTagUserVO.API_TYPE_ID, 'nfc_tag_id', [tag.id]);
            if ((!tags_user) || (tags_user.length != 1)) {
                ConsoleHandler.getInstance().error('TAG pas lié à un utilisateur ou pas un seul:' + serial_number);
                return false;
            }

            let tag_user = tags_user[0];
            if (!tag_user.user_id) {
                ConsoleHandler.getInstance().error('TAG pas lié à un utilisateur ou pas un seul:' + serial_number);
                return false;
            }

            return await ModuleAccessPolicyServer.getInstance().login(tag_user.user_id);
        });
    }

    /**
     *
     * @param serial_number
     * @param user_id
     * @returns true if tag is known and link to an other account
     */
    private async checktag_user(serial_number: string, user_id: number): Promise<boolean> {

        return await StackContext.getInstance().runPromise({ IS_CLIENT: false }, async () => {

            let tag = await ModuleDAO.getInstance().getNamedVoByName<NFCTagVO>(NFCTagVO.API_TYPE_ID, serial_number);
            if (!tag) {
                return false;
            }

            let tags_user: NFCTagUserVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<NFCTagUserVO>(NFCTagUserVO.API_TYPE_ID, 'nfc_tag_id', [tag.id]);
            if ((!tags_user) || (tags_user.length != 1)) {
                return false;
            }

            let tag_user = tags_user[0];
            if (!tag_user.user_id) {
                return false;
            }

            return tag_user.user_id != user_id;
        });
    }

    private async add_tag(serial_number: string): Promise<boolean> {

        let user_id = await ModuleAccessPolicyServer.getInstance().getLoggedUserId();

        if (!user_id) {
            ConsoleHandler.getInstance().error("Impossible de créer le nouveau tag. Pas de user_id:" + user_id);
            return false;
        }

        return await StackContext.getInstance().runPromise({ IS_CLIENT: false }, async () => {

            let insertOrDeleteQueryResult = null;
            let tag = await ModuleDAO.getInstance().getNamedVoByName<NFCTagVO>(NFCTagVO.API_TYPE_ID, serial_number);
            if (!tag) {

                tag = new NFCTagVO();
                tag.activated = true;
                tag.name = serial_number;
                insertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(tag);
                if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {

                    ConsoleHandler.getInstance().error("Impossible de créer le nouveau tag. Abandon.");
                    return false;
                }
                tag.id = insertOrDeleteQueryResult.id;
            }

            let tags_user: NFCTagUserVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<NFCTagUserVO>(NFCTagUserVO.API_TYPE_ID, 'nfc_tag_id', [tag.id]);
            if ((tags_user) && (tags_user.length > 0)) {

                if ((tags_user.length == 1) && (tags_user[0].user_id == user_id)) {
                    // Tag déjà lié à cet utilisateur
                    return true;
                }
                ConsoleHandler.getInstance().error('TAG déjà lié à un utilisateur:' + serial_number);
                return false;
            }

            let add_tag_user = new NFCTagUserVO();
            add_tag_user.nfc_tag_id = tag.id;
            add_tag_user.user_id = user_id;
            insertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(add_tag_user);
            if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {

                ConsoleHandler.getInstance().error("Impossible de créer le nouveau tag user. Abandon.");
                return false;
            }

            return true;
        });
    }

    private async remove_user_tag(serial_number: string): Promise<boolean> {

        let user_id = await ModuleAccessPolicyServer.getInstance().getLoggedUserId();

        if (!user_id) {
            ConsoleHandler.getInstance().error("Impossible de supprimer le tag. Pas de user_id:" + user_id);
            return false;
        }

        return await StackContext.getInstance().runPromise({ IS_CLIENT: false }, async () => {

            let insertOrDeleteQueryResult = null;
            let tag = await ModuleDAO.getInstance().getNamedVoByName<NFCTagVO>(NFCTagVO.API_TYPE_ID, serial_number);
            if (!tag) {

                ConsoleHandler.getInstance().error("Impossible de supprimer le tag. Tag Introuvable.");
                return false;
            }

            insertOrDeleteQueryResult = await ModuleDAO.getInstance().deleteVOs([tag]);
            if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                ConsoleHandler.getInstance().error("Impossible de supprimer le tag user. Abandon.");
                return false;
            }

            return true;
        });
    }
}