import { cloneDeep, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import VarMixedChartWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VarMixedChartWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VarChartOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VarChartOptionsVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import TimeSegment from '../../../../../../../shared/modules/DataRender/vos/TimeSegment';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import ChartJsScaleOptionsComponent from '../../../../chartjs/scale_options/ChartJsScaleOptionsComponent';
import WidgetFilterOptionsComponent from '../../var_widget/options/filters/WidgetFilterOptionsComponent';
import VarChartsOptionsComponent from '../../var_chart_options/VarChartsOptionsComponent';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import './VarMixedChartsWidgetOptionsComponent.scss';
import { Scale } from 'chart.js';

@Component({
    template: require('./VarMixedChartsWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Chartjsscaleoptionscomponent: ChartJsScaleOptionsComponent,
        Widgetfilteroptionscomponent: WidgetFilterOptionsComponent,
        Varchartsoptionscomponent: VarChartsOptionsComponent,
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class VarMixedChartsWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    @ModuleDashboardPageGetter
    private get_custom_filters: string[];

    private next_update_options: VarMixedChartWidgetOptionsVO = null;
    private throttled_reload_options = ThrottleHelper.declare_throttle_without_args(this.reload_options.bind(this), 50, { leading: false, trailing: true });
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });
    private throttled_update_colors = ThrottleHelper.declare_throttle_without_args(this.update_colors.bind(this), 800, { leading: false, trailing: true });

    private dimension_custom_filter_name: string = null;

    private bg_color: string = null;
    private legend_font_color: string = null;
    private title_font_color: string = null;

    private legend_display: boolean = false;
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

    private var_charts_options?: VarChartOptionsVO[] = [];
    private scale_options_x?: Partial<Scale> = null;
    private scale_options_y?: Partial<Scale> = null;

    private tmp_selected_legend_position: string = null;
    private tmp_selected_dimension_custom_filter_segment_type: string = null;

    private widget_options: VarMixedChartWidgetOptionsVO = null;

    private dimension_custom_filter_segment_types: string[] = [
        this.label('VarMixedChartsWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_YEAR),
        this.label('VarMixedChartsWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_MONTH),
        this.label('VarMixedChartsWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_DAY),
        this.label('VarMixedChartsWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_WEEK),
        this.label('VarMixedChartsWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_ROLLING_YEAR_MONTH_START),
        this.label('VarMixedChartsWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_HOUR),
        this.label('VarMixedChartsWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_MINUTE),
        this.label('VarMixedChartsWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_SECOND),
    ];

    // TODO: Add translations
    private legend_positions: string[] = [
        'top',
        'left',
        'bottom',
        'right'
    ];

    @Watch('page_widget', { immediate: true, deep: true })
    private onchange_page_widget(): void {
        this.throttled_reload_options();
    }

    @Watch('widget_options')
    private onchange_widget_options(): void {
        this.throttled_reload_options();
    }

    @Watch('tmp_selected_dimension_custom_filter_segment_type')
    private async onchange_tmp_selected_dimension_custom_filter_segment_type() {
        if (!this.widget_options) {
            return;
        }

        if (!this.tmp_selected_dimension_custom_filter_segment_type) {

            if (this.widget_options.dimension_custom_filter_segment_type) {
                this.widget_options.dimension_custom_filter_segment_type = null;
                this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.dimension_custom_filter_segment_type != this.get_dimension_custom_filter_segment_type_from_selected_option(this.tmp_selected_dimension_custom_filter_segment_type)) {
                this.next_update_options = this.widget_options;
                this.next_update_options.dimension_custom_filter_segment_type = this.get_dimension_custom_filter_segment_type_from_selected_option(this.tmp_selected_dimension_custom_filter_segment_type);

                this.throttled_update_options();
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
                this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.legend_position != this.tmp_selected_legend_position) {
                this.next_update_options = this.widget_options;
                this.next_update_options.legend_position = this.tmp_selected_legend_position;

                this.throttled_update_options();
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
                this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.legend_font_size != parseInt(this.legend_font_size)) {
                this.next_update_options = this.widget_options;
                this.next_update_options.legend_font_size = parseInt(this.legend_font_size);

                this.throttled_update_options();
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
                this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.legend_box_width != parseInt(this.legend_box_width)) {
                this.next_update_options = this.widget_options;
                this.next_update_options.legend_box_width = parseInt(this.legend_box_width);

                this.throttled_update_options();
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
                this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.legend_padding != parseInt(this.legend_padding)) {
                this.next_update_options = this.widget_options;
                this.next_update_options.legend_padding = parseInt(this.legend_padding);

                this.throttled_update_options();
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
                this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.title_font_size != parseInt(this.title_font_size)) {
                this.next_update_options = this.widget_options;
                this.next_update_options.title_font_size = parseInt(this.title_font_size);

                this.throttled_update_options();
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
                this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.title_padding != parseInt(this.title_padding)) {
                this.next_update_options = this.widget_options;
                this.next_update_options.title_padding = parseInt(this.title_padding);

                this.throttled_update_options();
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
                this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.max_dimension_values != parseInt(this.max_dimension_values)) {
                this.next_update_options = this.widget_options;
                this.next_update_options.max_dimension_values = parseInt(this.max_dimension_values);

                this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
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

        this.throttled_update_options();
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

        this.throttled_update_options();
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

        this.throttled_update_options();
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

        this.throttled_update_options();
    }

    private get_default_options(): VarMixedChartWidgetOptionsVO {
        return VarMixedChartWidgetOptionsVO.createDefault();
    }

    private async switch_legend_display() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.legend_display = !this.next_update_options.legend_display;

        this.throttled_update_options();
    }

    private async switch_dimension_is_vo_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.dimension_is_vo_field_ref = !this.next_update_options.dimension_is_vo_field_ref;

        this.throttled_update_options();
    }

    private async switch_sort_dimension_by_asc() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.sort_dimension_by_asc = !this.next_update_options.sort_dimension_by_asc;

        this.throttled_update_options();
    }

    /**
     * switch_has_dimension
     *
     * @returns {void}
     */
    private switch_has_dimension(): void {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.has_dimension = !this.next_update_options.has_dimension;

        this.throttled_update_options();
    }

    /**
     * switch_title_display
     *
     * @returns {void}
     */
    private switch_title_display(): void {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.title_display = !this.next_update_options.title_display;

        this.throttled_update_options();
    }

    private async switch_legend_use_point_style() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.legend_use_point_style = !this.next_update_options.legend_use_point_style;

        this.throttled_update_options();
    }

    private async switch_max_is_sum_of_var_1_and_2() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        // this.next_update_options.max_is_sum_of_var_1_and_2 = !this.next_update_options.max_is_sum_of_var_1_and_2;

        this.throttled_update_options();
    }

    /**
     * update_colors
     *
     * @returns {void}
     */
    private update_colors(): void {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.legend_font_color = this.legend_font_color;
        this.next_update_options.title_font_color = this.title_font_color;
        this.next_update_options.bg_color = this.bg_color;

        this.throttled_update_options();
    }

    /**
     * change_custom_filter_dimension
     *
     * @param {string} custom_filter
     * @returns {void}
     */
    private change_custom_filter_dimension(custom_filter: string): void {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.dimension_custom_filter_name = custom_filter;
        this.next_update_options.dimension_custom_filter_name = this.dimension_custom_filter_name;

        this.throttled_update_options();
    }

    /**
     * handle_var_charts_options_change
     *
     * @param {VarChartOptionsVO[]} var_charts_options
     * @returns {void}
     */
    private handle_var_charts_options_change(var_charts_options: VarChartOptionsVO[]): void {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.var_charts_options = var_charts_options;
        this.next_update_options.var_charts_options = this.var_charts_options;

        this.throttled_update_options();
    }

    /**
     * update_additional_options
     *
     * @param {string} additional_options
     * @returns {void}
     */
    private update_additional_options(additional_options: string): void {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.filter_additional_params = additional_options;

        this.throttled_update_options();
    }

    /**
     * handle_scale_options_x_change
     *
     * @param {Partial<Scale>} options
     */
    private handle_scale_options_x_change(options: Partial<Scale>) {
        this.scale_options_x = options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.scale_options_x = options;

        this.throttled_update_options();
    }

    /**
     * handle_scale_options_y_change
     *
     * @param {Partial<Scale>} options
     */
    private handle_scale_options_y_change(options: Partial<Scale>) {
        this.scale_options_y = options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.scale_options_y = options;

        this.throttled_update_options();
    }

    /**
     * update_filter_type
     *
     * @param {string} filter_type
     * @returns {void}
     */
    private update_filter_type(filter_type: string): void {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.filter_type = filter_type;

        this.throttled_update_options();
    }

    private reload_options(): void {
        if (!this.page_widget) {
            this.widget_options = null;
        } else {

            let options: VarMixedChartWidgetOptionsVO = null;
            try {
                if (!!this.page_widget.json_options) {
                    options = JSON.parse(this.page_widget.json_options) as VarMixedChartWidgetOptionsVO;

                    if (this.widget_options && isEqual(this.widget_options, options)) {
                        options = null;
                    }

                    options = options ? new VarMixedChartWidgetOptionsVO().from(options) : null;
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

            this.var_charts_options = [];
            this.scale_options_x = null;
            this.scale_options_y = null;

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

        if (this.tmp_selected_legend_position != this.widget_options.legend_position) {
            this.tmp_selected_legend_position = this.widget_options.legend_position;
        }
        if (this.get_dimension_custom_filter_segment_type_from_selected_option(this.tmp_selected_dimension_custom_filter_segment_type) != this.widget_options.dimension_custom_filter_segment_type) {
            this.tmp_selected_dimension_custom_filter_segment_type = this.dimension_custom_filter_segment_types[this.widget_options.dimension_custom_filter_segment_type];
        }

        if (this.dimension_custom_filter_name != this.widget_options.dimension_custom_filter_name) {
            this.dimension_custom_filter_name = this.widget_options.dimension_custom_filter_name;
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
        if (!isEqual(this.var_charts_options, this.widget_options.var_charts_options)) {
            this.var_charts_options = cloneDeep(this.widget_options.var_charts_options);
        }

        if (!isEqual(this.scale_options_x, this.widget_options.scale_options_x)) {
            this.scale_options_x = cloneDeep(this.widget_options.scale_options_x);
        }

        if (!isEqual(this.scale_options_y, this.widget_options.scale_options_y)) {
            this.scale_options_y = cloneDeep(this.widget_options.scale_options_y);
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

    /**
     * get_var_name_code_text
     *
     * @returns {string}
     */
    private get_var_name_code_text(): (page_widget_id: number, var_id: number) => string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.get_var_name_code_text;
    }

    get title_name_code_text(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    get dimension_vo_field_ref(): VOFieldRefVO {
        let options: VarMixedChartWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.dimension_vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.dimension_vo_field_ref);
    }

    get sort_dimension_by_vo_field_ref(): VOFieldRefVO {
        let options: VarMixedChartWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.sort_dimension_by_vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.sort_dimension_by_vo_field_ref);
    }
}