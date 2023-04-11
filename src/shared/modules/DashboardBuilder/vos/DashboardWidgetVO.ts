import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import INamedVO from "../../../interfaces/INamedVO";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import DefaultTranslation from "../../Translation/vos/DefaultTranslation";
import DashboardBuilderController from "../DashboardBuilderController";

export default class DashboardWidgetVO implements IDistantVOBase, IWeightedItem, INamedVO {
    public static API_TYPE_ID: string = "dashboard_widget";

    public static WIDGET_NAME_bulkops: string = 'bulkops';
    public static WIDGET_NAME_checklist: string = 'checklist';
    public static WIDGET_NAME_supervision: string = 'supervision';
    public static WIDGET_NAME_supervision_type: string = 'supervision_type';
    public static WIDGET_NAME_datatable: string = 'datatable';
    public static WIDGET_NAME_valuetable: string = 'valuetable';
    public static WIDGET_NAME_fieldvaluefilter: string = 'fieldvaluefilter';
    public static WIDGET_NAME_dowfilter: string = 'dowfilter';
    public static WIDGET_NAME_monthfilter: string = 'monthfilter';
    public static WIDGET_NAME_advanceddatefilter: string = 'advanceddatefilter';
    public static WIDGET_NAME_yearfilter: string = 'yearfilter';
    public static WIDGET_NAME_validationfilters: string = 'validationfilters';
    public static WIDGET_NAME_var: string = 'var';
    public static WIDGET_NAME_pageswitch: string = 'pageswitch';
    public static WIDGET_NAME_varpiechart: string = 'varpiechart';

    public id: number;
    public _type: string = DashboardWidgetVO.API_TYPE_ID;

    get translatable_name_code_text(): string {

        if (!this.id) {
            return null;
        }
        return DashboardBuilderController.WIDGET_NAME_CODE_PREFIX + this.id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public weight: number;

    public widget_component: string;
    public options_component: string;
    public icon_component: string;

    public default_width: number;
    public default_height: number;

    /**
     * Needs to be unique for ergonomy and widget retrieval
     */
    public name: string;

    public default_background: string;

    public is_filter: boolean;
    public is_validation_filters: boolean;
}