import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import AbstractVO from "../../VO/abstract/AbstractVO";
import IDashboardGridItem from "../interfaces/IDashboardGridItem";

export default class DashboardPageWidgetVO extends AbstractVO implements IDistantVOBase, IDashboardGridItem, IWeightedItem {
    public static API_TYPE_ID: string = "dashboard_pwidget";

    public id: number;
    public _type: string = DashboardPageWidgetVO.API_TYPE_ID;

    public widget_id: number;

    /**
     * id de la page pour le widget en question.
     */
    public page_id: number;

    // public isdraggable: boolean;
    // public isresizable: boolean;
    public static: boolean;
    // public minh: number;
    // public minw: number;
    // public maxh: number;
    // public maxw: number;
    public x: number;
    public y: number;
    public w: number;
    public h: number;
    public i: number;
    // public dragallowfrom: string;
    // public dragignorefrom: string;
    // public resizeignorefrom: string;
    // public preserveaspectratio: boolean;

    public weight: number;

    /**
     * Le nom du type de données qui permet de configurer les options du widget.
     */
    public widget_options_vo_type: string;

    public background: string;

    public show_widget_on_viewport: boolean;
    public dashboard_viewport_id: number;

    public title: string;
}