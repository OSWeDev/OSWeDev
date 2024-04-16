import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import AbstractVO from "../../VO/abstract/AbstractVO";
import DashboardBuilderController from "../DashboardBuilderController";
import IDashboardGridItem from "../interfaces/IDashboardGridItem";
import FieldValueFilterWidgetOptionsVO from "./FieldValueFilterWidgetOptionsVO";
import MonthFilterWidgetOptionsVO from "./MonthFilterWidgetOptionsVO";
import YearFilterWidgetOptionsVO from "./YearFilterWidgetOptionsVO";

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

    public json_options: string;

    public background: string;

    get translatable_name_code_text(): string {

        if (!this.widget_id) {
            return null;
        }

        return DashboardBuilderController.WIDGET_NAME_CODE_PREFIX + this.widget_id;
    }

    /**
     * Create a new instance from a widget_options object
     *
     * @param {any | FieldValueFilterWidgetOptionsVO | MonthFilterWidgetOptionsVO | YearFilterWidgetOptionsVO} widget_options
     * @returns
     */
    public from_widget_options(widget_options: any | FieldValueFilterWidgetOptionsVO | MonthFilterWidgetOptionsVO | YearFilterWidgetOptionsVO) {
        let json_options = null;

        if (typeof widget_options === 'object') {
            json_options = JSON.stringify(widget_options);
        }

        this.json_options = json_options;


        return this;
    }
}