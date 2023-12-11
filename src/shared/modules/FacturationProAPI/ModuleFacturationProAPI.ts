import AccessPolicyTools from '../../tools/AccessPolicyTools';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import IDistantVOBase from '../IDistantVOBase';
import Module from '../Module';
import ModuleParams from '../Params/ModuleParams';
import ModuleRequest from '../Request/ModuleRequest';
import { FactuProInvoiceVOStatic } from './vos/apis/FactuProInvoiceVO';
import FactuProInvoiceEmailVO, { FactuProInvoiceEmailVOStatic } from './vos/apis/FactuProInvoiceEmailVO';
import FactuProCategoriesLISTParams from './vos/categories/FactuProCategoriesLISTParams';
import FactuProCategoryVO from './vos/categories/FactuProCategoryVO';
import FactuProCustomersLISTParams from './vos/customers/FactuProCustomersLISTParams';
import FactuProCustomerVO from './vos/customers/FactuProCustomerVO';
import FactuProInvoicesEmailParams from './vos/invoices/FactuProInvoicesEmailParams';
import FactuProInvoicesLISTParams from './vos/invoices/FactuProInvoicesLISTParams';
import FactuProInvoiceVO from './vos/invoices/FactuProInvoiceVO';
import FactuProProductsLISTParams from './vos/products/FactuProProductsLISTParams';
import FactuProProductVO from './vos/products/FactuProProductVO';
import FactuProInvoiceFinaliseVO, { FactuProInvoiceFinaliseVOStatic } from './vos/apis/FactuProInvoiceFinaliseVO';
import FactuProDevisLISTParams from './vos/devis/FactuProDevisLISTParams';
import FactuProDevisVO from './vos/devis/FactuProDevisVO';

export default class ModuleFacturationProAPI extends Module {

    public static FacturationProAPI_AUTH_PARAM_NAME: string = 'FacturationProAPI.FacturationProAPI_AUTH';
    public static FacturationProAPI_Login_API_PARAM_NAME: string = 'FacturationProAPI.FacturationProAPI_Login_API';
    public static FacturationProAPI_Cle_API_PARAM_NAME: string = 'FacturationProAPI.FacturationProAPI_Cle_API';

    public static APINAME_download_invoice: string = "download_invoice";
    public static APINAME_send_email_facture: string = "send_email_facture";
    public static APINAME_finalise_invoice: string = "finalise_invoice";

    public static MODULE_NAME: string = 'FacturationProAPI';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleFacturationProAPI.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleFacturationProAPI.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleFacturationProAPI.MODULE_NAME + '.FO_ACCESS';

    public static getInstance(): ModuleFacturationProAPI {
        if (!ModuleFacturationProAPI.instance) {
            ModuleFacturationProAPI.instance = new ModuleFacturationProAPI();
        }
        return ModuleFacturationProAPI.instance;
    }

    private static instance: ModuleFacturationProAPI = null;

    public download_invoice: (firm_id: number, invoice_id: string, original: boolean) => Promise<string> = APIControllerWrapper.sah(ModuleFacturationProAPI.APINAME_download_invoice);
    public send_email_facture: (firm_id: number, bill_id: number, params: FactuProInvoicesEmailParams) => Promise<void> = APIControllerWrapper.sah(ModuleFacturationProAPI.APINAME_send_email_facture);
    public finalise_invoice: (firm_id: number, invoice_id: number, params: FactuProInvoiceVO) => Promise<void> = APIControllerWrapper.sah(ModuleFacturationProAPI.APINAME_finalise_invoice);

    private constructor() {

        super("factuproapi", ModuleFacturationProAPI.MODULE_NAME);
    }

    public registerApis() {
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<FactuProInvoiceVO, string>(
            null,
            ModuleFacturationProAPI.APINAME_download_invoice,
            [],
            FactuProInvoiceVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<FactuProInvoiceEmailVO, void>(
            null,
            ModuleFacturationProAPI.APINAME_send_email_facture,
            [],
            FactuProInvoiceEmailVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<FactuProInvoiceFinaliseVO, void>(
            null,
            ModuleFacturationProAPI.APINAME_finalise_invoice,
            [],
            FactuProInvoiceFinaliseVOStatic
        ));
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }

    public async list_customers(firm_id: number, params: FactuProCustomersLISTParams) {

        let customers: FactuProCustomerVO[] = await this.get_all_pages(
            "firms/" + firm_id + "/customers.json",
            params as any as { [i: string]: string },
        ) as FactuProCustomerVO[];
        return customers;
    }

    public async list_products(firm_id: number, params: FactuProProductsLISTParams) {

        let products: FactuProProductVO[] = await this.get_all_pages(
            "firms/" + firm_id + "/products.json",
            params as any as { [i: string]: string },
        ) as FactuProProductVO[];
        return products;
    }

    public async list_invoices(firm_id: number, params: FactuProInvoicesLISTParams) {

        let invoices: FactuProInvoiceVO[] = await this.get_all_pages(
            "firms/" + firm_id + "/invoices.json",
            params as any as { [i: string]: string },
        ) as FactuProInvoiceVO[];
        return invoices;
    }

    public async list_categories(firm_id: number, params: FactuProCategoriesLISTParams) {

        let categories: FactuProCategoryVO[] = await this.get_all_pages(
            "firms/" + firm_id + "/categories.json",
            params as any as { [i: string]: string },
        ) as FactuProCategoryVO[];
        return categories;
    }

    public async list_devis(firm_id: number, params: FactuProDevisLISTParams) {

        let devis: FactuProDevisVO[] = await this.get_all_pages(
            "firms/" + firm_id + "/quotes.json",
            params as any as { [i: string]: string },
        ) as FactuProDevisVO[];
        return devis;
    }

    public async getHeadersRequest(): Promise<any> {

        let auth = await ModuleParams.getInstance().getParamValueAsString(ModuleFacturationProAPI.FacturationProAPI_AUTH_PARAM_NAME);
        let cle = await ModuleParams.getInstance().getParamValueAsString(ModuleFacturationProAPI.FacturationProAPI_Cle_API_PARAM_NAME);
        let login = await ModuleParams.getInstance().getParamValueAsString(ModuleFacturationProAPI.FacturationProAPI_Login_API_PARAM_NAME);

        let authorization = 'Basic ' + Buffer.from(login + ':' + cle).toString('base64');

        return {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-User-Agent': auth,
            'Authorization': authorization
        };
    }

    private async get_all_pages(url: string, params: { [i: string]: string }) {
        let res: IDistantVOBase[] = [];
        let has_more: boolean = true;
        let page: number = 1;

        while (has_more) {
            has_more = false;
            let result_headers = {};
            let elts: { datas: IDistantVOBase[], headers: any } = await ModuleRequest.getInstance().sendRequestFromApp(
                ModuleRequest.METHOD_GET,
                "www.facturation.pro",
                (url.startsWith('/') ? url : '/' + url) + ModuleRequest.getInstance().get_params_url(
                    Object.assign({
                        page: page
                    }, params)
                ),
                null,
                await this.getHeadersRequest(),
                true,
                result_headers
            );

            res = res.concat(elts.datas);
            page++;

            let pagination = (elts.headers && elts.headers['x-pagination']) ? JSON.parse(elts.headers['x-pagination']) : null;
            has_more = pagination && pagination['total_pages'] && pagination['current_page'] &&
                (pagination['current_page'] < pagination['total_pages']);
        }

        return res;
    }
}