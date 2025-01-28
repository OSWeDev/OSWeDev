import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { cloneDeep, filter, isEqual } from 'lodash';
import VarChartScalesOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VarChartScalesOptionsVO';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import ChartJsScaleOptionsComponent from '../../../../chartjs/scale_options/ChartJsScaleOptionsComponent';
import WidgetFilterOptionsComponent from '../../var_widget/options/filters/WidgetFilterOptionsComponent';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import { ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import './VarChartScalesOptionsItemComponent.scss';
import ModuleTableFieldVO from '../../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableController from '../../../../../../../shared/modules/DAO/ModuleTableController';
import { Scale } from 'chart.js';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';

@Component({
    template: require('./VarChartScalesOptionsItemComponent.pug'),
    components: {
        Chartjsscaleoptionscomponent: ChartJsScaleOptionsComponent,
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Widgetfilteroptionscomponent: WidgetFilterOptionsComponent,
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class VarChartScalesOptionsItemComponent extends VueComponentBase {

    @Prop({
        default: () => new Object(),
        type: Object,
    })
    private options: VarChartScalesOptionsVO;

    @Prop({ default: null })
    private page_widget_id: number;

    @Prop({ default: false })
    private detailed: boolean;

    @Prop({ default: null })
    private get_var_name_code_text: (page_widget_id: number, var_id: number, chart_id: number) => string;
    private throttled_emit_changes = ThrottleHelper.declare_throttle_without_args(this.emit_change.bind(this), 50, false);
    private options_props: VarChartScalesOptionsVO = null;
    private show_scale_title: boolean = true;
    private scale_options: Partial<Scale> = null;
    private filter_type: string = '';
    private filter_additional_params: string = '';
    private scale_position: string[] = [
        'left',
        'right'
    ];
    private selected_position: string = 'left';
    private stacked: boolean = false;
    private fill: boolean = false;


    get chart_id(): number {
        return this.options_props.chart_id ? this.options_props.chart_id : Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    }

    get title_code_text(): string {
        if (!this.options_props) {
            return null;
        }
        return this.options_props.get_title_name_code_text(this.page_widget_id, this.chart_id);
    }

    @Watch('scale_color')
    private async handle_scale_color_change() {
        await this.throttled_emit_changes();
    }
    @Watch('selected_position')
    private async handle_selected_position_change() {
        await this.throttled_emit_changes();
    }

    @Watch('options', { immediate: true, deep: true })
    private on_input_options_changed() {
        if (isEqual(this.options_props, this.options)) {
            return;
        }

        this.options_props = this.options ? new VarChartScalesOptionsVO().from(this.options) : null;
    }

    @Watch('options_props', { immediate: true, deep: true })
    private async on_input_options_props_changed() {
        if (!this.options_props) {
            return;
        }

        if (this.filter_type != this.options_props.filter_type) {
            this.filter_type = this.options_props.filter_type;
        }

        if (this.filter_additional_params != this.options_props.filter_additional_params) {
            this.filter_additional_params = this.options_props.filter_additional_params;
        }

        if (this.show_scale_title != this.options_props.show_scale_title) {
            this.show_scale_title = this.options_props.show_scale_title;
        }

        if (this.scale_options != this.options_props.scale_options) {
            this.scale_options = this.options_props.scale_options;
        }

        if (this.selected_position != this.options_props.selected_position) {
            this.selected_position = this.options_props.selected_position;
        }
    }

    private async update_additional_options(additional_options: string) {
        this.filter_additional_params = additional_options;
        await this.throttled_emit_changes();
    }

    private async update_filter_type(filter_type: string) {
        this.filter_type = filter_type;
        await this.throttled_emit_changes();
    }

    private async switch_show_scale_title() {
        this.show_scale_title = !this.show_scale_title;
        await this.throttled_emit_changes();
    }

    private async switch_stacked() {
        this.stacked = !this.stacked;
        await this.throttled_emit_changes();
    }

    private async switch_fill() {
        this.fill = !this.fill;
        await this.throttled_emit_changes();
    }


    /**
     * handle_scale_options_change
     *
     * @param {Partial<Scale>} options
     */
    private async handle_scale_options_change(options: Partial<Scale>) {
        this.scale_options = options;

        if (this.scale_options) {
            if (this.scale_options.type != "") {
                await this.throttled_emit_changes();
            }
        }
    }

    private async emit_change() {
        // Set up all params fields
        this.options.page_widget_id = this.page_widget_id;
        this.options_props.chart_id = this.chart_id; // To load the var data
        this.options_props.filter_additional_params = this.filter_additional_params;
        this.options_props.filter_type = this.filter_type;
        this.options_props.show_scale_title = this.show_scale_title;
        this.options_props.scale_options = this.scale_options;
        this.options_props.selected_position = this.selected_position;
        this.options_props.stacked = this.stacked;
        this.options_props.fill = this.fill;

        this.$emit('on_change', this.options_props);
    }
}