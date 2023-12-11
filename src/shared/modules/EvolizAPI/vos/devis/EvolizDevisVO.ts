export default class EvolizDevisVO {
    public static API_TYPE_ID: string = "evoliz_devis";

    public id: number;
    public _type: string = EvolizDevisVO.API_TYPE_ID;

    // ID unique Evoliz
    public quoteid: number;
    // Document number
    public document_number: string;
    // Document’s creator ID
    public userid: number;
    // Linked client informations
    public client: { clientid: number, code: string, civility: string, name: string };
    // Linked prospect informations
    public prospect: { prospectid: number, code: string, name: string };
    // Organization's type of the quote
    public organization: string;
    // Company default currency
    public default_currency: {
        // Iso currency code
        code: string,
        // Conversion rate with the "EUR" currency
        conversion: number,
        // Currency symbol
        symbol: string
    };
    // Document currency
    public document_currency: { code: string, conversion: number, symbol: string };
    // Document total amounts
    public total: {
        // Document amount rebate
        rebate: { amount_vat_exclude: number, percent: number },
        // Total amount of the document excluding vat
        vat_exclude: number,
        // Total amount of vat
        vat: number,
        // Total amount of the document including vat
        vat_include: number,
        // Total sale margin information
        margin: {
            // Total purchase price
            purchase_price_vat_exclude: number,
            // Total margin percent
            percent: number,
            // Total margin amount
            amount: number
        },
        // Total amount remaining on this document
        net_to_pay: number
    };
    public currency_total: {
        rebate: { amount_vat_exclude: number, percent: number },
        vat_exclude: number,
        vat: number,
        vat_include: number,
        margin: { purchase_price_vat_exclude: number, percent: number, amount: number },
        net_to_pay: number
    };
    // Document status code
    public status_code: number;
    // Document status
    public status: string;
    // Document status date
    public status_dates: { create: string, sent: string, accept: string, wait: string, reject: string, order: string, pack: string, invoice: string, close: string };
    // object on the document
    public object: string;
    // Document date
    public documentdate: string;
    // Due date of the document
    public duedate: string;
    // Execution date of payment terms
    public execdate: string;
    // Delivery date of the document
    public delivery_date: string;
    // Validity duration of the document in days
    public validity: string;
    // Document condition informations
    public term: {
        // Penalty rate
        penalty: number,
        // Use legal mention about penalty rate
        nopenalty: boolean,
        // Use legal collection cost
        recovery_indemnity: boolean,
        // Discount rate
        discount_term: number,
        // No relevant discount rate
        no_discount_term: boolean,
        // Payment condition term
        payterm: { paytermid: number, label: string },
        // Payment condition type
        paytype: { paytypeid: number, label: string }
    };
    // Comments on the document with html
    public comment: string;
    // Comments on the document without html
    public comment_clean: string;
    // External Document number
    public external_document_number: string;
    // Determines if the document is active
    public enabled: boolean;
    // analytic axis of document
    public analytic: {
        // Analytical axis id
        id: number,
        // Analytical axis code identifier
        code: string,
        // Analytical axis label
        label: string,
        // Determines if analytical axis is active
        enabled: boolean
    };
    // Link of document file
    public file: string;
    // Link of linked documents list
    public links: string;
    // Webdocument link
    public webdoc: string;
    // Quote template
    public template: { templateid: number, label: string };
    // Document item
    public items: {
        // Item id
        itemid: number,
        // Article unique identifier
        articleid: number,
        // Article reference with html
        reference: string,
        // Article reference without html
        reference_clean: string,
        // Article designation with html
        designation: string,
        // Article designation without html
        designation_clean: string,
        // Article quantity
        quantity: number,
        // Quantity unit
        unit: string,
        // Article unit price excluding vat
        unit_price_vat_exclude: number,
        // Article unit price excluding vat in currency
        unit_price_vat_exclude_currency: number,
        // Article VAT rate
        vat: number,
        // Document total amounts
        total: {
            rebate: null,
            vat_exclude: number,
            vat: number,
            vat_include: number,
            margin: { purchase_unit_price_vat_exclude: number, coefficient: number, percent: number, amount: number }
        },
        // Document total amounts in currency
        currency_total: {
            rebate: { amount_vat_exclude: number, percent: number },
            vat_exclude: number,
            vat: number,
            vat_include: number,
            margin: { purchase_price_vat_exclude: number, percent: number, amount: number }
        },
        // Item classification information
        sale_classification: {
            // Classification id
            id: number,
            // Classification code
            code: number,
            // Classification label
            label: string
        }
    };
}