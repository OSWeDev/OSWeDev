import moment = require('moment');
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleEvolizAPI from '../../../shared/modules/EvolizAPI/ModuleEvolizAPI';
import EvolizClientVO from '../../../shared/modules/EvolizAPI/vos/clients/EvolizClientVO';
import EvolizInvoiceVO from '../../../shared/modules/EvolizAPI/vos/invoices/EvolizInvoiceVO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModuleRequest from '../../../shared/modules/Request/ModuleRequest';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import EvolizAPIToken from './vos/EvolizAPIToken';

export default class ModuleEvolizAPIServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleEvolizAPIServer.instance) {
            ModuleEvolizAPIServer.instance = new ModuleEvolizAPIServer();
        }
        return ModuleEvolizAPIServer.instance;
    }

    private static instance: ModuleEvolizAPIServer = null;

    private token: EvolizAPIToken = null;

    private constructor() {
        super(ModuleEvolizAPI.getInstance().name);
    }

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
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModuleEvolizAPI.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, new DefaultTranslation({
            'fr-fr': 'Accès front - API EvolizAPI'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    public async configure() {
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleEvolizAPI.APINAME_list_invoices, this.list_invoices.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleEvolizAPI.APINAME_create_invoices, this.create_invoices.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleEvolizAPI.APINAME_list_clients, this.list_clients.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleEvolizAPI.APINAME_create_clients, this.create_clients.bind(this));
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

    public async list_invoices(): Promise<EvolizInvoiceVO[]> {
        let token: EvolizAPIToken = await this.getToken();

        let list_invoices: { data: EvolizInvoiceVO[], links: any, meta: any } = await ModuleRequest.getInstance().sendRequestFromApp(
            ModuleRequest.METHOD_GET,
            ModuleEvolizAPI.EvolizAPI_BaseURL,
            '/api/v1/invoices' + ModuleRequest.getInstance().get_params_url({
                per_page: '100',
            }),
            null,
            {
                Authorization: 'Bearer ' + token.access_token
            },
            true,
            null,
            false,
            true,
        );

        console.log(list_invoices);
        return list_invoices.data;
    }

    public async create_invoices(invoice: EvolizInvoiceVO) {
        let token: EvolizAPIToken = await this.getToken();

        let create_invoice = await ModuleRequest.getInstance().sendRequestFromApp(
            ModuleRequest.METHOD_POST,
            ModuleEvolizAPI.EvolizAPI_BaseURL,
            '/api/v1/invoices',
            invoice,
            {
                Authorization: 'Bearer ' + token.access_token
            },
            true,
            null,
            false,
            false,
        );
    }

    public async list_clients(): Promise<EvolizClientVO[]> {
        let token: EvolizAPIToken = await this.getToken();

        let clients: { data: EvolizClientVO[], links: any, meta: any } = await ModuleRequest.getInstance().sendRequestFromApp(
            ModuleRequest.METHOD_GET,
            ModuleEvolizAPI.EvolizAPI_BaseURL,
            '/api/v1/clients' + ModuleRequest.getInstance().get_params_url({
                per_page: '100',
            }),
            null,
            {
                Authorization: 'Bearer ' + token.access_token
            },
            true,
            null,
            false,
            true,
        );

        console.log(clients);
        return clients.data;
    }

    public async create_clients(client: EvolizClientVO) {
        let token: EvolizAPIToken = await this.getToken();

        let create_client = await ModuleRequest.getInstance().sendRequestFromApp(
            ModuleRequest.METHOD_POST,
            ModuleEvolizAPI.EvolizAPI_BaseURL,
            '/api/v1/clients',
            client,
            {
                Authorization: 'Bearer ' + token.access_token
            },
            true,
            null,
            false,
            false,
        );
    }
}