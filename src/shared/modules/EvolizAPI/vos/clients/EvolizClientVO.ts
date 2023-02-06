export default class EvolizClientVO {
    public static API_TYPE_ID: string = "evoliz_client";

    public id: number;
    public _type: string = EvolizClientVO.API_TYPE_ID;

    // ID unique Evoliz
    public clientid: number;
    // ID du créateur du client
    public userid: number;
    // Code client
    public code: string;
    // Civilité
    public civility: string;
    // Nom
    public name: string;
    // Type: Particulier, Professionnel, Administration publique
    public type: string;
    // Client's company legalform
    public legalform: string;
    // SIRET
    public business_number: string;
    // APE, NAF
    public activity_number: string;
    // Numéro de TVA ou N/C si non-concerné
    public vat_number: string;
    // Registration number (RCS, RM)
    public immat_number: string;
    // Informations bancaires
    public bank_information: { bank_name: string, bank_account_detail: string, iban: string, bank_identification_code: string, };
    // Adresse
    public address: {
        addr: string,
        addr2: string,
        postcode: string,
        town: string,
        country: { label: string, iso2: string }
    };
    // Adresse de livraison
    public delivery_address: {
        addr: string,
        addr2: string,
        postcode: string,
        town: string,
        country: { label: string, iso2: string }
    };
    // Téléphone
    public phone: string;
    // Téléphone portable
    public mobile: string;
    // Fax
    public fax: string;
    // Site web
    public website: string;
    // Amount of outstanding guarantee
    public safe_amount: number;
    // Document condition informations
    public term: {
        // Client's quote period of validity (in days)
        validity: number,
        // Payment condition term
        payterm: { paytermid: number, label: string },
        // Payment condition type
        paytype: { paytypeid: number, label: string },
        // Penalty rate
        penalty: number,
        // Use legal mention about penalty rate
        nopenalty: boolean,
        // Use legal collection cost
        recovery_indemnity: boolean,
        // Discount rate
        discount_term: number,
        // No relevant discount rate
        no_discount_term: boolean
    };
    // Billing option (true is incl. taxes, false is excl. taxes and null is Company billing option)
    public ttc: boolean;
    // Comments on this client
    public comment: string;
    // Determines if the client is active
    public enabled: boolean;
    // Custom field
    public custom_fields: {
        [field_name: string]: {
            label: string,
            value: string
        }
    };
}