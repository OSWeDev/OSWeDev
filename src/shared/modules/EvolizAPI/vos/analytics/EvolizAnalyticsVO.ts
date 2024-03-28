export default class EvolizAnalyticsVO {
    public static API_TYPE_ID: string = "evoliz_analytics";

    public id: number;
    public _type: string = EvolizAnalyticsVO.API_TYPE_ID;

    //Analytical axis id
    public analyticid: number;
    //Analytical axis code identifier
    public code: string;
    //Analytical axis label
    public label: string;
    //Determines if analytical axis is active
    public enabled: boolean;
}