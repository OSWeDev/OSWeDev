import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { cloneDeep, isEqual } from 'lodash';
import VarChartOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/VarChartOptionsVO';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VueComponentBase from '../../../VueComponentBase';
import VarChartOptionsItemComponent from './item/VarChartOptionsItemComponent';
import './VarChartsOptionsComponent.scss';

@Component({
    template: require('./VarChartsOptionsComponent.pug'),
    components: {
        Varchartoptionsitemcomponent: VarChartOptionsItemComponent,
    }
})
export default class VarChartsOptionsComponent extends VueComponentBase {

    @Prop({
        default: () => [],
        type: Array,
    })
    private options: VarChartOptionsVO[];

    @Prop({ default: null })
    private page_widget_id: number;

    @Prop({ default: null })
    private get_var_name_code_text: (page_widget_id: number, var_id: number) => string;

    private options_props: VarChartOptionsVO[] = [];

    @Watch('options', { immediate: true, deep: true })
    private on_input_options_changed() {
        if (isEqual(this.options_props, this.options)) {
            return;
        }

        this.options_props = this.options;
    }

    /**
     * add_var_chart_options
     * - Add a var_chart_options value to the collection object.
     */
    private add_var_chart_options() {
        const var_chart_options = new VarChartOptionsVO();

        this.options_props = [
            ...this.options_props,
            var_chart_options
        ];

        this.emit_change();
    }

    /**
     * remove_var_chart_options
     * - We need to delete the var_chart_options.
     *
     * @param {number} index
     */
    private remove_var_chart_options(index: number) {
        const options = cloneDeep(this.options_props);

        options.splice(index, 1);

        // We need to re-assign the object to trigger the watcher
        this.options_props = options;

        this.emit_change();
    }

    /**
     * handle_var_chart_options_change
     *  - When a var_chart_options is changed, we need to update the var_chart_options collection.
     *  - We need to delete the old var_chart_options and add the new one.
     *
     * @param {string} index
     * @param {{ VarChartOptionsVO }} var_chart_options
     */
    private handle_var_chart_options_change(index: string, var_chart_options: VarChartOptionsVO) {
        const options = cloneDeep(this.options_props);

        options[index] = var_chart_options;

        this.options_props = options;

        this.emit_change();
    }

    private emit_change() {
        this.$emit('on_change', this.options_props);
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
}