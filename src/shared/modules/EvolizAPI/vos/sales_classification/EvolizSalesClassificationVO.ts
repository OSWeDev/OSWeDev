export default class EvolizSalesClassificationVO {
    public static API_TYPE_ID: string = "evoliz_sales_classification";

    public id: number;
    public _type: string = EvolizSalesClassificationVO.API_TYPE_ID;

    // Classification Id
    public classificationid: number;
    // Classification code
    public code: string;
    // Classification label
    public label: string;
    // Accounting account
    public account: {
        // Object unique identifier
        accountid: number;
        // Account number
        code: string;
        // Account label
        label: string;
    };
    // Classification enabled state
    public enabled: boolean;
}