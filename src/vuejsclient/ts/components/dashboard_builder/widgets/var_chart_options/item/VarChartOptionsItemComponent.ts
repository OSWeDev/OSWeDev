import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { cloneDeep, every, isEqual } from 'lodash';
import VarChartOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VarChartOptionsVO';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import ChartJsScaleOptionsComponent from '../../../../chartjs/scale_options/ChartJsScaleOptionsComponent';
import { ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import './VarChartOptionsItemComponent.scss';
import ModuleTableFieldVO from '../../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableController from '../../../../../../../shared/modules/DAO/ModuleTableController';
import VarChartScalesOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VarChartScalesOptionsVO';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import WidgetFilterOptionsComponent from '../../var_widget/options/filters/WidgetFilterOptionsComponent';

@Component({
    template: require('./VarChartOptionsItemComponent.pug'),
    components: {
        Chartjsscaleoptionscomponent: ChartJsScaleOptionsComponent,
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Inlinetranslatabletext: InlineTranslatableText,
        Widgetfilteroptionscomponent: WidgetFilterOptionsComponent,
    }
})
export default class VarChartOptionsItemComponent extends VueComponentBase {

    @Prop({
        default: () => new Object(),
        type: Object,
    })
    private options: VarChartOptionsVO;

    @Prop({ default: false })
    private detailed: boolean;

    @Prop({ default: null })
    private page_widget_id: number;

    @Prop({ default: null })
    private fields_that_could_get_scales_filter: VarChartScalesOptionsVO[];

    @Prop({ default: false })
    private use_palette: boolean;

    @Prop({ default: null })
    private get_var_name_code_text: (page_widget_id: number, var_id: number, chart_id: number) => string;

    @ModuleDashboardPageGetter
    private get_custom_filters: string[];
    private throttled_emit_changes = ThrottleHelper.declare_throttle_without_args(this.emit_change.bind(this), 50, { leading: false, trailing: true });

    private options_props: VarChartOptionsVO;

    private selected_var_name: string = null;

    private custom_filter_names: { [field_id: string]: string } = {};
    private scale_filter_names: string[] = [];
    private selected_filter_name: string = null;
    private selected_filter_id: number = null;
    private chart_id: number = null;
    private var_id: number = null;
    private type: string | 'line' | 'bar' | 'radar' = null;
    private bg_color: string = '#666';
    private border_color: string = '#666';
    private border_width: number = null;
    private has_gradient: boolean = false;
    private show_values: boolean = false;
    private show_zeros: boolean = true;
    private filter_type: string = '';
    private filter_additional_params: string = '';
    private graphe_types: string[] = [
        'line',     // many lines on the same graph or line chart with bars
        'bar',      // Bar chart with lines chart
    ];

    // TODO: Add translations
    private scale_types_options: string[] = [
        'linear',
        'logarithmic',
        'category',
        'time',
        'radialLinear'
    ];

    // TODO: Add translations
    private legend_positions: string[] = [
        'top',
        'left',
        'bottom',
        'right'
    ];

    /**
         * fields_that_could_get_custom_filter
         *
         * @returns {string[]}
         */
    get fields_that_could_get_custom_filter(): string[] {
        const res: string[] = [];

        if (!this.var_id || (!VarsController.var_conf_by_id[this.var_id])) {
            return null;
        }

        const var_param_type = VarsController.var_conf_by_id[this.var_id].var_data_vo_type;
        if (!var_param_type) {
            return null;
        }

        if (!this.custom_filter_names) {
            this.custom_filter_names = {};
        }

        const fields = ModuleTableController.module_tables_by_vo_type[var_param_type].get_fields();
        for (const i in fields) {
            const field = fields[i];

            if (
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_tstzrange_array) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_hourrange_array)
            ) {

                res.push(field.field_id);

                if (typeof this.custom_filter_names[field.field_id] === "undefined") {
                    this.custom_filter_names[field.field_id] = null;
                }
            }
        }

        return res;
    }
    get var_names(): string[] {

        const res: string[] = [];

        for (const i in VarsController.var_conf_by_name) {
            const var_conf = VarsController.var_conf_by_name[i];

            res.push(var_conf.id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(var_conf.id)));
        }

        res.sort((a, b) => {
            const a_ = a.split(' | ')[1];
            const b_ = b.split(' | ')[1];

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

    @Watch('options', { immediate: true, deep: true })
    private on_input_options_changed() {
        if (isEqual(this.options_props, this.options)) {
            return;
        }

        for (const key in this.options) {
            if (Object.prototype.hasOwnProperty.call(this, key)) {
                this[key] = this.options[key];
            }
        }

        if (this.var_id && (this.selected_var_name != (this.var_id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.var_id))))) {
            this.selected_var_name = this.var_id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.var_id));
        }

        if(!this.detailed) {
            this.border_width = 0;
        }
        this.options_props = this.options;
        this.selected_filter_name = this.options_props.selected_filter_name ? this.options_props.selected_filter_name : null;
    }


    @Watch('selected_var_name')
    private async on_change_selected_var_name() {

        if (!this.selected_var_name) {

            this.var_id = null;
            await this.throttled_emit_changes();

            return;
        }

        try {
            const selected_var_id: number = parseInt(this.selected_var_name.split(' | ')[0]);

            if (this.var_id != selected_var_id) {

                this.var_id = selected_var_id;
                await this.throttled_emit_changes();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('type')
    private async on_change_type() {
        await this.throttled_emit_changes();
    }

    @Watch('bg_color')
    private async on_change_bg_color() {
        await this.throttled_emit_changes();
    }

    @Watch('border_color')
    private async on_change_border_color() {
        await this.throttled_emit_changes();
    }

    @Watch('border_width')
    private async on_changborder_width() {
        await this.throttled_emit_changes();
    }

    @Watch('selected_filter_name')
    private async change_selected_filter_name() {
        if (this.fields_that_could_get_scales_filter[this.scale_filter_names.indexOf(this.selected_filter_name)]) {
            this.selected_filter_id = this.fields_that_could_get_scales_filter[this.scale_filter_names.indexOf(this.selected_filter_name)].chart_id;
        }

        await this.throttled_emit_changes();
    }

    @Watch('fields_that_could_get_scales_filter', { immediate: true, deep: true })
    private async on_change_fields_that_could_get_scales_filter() {
        if (!this.fields_that_could_get_scales_filter) {
            return [];
        }
        const res: string[] = [];
        for (const i in this.fields_that_could_get_scales_filter) {
            const scale_options = new VarChartScalesOptionsVO().from(this.fields_that_could_get_scales_filter[i]);
            const allScaleOptionsUndefined = every(scale_options, scaleOptions => scaleOptions === undefined);
            if (!allScaleOptionsUndefined) {
                const title_name = this.t(scale_options.get_title_name_code_text(this.page_widget_id, scale_options.chart_id)) != scale_options.get_title_name_code_text(this.page_widget_id, scale_options.chart_id) ? this.t(scale_options.get_title_name_code_text(this.page_widget_id, scale_options.chart_id)) : 'Axe - ' + scale_options.chart_id.toString();
                res.push(title_name);
            }
        }
        this.scale_filter_names = res;
        await this.throttled_emit_changes();
    }

    public async created() {
        this.chart_id = this.chart_id ?? Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    }

    private async on_change_gradient() {
        this.has_gradient = !this.has_gradient;
        await this.throttled_emit_changes();
    }

    private async switch_show_values() {
        this.show_values = !this.show_values;
        await this.throttled_emit_changes();
    }

    private async switch_show_zeros() {
        this.show_zeros = !this.show_zeros;
        await this.throttled_emit_changes();
    }

    private async update_additional_options(additional_options: string) {
        this.filter_additional_params = additional_options;
        await this.throttled_emit_changes();
    }

    private async update_filter_type(filter_type: string) {
        this.filter_type = filter_type;
        await this.throttled_emit_changes();
    }

    /**
         * change_custom_filter
         *
         * @param {string} field_id
         * @param {string} custom_filter
         */
    private async change_custom_filter(field_id: string, custom_filter: string) {
        const custom_filter_names: { [field_id: string]: string } = cloneDeep(this.custom_filter_names);

        custom_filter_names[field_id] = custom_filter;

        this.custom_filter_names = custom_filter_names;

        await this.throttled_emit_changes();
    }

    private async emit_change() {
        // Set up all params fields
        this.options_props.chart_id = this.chart_id; // To load the var data
        this.options_props.var_id = this.var_id; // To load the var data
        this.options_props.type = this.type;
        this.options_props.bg_color = this.bg_color;
        this.options_props.border_color = this.border_color;
        this.options_props.border_width = this.border_width;
        this.options_props.custom_filter_names = this.custom_filter_names;
        this.options_props.has_gradient = this.has_gradient;
        this.options_props.show_values = this.show_values;
        this.options_props.show_zeros = this.show_zeros;
        this.options_props.filter_additional_params = this.filter_additional_params;
        this.options_props.filter_type = this.filter_type;
        this.options_props.selected_filter_id = this.selected_filter_id;
        this.options_props.selected_filter_name = this.selected_filter_name;
        this.$emit('on_change', this.options_props);
    }
}