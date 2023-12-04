import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { Scale } from 'chart.js';
import { isEqual } from 'lodash';
import VarChartOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VarChartOptionsVO';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import ChartJsScaleOptionsComponent from '../../../../chartjs/scale_options/ChartJsScaleOptionsComponent';
import WidgetFilterOptionsComponent from '../../var_widget/options/filters/WidgetFilterOptionsComponent';
import './VarChartOptionsItemComponent.scss';

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

    private options_props: VarChartOptionsVO;

    private selected_var_name: string = null;

    private custom_field_filters: { [field_id: string]: string } = {};

    private var_id: number = null;
    private bg_color: string = null;
    private border_color: string = null;
    private border_width: number = null;
    private scale_options_x: Partial<Scale> = null;
    private scale_options_y: Partial<Scale> = null;
    private scale_options_r: Partial<Scale> = null;

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
            this[key] = this.options[key];
        }

        this.options_props = this.options;
    }

    @Watch('selected_var_name')
    private async on_change_selected_var_name() {

        if (!this.selected_var_name) {

            this.var_id = null;
            this.handle_change();

            return;
        }

        try {
            const selected_var_id: number = parseInt(this.selected_var_name.split(' | ')[0]);

            if (this.var_id != selected_var_id) {

                this.var_id = selected_var_id;
                this.handle_change();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('bg_color')
    private async on_change_bg_color() {

        if (!this.bg_color) {

            this.bg_color = null;
            this.handle_change();

            return;
        }

        try {
            this.options_props.bg_color = this.bg_color;

            this.handle_change();
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('border_color')
    private async on_change_border_color() {
        if (!this.border_color) {

            this.border_color = null;
            this.handle_change();

            return;
        }

        try {
            this.options_props.border_color = this.border_color;

            this.handle_change();
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('border_width')
    private async on_changborder_width() {
        if (!this.border_width) {

            this.border_width = null;
            this.handle_change();

            return;
        }

        try {
            this.options_props.border_width = parseInt(this.border_width.toString());

            this.handle_change();
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    private handle_scale_options_x_change(options: Partial<Scale>) {
        this.scale_options_x = options;
        this.options_props.scale_options_x = this.scale_options_x;

        this.handle_change();
    }

    private handle_scale_options_y_change(options: Partial<Scale>) {
        this.scale_options_y = options;
        this.options_props.scale_options_y = this.scale_options_y;

        this.handle_change();
    }

    private async handle_change() {
        // Set up all params fields
        this.options_props.var_id = this.var_id;
        this.options_props.bg_color = this.bg_color;
        this.options_props.border_color = this.border_color;
        this.options_props.border_width = this.border_width;
        this.options_props.scale_options_x = this.scale_options_x;
        this.options_props.scale_options_y = this.scale_options_y;
        this.options_props.scale_options_r = this.scale_options_r;

        this.$emit('on_change', this.options_props);
    }
}