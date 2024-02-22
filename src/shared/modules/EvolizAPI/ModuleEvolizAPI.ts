import AccessPolicyTools from '../../tools/AccessPolicyTools';
import APIControllerWrapper from '../API/APIControllerWrapper';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import Module from '../Module';
import EvolizClientParam, { EvolizClientParamStatic } from './vos/apis/EvolizClientParam';
import EvolizProspectParam, { EvolizProspectParamStatic } from './vos/apis/EvolizProspectParam';
import EvolizContactClientParam, { EvolizContactClientParamStatic } from './vos/apis/EvolizContactClientParam';
import EvolizContactProspectParam, { EvolizContactProspectParamStatic } from './vos/apis/EvolizContactProspectParam';
import EvolizInvoiceParam, { EvolizInvoiceParamStatic } from './vos/apis/EvolizInvoiceParam';
import EvolizClientVO from './vos/clients/EvolizClientVO';
import EvolizContactClientVO from './vos/contact_clients/EvolizContactClientVO';
import EvolizContactProspectVO from './vos/contact_prospects/EvolizContactProspectVO';
import EvolizInvoiceVO from './vos/invoices/EvolizInvoiceVO';
import EvolizProspectVO from './vos/prospects/EvolizProspectVO';
import EvolizDevisVO from './vos/devis/EvolizDevisVO';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import EvolizArticleVO from './vos/articles/EvolizArticleVO';
import EvolizArticleParam, { EvolizArticleParamStatic } from './vos/apis/EvolizArticleParam';
import EvolizInvoicePOSTVO from './vos/invoices/EvolizInvoicePOSTVO';

export default class ModuleEvolizAPI extends Module {

    public static EvolizAPI_PublicKey_API_PARAM_NAME: string = 'EvolizAPI.EvolizAPI_PublicKey_API';
    public static EvolizAPI_SecretKey_API_PARAM_NAME: string = 'EvolizAPI.EvolizAPI_SecretKey_API';

    public static EvolizAPI_BaseURL: string = 'www.evoliz.io';
    public static APINAME_list_devis: string = "list_devis";
    public static APINAME_get_devis: string = "get_devis";
    public static APINAME_list_articles: string = "list_articles";
    public static APINAME_create_article: string = "create_article";
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

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleEvolizAPI {
        if (!ModuleEvolizAPI.instance) {
            ModuleEvolizAPI.instance = new ModuleEvolizAPI();
        }
        return ModuleEvolizAPI.instance;
    }

    private static instance: ModuleEvolizAPI = null;

    public list_devis: () => Promise<EvolizDevisVO[]> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_list_devis);
    public get_devis: (evoliz_id: string) => Promise<EvolizDevisVO[]> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_get_devis);
    public list_articles: () => Promise<EvolizArticleVO[]> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_list_articles);
    public create_article: (article: EvolizArticleVO) => Promise<number> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_create_article);
    public list_invoices: () => Promise<EvolizInvoiceVO[]> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_list_invoices);
    public create_invoice: (invoice: EvolizInvoicePOSTVO) => Promise<number> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_create_invoice);
    public list_clients: () => Promise<EvolizClientVO[]> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_list_clients);
    public create_client: (client: EvolizClientVO) => Promise<number> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_create_client);
    public list_contact_clients: () => Promise<EvolizContactClientVO[]> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_list_contact_clients);
    public create_contact_client: (contact: EvolizContactClientVO) => Promise<number> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_create_contact_client);
    public list_prospects: () => Promise<EvolizProspectVO[]> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_list_prospects);
    public create_prospect: (prospect: EvolizProspectVO) => Promise<number> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_create_prospect);
    public list_contact_prospects: () => Promise<EvolizContactProspectVO[]> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_list_contact_prospects);
    public create_contact_prospect: (contact: EvolizContactProspectVO) => Promise<number> = APIControllerWrapper.sah(ModuleEvolizAPI.APINAME_create_contact_prospect);

    private constructor() {

        super("evolizapi", ModuleEvolizAPI.MODULE_NAME);
    }

    public registerApis() {
        APIControllerWrapper.registerApi(new GetAPIDefinition<null, EvolizDevisVO[]>(
            null,
            ModuleEvolizAPI.APINAME_list_devis,
            []
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<StringParamVO, EvolizDevisVO[]>(
            null,
            ModuleEvolizAPI.APINAME_get_devis,
            [],
            StringParamVOStatic,
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<null, EvolizArticleVO[]>(
            null,
            ModuleEvolizAPI.APINAME_list_articles,
            []
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<EvolizArticleParam, number>(
            null,
            ModuleEvolizAPI.APINAME_create_article,
            [],
            EvolizArticleParamStatic
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<null, EvolizInvoiceVO[]>(
            null,
            ModuleEvolizAPI.APINAME_list_invoices,
            []
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<EvolizInvoiceParam, number>(
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

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<EvolizClientParam, number>(
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

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<EvolizContactClientParam, number>(
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

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<EvolizProspectParam, number>(
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

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<EvolizContactProspectParam, number>(
            null,
            ModuleEvolizAPI.APINAME_create_contact_prospect,
            [],
            EvolizContactProspectParamStatic
        ));
    }

    public initialize() {
    }

}