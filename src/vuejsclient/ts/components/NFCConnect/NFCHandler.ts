import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleNFCConnect from '../../../../shared/modules/NFCConnect/ModuleNFCConnect';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import VueAppBase from '../../../VueAppBase';

export default class NFCHandler {

    public static getInstance(): NFCHandler {
        if (!NFCHandler.instance) {
            NFCHandler.instance = new NFCHandler();
        }
        return NFCHandler.instance;
    }

    private static instance: NFCHandler;

    public has_access_to_nfc: boolean = false;
    public ndef_active: boolean = false;
    private ndef = null;
    private is_waiting_to_write: boolean = false;

    private constructor() {
    }

    public async make_sure_nfc_is_initialized(): Promise<boolean> {
        try {

            if (!!this.ndef) {
                return true;
            }

            this.has_access_to_nfc = await ModuleAccessPolicy.getInstance().checkAccess(ModuleNFCConnect.POLICY_FO_ACCESS);

            let NDEFReader = window['NDEFReader'];

            if (!NDEFReader) {
                ConsoleHandler.getInstance().log("NFCReader is not available");

                return false;
            }

            this.ndef = new NDEFReader();

            await this.ndef.scan();

            ConsoleHandler.getInstance().log("> NFC Reader ready");

            this.ndef.addEventListener("readingerror", () => {
                VueAppBase.getInstance().vueInstance.snotify.error(VueAppBase.getInstance().vueInstance.label('NFCHandler.readingerror.readingerror'));
                ConsoleHandler.getInstance().log("Argh! Cannot read data from the NFC tag. Try another one?");
            });

            let self = this;

            this.ndef.addEventListener("reading", async ({ message, serialNumber }) => {

                if (self.is_waiting_to_write) {
                    return;
                }

                if (!serialNumber) {
                    VueAppBase.getInstance().vueInstance.snotify.error(VueAppBase.getInstance().vueInstance.label('NFCHandler.readingerror.serialNumber'));
                    ConsoleHandler.getInstance().log("Empty serial number on NFC tag reading...");
                    return;
                }

                let logged_user_id = VueAppBase.getInstance().appController.data_user ? VueAppBase.getInstance().appController.data_user.id : null;

                if (!logged_user_id) {

                    // Si on est pas co :
                    //  - on tente la connexion. Si ça marche pas, on indique que le tag n'est pas reconnu.

                    let connected = await ModuleNFCConnect.getInstance().connect(serialNumber);
                    if (!connected) {
                        VueAppBase.getInstance().vueInstance.snotify.info(VueAppBase.getInstance().vueInstance.label('NFCHandler.readinginfo.tag_not_registered'));
                        ConsoleHandler.getInstance().log("NFC tag is not registered and needs to be linked to connected user first...");
                        return;
                    }
                    // location.href = '/';
                    return;
                }

                // Si on est co :
                //  - on veut savoir si le tag existe et est lié à un autre compte
                //      - si oui on propose de se connecter à ce compte
                //      - si non on propose de lier le tag au compte

                let is_other_account: boolean = await ModuleNFCConnect.getInstance().checktag_user(serialNumber, logged_user_id);
                if (is_other_account) {
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
                                    // location.href = '/';
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

                // Pas un autre compte, mais tag existant : on est donc sur un tag assigné au compte, on propose pas de l'ajouter...
                let own_tags = await ModuleNFCConnect.getInstance().get_own_tags();
                if (own_tags && own_tags.find((tag) => tag.name == serialNumber)) {
                    VueAppBase.getInstance().vueInstance.snotify.info(VueAppBase.getInstance().vueInstance.label('NFCHandler.tag_already_added'));

                    await self.write_url_to_tag_confirmation(serialNumber);
                }

                this.add_tag_confirmation(serialNumber);
            });

            this.ndef_active = true;
            return true;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            this.ndef = null;
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

    private add_tag_confirmation(serialNumber: string) {
        let self = this;

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


                        if (!await ModuleNFCConnect.getInstance().add_tag(serialNumber)) {
                            VueAppBase.getInstance().vueInstance.snotify.error(VueAppBase.getInstance().vueInstance.label('NFCHandler.addconfirmation.failed_add_tag'));
                            ConsoleHandler.getInstance().error("Impossible de créer le nouveau tag. Abandon.");
                            return;
                        }

                        /**
                         * On tente de rajouter une url dans le tag pour qu'il permette d'accéder à l'appli
                         */
                        await self.write_url_to_tag_confirmation(serialNumber);

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

    private write_url_to_tag_confirmation(serialNumber: string) {
        let self = this;

        VueAppBase.getInstance().vueInstance.snotify.confirm(VueAppBase.getInstance().vueInstance.label('NFCHandler.writeurlconfirmation.body'), VueAppBase.getInstance().vueInstance.label('NFCHandler.writeurlconfirmation.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: VueAppBase.getInstance().vueInstance.t('YES'),
                    action: async (toast) => {
                        VueAppBase.getInstance().vueInstance.$snotify.remove(toast.id);
                        VueAppBase.getInstance().vueInstance.snotify.info(VueAppBase.getInstance().vueInstance.label('NFCHandler.writeurlconfirmation.start'));
                        self.is_waiting_to_write = true;

                        self.ndef.write({
                            records: [{ recordType: "url", data: window.location.origin + "/api_handler/" + ModuleNFCConnect.APINAME_connect_and_redirect + "/" + serialNumber }]
                        }).then(() => {
                            VueAppBase.getInstance().vueInstance.snotify.success(VueAppBase.getInstance().vueInstance.label('NFCHandler.writeurlconfirmation.ended'));
                            self.is_waiting_to_write = false;
                        }).catch((error) => {
                            VueAppBase.getInstance().vueInstance.snotify.error(VueAppBase.getInstance().vueInstance.label('NFCHandler.writeurlconfirmation.failed'));
                            self.is_waiting_to_write = false;
                            ConsoleHandler.getInstance().error("Impossible de créer le nouveau tag. Abandon. " + error);
                        });
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