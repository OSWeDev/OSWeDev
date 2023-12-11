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

export default class ModuleEvolizAPIServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleEvolizAPIServer.instance) {
            ModuleEvolizAPIServer.instance = new ModuleEvolizAPIServer();
        }
        return ModuleEvolizAPIServer.instance;
    }

    private static instance: ModuleEvolizAPIServer = null;

    private token: EvolizAPIToken = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleEvolizAPI.getInstance().name);
    }

    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleEvolizAPI.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'API EvolizAPI'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleEvolizAPI.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration API EvolizAPI'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModuleEvolizAPI.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, new DefaultTranslation({
            'fr-fr': 'Accès front - API EvolizAPI'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    // istanbul ignore next: cannot test configure
    public async configure() {
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleEvolizAPI.APINAME_list_devis, this.list_devis.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleEvolizAPI.APINAME_list_invoices, this.list_invoices.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleEvolizAPI.APINAME_create_invoice, this.create_invoice.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleEvolizAPI.APINAME_list_clients, this.list_clients.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleEvolizAPI.APINAME_create_client, this.create_client.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleEvolizAPI.APINAME_create_contact_client, this.create_contact_client.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleEvolizAPI.APINAME_list_contact_clients, this.list_contact_clients.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleEvolizAPI.APINAME_list_prospects, this.list_prospects.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleEvolizAPI.APINAME_create_prospect, this.create_prospect.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleEvolizAPI.APINAME_list_contact_prospects, this.list_contact_prospects.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleEvolizAPI.APINAME_create_contact_prospect, this.create_contact_prospect.bind(this));
    }

    public async getToken(): Promise<EvolizAPIToken> {
        // Si j'ai un token et que il est encore ACTIF, je ne fais rien
        if (this.token && this.token.expires_at.isBefore(moment())) {
            return this.token;
        }

        // Sinon, je me connecte
        await this.connexion_to_api();

        return this.token;
    }

    public async connexion_to_api() {
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

    // DEVIS
    public async list_devis(): Promise<EvolizDevisVO[]> {
        try {
            let invoices: EvolizDevisVO[] = await this.get_all_pages('/api/v1/quotes') as EvolizDevisVO[];

            return invoices;
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
            let token: EvolizAPIToken = await this.getToken();

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
            let token: EvolizAPIToken = await this.getToken();

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
            let token: EvolizAPIToken = await this.getToken();

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
            let token: EvolizAPIToken = await this.getToken();

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
            let token: EvolizAPIToken = await this.getToken();

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
        let token: EvolizAPIToken = await this.getToken();

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
}