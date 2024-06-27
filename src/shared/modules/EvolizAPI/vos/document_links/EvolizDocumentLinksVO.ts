export default class EvolizDocumentLinksVO {
    public static API_TYPE_ID: string = "evoliz_document_links";

    public id: number;
    public _type: string = EvolizDocumentLinksVO.API_TYPE_ID;

    public credits: Array<{
        id: number,
        link: string,
    }>;

    public payments: Array<{
        id: number,
        link: string,
    }>;

    public advances: Array<{
        id: number,
        link: string,
    }>;

    public invoices: Array<{
        id: number,
        link: string,
    }>;

    public deliveries: Array<{
        id: number,
        link: string,
    }>;

    public sale_orders: Array<{
        id: number,
        link: string,
    }>;

    public quotes: Array<{
        id: number,
        link: string,
    }>;

    public cashentries: Array<{
        id: number,
        link: string,
    }>;


}