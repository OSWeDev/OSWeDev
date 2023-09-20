export default class EvolizContactClientVO {
    // ID unique Evoliz (required & non null)
    public clientid: number;
    // Client
    public client: { clientid: number, code: string, civility: string, name: string };
    // Nom de famille (required & non null)
    public lastname: string;
    // Email (required & non null)
    public email: string;
    // Civilité
    public civility: string;
    // Prénom
    public firstname: string;
    // Profil du contact
    public profil: string;
    // Contact consent informations ; Default: "without" ; Enum: "without" "authorized" "unauthorized"
    public consent: string;
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
}