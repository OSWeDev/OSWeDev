import AccessPolicyTools from '../../tools/AccessPolicyTools';
import APIControllerWrapper from '../API/APIControllerWrapper';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import Module from '../Module';
import { EvolizClientParamStatic } from './vos/apis/EvolizClientParam';
import { EvolizProspectParamStatic } from './vos/apis/EvolizProspectParam';
import { EvolizContactClientParamStatic } from './vos/apis/EvolizContactClientParam';
import { EvolizContactProspectParamStatic } from './vos/apis/EvolizContactProspectParam';
import { EvolizInvoiceParamStatic } from './vos/apis/EvolizInvoiceParam';
import EvolizClientVO from './vos/clients/EvolizClientVO';
import EvolizContactClientVO from './vos/contact_clients/EvolizContactClientVO';
import EvolizContactProspectVO from './vos/contact_prospects/EvolizContactProspectVO';
import EvolizInvoiceVO from './vos/invoices/EvolizInvoiceVO';
import EvolizProspectVO from './vos/prospects/EvolizProspectVO';

export default class ModuleEvolizAPI extends Module {

    public static EvolizAPI_PublicKey_API_PARAM_NAME: string = 'EvolizAPI.EvolizAPI_PublicKey_API';
    public static EvolizAPI_SecretKey_API_PARAM_NAME: string = 'EvolizAPI.EvolizAPI_SecretKey_API';

    public static EvolizAPI_BaseURL: string = 'www.evoliz.io';
    public static APINAME_list_invoices: string = "list_invoices";
    public static APINAME_create_invoice: string = "create_invoice";
    public static APINAME_list_clients: string = "list_clients";
    public static APINAME_create_client: string = "create_client";
    public static APINAME_list_contact_clients: string = "list_contact_clients";
    public static APINAME_create_contact_client: string = "create_contact_client";
    public static APINAME_list_prospects: string = "list_prospects";
    public static APINAME_create_prospect: string = "create_prospect";
    public static APINAME_list_contact_prospects: string = "list_contact_prospects";
    public static APINAME_create_contact_prospect: string = "create_contact_prospect";

    public static MODULE_NAME: string = 'EvolizAPI';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleEvolizAPI.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleEvolizAPI.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleEvolizAPI.MODULE_NAME + '.FO_ACCESS';

    public static getInstance(): ModuleEvolizAPI {
        if (!ModuleEvolizAPI.instance) {
            ModuleEvolizAPI.instance = new ModuleEvolizAPI();
        }
        return ModuleEvolizAPI.instance;
    }

    private static instance: ModuleEvolizAPI = null;

    public list_invoices: () => Promise<EvolizInvoiceVO[]> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_list_invoices);
    public create_invoice: (invoice: EvolizInvoiceVO) => Promise<string> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_create_invoice);
    public list_clients: () => Promise<EvolizClientVO[]> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_list_clients);
    public create_client: (client: EvolizClientVO) => Promise<string> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_create_client);
    public list_contact_clients: () => Promise<EvolizContactClientVO[]> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_list_contact_clients);
    public create_contact_client: (contact: EvolizContactClientVO) => Promise<string> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_create_contact_client);
    public list_prospects: () => Promise<EvolizProspectVO[]> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_list_prospects);
    public create_prospect: (prospect: EvolizProspectVO) => Promise<string> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_create_prospect);
    public list_contact_prospects: () => Promise<EvolizContactProspectVO[]> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_list_contact_prospects);
    public create_contact_prospect: (contact: EvolizContactProspectVO) => Promise<string> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_create_contact_prospect);

    private constructor() {

        super("evolizapi", ModuleEvolizAPI.MODULE_NAME);
    }

    public registerApis() {
        APIControllerWrapper.registerApi(new GetAPIDefinition<null, EvolizInvoiceVO[]>(
            null,
            ModuleEvolizAPI.APINAME_list_invoices,
            []
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<EvolizInvoiceVO, string>(
            null,
            ModuleEvolizAPI.APINAME_create_invoice,
            [],
            EvolizInvoiceParamStatic
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<null, EvolizClientVO[]>(
            null,
            ModuleEvolizAPI.APINAME_list_clients,
            []
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<EvolizClientVO, string>(
            null,
            ModuleEvolizAPI.APINAME_create_client,
            [],
            EvolizClientParamStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<null, EvolizContactClientVO[]>(
            null,
            ModuleEvolizAPI.APINAME_list_contact_clients,
            []
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<EvolizContactClientVO, string>(
            null,
            ModuleEvolizAPI.APINAME_create_contact_client,
            [],
            EvolizContactClientParamStatic
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<null, EvolizProspectVO[]>(
            null,
            ModuleEvolizAPI.APINAME_list_prospects,
            []
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<EvolizProspectVO, string>(
            null,
            ModuleEvolizAPI.APINAME_create_prospect,
            [],
            EvolizProspectParamStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<null, EvolizContactProspectVO[]>(
            null,
            ModuleEvolizAPI.APINAME_list_contact_prospects,
            []
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<EvolizContactProspectVO, string>(
            null,
            ModuleEvolizAPI.APINAME_create_contact_prospect,
            [],
            EvolizContactProspectParamStatic
        ));
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }

}