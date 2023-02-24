export default class FactuProInvoicesEmailParams {
    // Mail cible, si non renseigné, le mail de la fiche client de FactuPro sera utilisé
    public to?: string;
    // cc et bcc sont remplis automatiquement avec les adresses renseignées dans la page Paramètres / Emails de FactuPro
    public cc: string;
    public bcc: string;
    // Titre du mail
    public subject: string;
    // Message du mail
    public message: string;
}