import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleNFCConnect from '../../../../shared/modules/NFCConnect/ModuleNFCConnect';
import NFCTagUserVO from '../../../../shared/modules/NFCConnect/vos/NFCTagUserVO';
import NFCTagVO from '../../../../shared/modules/NFCConnect/vos/NFCTagVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import VueAppBase from '../../../VueAppBase';
import VueAppController from '../../../VueAppController';

export default class NFCHandler {

    public static getInstance(): NFCHandler {
        if (!NFCHandler.instance) {
            NFCHandler.instance = new NFCHandler();
        }
        return NFCHandler.instance;
    }

    private static instance: NFCHandler;

    private ndef = null;

    private constructor() {
    }

    public async make_sure_nfc_is_initialized(): Promise<boolean> {
        try {

            VueAppBase.getInstance().vueInstance.snotify.success('NFCReader');

            if (!!this.ndef) {
                return true;
            }

            let NDEFReader = window['NDEFReader'];

            if (!NDEFReader) {
                VueAppBase.getInstance().vueInstance.snotify.error('NFCReader is not available');
                ConsoleHandler.getInstance().log("NFCReader is not available");

                return false;
            }

            VueAppBase.getInstance().vueInstance.snotify.success('NFCReader - constructor');
            this.ndef = new NDEFReader();

            VueAppBase.getInstance().vueInstance.snotify.success('NFCReader - scan');
            await this.ndef.scan();

            VueAppBase.getInstance().vueInstance.snotify.success('NFCReader - NFC Reader ready');
            ConsoleHandler.getInstance().log("> NFC Reader ready");

            this.ndef.addEventListener("readingerror", () => {
                VueAppBase.getInstance().vueInstance.snotify.error(VueAppBase.getInstance().vueInstance.label('NFCHandler.readingerror.readingerror'));
                ConsoleHandler.getInstance().log("Argh! Cannot read data from the NFC tag. Try another one?");
            });

            this.ndef.addEventListener("reading", async ({ message, serialNumber }) => {

                if (!serialNumber) {
                    VueAppBase.getInstance().vueInstance.snotify.error(VueAppBase.getInstance().vueInstance.label('NFCHandler.readingerror.serialNumber'));
                    ConsoleHandler.getInstance().log("Empty serial number on NFC tag reading...");
                    return;
                }

                let logged_user_id = VueAppBase.getInstance().appController.data_user.id;
                let tag = await ModuleDAO.getInstance().getNamedVoByName<NFCTagVO>(NFCTagVO.API_TYPE_ID, serialNumber);
                if (!tag) {
                    // Le tag est inconnu, si on est connecté on propose de l'ajouter au compte comme mode d'accès
                    //  - si on est pas connecté on indique que le tag ne permet pas de se connecter, il faut l'enregistrer après une première connexion manuelle
                    if (!logged_user_id) {
                        VueAppBase.getInstance().vueInstance.snotify.info(VueAppBase.getInstance().vueInstance.label('NFCHandler.readinginfo.tag_not_registered'));
                        ConsoleHandler.getInstance().log("NFC tag is not registered and needs to be linked to connected user first...");
                        return;
                    }

                    this.add_tag_confirmation(serialNumber, logged_user_id);
                    return;
                }

                let tags_user: NFCTagUserVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<NFCTagUserVO>(NFCTagUserVO.API_TYPE_ID, 'nfc_tag_id', [tag.id]);
                if ((!tags_user) || (tags_user.length != 1)) {
                    // Le tag n'est pas lié à un utilisateur :
                    //  - si on est déjà connecté avec un compte on propose de rajouter ce tag comme moyen de connexion
                    //  - si on est pas connecté on indique que le tag ne permet pas de se connecter, il faut l'enregistrer après une première connexion manuelle
                    if (!logged_user_id) {
                        VueAppBase.getInstance().vueInstance.snotify.info(VueAppBase.getInstance().vueInstance.label('NFCHandler.readinginfo.tag_not_registered'));
                        ConsoleHandler.getInstance().log("NFC tag is not registered and needs to be linked to connected user first...");
                        return;
                    }

                    this.add_tag_confirmation(serialNumber, logged_user_id, tag);
                    return;
                }

                let tag_user = tags_user[0];
                if (tag_user.user_id) {
                    // Le tag est lié à un utilisateur :
                    //  - si on est déjà connecté et que le tag n'est pas lié au même compte, on propose de switcher (de compte connecté, pas de compte lié au tag)
                    //  - si on est pas connecté on lance la connexion
                    if (!logged_user_id) {
                        // TODO : sécuriser la requete pour ne pas envoyer en clair le serial_number qui sert de mot de passe du compte en somme
                        // await ModuleNFCConnect.getInstance().get_temp_encryption_key();
                        await ModuleNFCConnect.getInstance().connect(serialNumber);
                        location.href = '/';
                        return;
                    }

                    VueAppBase.getInstance().vueInstance.snotify.confirm(VueAppBase.getInstance().vueInstance.label('NFCHandler.switchconfirmation.body'), VueAppBase.getInstance().vueInstance.label('NFCHandler.switchconfirmation.title'), {
                        timeout: 10000,
                        showProgressBar: true,
                        closeOnClick: false,
                        pauseOnHover: true,
                        buttons: [
                            {
                                text: VueAppBase.getInstance().vueInstance.t('YES'),
                                action: async (toast) => {
                                    VueAppBase.getInstance().vueInstance.$snotify.remove(toast.id);
                                    VueAppBase.getInstance().vueInstance.snotify.info(VueAppBase.getInstance().vueInstance.label('NFCHandler.switchconfirmation.start'));

                                    await ModuleAccessPolicy.getInstance().logout();
                                    await ModuleNFCConnect.getInstance().connect(serialNumber);
                                    location.href = '/';
                                    return;
                                },
                                bold: false
                            },
                            {
                                text: VueAppBase.getInstance().vueInstance.t('NO'),
                                action: (toast) => {
                                    VueAppBase.getInstance().vueInstance.$snotify.remove(toast.id);
                                }
                            }
                        ]
                    });

                    return;
                }
            });

            return true;
        } catch (error) {
            VueAppBase.getInstance().vueInstance.snotify.error(error);
            ConsoleHandler.getInstance().error(error);
        }

        return false;
    }

    public has_nfc_support(): boolean {
        if (!("NDEFReader" in window)) {
            ConsoleHandler.getInstance().log("Web NFC is not available.");
            return false;
        }

        return true;
    }

    private add_tag_confirmation(serialNumber: string, logged_user_id: number, tag: NFCTagVO = null) {
        VueAppBase.getInstance().vueInstance.snotify.confirm(VueAppBase.getInstance().vueInstance.label('NFCHandler.addconfirmation.body'), VueAppBase.getInstance().vueInstance.label('NFCHandler.addconfirmation.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: VueAppBase.getInstance().vueInstance.t('YES'),
                    action: async (toast) => {
                        VueAppBase.getInstance().vueInstance.$snotify.remove(toast.id);
                        VueAppBase.getInstance().vueInstance.snotify.info(VueAppBase.getInstance().vueInstance.label('NFCHandler.addconfirmation.start'));

                        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = null;
                        if (!tag) {

                            tag = new NFCTagVO();
                            tag.activated = true;
                            tag.name = serialNumber;
                            insertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(tag);
                            if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                                VueAppBase.getInstance().vueInstance.snotify.error(VueAppBase.getInstance().vueInstance.label('NFCHandler.addconfirmation.failed_add_tag'));
                                ConsoleHandler.getInstance().error("Impossible de créer le nouveau tag. Abandon.");
                                return;
                            }
                            tag.id = insertOrDeleteQueryResult.id;
                        }

                        let add_tag_user = new NFCTagUserVO();
                        add_tag_user.nfc_tag_id = tag.id;
                        add_tag_user.user_id = logged_user_id;
                        insertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(add_tag_user);
                        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                            VueAppBase.getInstance().vueInstance.snotify.error(VueAppBase.getInstance().vueInstance.label('NFCHandler.addconfirmation.failed_add_tag_user'));
                            ConsoleHandler.getInstance().error("Impossible de créer le nouveau tag user. Abandon.");
                            return;
                        }

                        VueAppBase.getInstance().vueInstance.snotify.success(VueAppBase.getInstance().vueInstance.label('NFCHandler.addconfirmation.ended'));
                    },
                    bold: false
                },
                {
                    text: VueAppBase.getInstance().vueInstance.t('NO'),
                    action: (toast) => {
                        VueAppBase.getInstance().vueInstance.$snotify.remove(toast.id);
                    }
                }
            ]
        });
    }
}