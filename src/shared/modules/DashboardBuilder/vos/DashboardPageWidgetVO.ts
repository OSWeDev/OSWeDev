import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import NumRange from "../../DataRender/vos/NumRange";
import AbstractVO from "../../VO/abstract/AbstractVO";
import IDashboardGridItem from "../interfaces/IDashboardGridItem";
import FieldValueFilterWidgetOptionsVO from "./FieldValueFilterWidgetOptionsVO";
import MonthFilterWidgetOptionsVO from "./MonthFilterWidgetOptionsVO";
import YearFilterWidgetOptionsVO from "./YearFilterWidgetOptionsVO";

export default class DashboardPageWidgetVO extends AbstractVO implements IDistantVOBase, IDashboardGridItem {
    public static API_TYPE_ID: string = "dashboard_pwidget";

    public id: number;
    public _type: string = DashboardPageWidgetVO.API_TYPE_ID;

    public widget_id: number;

    public widget_name: string;
    public widget_description: string;

    /**
     * id de la page pour le widget en question.
     * @deprecated use page_id_ranges à la place
     * @see page_id_ranges
     */
    public page_id: number;

    /**
     * Tableau de ranges d'id de pages pour le widget en question.
     * Permet de gérer les widgets qui sont sur plusieurs pages.
     */
    public page_id_ranges: NumRange[];

    /***
     * @deprecated Use DashboardViewportPageWidgetVO.static instead
     */
    public static: boolean;

    /**
     * @deprecated Use DashboardViewportPageWidgetVO.x instead
     */
    public x: number;

    /**
     * @deprecated Use DashboardViewportPageWidgetVO.y instead
     */
    public y: number;

    /**
     * @deprecated Use DashboardViewportPageWidgetVO.w instead
     */
    public w: number;

    /**
     * @deprecated Use DashboardViewportPageWidgetVO.h instead
     */
    public h: number;

    /**
     * @deprecated Use DashboardViewportPageWidgetVO.i instead
     */
    public i: number;

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

    // Idem pour les scales : x == scale_1_title, y == scale_2_title, ...
    public scale_1_titre: string;
    public scale_2_titre: string;
    public scale_3_titre: string;
    public scale_4_titre: string;
    public scale_5_titre: string;
    public scale_6_titre: string;
    public scale_7_titre: string;
    public scale_8_titre: string;
    public scale_9_titre: string;
    public scale_10_titre: string;
    public scale_11_titre: string;
    public scale_12_titre: string;

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