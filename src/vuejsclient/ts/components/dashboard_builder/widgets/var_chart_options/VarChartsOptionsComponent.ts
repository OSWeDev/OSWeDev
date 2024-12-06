import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { cloneDeep, isEqual } from 'lodash';
import VarChartOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/VarChartOptionsVO';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VueComponentBase from '../../../VueComponentBase';
import VarChartOptionsItemComponent from './item/VarChartOptionsItemComponent';
import './VarChartsOptionsComponent.scss';
import VarChartScalesOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/VarChartScalesOptionsVO';

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
    private get_var_name_code_text: (page_widget_id: number, var_id: number, chart_id: number) => string;

    @Prop({ default: [] })
    private fields_that_could_get_scales_filter: VarChartScalesOptionsVO[];

    private options_props: VarChartOptionsVO[] = [];

    private use_palette: boolean = false;
    private color_palettes_labels: string[] = [
        "Tableau",
        "ColorBrewer",
        "Matplotlib",
        "Coolors",
    ];
    private color_palettes: string[][] = [
        [
            '#4E79A7', // Bleu
            '#F28E2B', // Orange
            '#E15759', // Rouge
            '#76B7B2', // Vert
            '#59A14F', // Vert foncé
            '#EDC948', // Jaune
            '#B07AA1', // Violet
            '#FF9DA7', // Rose
            '#9C755F', // Marron
            '#BAB0AC'  // Gris
        ],
        [
            '#1b9e77', // Vert
            '#d95f02', // Orange
            '#7570b3', // Violet
            '#e7298a', // Rose
            '#66a61e', // Vert clair
            '#e6ab02', // Jaune
            '#a6761d', // Marron
            '#666666'  // Gris
        ],
        [
            '#1f77b4', // Bleu
            '#ff7f0e', // Orange
            '#2ca02c', // Vert
            '#d62728', // Rouge
            '#9467bd', // Violet
            '#8c564b', // Marron
            '#e377c2', // Rose
            '#7f7f7f', // Gris
            '#bcbd22', // Jaune
            '#17becf'  // Cyan
        ],
        [
            '#264653', // Bleu foncé
            '#2a9d8f', // Vert sarcelle
            '#e9c46a', // Jaune moutarde
            '#f4a261', // Orange brûlé
            '#e76f51'  // Rouge terre cuite
        ]
    ];
    private tmp_selected_color_palette: string = null;

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

    @Watch('tmp_selected_color_palette')
    private onchange_tmp_selected_color_palette() {
        if (!this.options_props) {
            return;
        }

        this.options_props.forEach(option_prop => {
            if (!this.tmp_selected_color_palette) {
                if (option_prop.color_palette) {
                    option_prop.color_palette = null;
                }
            } else {
                let selected_palette_index = this.color_palettes_labels.indexOf(this.tmp_selected_color_palette);
                let new_palette = this.color_palettes[selected_palette_index];
                if (option_prop.color_palette != new_palette) {
                    option_prop.color_palette = new_palette;
                    option_prop.bg_color = null;
                    option_prop.border_color = null;
                }
            }
        });

        this.emit_change();
    }

    @Watch('options', { immediate: true, deep: true })
    private on_input_options_changed() {
        if (isEqual(this.options_props, this.options)) {
            return;
        }

        this.options_props = this.options;
        this.use_palette = this.options_props.some(option_prop => option_prop.color_palette && option_prop.color_palette.length > 0);
        this.tmp_selected_color_palette = this.use_palette ? this.color_palettes_labels[this.searchIndexOfArray(this.options_props[0].color_palette, this.color_palettes)] : null;

    }

    private searchIndexOfArray(target: any, source: any): number {
        for (let i = 0; i <= source.length; i++) {
            if (JSON.stringify(target) === JSON.stringify(source[i])) {
                return i;
            }
        }
        return -1;
    }

    private switch_use_palette() {
        this.use_palette = !this.use_palette;
        this.tmp_selected_color_palette = null;
        this.emit_change();
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
}