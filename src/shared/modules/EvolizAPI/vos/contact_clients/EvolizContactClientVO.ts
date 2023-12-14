export default class EvolizContactClientVO {
    // ID unique Evoliz (required & non null)
    public contactid: number;
    // ID du créateur du contact
    public userid: number;
    // Client
    public client: { clientid: number, code: string, civility: string, name: string };
    // Civilité
    public civility: string;
    // Nom de famille (required & non null)
    public lastname: string;
    // Prénom
    public firstname: string;
    // Email (required & non null)
    public email: string;
    // Profil du contact
    public profil: string;
    // Enum: "Assistant(e)", "Tel Bureau", "Tel Bureau 2", "Télécopie (bureau)", "Télécopie (domicile)", "Portable", "Domicile", "Domicile 2", "Principal", "Secondaire", "Autre 1", "Autre 2"
    public label_tel_primary: string;
    // Primary phone number, required when label_tel_primary is present
    public tel_primary: string;
    // Enum: "Assistant(e)", "Tel Bureau", "Tel Bureau 2", "Télécopie (bureau)", "Télécopie (domicile)", "Portable", "Domicile", "Domicile 2", "Principal", "Secondaire", "Autre 1", "Autre 2"
    public label_tel_secondary: string;
    // Secondary phone number, required when label_tel_secondary is present
    public tel_secondary: string;
    // Enum: "Assistant(e)", "Tel Bureau", "Tel Bureau 2", "Télécopie (bureau)", "Télécopie (domicile)", "Portable", "Domicile", "Domicile 2", "Principal", "Secondaire", "Autre 1", "Autre 2"
    public label_tel_tertiary: string;
    // Tertiary phone number, required when label_tel_tertiary is present
    public tel_tertiary: string;
    // Determines if the client is active
    public enabled: boolean;
    // Contact consent informations ; Default: "without" ; Enum: "without" "authorized" "unauthorized"
    public consent: string;
    // Custom field
    public custom_fields: {
        [field_name: string]: {
            label: string,
            value: string
        }
    };
}