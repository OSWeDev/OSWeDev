import EvolizPayTypeVO from "../pay_type/EvolizPayTypeVO";
import EvolizPaymentTermsVO from "../payment_terms/EvolizPaymentTermsVO";

export default class EvolizCompanyVO {
    public static API_TYPE_ID: string = "evoliz_company";

    public id: number;
    public _type: string = EvolizCompanyVO.API_TYPE_ID;

    //Object unique identifier
    public companyid: number;
    //Company code identifier
    public company_code: string;
    //Name ; <= 200 characters
    public company_name: string;
    //Access path for the company ; <= 80 characters / (^([a-z0-9]+)?$)/u
    public access_path: string;
    //Email ; <= 200 characters
    public email: string;
    //Phone ;  <= 25 characters
    public phone: string;
    //Legal status
    public legal_status: {
        //Legal status code
        legal_status_code: string,
        //Legal status label
        label: string,
        //Other legal status label, only when legal_status_code set to other
        other_label: string
    };
    //Address information
    public address: {
        addr: string,
        addr2: string,
        postcode: string,
        town: string,
        country: {
            label: string,
            iso2: string
        }
    };
    //Affiliated site information
    public home_site: {
        //Affiliated site id
        home_siteid: number,
        //Affiliated site name
        home_site: string,
    };
    //Template menu
    public template_menu: {
        //Object unique identifier
        template_menuid: number,
        //Template menu label
        label: string,
        //Fonctional mode ; Enum: "business" "banking"
        mode: string,
        //Fonctional mode label
        mode_label: string,
        //Template menu creation date
        stampdate: string,
    };
    //User last connection date
    public lastconnect: string;
    //Fonctional mode ; Enum: "BUSINESS" "BANKING"
    public mode: string;
    //Determines if the company is in production mode
    public live: boolean;
    //Payment condition term
    public payterm: EvolizPaymentTermsVO;
    //Payment condition type
    public paytype: EvolizPayTypeVO;
}