import AccessPolicyTools from '../../tools/AccessPolicyTools';
import IDistantVOBase from '../IDistantVOBase';
import Module from '../Module';
import ModuleParams from '../Params/ModuleParams';
import ModuleRequest from '../Request/ModuleRequest';
import FactuProCategoriesLISTParams from './vos/categories/FactuProCategoriesLISTParams';
import FactuProCategoryVO from './vos/categories/FactuProCategoryVO';
import FactuProCustomersLISTParams from './vos/customers/FactuProCustomersLISTParams';
import FactuProCustomerVO from './vos/customers/FactuProCustomerVO';
import FactuProInvoicesLISTParams from './vos/invoices/FactuProInvoicesLISTParams';
import FactuProProductsLISTParams from './vos/products/FactuProProductsLISTParams';
import FactuProProductVO from './vos/products/FactuProProductVO';
import FactuProInvoiceVO from './vos/invoices/FactuProInvoiceVO';

export default class ModuleFacturationProAPI extends Module {

    public static FacturationProAPI_AUTH_PARAM_NAME: string = 'FacturationProAPI.FacturationProAPI_AUTH';
    public static FacturationProAPI_Login_API_PARAM_NAME: string = 'FacturationProAPI.FacturationProAPI_Login_API';
    public static FacturationProAPI_Cle_API_PARAM_NAME: string = 'FacturationProAPI.FacturationProAPI_Cle_API';

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

    private constructor() {

        super("factuproapi", ModuleFacturationProAPI.MODULE_NAME);
    }

    public registerApis() {
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

    private async get_all_pages(url: string, params: { [i: string]: string }) {
        let res: IDistantVOBase[] = [];
        let has_more: boolean = true;
        let page: number = 1;

        while (has_more) {
            has_more = false;
            let result_headers = {};
            let elts: IDistantVOBase[] = await ModuleRequest.getInstance().sendRequestFromApp(
                ModuleRequest.METHOD_GET,
                "www.facturation.pro",
                url + ModuleRequest.getInstance().get_params_url(
                    Object.assign({
                        page: page
                    }, params)
                ),
                null,
                await this.getHeadersRequest(),
                true,
                result_headers
            );

            res = res.concat(elts);
            page++;
            has_more = result_headers && result_headers['total_pages'] && result_headers['current_page'] &&
                (result_headers['current_page'] < result_headers['total_pages']);
        }

        return res;
    }

    private async getHeadersRequest(): Promise<any> {

        let auth = await ModuleParams.getInstance().getParamValue(ModuleFacturationProAPI.FacturationProAPI_AUTH_PARAM_NAME);

        return {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-User-Agent': auth
        };
    }
}