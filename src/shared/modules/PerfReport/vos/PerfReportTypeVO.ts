import IDistantVOBase from "../../IDistantVOBase";

export default class PerfReportTypeVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "perf_report_type";

    public id: number;
    public _type: string = PerfReportTypeVO.API_TYPE_ID;

    /**
     * Nom du type de rapport (Globalement le module qui le génère, par exemple Eventify)
     */
    public name: string;

    /**
     * Description du type de rapport et surtout de ce qu'il contient / comment on affiche les données récoltées
     *  Par exemple et en particulier ça sert à décrire les séries de données récoltées et les couleurs / choix graphiques
     */
    public description: string;
}