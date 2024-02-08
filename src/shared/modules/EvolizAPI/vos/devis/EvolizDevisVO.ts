export default class EvolizDevisVO {
    public static API_TYPE_ID: string = "evoliz_devis";

    public static STATUS_CONTRAT_EFFECTUE: number = 0;
    public static STATUS_PROPOSITION_EFFECTUEE: number = 1;
    public static STATUS_NEGOCITATION: number = 2;
    public static STATUS_CONFIRMEE: number = 3;
    public static STATUS_FACTUREE: number = 4;
    public static STATUS_PERDUE: number = 5;

    public static STATUS_CONTRAT_EFFECTUE_LABEL: string = 'evoliz_devis.status_contrat_effectue.___LABEL___';
    public static STATUS_PROPOSITION_EFFECTUEE_LABEL: string = 'evoliz_devis.status_proposition_effectuee.___LABEL___';
    public static STATUS_NEGOCITATION_LABEL: string = 'evoliz_devis.status_negociation.___LABEL___';
    public static STATUS_CONFIRMEE_LABEL: string = 'evoliz_devis.status_confirmee.___LABEL___';
    public static STATUS_FACTUREE_LABEL: string = 'evoliz_devis.status_facturee.___LABEL___';
    public static STATUS_PERDUE_LABEL: string = 'evoliz_devis.status_perdue.___LABEL___';

    public static STATE_LABELS: { [id: number]: string } = {
        [EvolizDevisVO.STATUS_CONTRAT_EFFECTUE]: EvolizDevisVO.STATUS_CONTRAT_EFFECTUE_LABEL,
        [EvolizDevisVO.STATUS_PROPOSITION_EFFECTUEE]: EvolizDevisVO.STATUS_PROPOSITION_EFFECTUEE_LABEL,
        [EvolizDevisVO.STATUS_NEGOCITATION]: EvolizDevisVO.STATUS_NEGOCITATION_LABEL,
        [EvolizDevisVO.STATUS_CONFIRMEE]: EvolizDevisVO.STATUS_CONFIRMEE_LABEL,
        [EvolizDevisVO.STATUS_FACTUREE]: EvolizDevisVO.STATUS_FACTUREE_LABEL,
        [EvolizDevisVO.STATUS_PERDUE]: EvolizDevisVO.STATUS_PERDUE_LABEL,
    };

    public static getStatus(status_code: number): number {

        switch (status_code) {
            case 0:
            case 1:
            case 2:
                return EvolizDevisVO.STATUS_CONTRAT_EFFECTUE;
            case 4:
                return EvolizDevisVO.STATUS_PROPOSITION_EFFECTUEE;
            case 8:
            case 12:
                return EvolizDevisVO.STATUS_CONFIRMEE;
            case 16:
            case 20:
            case 24:
                return EvolizDevisVO.STATUS_FACTUREE;
            case -1:
                return EvolizDevisVO.STATUS_PERDUE;
            default:
                return null;
        }
    }

    public static getStatusLabel(status_code: number): string {

        switch (status_code) {
            case 0:
            case 1:
            case 2:
                return EvolizDevisVO.STATUS_CONTRAT_EFFECTUE_LABEL;
            case 4:
                return EvolizDevisVO.STATUS_PROPOSITION_EFFECTUEE_LABEL;
            case 8:
            case 12:
                return EvolizDevisVO.STATUS_CONFIRMEE_LABEL;
            case 16:
            case 20:
            case 24:
                return EvolizDevisVO.STATUS_FACTUREE_LABEL;
            case -1:
                return EvolizDevisVO.STATUS_PERDUE_LABEL;
            default:
                return null;
        }
    }

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
    // 1: filled => First state of a quote, document is now a draft with a temporary document_number
    // 2: create => In this state the document document_number is now definitive
    // 4: sent => A document that has been sent to a client or marked as sent
    // 0: wait => A document that has been marked as waiting
    // 8: accept => A document that has been marked as accepted
    // -1: reject => A document that has been marked as rejected
    // 12: corder => A document that has a related sale order
    // 16: delivery => A document that has a related delivery
    // 20: invoice => A document that has a related invoice
    // 24: close => A document that has been marked as closed
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