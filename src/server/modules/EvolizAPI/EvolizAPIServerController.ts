import moment from 'moment';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleEvolizAPI from '../../../shared/modules/EvolizAPI/ModuleEvolizAPI';
import EvolizClientVO from '../../../shared/modules/EvolizAPI/vos/clients/EvolizClientVO';
import EvolizContactClientVO from '../../../shared/modules/EvolizAPI/vos/contact_clients/EvolizContactClientVO';
import EvolizContactProspectVO from '../../../shared/modules/EvolizAPI/vos/contact_prospects/EvolizContactProspectVO';
import EvolizInvoiceVO from '../../../shared/modules/EvolizAPI/vos/invoices/EvolizInvoiceVO';
import EvolizProspectVO from '../../../shared/modules/EvolizAPI/vos/prospects/EvolizProspectVO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModuleRequest from '../../../shared/modules/Request/ModuleRequest';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import EvolizAPIToken from './vos/EvolizAPIToken';
import EvolizDevisVO from '../../../shared/modules/EvolizAPI/vos/devis/EvolizDevisVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import IEvolizAPIPagination from './interfaces/IEvolizAPIPagination';
import EvolizAPIEltUpdateWrapper from './synchro/EvolizAPIEltUpdateWrapper';

export default class EvolizAPIServerController {

    private static token: EvolizAPIToken = null;

    private static async refresh_token() {
        // Si j'ai un token et que il est encore ACTIF, je ne fais rien
        if (this.token && this.token.expires_at.isBefore(moment())) {
            return;
        }

        // Sinon, je me connecte
        await EvolizAPIServerController.connexion_to_api();
    }

    private static async connexion_to_api() {
        let return_connect: any = await ModuleRequest.getInstance().sendRequestFromApp(
            ModuleRequest.METHOD_POST,
            ModuleEvolizAPI.EvolizAPI_BaseURL,
            '/api/login',
            {
                public_key: await ModuleParams.getInstance().getParamValueAsString(ModuleEvolizAPI.EvolizAPI_PublicKey_API_PARAM_NAME),
                secret_key: await ModuleParams.getInstance().getParamValueAsString(ModuleEvolizAPI.EvolizAPI_SecretKey_API_PARAM_NAME)
            },
            {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            true,
            null,
            false,
            true,
        );

        if (return_connect) {
            this.token = return_connect;
        }
    }

    /**
     * Méthode qui synchronise - de manière descendante - les éléments d'Evoliz vers la bdd
     * @param evoliz_api_url Url pour lister les éléments souhaités - uniquement la partie qui désigne le contenu à récupérer.
     * Par exemple pour les quotes, on n'envoie pas '/api/v1/quotes' mais simplement 'quotes'
     * @param evoliz_key_field_id L'id unique de l'élément dans Evoliz, qui est utilisé pour retrouver les éléments en base
     * @param vo_api_type_id Le type de l'objet à insérer en base de données
     * @param vo_key_field_id Le champs de l'objet à insérer en base de données qui correspond à evoliz_key_field_id_sort_by_desc
     * @param new_items_handler Une fonction pour transformer les éléments récupérés en VOs, et les insérer en base
     * @param updated_items_handler Une fonction pour comparer les éléments récupérés avec ceux en base, et les mettre à jour
     * @param deleted_items_handler Une fonction pour gérer les suppressions à faire en base. Par défaut on met juste à jour le flag synchronized à false sur le vo
     * pour indiquer qu'on a perdu la trace de l'élément dans Evoliz
     */
    private static async synchronize_from_evoliz_to_oswedev<EvolizAPIType, VOType extends IDistantVOBase>(
        evoliz_api_url: string,
        evoliz_key_field_id: string,
        vo_api_type_id: string,
        vo_key_field_id: string,
        new_items_handler: (elts: EvolizAPIType[]) => void,
        updated_items_handler: (elts: Array<EvolizAPIEltUpdateWrapper<EvolizAPIType, VOType>>) => void,
        deleted_items_handler: (elts: EvolizAPIType[]) => void = null
    ) {

        try {
            await EvolizAPIServerController.refresh_token();

            let res: EvolizAPIType[] = [];
            let has_more: boolean = true;
            let page: number = 1;

            while (has_more) {
                let elts: IEvolizAPIPagination<EvolizAPIType> = await ModuleRequest.getInstance().sendRequestFromApp(
                    ModuleRequest.METHOD_GET,
                    ModuleEvolizAPI.EvolizAPI_BaseURL,
                    ('/api/v1/') + evoliz_api_url + ModuleRequest.getInstance().get_params_url({
                        per_page: '100',
                        page: page.toString(),
                        period: 'custom',
                        date_min: '1900-01-01',
                        date_max: '2999-12-31',
                    }),
                    null,
                    {
                        Authorization: 'Bearer ' + token.access_token
                    },
                    true,
                    null,
                    false,
                );

                res = res.concat(elts.data);
                page++;

                has_more = page <= elts.meta.last_page;
            }

            return res;
        } catch (error) {
            console.error(error);
        }
    }






















    // DEVIS
    public async list_devis(): Promise<EvolizDevisVO[]> {
        try {
            // let devis: EvolizDevisVO[] = await this.get_all_pages('/api/v1/quotes') as EvolizDevisVO[];

            // return devis;
            await EvolizAPIServerController.refresh_token();

            let res: EvolizDevisVO[] = [];
            let has_more: boolean = true;
            let page: number = 1;

            while (has_more) {
                let elts: { data: any[], links: any, meta: any } = await ModuleRequest.getInstance().sendRequestFromApp(
                    ModuleRequest.METHOD_GET,
                    ModuleEvolizAPI.EvolizAPI_BaseURL,
                    ('/api/v1/quotes') + ModuleRequest.getInstance().get_params_url({
                        per_page: '100',
                        page: page.toString(),
                        period: 'custom',
                        date_min: '1900-01-01',
                        date_max: '2999-12-31',
                    }),
                    null,
                    {
                        Authorization: 'Bearer ' + token.access_token
                    },
                    true,
                    null,
                    false,
                );

                res = res.concat(elts.data);
                page++;

                has_more = page <= elts.meta.last_page;
            }

            return res;
        } catch (error) {
            console.error(error);
        }
    }

    public async get_devis(evoliz_id: string): Promise<EvolizDevisVO> {
        try {
            await EvolizAPIServerController.refresh_token();

            let devis: EvolizDevisVO = await ModuleRequest.getInstance().sendRequestFromApp(
                ModuleRequest.METHOD_GET,
                ModuleEvolizAPI.EvolizAPI_BaseURL,
                ('/api/v1/quotes/' + evoliz_id),
                null,
                {
                    Authorization: 'Bearer ' + token.access_token
                },
                true,
                null,
                false,
            );

            return devis;

        } catch (error) {
            console.error(error);
        }
    }

    // FACTURES
    public async list_invoices(): Promise<EvolizInvoiceVO[]> {
        try {
            let invoices: EvolizInvoiceVO[] = await this.get_all_pages('/api/v1/invoices') as EvolizInvoiceVO[];

            return invoices;
        } catch (error) {
            console.error(error);
        }
    }

    public async create_invoice(invoice: EvolizInvoiceVO) {
        try {
            await EvolizAPIServerController.refresh_token();

            let create_invoice = await ModuleRequest.getInstance().sendRequestFromApp(
                ModuleRequest.METHOD_POST,
                ModuleEvolizAPI.EvolizAPI_BaseURL,
                '/api/v1/invoices',
                invoice,
                {
                    'Authorization': 'Bearer ' + token.access_token,
                    'Content-Type': 'application/json',
                },
                true,
                null,
                false,
                true,
            );
        } catch (error) {
            console.error("Erreur Evoliz: invoice: " + invoice.document_number);
        }
    }

    ///// CLIENTS /////
    public async list_clients(): Promise<EvolizClientVO[]> {
        try {
            let clients: EvolizClientVO[] = await this.get_all_pages('/api/v1/clients') as EvolizClientVO[];

            return clients;
        } catch (error) {
            console.error(error);
        }
    }

    public async create_client(client: EvolizClientVO) {

        try {
            await EvolizAPIServerController.refresh_token();

            let create_client = await ModuleRequest.getInstance().sendRequestFromApp(
                ModuleRequest.METHOD_POST,
                ModuleEvolizAPI.EvolizAPI_BaseURL,
                '/api/v1/clients',
                client,
                {
                    'Authorization': 'Bearer ' + token.access_token,
                    'Content-Type': 'application/json',
                },
                true,
                null,
                false,
                true,
            );

            return create_client.clientid;

        } catch (error) {
            console.error("Erreur Evoliz: client: " + client.name);
        }
    }

    ///// CONTACTS CLIENTS /////
    public async list_contact_clients(): Promise<EvolizContactClientVO[]> {
        try {
            let contacts: EvolizContactClientVO[] = await this.get_all_pages('/api/v1/contacts-clients') as EvolizContactClientVO[];

            return contacts;
        } catch (error) {
            console.error(error);
        }
    }

    public async create_contact_client(contact: EvolizContactClientVO) {

        try {
            await EvolizAPIServerController.refresh_token();

            let create_contact = await ModuleRequest.getInstance().sendRequestFromApp(
                ModuleRequest.METHOD_POST,
                ModuleEvolizAPI.EvolizAPI_BaseURL,
                '/api/v1/contacts-clients',
                contact,
                {
                    'Authorization': 'Bearer ' + token.access_token,
                    'Content-Type': 'application/json',
                },
                true,
                null,
                false,
                true,
            );

            return create_contact.contactid;

        } catch (error) {
            console.error("Erreur Evoliz: contact client: " + contact.lastname + " " + contact.firstname);
        }
    }

    ///// PROSPECTS /////
    public async list_prospects(): Promise<EvolizProspectVO[]> {
        try {
            let prospects: EvolizProspectVO[] = await this.get_all_pages('/api/v1/prospects') as EvolizProspectVO[];

            return prospects;
        } catch (error) {
            console.error(error);
        }
    }

    public async create_prospect(prospect: EvolizProspectVO) {

        try {
            await EvolizAPIServerController.refresh_token();

            let create_prospect = await ModuleRequest.getInstance().sendRequestFromApp(
                ModuleRequest.METHOD_POST,
                ModuleEvolizAPI.EvolizAPI_BaseURL,
                '/api/v1/prospects',
                prospect,
                {
                    'Authorization': 'Bearer ' + token.access_token,
                    'Content-Type': 'application/json',
                },
                true,
                null,
                false,
                true,
            );

            return create_prospect.prospectid;

        } catch (error) {
            console.error("Erreur Evoliz: prospect: " + prospect.name);
        }
    }

    ///// CONTACTS PROSPECTS /////
    public async list_contact_prospects(): Promise<EvolizContactProspectVO[]> {
        try {
            let prospects: EvolizContactProspectVO[] = await this.get_all_pages('/api/v1/contacts-prospects') as EvolizContactProspectVO[];

            return prospects;
        } catch (error) {
            console.error(error);
        }
    }

    public async create_contact_prospect(contact: EvolizContactProspectVO) {

        try {
            await EvolizAPIServerController.refresh_token();

            let create_prospect = await ModuleRequest.getInstance().sendRequestFromApp(
                ModuleRequest.METHOD_POST,
                ModuleEvolizAPI.EvolizAPI_BaseURL,
                '/api/v1/contacts-prospects',
                contact,
                {
                    'Authorization': 'Bearer ' + token.access_token,
                    'Content-Type': 'application/json',
                },
                true,
                null,
                false,
                true,
            );

            return create_prospect.contactid;

        } catch (error) {
            console.error("Erreur Evoliz: contact prospect: " + contact.lastname + " " + contact.firstname);
        }
    }

    private async get_all_pages(url: string) {
        await EvolizAPIServerController.refresh_token();

        let res: any[] = [];
        let has_more: boolean = true;
        let page: number = 1;

        while (has_more) {
            let elts: { data: any[], links: any, meta: any } = await ModuleRequest.getInstance().sendRequestFromApp(
                ModuleRequest.METHOD_GET,
                ModuleEvolizAPI.EvolizAPI_BaseURL,
                (url.startsWith('/') ? url : '/' + url) + ModuleRequest.getInstance().get_params_url({
                    per_page: '100',
                    page: page.toString(),
                }),
                null,
                {
                    Authorization: 'Bearer ' + token.access_token
                },
                true,
                null,
                false,
            );

            res = res.concat(elts.data);
            page++;

            has_more = page <= elts.meta.last_page;
        }

        return res;
    }

    private configureTraductions(): void {

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Contrat effectué'
        }, 'evoliz_devis.status_contrat_effectue.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Proposition effectuée'
        }, 'evoliz_devis.status_proposition_effectuee.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Négociation'
        }, 'evoliz_devis.status_negociation.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Confirmée'
        }, 'evoliz_devis.status_confirmee.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Facturée'
        }, 'evoliz_devis.status_facturee.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Perdue'
        }, 'evoliz_devis.status_perdue.___LABEL___'));
    }
}