import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { cloneDeep, isEqual } from 'lodash';
import VarChartScalesOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/VarChartScalesOptionsVO';
import VueComponentBase from '../../../VueComponentBase';
import VarChartScalesOptionsItemComponent from './item/VarChartScalesOptionsItemComponent';
import './VarChartScalesOptionsComponent.scss';

@Component({
    template: require('./VarChartScalesOptionsComponent.pug'),
    components: {
        Varchartscalesoptionsitemcomponent: VarChartScalesOptionsItemComponent,
    }
})
export default class VarChartScalesOptionsComponent extends VueComponentBase {

    @Prop({
        default: () => [],
        type: Array,
    })
    private options: VarChartScalesOptionsVO[];

    @Prop({ default: false })
    private detailed: boolean;

    @Prop({ default: null })
    private page_widget_id: number;

    @Prop({ default: null })
    private get_var_name_code_text: (page_widget_id: number, var_id: number, chart_id: number) => string;

    private options_props: VarChartScalesOptionsVO[] = [];

    private opened_prop_index: number[] = [];

    @Watch('options', { immediate: true, deep: true })
    private on_input_options_changed() {
        if (isEqual(this.options_props, this.options)) {
            return;
        }

        this.options_props = this.options;
        if (this.opened_prop_index.length == 0) {
            this.opened_prop_index = Array.from({ length: this.options_props.length }, (x, i) => i);
        }
    }

    private is_closed(index: number): boolean {
        if (this.opened_prop_index.indexOf(index) == -1) {
            return true;
        } else {
            return false;
        }
    }

    private close_var_chart_options(index: number) {
        if (!this.is_closed(index)) {
            this.opened_prop_index.splice(this.opened_prop_index.indexOf(index), 1);
        } else {
            this.opened_prop_index.push(index);
        }
    }

    /**
     * add_var_chart_scales_options
     * - Add a var_chart_scales_options value to the collection object.
     */
    private add_var_chart_scales_options() {
        const var_chart_scales_options = new VarChartScalesOptionsVO();

        this.options_props = [
            ...this.options_props,
            var_chart_scales_options
        ];

        this.emit_change();
    }

    /**
     * remove_var_chart_scales_options
     * - We need to delete the var_chart_scales_options.
     *
     * @param {number} index
     */
    private remove_var_chart_scales_options(index: number) {
        const options = cloneDeep(this.options_props);

        options.splice(index, 1);

        // We need to re-assign the object to trigger the watcher
        this.options_props = options;

        this.emit_change();
    }

    /**
     * handle_var_chart_scales_options_change
     *  - When a var_chart_scales_options is changed, we need to update the var_chart_scales_options collection.
     *  - We need to delete the old var_chart_scales_options and add the new one.
     *
     * @param {string} index
     * @param {{ VarChartScalesOptionsVO }} var_chart_scales_options
     */
    private handle_var_chart_scales_options_change(index: string, var_chart_scales_options: VarChartScalesOptionsVO) {
        const options = cloneDeep(this.options_props);

        options[index] = var_chart_scales_options;

        this.options_props = options;

        this.emit_change();
    }

    private emit_change() {
        this.$emit('on_change', this.options_props);
    }
}