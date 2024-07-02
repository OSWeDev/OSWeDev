export default class EvolizInvoiceEmailVO {
    /**
     * Dynamic fields : https://evoliz.io/documentation#section/Invoice-email-dynamic-fields/Subject-dynamic-fields-and-their-values
     */

    // (REQUIRED) Array of email recipients address
    public to: string[];
    // You can select any email from your configured SMTP servers.
    // The default sender's email is your favored SMTP address. If not set, it defaults to notification@evoliz.com
    public from: string;
    // Send copy to your user email address
    public copy: boolean;
    // Add the PDF document as an attachment. When parameter is not set, the parameter in Evoliz app email setting is used.
    public attachment: boolean;
    // Subject of the email. See dynamic fields
    public subject: string;
    // Body of the email in txt or Html. See dynamic fields
    public body: string;
    // Send signature of your company in the email. Default: true
    public signature: boolean;
    // (DEPRECATED) Add "View PDF" and "Download PDF" links at the end of the email. When parameter is not set, the parameter in Evoliz app email setting is used.
    public links: boolean;
    public contact: {
        // Contact client civility
        civility: string,
        // Contact last name
        lastname: string,
        // Contact first name
        firstname: string
    };
}