import IDistantVOBase from "../../IDistantVOBase";

export default class PerfReportVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "perf_report";

    public id: number;
    public _type: string = PerfReportVO.API_TYPE_ID;

    /**
     * Nom unique du rapport, permettant de s'y référer
     */
    public name: string;

    /**
     * Type de rapport (Globalement le module qui le génère, par exemple Eventify)
     */
    public perf_report_type: number;

    /**
     * Date de début du rapport
     */
    public start_date: number;

    /**
     * La version issue des perfs, en ms
     */
    public start_date_perf_ms: number;

    /**
     * Date de création du rapport (donc de fin du perf log)
     */
    public end_date: number;

    /**
     * La version issue des perfs, en ms
     */
    public end_date_perf_ms: number;

    /**
     * Le texte traductible indiquant le type de ressource ("Listener" pour eventify par exemple, ...)
     */
    public resource_column_translatable_name: string;

    // TODO est-ce que la conf des série c'est par rapport ou par rapport type ?
}