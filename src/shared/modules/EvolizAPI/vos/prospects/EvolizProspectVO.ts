export default class EvolizProspectVO {
    // ID unique Evoliz
    public prospectid: number;
    // ID du créateur du prospect
    public userid: number;
    // Nom (required & non null)
    public name: string;
    // SIRET
    public business_number: string;
    // APE, NAF
    public activity_number: string;
    // Numéro de TVA ou N/C si non-concerné ou Not Known
    public vat_number: string;
    // Adresse (required & non null)
    // En GET : {
    //     addr: string,
    //     addr2: string,
    //     postcode: string,
    //     town: string,
    //     country: { label: string, iso2: string }
    // };
    // En POST : {
    //     postcode: string,
    //     town: string,
    //     iso2: string
    //     addr: string,
    //     addr2: string,
    // };
    public address: {
        postcode: string,
        town: string,
        iso2?: string,
        addr: string,
        addr2?: string,
        country?: { label: string, iso2: string }
    };
    // Téléphone
    public phone: string;
    // Téléphone portable
    public mobile: string;
    // Fax
    public fax: string;
    // Site web
    public website: string;
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