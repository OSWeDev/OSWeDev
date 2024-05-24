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

    @Prop({ default: null })
    private get_var_name_code_text: (page_widget_id: number, var_id: number) => string;

    private options_props: VarChartScalesOptionsVO;
    private scale_title: string = null;
    private chart_id: number = null;
    private show_scale_title: boolean = true;
    private scale_color: string = '#666';
    private scale_options?: Partial<Scale> = null;
    private filter_type: string = '';
    private filter_additional_params: string = '';

    public async created() {
        this.chart_id = this.chart_id ?? Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    }

    @Watch('options', { immediate: true, deep: true })
    private on_input_options_changed() {
        if (isEqual(this.options_props, this.options)) {
            return;
        }

        for (const key in this.options) {
            if (this.hasOwnProperty(key)) {
                this[key] = this.options[key];
            }
        }

        this.options_props = this.options;
    }

    private async update_additional_options(additional_options: string) {
        this.filter_additional_params = additional_options;
        this.emit_change();
    }

    private async update_filter_type(filter_type: string) {
        this.filter_type = filter_type;
        this.emit_change();
    }

    private async switch_show_scale_title() {
        this.show_scale_title = !this.show_scale_title;
        this.emit_change();
    }

    get title_code_text(): string {
        if (!this.options_props) {
            return null;
        }
        // this.scale_title = VarChartScalesOptionsVO.get_title_code_text(this.page_widget_id, this.chart_id);
        // this.emit_change();
        return this.options_props.get_title_name_code_text(this.page_widget_id, this.chart_id);
    }

    private async handle_scale_color_change(color: string) {
        this.scale_color = color;
        this.emit_change();
    }

    /**
     * handle_scale_options_x_change
     *
     * @param {Partial<Scale>} options
     */
    private handle_scale_options_change(options: Partial<Scale>) {
        this.scale_options = options;

        if (this.scale_options) {
            if (this.scale_options.type != "") {
                this.emit_change();
            }
        }
    }

    private async emit_change() {
        // Set up all params fields
        this.options_props.chart_id = this.chart_id; // To load the var data
        this.options_props.filter_additional_params = this.filter_additional_params;
        this.options_props.filter_type = this.filter_type;
        this.options_props.show_scale_title = this.show_scale_title;
        this.options_props.scale_color = this.scale_color;
        this.options_props.scale_options = this.scale_options;
        this.options_props.scale_title = this.scale_title;

        this.$emit('on_change', this.options_props);
    }
}