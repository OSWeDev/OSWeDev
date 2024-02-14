export default class EvolizArticleVO {
    public static API_TYPE_ID: string = "evoliz_article";

    public id: number;
    public _type: string = EvolizArticleVO.API_TYPE_ID;

    //Object unique identifier
    public articleid: number;
    //Document’s creator ID
    public userid: string;
    //Article reference with html
    public reference: string;
    //Article reference without html
    public reference_clean: string;
    //Article Type: Enum: product, service
    public nature: string;
    //Item sell classification information
    public sale_classifiaction: {
        //Classification id
        id: number,
        //Classification code
        code: string
        //Classification label
        label: string
    };
    //Article designation with html
    public designation: string;
    //Article designation without html
    public designation_clean: string;
    //Article quantity
    public quantity: string;
    //Item weight
    public weight: string;
    //Quantity unit
    public unit: string;
    //Article unit price excluding vat
    public unit_price_vat_exclude: string;
    //Article unit price including vat
    public unit_price_vat_include: string;
    //Article VAT rate
    public vat: string;
    //Billing option (true is incl. taxes, false is excl. taxes and null is Company billing option)
    public ttc: string;
    //Item purchase classification information
    public purchase_classification: {
        //Classification id
        id: number,
        //Classification code
        code: string
        //Classification label
        label: string
    };
    //Sale margin information
    public margin: {
        //Purchase unit price
        purchase_unit_price_vat_exclude: number,
        //Margin coefficient
        coefficient: string
        //Margin percent
        margin_percent: string
        //Markup percent
        markup_percent: string
        //Margin amount
        amount: string
    };
    //Linked supplier information
    public supplier: {
        //Linked supplier Id
        supplierid: number,
        //Supplier Code identifier
        code: string
        //Supplier name
        name: string
    };
    //Article reference from the supplier with html
    public supplier_reference: string;
    //Article reference from the supplier without html
    public supplier_reference_clean: string;
    //Stock management for the article
    public stock_management: string;
    //Article stocked quantity
    public stock_quantity: string;
    //Determines if the article is active
    public enabled: string;
    //Link to article picture file
    public picture_link: string;
    //Custom field
    public custom_fields: {
        //Hash of the custom field id
        custom_field_api: {
            label: string
            value: string
        },
        //Hash of another custom field id
        custom_field_api2: {
            label: string
            value: string
        }
    };
}