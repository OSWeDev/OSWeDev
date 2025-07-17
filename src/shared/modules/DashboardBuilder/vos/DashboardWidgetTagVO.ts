import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";


/**
 * @class DashboardWidgetTagVO
 *  - DashboardWidgetTagVO is the DashboardPageWidgetVO type actually
 *
 * May be renamed to DashboardWidgetTypeVO
 */
export default class DashboardWidgetTagVO implements IDistantVOBase, IWeightedItem {
    public static API_TYPE_ID: string = "dashboard_widget_tag";

    public static WIDGET_TAG_OSELIA: string = "oselia"; // Widget Oselia, Graph Osélia, ...
    public static WIDGET_TAG_TABLE: string = "table"; // Tableau de données, BulkOpts, Supervision ...
    public static WIDGET_TAG_VARS: string = "vars"; // Graphs, KPIs, ...
    public static WIDGET_TAG_FILTER: string = "filter"; // Filtres
    public static WIDGET_TAG_TEMPLATE: string = "template"; // Modèles de pages
    public static WIDGET_CMS: string = "cms"; // Texte, images, vidéos, ...
    public static WIDGET_FAVORIS: string = "favoris"; // Gestion des filtres favoris

    public id: number;
    public _type: string = DashboardWidgetTagVO.API_TYPE_ID;

    public name: string;
    public description: string;

    public weight: number;

    /**
     * Le classe de l'icône à afficher pour ce tag
     */
    public icon_classname: string;
}