import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { cloneDeep, isEqual } from 'lodash';
import VarChartOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VarChartOptionsVO';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import ChartJsScaleOptionsComponent from '../../../../chartjs/scale_options/ChartJsScaleOptionsComponent';
import WidgetFilterOptionsComponent from '../../var_widget/options/filters/WidgetFilterOptionsComponent';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import { ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import './VarChartOptionsItemComponent.scss';
import ModuleTableFieldVO from '../../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableController from '../../../../../../../shared/modules/DAO/ModuleTableController';

@Component({
    template: require('./VarChartOptionsItemComponent.pug'),
    components: {
        Chartjsscaleoptionscomponent: ChartJsScaleOptionsComponent,
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Widgetfilteroptionscomponent: WidgetFilterOptionsComponent,
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class VarChartOptionsItemComponent extends VueComponentBase {

    @Prop({
        default: () => new Object(),
        type: Object,
    })
    private options: VarChartOptionsVO;

    @Prop({ default: null })
    private page_widget_id: number;

    @Prop({ default: null })
    private get_var_name_code_text: (page_widget_id: number, var_id: number) => string;

    @ModuleDashboardPageGetter
    private get_custom_filters: string[];

    private options_props: VarChartOptionsVO;


    private selected_var_name: string = null;

    private custom_filter_names: { [field_id: string]: string } = {};

    private chart_id: number = null;
    private var_id: number = null;
    private type: string | 'line' | 'bar' | 'radar' = null;
    private bg_color: string = null;
    private border_color: string = null;
    private border_width: number = null;


    private graphe_types: string[] = [
        'line',     // many lines on the same graph or line chart with bars
        'bar',      // Bar chart with lines chart
        'radar',    // Many radar charts on the same graph
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

        if (this.var_id && (this.selected_var_name != (this.var_id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.var_id))))) {
            this.selected_var_name = this.var_id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.var_id));
        }

        this.options_props = this.options;
    }

    @Watch('selected_var_name')
    private async on_change_selected_var_name() {

        if (!this.selected_var_name) {

            this.var_id = null;
            this.emit_change();

            return;
        }

        try {
            const selected_var_id: number = parseInt(this.selected_var_name.split(' | ')[0]);

            if (this.var_id != selected_var_id) {

                this.var_id = selected_var_id;
                this.emit_change();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('type')
    private async on_change_type() {
        this.emit_change();
    }

    @Watch('bg_color')
    private async on_change_bg_color() {
        this.emit_change();
    }

    @Watch('border_color')
    private async on_change_border_color() {
        this.emit_change();
    }

    @Watch('border_width')
    private async on_changborder_width() {
        this.emit_change();
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

        this.emit_change();
    }

    /**
     * fields_that_could_get_custom_filter
     *
     * @returns {string[]}
     */
    get fields_that_could_get_custom_filter(): string[] {
        let res: string[] = [];

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

    private async emit_change() {
        // Set up all params fields
        this.options_props.chart_id = this.chart_id; // To load the var data
        this.options_props.var_id = this.var_id; // To load the var data
        this.options_props.type = this.type;
        this.options_props.bg_color = this.bg_color;
        this.options_props.border_color = this.border_color;
        this.options_props.border_width = this.border_width;
        this.options_props.custom_filter_names = this.custom_filter_names;

        this.$emit('on_change', this.options_props);
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
}