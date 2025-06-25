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

    public titre: string;


    /**
     * TODO FIXME : DELETE ME dès que possible
     * Petite siouxerie le temps de mettre en oeuvre les VOs de param des Widgets correctement : on importe les confs de titres/translatable_string ici dans un VO
     * Pour l'export/import. Et on rebasculera après dans les VOs de param des Widgets
     */
    // Le placeholder
    public placeholder: string;
    // Le placeholder du mode avancé
    public advanced_mode_placeholder: string;
    // Var 1
    public var_1_titre: string;
    // Var 2
    public var_2_titre: string;
    // Tableau de vars => on triche on rajoute juste des vars 3, 4, 5 .... 12 (ya pas encore de composant pour translatable_string_array....)
    public var_3_titre: string;
    public var_4_titre: string;
    public var_5_titre: string;
    public var_6_titre: string;
    public var_7_titre: string;
    public var_8_titre: string;
    public var_9_titre: string;
    public var_10_titre: string;
    public var_11_titre: string;
    public var_12_titre: string;
    /**
     * !TODO FIXME : DELETE ME dès que possible
     */

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