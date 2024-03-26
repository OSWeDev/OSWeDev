import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import VarLineChartWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VarLineChartWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import TimeSegment from '../../../../../../../shared/modules/DataRender/vos/TimeSegment';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import ChartJsScaleOptionsComponent from '../../../../chartjs/scale_options/ChartJsScaleOptionsComponent';
import WidgetFilterOptionsComponent from '../../var_widget/options/filters/WidgetFilterOptionsComponent';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import './VarLineChartWidgetOptionsComponent.scss';
import { Scale } from 'chart.js';
import ModuleTableController from '../../../../../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldVO from '../../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';

@Component({
    template: require('./VarLineChartWidgetOptionsComponent.pug'),
    components: {
        Chartjsscaleoptionscomponent: ChartJsScaleOptionsComponent,
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Widgetfilteroptionscomponent: WidgetFilterOptionsComponent,
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class VarLineChartWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    @ModuleDashboardPageGetter
    private get_custom_filters: string[];

    private next_update_options: VarLineChartWidgetOptionsVO = null;
    private throttled_reload_options = ThrottleHelper.declare_throttle_without_args(this.reload_options.bind(this), 50, { leading: false, trailing: true });
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });
    private throttled_update_colors = ThrottleHelper.declare_throttle_without_args(this.update_colors.bind(this), 800, { leading: false, trailing: true });

    private tmp_selected_var_name_1: string = null;
    private tmp_selected_var_name_2: string = null;

    private custom_filter_names_1: { [field_id: string]: string } = {};
    private custom_filter_names_2: { [field_id: string]: string } = {};
    private dimension_custom_filter_name: string = null;

    private bg_color_1: string = null;
    private bg_color_2: string = null;
    private border_color_1: string = null;
    private border_color_2: string = null;
    private bg_color: string = null;
    private legend_font_color: string = null;
    private title_font_color: string = null;

    private legend_display: boolean = false;
    private max_is_sum_of_var_1_and_2: boolean = false;
    private legend_use_point_style: boolean = false;
    private title_display: boolean = false;
    private has_dimension: boolean = false;
    private sort_dimension_by_asc: boolean = false;
    private dimension_is_vo_field_ref: boolean = false;

    private legend_font_size: string = null;
    private legend_box_width: string = null;
    private legend_padding: string = null;
    private title_font_size: string = null;
    private title_padding: string = null;
    private max_dimension_values: string = null;
    private border_width_1: string = null;

    private scale_x_color?: string = null;
    private scale_y_color?: string = null;

    private scale_options_x_1?: Partial<Scale> = null;
    private scale_options_y_1?: Partial<Scale> = null;
    private scale_options_r_1?: Partial<Scale> = null;

    private border_width_2: string = null;

    private tmp_selected_legend_position: string = null;
    private tmp_selected_dimension_custom_filter_segment_type: string = null;

    private widget_options: VarLineChartWidgetOptionsVO = null;

    private dimension_custom_filter_segment_types: string[] = [
        this.label('VarLineChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_YEAR),
        this.label('VarLineChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_MONTH),
        // this.label('VarLineChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_DAY),
        // this.label('VarLineChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_WEEK),
        // this.label('VarLineChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_ROLLING_YEAR_MONTH_START),
        this.label('VarLineChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_HOUR),
        this.label('VarLineChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_MINUTE),
        this.label('VarLineChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_SECOND),
    ];

    private scale_types_options: string[] = [
        'linear',
        'logarithmic',
        'category',
        'time',
        'radialLinear'
    ];

    private legend_positions: string[] = [
        'top',
        'left',
        'bottom',
        'right'
    ];

    get dimension_vo_field_ref(): VOFieldRefVO {
        let options: VarLineChartWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.dimension_vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.dimension_vo_field_ref);
    }

    private async remove_dimension_vo_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.dimension_vo_field_ref) {
            return null;
        }

        this.next_update_options.dimension_vo_field_ref = null;

        await this.throttled_update_options();
    }

    private async add_dimension_vo_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        let dimension_vo_field_ref = new VOFieldRefVO();
        dimension_vo_field_ref.api_type_id = api_type_id;
        dimension_vo_field_ref.field_id = field_id;
        dimension_vo_field_ref.weight = 0;

        this.next_update_options.dimension_vo_field_ref = dimension_vo_field_ref;

        await this.throttled_update_options();
    }

    get sort_dimension_by_vo_field_ref(): VOFieldRefVO {
        let options: VarLineChartWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.sort_dimension_by_vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.sort_dimension_by_vo_field_ref);
    }

    private async remove_sort_dimension_by_vo_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.sort_dimension_by_vo_field_ref) {
            return null;
        }

        this.next_update_options.sort_dimension_by_vo_field_ref = null;

        await this.throttled_update_options();
    }

    private async add_sort_dimension_by_vo_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        let sort_dimension_by_vo_field_ref = new VOFieldRefVO();
        sort_dimension_by_vo_field_ref.api_type_id = api_type_id;
        sort_dimension_by_vo_field_ref.field_id = field_id;
        sort_dimension_by_vo_field_ref.weight = 0;

        this.next_update_options.sort_dimension_by_vo_field_ref = sort_dimension_by_vo_field_ref;

        await this.throttled_update_options();
    }

    private get_default_options(): VarLineChartWidgetOptionsVO {
        return VarLineChartWidgetOptionsVO.createDefault();
    }

    private async switch_legend_display() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.legend_display = !this.next_update_options.legend_display;

        await this.throttled_update_options();
    }

    private async switch_dimension_is_vo_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.dimension_is_vo_field_ref = !this.next_update_options.dimension_is_vo_field_ref;

        await this.throttled_update_options();
    }

    private async switch_sort_dimension_by_asc() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.sort_dimension_by_asc = !this.next_update_options.sort_dimension_by_asc;

        await this.throttled_update_options();
    }

    private async switch_has_dimension() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.has_dimension = !this.next_update_options.has_dimension;

        await this.throttled_update_options();
    }

    private async switch_title_display() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.title_display = !this.next_update_options.title_display;

        await this.throttled_update_options();
    }

    private async switch_legend_use_point_style() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.legend_use_point_style = !this.next_update_options.legend_use_point_style;

        await this.throttled_update_options();
    }

    private async switch_max_is_sum_of_var_1_and_2() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.max_is_sum_of_var_1_and_2 = !this.next_update_options.max_is_sum_of_var_1_and_2;

        await this.throttled_update_options();
    }


    private async change_custom_filter_1(field_id: string, custom_filter: string) {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.custom_filter_names_1[field_id] = custom_filter;
        this.next_update_options.filter_custom_field_filters_1 = this.custom_filter_names_1;
        await this.throttled_update_options();
    }

    private async change_custom_filter_2(field_id: string, custom_filter: string) {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.custom_filter_names_2[field_id] = custom_filter;
        this.next_update_options.filter_custom_field_filters_2 = this.custom_filter_names_2;
        await this.throttled_update_options();
    }


    private async change_custom_filter_dimension(custom_filter: string) {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.dimension_custom_filter_name = custom_filter;
        this.next_update_options.dimension_custom_filter_name = this.dimension_custom_filter_name;

        await this.throttled_update_options();
    }

    private handle_scale_x_color_change(color: string) {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.scale_x_color = color;
        this.throttled_update_colors();
    }

    private handle_scale_y_color_change(color: string) {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.scale_y_color = color;
        this.throttled_update_colors();
    }


    private handle_scale_x_axis_options_1_change(options: Partial<Scale>) {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.scale_options_x_1 = options;
        this.next_update_options.scale_options_x_1 = this.scale_options_x_1;

        this.throttled_update_options();
    }

    private handle_scale_y_axis_options_1_change(options: Partial<Scale>) {
        this.scale_options_y_1 = options;
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.scale_options_y_1 = options;
        this.next_update_options.scale_options_y_1 = this.scale_options_y_1;

        this.throttled_update_options();
    }

    get fields_that_could_get_custom_filter_1(): string[] {
        let res: string[] = [];

        if (!this.widget_options || (!this.widget_options.var_id_1) || (!VarsController.var_conf_by_id[this.widget_options.var_id_1])) {
            return null;
        }

        let var_param_type = VarsController.var_conf_by_id[this.widget_options.var_id_1].var_data_vo_type;
        if (!var_param_type) {
            return null;
        }

        if (!this.custom_filter_names_1) {
            this.custom_filter_names_1 = {};
        }

        let fields = ModuleTableController.module_tables_by_vo_type[var_param_type].get_fields();
        for (let i in fields) {
            let field = fields[i];

            if ((field.field_type == ModuleTableFieldVO.FIELD_TYPE_tstzrange_array) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_hourrange_array)) {
                res.push(field.field_id);
                if (typeof this.custom_filter_names_1[field.field_id] === "undefined") {
                    this.custom_filter_names_1[field.field_id] = null;
                }
            }
        }

        return res;
    }

    get fields_that_could_get_custom_filter_2(): string[] {
        let res: string[] = [];

        if (!this.widget_options || !this.widget_options.var_id_2) {
            return null;
        }

        let var_param_type = VarsController.var_conf_by_id[this.widget_options.var_id_2].var_data_vo_type;
        if (!var_param_type) {
            return null;
        }

        if (!this.custom_filter_names_2) {
            this.custom_filter_names_2 = {};
        }

        let fields = ModuleTableController.module_tables_by_vo_type[var_param_type].get_fields();
        for (let i in fields) {
            let field = fields[i];

            if ((field.field_type == ModuleTableFieldVO.FIELD_TYPE_tstzrange_array) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_hourrange_array)) {
                res.push(field.field_id);
                if (typeof this.custom_filter_names_2[field.field_id] === "undefined") {
                    this.custom_filter_names_2[field.field_id] = null;
                }
            }
        }

        return res;
    }


    private async update_additional_options(additional_options: string) {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.next_update_options.filter_additional_params = additional_options;
        await this.throttled_update_options();
    }

    private async update_filter_type(filter_type: string) {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.next_update_options.filter_type = filter_type;
        await this.throttled_update_options();
    }

    get var_names(): string[] {

        let res: string[] = [];

        for (let i in VarsController.var_conf_by_name) {
            let var_conf = VarsController.var_conf_by_name[i];
            res.push(var_conf.id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(var_conf.id)));
        }

        res.sort((a, b) => {
            let a_ = a.split(' | ')[1];
            let b_ = b.split(' | ')[1];

            if (a_ < b_) {
                return -1;
            }
            if (a_ > b_) {
                return 1;
            }

            return 0;
        });
        return res;
    }

    private reload_options() {
        if (!this.page_widget) {
            this.widget_options = null;
        } else {

            let options: VarLineChartWidgetOptionsVO = null;
            try {
                if (!!this.page_widget.json_options) {
                    options = JSON.parse(this.page_widget.json_options) as VarLineChartWidgetOptionsVO;
                    if (this.widget_options &&
                        (this.widget_options.var_id_1 == options.var_id_1) &&
                        (this.widget_options.var_id_2 == options.var_id_2) &&
                        (this.widget_options.dimension_custom_filter_name == options.dimension_custom_filter_name) &&
                        (ObjectHandler.are_equal(this.widget_options.filter_custom_field_filters_1, options.filter_custom_field_filters_1)) &&
                        (ObjectHandler.are_equal(this.widget_options.filter_custom_field_filters_2, options.filter_custom_field_filters_2)) &&

                        (this.widget_options.legend_display == options.legend_display) &&
                        (this.widget_options.legend_position == options.legend_position) &&
                        (this.widget_options.bg_color_1 == options.bg_color_1) &&
                        (this.widget_options.bg_color_2 == options.bg_color_2) &&
                        (this.widget_options.border_color_1 == options.border_color_1) &&
                        (this.widget_options.border_color_2 == options.border_color_2) &&
                        (this.widget_options.bg_color == options.bg_color) &&
                        (this.widget_options.legend_font_color == options.legend_font_color) &&
                        (this.widget_options.title_font_color == options.title_font_color) &&
                        (this.widget_options.legend_font_size == options.legend_font_size) &&
                        (this.widget_options.legend_box_width == options.legend_box_width) &&
                        (this.widget_options.legend_padding == options.legend_padding) &&
                        (this.widget_options.legend_use_point_style == options.legend_use_point_style) &&
                        (this.widget_options.title_display == options.title_display) &&
                        (this.widget_options.title_font_size == options.title_font_size) &&
                        (this.widget_options.title_padding == options.title_padding) &&
                        (this.widget_options.scale_x_color == options.scale_x_color) &&
                        (this.widget_options.scale_y_color == options.scale_y_color) &&
                        (this.widget_options.has_dimension == options.has_dimension) &&
                        (this.widget_options.max_dimension_values == options.max_dimension_values) &&
                        (this.widget_options.sort_dimension_by_vo_field_ref == options.sort_dimension_by_vo_field_ref) &&
                        (this.widget_options.sort_dimension_by_asc == options.sort_dimension_by_asc) &&

                        (this.widget_options.dimension_is_vo_field_ref == options.dimension_is_vo_field_ref) &&
                        ObjectHandler.are_equal(this.widget_options.dimension_vo_field_ref, options.dimension_vo_field_ref) &&
                        (this.widget_options.dimension_custom_filter_name == options.dimension_custom_filter_name) &&
                        (this.widget_options.dimension_custom_filter_segment_type == options.dimension_custom_filter_segment_type) &&
                        (this.widget_options.border_width_1 == options.border_width_1) &&
                        (this.widget_options.border_width_2 == options.border_width_2) &&
                        (this.widget_options.max_is_sum_of_var_1_and_2 == options.max_is_sum_of_var_1_and_2) &&
                        (this.widget_options.filter_type == options.filter_type) &&
                        (this.widget_options.filter_additional_params == options.filter_additional_params)
                    ) {
                        options = null;
                    }

                    options = options ? new VarLineChartWidgetOptionsVO().from(options) : null;
                }
            } catch (error) {
                ConsoleHandler.error(error);
            }

            if ((!!options) && (!!this.page_widget.json_options)) {
                if (!ObjectHandler.are_equal(this.widget_options, options)) {
                    this.widget_options = options;
                }
            } else if ((!!this.widget_options) && !this.page_widget.json_options) {
                this.widget_options = null;
            }
        }

        if (!this.widget_options) {
            this.next_update_options = null;

            this.bg_color = null;

            this.legend_display = true;
            this.tmp_selected_legend_position = 'top';
            this.legend_font_color = '#666';
            this.legend_font_size = '12';
            this.legend_box_width = '40';
            this.legend_padding = '10';
            this.legend_use_point_style = false;

            this.title_display = false;
            this.title_font_color = '#666';
            this.title_font_size = '16';
            this.title_padding = '10';

            this.has_dimension = false;
            this.max_dimension_values = '10';
            this.sort_dimension_by_asc = true;
            this.dimension_is_vo_field_ref = true;
            this.dimension_custom_filter_name = null;
            this.tmp_selected_dimension_custom_filter_segment_type = this.dimension_custom_filter_segment_types[0];

            this.tmp_selected_var_name_1 = null;
            this.custom_filter_names_1 = {};
            this.bg_color_1 = null;
            this.border_color_1 = null;
            this.border_width_1 = null;
            this.tmp_selected_var_name_2 = null;
            this.custom_filter_names_2 = {};
            this.bg_color_2 = null;
            this.border_color_2 = null;
            this.border_width_2 = null;
            this.max_is_sum_of_var_1_and_2 = false;
            this.scale_x_color = "#666";
            this.scale_y_color = "#666";

            return;
        }

        if (this.legend_display != this.widget_options.legend_display) {
            this.legend_display = this.widget_options.legend_display;
        }
        if (((!this.widget_options.legend_font_size) && this.legend_font_size) || (this.widget_options.legend_font_size && (this.legend_font_size != this.widget_options.legend_font_size.toString()))) {
            this.legend_font_size = this.widget_options.legend_font_size ? this.widget_options.legend_font_size.toString() : null;
        }
        if (((!this.widget_options.legend_box_width) && this.legend_box_width) || (this.widget_options.legend_box_width && (this.legend_box_width != this.widget_options.legend_box_width.toString()))) {
            this.legend_box_width = this.widget_options.legend_box_width ? this.widget_options.legend_box_width.toString() : null;
        }
        if (((!this.widget_options.legend_padding) && this.legend_padding) || (this.widget_options.legend_padding && (this.legend_padding != this.widget_options.legend_padding.toString()))) {
            this.legend_padding = this.widget_options.legend_padding ? this.widget_options.legend_padding.toString() : null;
        }
        if (this.legend_use_point_style != this.widget_options.legend_use_point_style) {
            this.legend_use_point_style = this.widget_options.legend_use_point_style;
        }

        if (this.title_display != this.widget_options.title_display) {
            this.title_display = this.widget_options.title_display;
        }
        if (((!this.widget_options.title_font_size) && this.title_font_size) || (this.widget_options.title_font_size && (this.title_font_size != this.widget_options.title_font_size.toString()))) {
            this.title_font_size = this.widget_options.title_font_size ? this.widget_options.title_font_size.toString() : null;
        }
        if (((!this.widget_options.title_padding) && this.title_padding) || (this.widget_options.title_padding && (this.title_padding != this.widget_options.title_padding.toString()))) {
            this.title_padding = this.widget_options.title_padding ? this.widget_options.title_padding.toString() : null;
        }

        if (this.has_dimension != this.widget_options.has_dimension) {
            this.has_dimension = this.widget_options.has_dimension;
        }
        if (((!this.widget_options.max_dimension_values) && this.max_dimension_values) || (this.widget_options.max_dimension_values && (this.max_dimension_values != this.widget_options.max_dimension_values.toString()))) {
            this.max_dimension_values = this.widget_options.max_dimension_values ? this.widget_options.max_dimension_values.toString() : null;
        }
        if (this.sort_dimension_by_asc != this.widget_options.sort_dimension_by_asc) {
            this.sort_dimension_by_asc = this.widget_options.sort_dimension_by_asc;
        }
        if (this.dimension_is_vo_field_ref != this.widget_options.dimension_is_vo_field_ref) {
            this.dimension_is_vo_field_ref = this.widget_options.dimension_is_vo_field_ref;
        }
        if (this.dimension_custom_filter_name != this.widget_options.dimension_custom_filter_name) {
            this.dimension_custom_filter_name = this.widget_options.dimension_custom_filter_name;
        }

        if (((!this.widget_options.border_width_1) && this.border_width_1) || (this.widget_options.border_width_1 && (this.border_width_1 != this.widget_options.border_width_1.toString()))) {
            this.border_width_1 = this.widget_options.border_width_1 ? this.widget_options.border_width_1.toString() : null;
        }
        if (((!this.widget_options.border_width_2) && this.border_width_2) || (this.widget_options.border_width_2 && (this.border_width_2 != this.widget_options.border_width_2.toString()))) {
            this.border_width_2 = this.widget_options.border_width_2 ? this.widget_options.border_width_2.toString() : null;
        }
        if (this.max_is_sum_of_var_1_and_2 != this.widget_options.max_is_sum_of_var_1_and_2) {
            this.max_is_sum_of_var_1_and_2 = this.widget_options.max_is_sum_of_var_1_and_2;
        }

        if (this.tmp_selected_legend_position != this.widget_options.legend_position) {
            this.tmp_selected_legend_position = this.widget_options.legend_position;
        }
        if (this.get_dimension_custom_filter_segment_type_from_selected_option(this.tmp_selected_dimension_custom_filter_segment_type) != this.widget_options.dimension_custom_filter_segment_type) {
            this.tmp_selected_dimension_custom_filter_segment_type = this.dimension_custom_filter_segment_types[this.widget_options.dimension_custom_filter_segment_type];
        }

        if (this.tmp_selected_var_name_1 != (this.widget_options.var_id_1 + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.widget_options.var_id_1)))) {
            this.tmp_selected_var_name_1 = this.widget_options.var_id_1 + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.widget_options.var_id_1));
        }
        if (this.tmp_selected_var_name_2 != (this.widget_options.var_id_2 + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.widget_options.var_id_2)))) {
            this.tmp_selected_var_name_2 = this.widget_options.var_id_2 + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.widget_options.var_id_2));
        }
        if (this.custom_filter_names_1 != (this.widget_options.filter_custom_field_filters_1 ? cloneDeep(this.widget_options.filter_custom_field_filters_1) : {})) {
            this.custom_filter_names_1 = this.widget_options.filter_custom_field_filters_1 ? cloneDeep(this.widget_options.filter_custom_field_filters_1) : {};
        }
        if (this.custom_filter_names_2 != (this.widget_options.filter_custom_field_filters_2 ? cloneDeep(this.widget_options.filter_custom_field_filters_2) : {})) {
            this.custom_filter_names_2 = this.widget_options.filter_custom_field_filters_2 ? cloneDeep(this.widget_options.filter_custom_field_filters_2) : {};
        }
        if (this.dimension_custom_filter_name != this.widget_options.dimension_custom_filter_name) {
            this.dimension_custom_filter_name = this.widget_options.dimension_custom_filter_name;
        }

        if (this.scale_x_color != this.widget_options.scale_x_color) {
            this.scale_x_color = this.widget_options.scale_x_color;
        }
        if (this.scale_y_color != this.widget_options.scale_y_color) {
            this.scale_y_color = this.widget_options.scale_y_color;
        }
        if (this.bg_color_1 != this.widget_options.bg_color_1) {
            this.bg_color_1 = this.widget_options.bg_color_1;
        }
        if (this.bg_color_2 != this.widget_options.bg_color_2) {
            this.bg_color_2 = this.widget_options.bg_color_2;
        }
        if (this.border_color_1 != this.widget_options.border_color_1) {
            this.border_color_1 = this.widget_options.border_color_1;
        }
        if (this.border_color_2 != this.widget_options.border_color_2) {
            this.border_color_2 = this.widget_options.border_color_2;
        }
        if (this.bg_color != this.widget_options.bg_color) {
            this.bg_color = this.widget_options.bg_color;
        }
        if (this.legend_font_color != this.widget_options.legend_font_color) {
            this.legend_font_color = this.widget_options.legend_font_color;
        }
        if (this.title_font_color != this.widget_options.title_font_color) {
            this.title_font_color = this.widget_options.title_font_color;
        }
        if (this.scale_options_x_1 != this.widget_options.scale_options_x_1) {
            this.scale_options_x_1 = this.widget_options.scale_options_x_1;
        }
        if (this.scale_options_y_1 != this.widget_options.scale_options_y_1) {
            this.scale_options_y_1 = this.widget_options.scale_options_y_1;
        }
        if (this.next_update_options != this.widget_options) {
            this.next_update_options = this.widget_options;
        }
    }

    private get_dimension_custom_filter_segment_type_from_selected_option(selected_option: string): number {
        if (this.dimension_custom_filter_segment_types) {
            let res = this.dimension_custom_filter_segment_types.indexOf(selected_option);
            return res >= 0 ? res : null;
        }
    }

    @Watch('page_widget', { immediate: true, deep: true })
    private async onchange_page_widget() {
        await this.throttled_reload_options();
    }

    @Watch('widget_options')
    private async onchange_widget_options() {
        await this.throttled_reload_options();
    }

    @Watch('tmp_selected_var_name_2')
    private async onchange_tmp_selected_var_name_2() {
        if (!this.widget_options) {
            return;
        }

        if (!this.tmp_selected_var_name_2) {

            if (this.widget_options.var_id_2) {
                this.widget_options.var_id_2 = null;
                this.custom_filter_names_2 = {};
                this.widget_options.filter_custom_field_filters_2 = {};
                await this.throttled_update_options();
            }
            return;
        }

        try {

            let selected_var_id_2: number = parseInt(this.tmp_selected_var_name_2.split(' | ')[0]);

            if (this.widget_options.var_id_2 != selected_var_id_2) {
                this.next_update_options = this.widget_options;
                this.next_update_options.var_id_2 = selected_var_id_2;

                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }


    @Watch('tmp_selected_var_name_1')
    private async onchange_tmp_selected_var_name_1() {
        if (!this.widget_options) {
            return;
        }

        if (!this.tmp_selected_var_name_1) {

            if (this.widget_options.var_id_1) {
                this.widget_options.var_id_1 = null;
                this.custom_filter_names_1 = {};
                this.widget_options.filter_custom_field_filters_1 = {};
                await this.throttled_update_options();
            }
            return;
        }

        try {

            let selected_var_id_1: number = parseInt(this.tmp_selected_var_name_1.split(' | ')[0]);

            if (this.widget_options.var_id_1 != selected_var_id_1) {
                this.next_update_options = this.widget_options;
                this.next_update_options.var_id_1 = selected_var_id_1;

                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('tmp_selected_dimension_custom_filter_segment_type')
    private async onchange_tmp_selected_dimension_custom_filter_segment_type() {
        if (!this.widget_options) {
            return;
        }

        if (!this.tmp_selected_dimension_custom_filter_segment_type) {

            if (this.widget_options.dimension_custom_filter_segment_type) {
                this.widget_options.dimension_custom_filter_segment_type = null;
                await this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.dimension_custom_filter_segment_type != this.get_dimension_custom_filter_segment_type_from_selected_option(this.tmp_selected_dimension_custom_filter_segment_type)) {
                this.next_update_options = this.widget_options;
                this.next_update_options.dimension_custom_filter_segment_type = this.get_dimension_custom_filter_segment_type_from_selected_option(this.tmp_selected_dimension_custom_filter_segment_type);

                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('tmp_selected_legend_position')
    private async onchange_tmp_selected_legend_position() {
        if (!this.widget_options) {
            return;
        }

        if (!this.tmp_selected_legend_position) {

            if (this.widget_options.legend_position) {
                this.widget_options.legend_position = null;
                await this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.legend_position != this.tmp_selected_legend_position) {
                this.next_update_options = this.widget_options;
                this.next_update_options.legend_position = this.tmp_selected_legend_position;

                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('legend_font_size')
    private async onchange_legend_font_size() {
        if (!this.widget_options) {
            return;
        }

        if (!this.legend_font_size) {

            if (this.widget_options.legend_font_size) {
                this.widget_options.legend_font_size = 12;
                await this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.legend_font_size != parseInt(this.legend_font_size)) {
                this.next_update_options = this.widget_options;
                this.next_update_options.legend_font_size = parseInt(this.legend_font_size);

                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('legend_box_width')
    private async onchange_legend_box_width() {
        if (!this.widget_options) {
            return;
        }

        if (!this.legend_box_width) {

            if (this.widget_options.legend_box_width) {
                this.widget_options.legend_box_width = 40;
                await this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.legend_box_width != parseInt(this.legend_box_width)) {
                this.next_update_options = this.widget_options;
                this.next_update_options.legend_box_width = parseInt(this.legend_box_width);

                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('legend_padding')
    private async onchange_legend_padding() {
        if (!this.widget_options) {
            return;
        }

        if (!this.legend_padding) {

            if (this.widget_options.legend_padding) {
                this.widget_options.legend_padding = 10;
                await this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.legend_padding != parseInt(this.legend_padding)) {
                this.next_update_options = this.widget_options;
                this.next_update_options.legend_padding = parseInt(this.legend_padding);

                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('title_font_size')
    private async onchange_title_font_size() {
        if (!this.widget_options) {
            return;
        }

        if (!this.title_font_size) {

            if (this.widget_options.title_font_size) {
                this.widget_options.title_font_size = 16;
                await this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.title_font_size != parseInt(this.title_font_size)) {
                this.next_update_options = this.widget_options;
                this.next_update_options.title_font_size = parseInt(this.title_font_size);

                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('title_padding')
    private async onchange_title_padding() {
        if (!this.widget_options) {
            return;
        }

        if (!this.title_padding) {

            if (this.widget_options.title_padding) {
                this.widget_options.title_padding = 10;
                await this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.title_padding != parseInt(this.title_padding)) {
                this.next_update_options = this.widget_options;
                this.next_update_options.title_padding = parseInt(this.title_padding);

                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    
    @Watch('border_width_1')
    private async onchange_border_width_1() {
        if (!this.widget_options) {
            return;
        }

        if (!this.border_width_1) {

            if (this.widget_options.border_width_1) {
                this.widget_options.border_width_1 = null;
                await this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.border_width_1 != parseInt(this.border_width_1)) {
                this.next_update_options = this.widget_options;
                this.next_update_options.border_width_1 = parseInt(this.border_width_1);

                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('border_width_2')
    private async onchange_border_width_2() {
        if (!this.widget_options) {
            return;
        }

        if (!this.border_width_2) {

            if (this.widget_options.border_width_2) {
                this.widget_options.border_width_2 = null;
                await this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.border_width_2 != parseInt(this.border_width_2)) {
                this.next_update_options = this.widget_options;
                this.next_update_options.border_width_2 = parseInt(this.border_width_2);

                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('max_dimension_values')
    private async onchange_max_dimension_values() {
        if (!this.widget_options) {
            return;
        }

        if (!this.max_dimension_values) {

            if (this.widget_options.max_dimension_values) {
                this.widget_options.max_dimension_values = 10;
                await this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.max_dimension_values != parseInt(this.max_dimension_values)) {
                this.next_update_options = this.widget_options;
                this.next_update_options.max_dimension_values = parseInt(this.max_dimension_values);

                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }
    private async update_colors() {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.next_update_options.bg_color_1 = this.bg_color_1;
        this.next_update_options.bg_color_2 = this.bg_color_2;
        this.next_update_options.border_color_1 = this.border_color_1;
        this.next_update_options.border_color_2 = this.border_color_2;
        this.next_update_options.bg_color = this.bg_color;
        this.next_update_options.legend_font_color = this.legend_font_color;
        this.next_update_options.title_font_color = this.title_font_color;
        this.next_update_options.scale_x_color = this.scale_x_color;
        this.next_update_options.scale_y_color = this.scale_y_color;
        await this.throttled_update_options();
    }

    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }
        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);
        this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);
    }

    get title_name_code_text(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }
}