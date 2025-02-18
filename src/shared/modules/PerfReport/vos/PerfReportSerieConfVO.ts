import IDistantVOBase from "../../IDistantVOBase";

export default class PerfReportSerieConfVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "perf_report_serie_conf";

    public static SERIE_TYPE_LABELS: string[] = [
        "PerfReportSerieConfVO.SERIE_TYPE_DOT",
        "PerfReportSerieConfVO.SERIE_TYPE_RECTANGLE",
    ];
    public static SERIE_TYPE_DOT: number = 0;
    public static SERIE_TYPE_RECTANGLE: number = 1;


    public id: number;
    public _type: string = PerfReportSerieConfVO.API_TYPE_ID;

    /**
     * Nom unique de la série (au sein du rapport)
     */
    public name: string;

    /**
     * Infos complémentaires, affichées dans la popup
     */
    public description: string;

    /**
     * Le type de série (pour savoir comment on l'affiche)
     */
    public serie_type: number;

    /**
     * Couleur de la série
     */
    public color: string;
}