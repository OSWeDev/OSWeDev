import AccessPolicyTools from '../../tools/AccessPolicyTools';
import APIControllerWrapper from '../API/APIControllerWrapper';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import Module from '../Module';
import { EvolizClientParamStatic } from './vos/apis/EvolizClientParam';
import { EvolizInvoiceParamStatic } from './vos/apis/EvolizInvoiceParam';
import EvolizClientVO from './vos/clients/EvolizClientVO';
import EvolizInvoiceVO from './vos/invoices/EvolizInvoiceVO';

export default class ModuleEvolizAPI extends Module {

    public static EvolizAPI_PublicKey_API_PARAM_NAME: string = 'EvolizAPI.EvolizAPI_PublicKey_API';
    public static EvolizAPI_SecretKey_API_PARAM_NAME: string = 'EvolizAPI.EvolizAPI_SecretKey_API';

    public static EvolizAPI_BaseURL: string = 'www.evoliz.io';
    public static APINAME_list_invoices: string = "list_invoices";
    public static APINAME_create_invoice: string = "create_invoice";
    public static APINAME_list_clients: string = "list_clients";
    public static APINAME_create_client: string = "create_client";

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
    public create_client: (client: any) => Promise<string> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_create_client);

    private constructor() {

        super("evolizapi", ModuleEvolizAPI.MODULE_NAME);
    }

    public registerApis() {
        APIControllerWrapper.registerApi(new GetAPIDefinition<null, EvolizClientVO[]>(
            null,
            ModuleEvolizAPI.APINAME_list_invoices,
            []
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<EvolizClientVO, string>(
            null,
            ModuleEvolizAPI.APINAME_create_invoice,
            [],
            EvolizClientParamStatic
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<null, EvolizInvoiceVO[]>(
            null,
            ModuleEvolizAPI.APINAME_list_clients,
            []
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<EvolizInvoiceVO, string>(
            null,
            ModuleEvolizAPI.APINAME_create_client,
            [],
            EvolizInvoiceParamStatic
        ));
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }

}