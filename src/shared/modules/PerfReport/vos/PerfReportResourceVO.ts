import IDistantVOBase from "../../IDistantVOBase";

export default class PerfReportResourceVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "perf_report_resource";

    public id: number;
    public _type: string = PerfReportResourceVO.API_TYPE_ID;

    /**
     * Nom unique de la resource (au sein du rapport)
     */
    public name: string;

    /**
     * Des infos complémentaires, affichées dans la popup
     */
    public description: string;

    /**
     * Les datas / séries de cette ressource
     */
    public datas: {
        [serie_name: string]: {
            start: number;
            end?: number; // Suivant le type de ressource, on peut ne pas avoir de end
            description?: string; // Des infos complémentaires, affichées dans la popup
        }
    };
}