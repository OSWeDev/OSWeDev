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
import VarChartScalesOptionsComponent from '../../var_chart_scales_options/VarChartScalesOptionsComponent';
import VarChartScalesOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VarChartScalesOptionsVO';

@Component({
    template: require('./VarMixedChartsWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Chartjsscaleoptionscomponent: ChartJsScaleOptionsComponent,
        Widgetfilteroptionscomponent: WidgetFilterOptionsComponent,
        Varchartsoptionscomponent: VarChartsOptionsComponent,
        Inlinetranslatabletext: InlineTranslatableText,
        Varchartscalesoptionscomponent: VarChartScalesOptionsComponent
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
    private has_dimension: boolean = true;
    private sort_dimension_by_asc: boolean = false;
    private hide_filter: boolean = false;
    private dimension_is_vo_field_ref: boolean = false;

    private legend_font_size: string = null;
    private legend_box_width: string = null;
    private legend_padding: string = null;
    private title_font_size: string = null;
    private title_padding: string = null;
    private max_dimension_values: string = null;
    private max_dataset_values: string = null;

    private var_charts_options?: VarChartOptionsVO[] = [];
    private var_chart_scales_options?: VarChartScalesOptionsVO[] = [];

    private scale_y_title: string = null;
    private scale_x_title: string = null;
    private show_scale_x: boolean = false;
    private show_scale_y: boolean = false;
    private scale_options_x?: Partial<Scale> = null;
    private scale_options_y?: Partial<Scale> = null;

    private tmp_selected_legend_position: string = null;
    private tmp_selected_dimension_custom_filter_segment_type: string = null;

    private widget_options: VarMixedChartWidgetOptionsVO = null;

    private dimension_custom_filter_segment_types: { [index: number]: string } =
        {
            [TimeSegment.TYPE_YEAR]: this.label('VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_YEAR),
            [TimeSegment.TYPE_MONTH]: this.label('VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_MONTH),
            [TimeSegment.TYPE_DAY]: this.label('VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_DAY),
            [TimeSegment.TYPE_HOUR]: this.label('VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_HOUR),
            // this.label('VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_WEEK),
            // this.label('VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_ROLLING_YEAR_MONTH_START),
            [TimeSegment.TYPE_MINUTE]: this.label('VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_MINUTE),
            [TimeSegment.TYPE_SECOND]: this.label('VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_SECOND)
        };

    private dimension_custom_filter_segment_types_values: string[] = Object.values(this.dimension_custom_filter_segment_types);

    // TODO: Add translations
    private legend_positions: string[] = [
        'top',
        'left',
        'bottom',
        'right'
    ];

    get title_name_code_text(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    get fields_that_could_get_scales_filter(): VarChartScalesOptionsVO[] {
        if (!this.widget_options) {
            return null;
        }

        return this.var_chart_scales_options;
    }

    get scale_x_code_text(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.get_scale_x_code_text(this.page_widget.id);
    }

    get scale_y_code_text(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.get_scale_y_code_text(this.page_widget.id);
    }

    get multiple_dataset_vo_field_ref(): VOFieldRefVO {
        const options: VarMixedChartWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.multiple_dataset_vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.multiple_dataset_vo_field_ref);
    }


    get dimension_vo_field_ref(): VOFieldRefVO {
        const options: VarMixedChartWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.dimension_vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.dimension_vo_field_ref);
    }

    get sort_dimension_by_vo_field_ref(): VOFieldRefVO {
        const options: VarMixedChartWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.sort_dimension_by_vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.sort_dimension_by_vo_field_ref);
    }

    get sort_dimension_by_vo_field_ref_label(): VOFieldRefVO {
        const options: VarMixedChartWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.sort_dimension_by_vo_field_ref_label)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.sort_dimension_by_vo_field_ref_label);
    }

    @Watch('scale_x_code_text')
    private async onchange_scale_x_code_text() {
        if (!this.widget_options) {
            return;
        }

        if (!this.scale_x_code_text) {

            if (this.widget_options.scale_x_title) {
                this.widget_options.scale_x_title = null;
                this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.scale_x_title != this.scale_x_code_text) {
                this.next_update_options = this.widget_options;
                this.next_update_options.scale_x_title = this.scale_x_code_text;

                this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('page_widget', { immediate: true, deep: true })
    private async onchange_page_widget() {
        await this.throttled_reload_options();
    }

    @Watch('widget_options', { deep: true })
    private async onchange_widget_options() {
        await this.throttled_reload_options();
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
                if (parseInt(this.legend_font_size) <= 100) {
                    this.next_update_options = this.widget_options;
                    this.next_update_options.legend_font_size = parseInt(this.legend_font_size);
                }
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
                if (parseInt(this.legend_box_width) <= 400) {
                    this.next_update_options = this.widget_options;
                    this.next_update_options.legend_box_width = parseInt(this.legend_box_width);
                }
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
                if (parseInt(this.title_font_size) <= 100) {
                    this.next_update_options = this.widget_options;
                    this.next_update_options.title_font_size = parseInt(this.title_font_size);
                }
                this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('scale_x_title')
    private async onchange_scale_x_title() {
        if (!this.widget_options) {
            return;
        }

        if (!this.scale_x_title) {

            if (this.widget_options.scale_x_title) {
                this.widget_options.scale_x_title = null;
                this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.scale_x_title != this.scale_x_title) {
                this.next_update_options = this.widget_options;
                this.next_update_options.scale_x_title = this.scale_x_title;

                this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('scale_y_title')
    private async onchange_scale_y_title() {
        if (!this.widget_options) {
            return;
        }

        if (!this.scale_y_title) {

            if (this.widget_options.scale_y_title) {
                this.widget_options.scale_y_title = null;
                this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.scale_y_title != this.scale_y_title) {
                this.next_update_options = this.widget_options;
                this.next_update_options.scale_y_title = this.scale_y_title;

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
                if (this.widget_options.dimension_is_vo_field_ref) {
                    if (parseInt(this.max_dimension_values) >= 0) {
                        this.next_update_options = this.widget_options;
                        this.next_update_options.max_dimension_values = parseInt(this.max_dimension_values);
                    }
                    await this.throttled_update_options();
                } else {
                    if (parseInt(this.max_dimension_values) > 0) {
                        this.next_update_options = this.widget_options;
                        this.next_update_options.max_dimension_values = parseInt(this.max_dimension_values);
                    } else {
                        this.snotify.error('Un custom filter doit avoir un maximum de valeurs à afficher supérieur à 0');
                        this.next_update_options = this.widget_options;
                        this.next_update_options.max_dimension_values = 10;
                    }
                    await this.throttled_update_options();
                }
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('max_dataset_values')
    private async onchange_max_dataset_values() {
        if (!this.widget_options) {
            return;
        }

        if (!this.max_dataset_values) {

            if (this.widget_options.max_dataset_values) {
                this.widget_options.max_dataset_values = 10;
                this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.widget_options.max_dataset_values != parseInt(this.max_dataset_values)) {
                if (this.widget_options.dimension_is_vo_field_ref) {
                    if (parseInt(this.max_dataset_values) >= 0) {
                        this.next_update_options = this.widget_options;
                        this.next_update_options.max_dataset_values = parseInt(this.max_dataset_values);
                    }
                    await this.throttled_update_options();
                } else {
                    if (parseInt(this.max_dataset_values) > 0) {
                        this.next_update_options = this.widget_options;
                        this.next_update_options.max_dataset_values = parseInt(this.max_dataset_values);
                    } else {
                        this.snotify.error('Un custom filter doit avoir un maximum de valeurs à afficher supérieur à 0');
                        this.next_update_options = this.widget_options;
                        this.next_update_options.max_dataset_values = 10;
                    }
                    await this.throttled_update_options();
                }
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

        const dimension_vo_field_ref = new VOFieldRefVO();
        dimension_vo_field_ref.api_type_id = api_type_id;
        dimension_vo_field_ref.field_id = field_id;
        dimension_vo_field_ref.weight = 0;

        this.next_update_options.dimension_vo_field_ref = dimension_vo_field_ref;

        this.throttled_update_options();
    }

    private async remove_sort_dimension_by_vo_field_ref_label() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.sort_dimension_by_vo_field_ref_label) {
            return null;
        }

        this.next_update_options.sort_dimension_by_vo_field_ref_label = null;

        this.throttled_update_options();
    }

    private async add_sort_dimension_by_vo_field_ref_label(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        const sort_dimension_by_vo_field_ref_label = new VOFieldRefVO();
        sort_dimension_by_vo_field_ref_label.api_type_id = api_type_id;
        sort_dimension_by_vo_field_ref_label.field_id = field_id;
        sort_dimension_by_vo_field_ref_label.weight = 0;

        this.next_update_options.sort_dimension_by_vo_field_ref_label = sort_dimension_by_vo_field_ref_label;

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

        const sort_dimension_by_vo_field_ref = new VOFieldRefVO();
        sort_dimension_by_vo_field_ref.api_type_id = api_type_id;
        sort_dimension_by_vo_field_ref.field_id = field_id;
        sort_dimension_by_vo_field_ref.weight = 0;

        this.next_update_options.sort_dimension_by_vo_field_ref = sort_dimension_by_vo_field_ref;

        this.throttled_update_options();
    }

    private get_default_options(): VarMixedChartWidgetOptionsVO {
        return VarMixedChartWidgetOptionsVO.createDefault();
    }

    private async switch_show_scale_x() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.show_scale_x = !this.next_update_options.show_scale_x;

        this.throttled_update_options();
    }

    private async switch_show_scale_y() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.show_scale_y = !this.next_update_options.show_scale_y;

        this.throttled_update_options();
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

    private async switch_hide_filter() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.hide_filter = !this.next_update_options.hide_filter;

        this.throttled_update_options();
    }

    /**
     * switch_has_dimension
     *
     * @returns {void}
     */
    private async switch_has_dimension() {
        if (!this.has_dimension) {
            this.snotify.error('Not implemented yet');
        }
        // this.next_update_options = this.widget_options;

        // if (!this.next_update_options) {
        //     this.next_update_options = this.get_default_options();
        // }

        // this.next_update_options.has_dimension = !this.next_update_options.has_dimension;

        // await this.throttled_update_options();
    }

    /**
     * switch_title_display
     *
     * @returns {void}
     */
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
    private async update_colors() {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.legend_font_color = this.legend_font_color;
        this.next_update_options.title_font_color = this.title_font_color;
        this.next_update_options.bg_color = this.bg_color;
        this.next_update_options.legend_font_color = this.legend_font_color;
        this.next_update_options.title_font_color = this.title_font_color;

        await this.throttled_update_options();
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
     * handle_var_chart_scales_options_change
     *
     * @param {VarChartScalesOptionsVO[]} var_chart_scales_options
     * @returns {void}
     */
    private handle_var_chart_scales_options_change(var_chart_scales_options: VarChartScalesOptionsVO[]): void {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.var_chart_scales_options = var_chart_scales_options;
        this.next_update_options.var_chart_scales_options = this.var_chart_scales_options;
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

        if (this.scale_options_x) {
            if (this.scale_options_x.type != "") {
                this.next_update_options.scale_options_x = options;
            }
        }
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

        if (this.scale_options_y) {
            if (this.scale_options_y.type != "") {
                this.next_update_options.scale_options_y = options;
            }
        }

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

            this.has_dimension = true;
            this.max_dimension_values = '10';
            this.max_dataset_values = '10';
            this.sort_dimension_by_asc = true;
            this.hide_filter = false;
            this.dimension_is_vo_field_ref = true;
            this.dimension_custom_filter_name = null;
            this.tmp_selected_dimension_custom_filter_segment_type = this.dimension_custom_filter_segment_types[0];

            this.var_charts_options = [];
            this.var_chart_scales_options = [];
            this.show_scale_x = false;
            this.show_scale_y = false;
            this.scale_x_title = null;
            this.scale_y_title = null;
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
        if (((!this.widget_options.max_dataset_values) && this.max_dataset_values) || (this.widget_options.max_dataset_values && (this.max_dataset_values != this.widget_options.max_dataset_values.toString()))) {
            this.max_dataset_values = this.widget_options.max_dataset_values ? this.widget_options.max_dataset_values.toString() : null;
        }
        if (this.sort_dimension_by_asc != this.widget_options.sort_dimension_by_asc) {
            this.sort_dimension_by_asc = this.widget_options.sort_dimension_by_asc;
        }
        if (this.hide_filter != this.widget_options.hide_filter) {
            this.hide_filter = this.widget_options.hide_filter;
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
        if (!isEqual(this.var_chart_scales_options, this.widget_options.var_chart_scales_options)) {
            this.var_chart_scales_options = cloneDeep(this.widget_options.var_chart_scales_options);
        }
        if (this.show_scale_x != this.widget_options.show_scale_x) {
            this.show_scale_x = this.widget_options.show_scale_x;
        }
        if (this.show_scale_y != this.widget_options.show_scale_y) {
            this.show_scale_y = this.widget_options.show_scale_y;
        }
        if (this.scale_x_title != this.widget_options.scale_x_title) {
            this.scale_x_title = this.widget_options.scale_x_title;
        }
        if (this.scale_y_title != this.widget_options.scale_y_title) {
            this.scale_y_title = this.widget_options.scale_y_title;
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
            for (const key in Object.keys(this.dimension_custom_filter_segment_types)) {
                if (this.dimension_custom_filter_segment_types[Object.keys(this.dimension_custom_filter_segment_types)[key]] == selected_option) {
                    const res = parseInt(Object.keys(this.dimension_custom_filter_segment_types)[key]);
                    return res >= 0 ? res : null;
                }
            }
            return null;
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
    private get_var_name_code_text(): (page_widget_id: number, var_id: number, chart_id?: number) => string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.get_var_name_code_text;
    }

    private async remove_multiple_dataset_vo_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.multiple_dataset_vo_field_ref) {
            return null;
        }

        this.next_update_options.multiple_dataset_vo_field_ref = null;

        await this.throttled_update_options();
    }

    private async add_multiple_dataset_vo_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        let multiple_dataset_vo_field_ref = new VOFieldRefVO();
        multiple_dataset_vo_field_ref.api_type_id = api_type_id;
        multiple_dataset_vo_field_ref.field_id = field_id;
        multiple_dataset_vo_field_ref.weight = 0;

        this.next_update_options.multiple_dataset_vo_field_ref = multiple_dataset_vo_field_ref;

        await this.throttled_update_options();
    }
}