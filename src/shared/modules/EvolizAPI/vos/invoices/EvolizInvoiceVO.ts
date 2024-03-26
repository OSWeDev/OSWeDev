export default class EvolizInvoiceVO {
    public static API_TYPE_ID: string = "evoliz_invoice";

    public id: number;
    public _type: string = EvolizInvoiceVO.API_TYPE_ID;

    // ID unique Evoliz
    public invoiceid: number;
    // Invoice's type: invoice, situation, benefit
    public typedoc: string;
    // Document number
    public document_number: string;
    // Document’s creator ID
    public userid: number;
    // Linked client informations
    public client: { clientid: number, code: string, civility: string, name: string };
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
        // Total amount of advance on this document
        advance: number,
        // Paid amount on document
        paid: number,
        // Total amount remaining on this document
        net_to_pay: number
    };
    public currency_total: {
        rebate: { amount_vat_exclude: number, percent: number },
        vat_exclude: number,
        vat: number,
        vat_include: number,
        margin: { purchase_price_vat_exclude: number, percent: number, amount: number },
        advance: number,
        paid: number,
        net_to_pay: number
    };
    // Document status code
    public status_code: number;
    // Document status
    public status: string;
    // Document status date
    public status_dates: { create: string, sent: string, inpayment: string, paid: string, match: string };
    // Document locked: True if locked and false otherwise
    public locked: boolean;
    // Document lock date
    public lockdate: string;
    // object on the document
    public object: string;
    // Document date
    public documentdate: string;
    // Due date of the document
    public duedate: string;
    // Execution date of payment terms
    public execdate: string;
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
    // Number of recoveries sent for the current invoice
    public recovery_number: number;
    // Document retention information
    public retention: {
        // Retention percent
        percent: number,
        // Retention amount
        amount: number,
        // Retention amount in currency
        currency_amount: number,
        // Retention Date
        date: string
    };
    // Document item
    public items: Array<{
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
            code: string,
            // Classification label
            label: string
        }
    }>;
}