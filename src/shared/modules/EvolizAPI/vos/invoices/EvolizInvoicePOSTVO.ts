// VO Invoice pour la création de facture
export default class EvolizInvoicePOSTVO {

    // (REQUIRED format: YYYY-MM-DD) Document date
    public documentdate: string;
    // (REQUIRED) The client's id to attach the invoice to
    public clientid: number;
    // External Document number, must be unique
    public external_document_number: string;
    // The client's contact id to adress the invoice to
    public contactid: number;
    // object on the document
    public object: string;
    // (REQUIRED) Invoice condition information
    public term: {
        // (REQUIRED) Payment term identifier
        paytermid: number,
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
        // Payment due date, required if paytermid is 18 (Saisir une date), must be after or equal to documentdate
        duedate: string,
        // Payment delay in days, required if paytermid is 16 (Autre condition)
        paydelay: number,
        // Payment is due at the end of the month, required if paytermid is 16 (Autre condition)
        endmonth: boolean,
        // Payment day, required if paytermid is 16 (Autre condition)
        payday: number,
        // Payment type identifier
        paytypeid: number,
    };
    // Comments on the document with html
    public comment: string;
    // (REQUIRED) Analytic axis id, this field is accepted only when analytic option is enabled, required if invoice is checked in analytic configuration.
    public analyticid: number;
    // Invoice rebate in amount, must be between 0 and the invoice total amount excluding vat
    public global_rebate: number;
    // Execution date of payment terms
    public execdate: string;
    // Document retention information
    public retention: {
        // Retention percent
        percent: number,
        // Retention Date
        date: string
    };
    // Default: false; Indicate whether to include sale general conditions in the document PDF or not
    public include_sale_general_conditions: boolean;
    // Template ID
    public templateid: number;
    // Invoice items: On rempli obligatoirement soit articleid, soit designation, quantity et unit_price_vat_exclude
    public items: Array<{
        // (REQUIRED) Article unique identifier
        articleid: number,
        // (REQUIRED Si pas de articleid) Article designation with html
        designation: string,
        // (REQUIRED Si pas de articleid) Article quantity
        quantity: number,
        // (REQUIRED Si pas de articleid) Article unit price excluding vat
        unit_price_vat_exclude: number,
        // Article reference with html
        reference: string,
        // Quantity unit
        unit: string,
        // Article VAT rate
        vat_rate: number,
        // Item rebate
        rebate: number,
        // Item sale classification id, only accepted when sale classification are enabled, required if invoice is checked in classifications configuration.
        sale_classificationid: number,
        // Item purchase unit price vat excluded, must be less than unit price vat excluded
        purchase_unit_price_vat_exclude: number,
    }>;
}