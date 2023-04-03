import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { VOFieldRefVOTypeHandler } from '../../../../../../shared/modules/DashboardBuilder/handlers/VOFieldRefVOTypeHandler';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import FieldValueFilterBooleanWidgetComponent from './boolean/FieldValueFilterBooleanWidgetComponent';
import FieldValueFilterDateWidgetComponent from './date/FieldValueFilterDateWidgetComponent';
import FieldValueFilterEnumWidgetComponent from './enum/FieldValueFilterEnumWidgetComponent';
import './FieldValueFilterWidgetComponent.scss';
import FieldValueFilterNumberWidgetComponent from './number/FieldValueFilterNumberWidgetComponent';
import FieldValueFilterWidgetOptions from './options/FieldValueFilterWidgetOptions';
import FieldValueFilterStringWidgetComponent from './string/FieldValueFilterStringWidgetComponent';

@Component({
    template: require('./FieldValueFilterWidgetComponent.pug'),
    components: {
        Fieldvaluefilterstringwidgetcomponent: FieldValueFilterStringWidgetComponent,
        Fieldvaluefilterbooleanwidgetcomponent: FieldValueFilterBooleanWidgetComponent,
        Fieldvaluefilterenumwidgetcomponent: FieldValueFilterEnumWidgetComponent,
        Fieldvaluefilterdatewidgetcomponent: FieldValueFilterDateWidgetComponent,
        Fieldvaluefilternumberwidgetcomponent: FieldValueFilterNumberWidgetComponent
    }
})
export default class FieldValueFilterWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;


    get is_type_boolean(): boolean {
        return VOFieldRefVOTypeHandler.is_type_boolean(this.vo_field_ref);
    }

    get is_type_enum(): boolean {
        return VOFieldRefVOTypeHandler.is_type_enum(this.vo_field_ref);
    }

    get is_type_date(): boolean {
        return VOFieldRefVOTypeHandler.is_type_date(this.vo_field_ref);
    }

    get is_type_string(): boolean {
        return VOFieldRefVOTypeHandler.is_type_string(this.vo_field_ref);
    }

    get is_type_number(): boolean {
        return VOFieldRefVOTypeHandler.is_type_number(this.vo_field_ref);
    }

    get vo_field_ref(): VOFieldRefVO {
        let options: FieldValueFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }


        let options: FieldValueFilterWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as FieldValueFilterWidgetOptions;
                options = options ? new FieldValueFilterWidgetOptions(
                    options.vo_field_ref,
                    options.vo_field_ref_lvl2,
                    options.vo_field_sort,
                    options.can_select_multiple,
                    options.is_checkbox,
                    options.checkbox_columns,
                    options.max_visible_options,
                    options.show_search_field,
                    options.hide_lvl2_if_lvl1_not_selected,
                    options.segmentation_type,
                    options.advanced_mode,
                    options.default_advanced_string_filter_type,
                    options.hide_btn_switch_advanced,
                    options.hide_advanced_string_filter_type,
                    options.vo_field_ref_multiple,
                    options.default_filter_opt_values,
                    options.default_ts_range_values,
                    options.default_boolean_values,
                    options.hide_filter,
                    options.no_inter_filter,
                    options.has_other_ref_api_type_id,
                    options.other_ref_api_type_id,
                    options.exclude_filter_opt_values,
                    options.exclude_ts_range_values,
                    options.placeholder_advanced_mode,
                    options.separation_active_filter,
                    options.vo_field_sort_lvl2,
                    options.autovalidate_advanced_filter,
                    options.add_is_null_selectable,
                    options.is_button,
                    options.enum_bg_colors,
                    options.enum_fg_colors,
                    options.show_count_value,
                    options.active_field_on_autovalidate_advanced_filter,
                    options.force_filter_all_api_type_ids,
                    options.bg_color,
                    options.fg_color_value,
                    options.fg_color_text,
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }
}