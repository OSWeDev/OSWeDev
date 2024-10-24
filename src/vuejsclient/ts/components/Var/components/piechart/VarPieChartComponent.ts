import { debounce } from 'lodash';
import { Pie } from 'vue-chartjs';
import Chart, { CategoryScale, LinearScale, LogarithmicScale, RadialLinearScale, TimeScale } from "chart.js/auto";
import * as helpers from "chart.js/helpers";
import { Component, Prop, Watch } from 'vue-property-decorator';
import VarPieDataSetDescriptor from '../../../../../../shared/modules/Var/graph/VarPieDataSetDescriptor';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VarUpdateCallback from '../../../../../../shared/modules/Var/vos/VarUpdateCallback';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarGetter } from '../../store/VarStore';
import VarsClientController from '../../VarsClientController';
import VarDatasRefsParamSelectComponent from '../datasrefs/paramselect/VarDatasRefsParamSelectComponent';
import ChartDataLabels from 'chartjs-plugin-datalabels';
@Component({
    template: require('./VarPieChartComponent.pug'),
    components: {
        piechart: Pie,
    }
})
export default class VarPieChartComponent extends VueComponentBase {
    @ModuleVarGetter
    public isDescMode: boolean;

    /**
     * TODO FIXME DIRTY : cas particulier des vars_params où l'on ne veut pas trimballer le var_id, on veut juste identifier les segments sur axis
     */
    @Prop({ default: null })
    public var_params: VarDataBaseVO[];

    @Prop({ default: null })
    public getlabel: (var_param: VarDataBaseVO) => string[];

    @Prop({ default: null })
    public var_dataset_descriptor: VarPieDataSetDescriptor;

    @Prop({ default: null })
    public options: any;

    @Prop({ default: null })
    public plugins: any;

    @Prop({ default: null })
    public filter: () => any;

    @Prop({ default: null })
    public filter_additional_params: any[];

    @Prop({ default: false })
    public reload_on_mount: boolean;

    private singleton_waiting_to_be_rendered: boolean = false;
    private rendered: boolean = false;

    private current_chart_data: any = null;
    private current_chart_options: any = null;
    private current_chart_plugins: any = null;

    private hovered_index: string = null;
    private hovered: boolean = false;

    private throttled_update_chart_js = ThrottleHelper.declare_throttle_without_args(this.update_chart_js, 500, { leading: false, trailing: true });
    private debounced_render_or_update_chart_js = debounce(this.render_or_update_chart_js, 100);

    private var_datas: { [index: string]: VarDataValueResVO } = {};
    private throttled_var_datas_updater = ThrottleHelper.declare_throttle_without_args(this.var_datas_updater.bind(this), 100, { leading: false, trailing: true });

    private varUpdateCallbacks: { [cb_uid: number]: VarUpdateCallback } = {
        [VarsClientController.get_CB_UID()]: VarUpdateCallback.newCallbackEvery(this.throttled_var_datas_updater.bind(this), VarUpdateCallback.VALUE_TYPE_VALID)
    };

    get chart_data() {
        if (!this.all_data_loaded) {
            return null;
        }

        return {
            labels: this.labels,
            datasets: this.datasets
        };
    }

    get chart_options() {
        const self = this;
        return Object.assign(
            {
                options: {
                    events: ['click', 'mousemove', 'mouseout']
                },

                onClick: (point, event) => {
                    if (!self.isDescMode) {
                        return;
                    }

                    self.$modal.show(
                        VarDatasRefsParamSelectComponent,
                        { var_params: this.var_params },
                        {
                            width: 465,
                            height: 'auto',
                            scrollable: true
                        }
                    );
                },
                onHover: (event, chartElement) => {
                    if (chartElement.length) {
                        const index = chartElement[0].index;
                        if (event.type === 'mousemove') {
                            this.hovered_index = index.toString();
                            this.hovered = true;
                        }

                    } else {
                        this.hovered_index = 'null';
                        this.hovered = false;
                    }
                },
            },
            this.options
        );
    }

    get chart_plugins() {
        const self = this;
        let plugins = [
            this.plugins
        ];

        return plugins;
    }


    get datasets(): any[] {

        const res: any[] = [];

        if (!this.all_data_loaded) {
            return null;
        }

        const dataset_datas: number[] = [];
        const backgrounds: string[] = [];
        const bordercolors: string[] = [];
        const borderwidths: number[] = [];
        for (const j in this.var_params.filter((entry, id, self) =>
            !self.slice(id + 1).some((otherEntry) => otherEntry.id === entry.id)
        )) {
            const var_param: VarDataBaseVO = this.var_params[j];
            // dataset_datas.push(this.get_filtered_value(this.var_datas[var_param.index]));
            dataset_datas.push(this.var_datas[var_param.id].value);

            if (this.hovered) {
                if (this.hovered_index == j) {
                    if (this.var_dataset_descriptor && this.var_dataset_descriptor.backgrounds[j]) {
                        if (this.var_dataset_descriptor.backgrounds[j].includes('rgba')) {
                            backgrounds.push(this.var_dataset_descriptor.backgrounds[j].replace(/[^,]+(?=\))/, "1"));
                        } else {
                            backgrounds.push(this.var_dataset_descriptor.backgrounds[j].slice(0, this.var_dataset_descriptor.backgrounds[j].length - 2) + 'FF');
                        }
                    }
                } else {
                    if (this.var_dataset_descriptor && this.var_dataset_descriptor.backgrounds[j]) {
                        if (this.var_dataset_descriptor.backgrounds[j].includes('rgba')) {
                            backgrounds.push(this.var_dataset_descriptor.backgrounds[j].replace(/[^,]+(?=\))/, "0.2"));
                        } else {
                            backgrounds.push(this.var_dataset_descriptor.backgrounds[j].slice(0, this.var_dataset_descriptor.backgrounds[j].length - 2) + '33');
                        }
                    }
                }
            } else {
                if (this.var_dataset_descriptor && this.var_dataset_descriptor.backgrounds[j]) {
                    backgrounds.push(this.var_dataset_descriptor.backgrounds[j]);
                } else if (this.var_dataset_descriptor && this.var_dataset_descriptor.backgrounds[0]) {
                    backgrounds.push(this.var_dataset_descriptor.backgrounds[0]);
                } else {
                    backgrounds.push('#e1ddd5'); // pourquoi #e1ddd5 ? par défaut c'est 'rgba(0, 0, 0, 0.1)'
                }
            }
            if (this.var_dataset_descriptor && this.var_dataset_descriptor.bordercolors[j]) {
                bordercolors.push(this.var_dataset_descriptor.bordercolors[j]);
            } else if (this.var_dataset_descriptor && this.var_dataset_descriptor.bordercolors[0]) {
                bordercolors.push(this.var_dataset_descriptor.bordercolors[0]);
            } else {
                bordercolors.push('#fff');
            }

            if (this.var_dataset_descriptor && this.var_dataset_descriptor.borderwidths[j]) {
                borderwidths.push(this.var_dataset_descriptor.borderwidths[j]);
            } else if (this.var_dataset_descriptor && this.var_dataset_descriptor.borderwidths[0]) {
                borderwidths.push(this.var_dataset_descriptor.borderwidths[0]);
            } else {
                borderwidths.push(2);
            }

        }

        const dataset = {
            label: '',
            data: dataset_datas,
            backgroundColor: backgrounds,
            borderColor: bordercolors,
            borderWidth: borderwidths,
        };

        res.push(dataset);

        return res;
    }

    get labels(): string[] {
        const res = [];

        for (const i in this.var_params) {
            if (this.getlabel && this.getlabel(this.var_params[i])) {
                if (this.getlabel(this.var_params[i]).length <= 1) {
                    res.push(this.getlabel(this.var_params[i]));
                } else {
                    res.push(this.getlabel(this.var_params[i])[i]);
                }
            } else {
                res.push(this.t(VarsController.get_translatable_name_code_by_var_id(this.var_params[i].var_id)));
            }
        }
        return res;
    }

    get all_data_loaded(): boolean {

        if ((!this.var_params) || (!this.var_params.length) || (!this.var_dataset_descriptor)) {
            return false;
        }

        for (const i in this.var_params) {
            const var_param = this.var_params[i];

            if ((!this.var_datas) || (!this.var_datas[var_param.id]) || (typeof this.var_datas[var_param.id].value === 'undefined')) {
                return false;
            }
        }
        return true;
    }

    @Watch('var_params', { immediate: true })
    private async onChangeVarParam(new_var_params: VarDataBaseVO[], old_var_params: VarDataBaseVO[]) {

        // On doit vérifier qu'ils sont bien différents
        if (VarsController.isSameParamArray(new_var_params, old_var_params)) {
            return;
        }

        if (old_var_params && old_var_params.length) {
            console.log('unregister');
            await VarsClientController.getInstance().unRegisterParams(old_var_params, this.varUpdateCallbacks);
        }

        if (new_var_params && new_var_params.length) {
            console.log('register');
            await VarsClientController.getInstance().registerParams(new_var_params, this.varUpdateCallbacks);
        }

        // this.set_datasets();
        // this.set_labels();
        // this.onchange_all_data_loaded();
    }

    @Watch('var_dataset_descriptor')
    private async onchange_descriptors(new_var_dataset_descriptor: VarPieDataSetDescriptor, old_var_dataset_descriptor: VarPieDataSetDescriptor) {

        // On doit vérifier qu'ils sont bien différents
        new_var_dataset_descriptor = new_var_dataset_descriptor ? new_var_dataset_descriptor : null;
        old_var_dataset_descriptor = old_var_dataset_descriptor ? old_var_dataset_descriptor : null;
        let same: boolean = true;
        if (((!old_var_dataset_descriptor) && (!!new_var_dataset_descriptor)) ||
            ((!!old_var_dataset_descriptor) && (!new_var_dataset_descriptor)) ||
            ((!!new_var_dataset_descriptor) && (!!old_var_dataset_descriptor) && (new_var_dataset_descriptor.var_name != old_var_dataset_descriptor.var_name))) {
            same = false;
        }
        if (same) {
            return;
        }

        // sur chaque dimension
        if ((!!old_var_dataset_descriptor) && (this.var_params) && this.var_params.length) {
            await VarsClientController.getInstance().unRegisterParams(this.var_params, this.varUpdateCallbacks);
        }
        if ((!!new_var_dataset_descriptor) && (this.var_params) && this.var_params.length) {
            await VarsClientController.getInstance().registerParams(this.var_params, this.varUpdateCallbacks);
        }

        // this.onchange_all_data_loaded();
    }

    @Watch('data')
    private async onchange_datasets() {
        await this.debounced_render_or_update_chart_js();
    }

    @Watch('chart_plugins', { immediate: true })
    @Watch('chart_data')
    @Watch('chart_options')
    private async onChartDataChanged() {
        if (!this.chart_data || !this.chart_options || !this.chart_plugins) {
            return;
        }

        this.current_chart_data = this.chart_data;
        this.current_chart_options = this.chart_options;
        this.current_chart_plugins = this.chart_plugins;
    }

    public async created() {
        let chart = Chart;
        chart.register(ChartDataLabels, CategoryScale, LinearScale, LogarithmicScale, TimeScale, RadialLinearScale);
        window['Chart'] = chart;
        Chart['helpers'] = helpers;

        // await import("chart.js-plugin-labels-dv");
        await import("chartjs-plugin-datalabels");
    }

    /**
     * Si on a pas encore rendered le chart, on checke les datas. Dès que les datas sont là, on render.
     *  Pendant ce temps on bloque le sémaphore
     * Si on a déjà rendered le chart, on checke les datas. Dès que les datas sont là, on update.
     *  Pendant ce temps on bloque le sémaphore
     */
    private async render_or_update_chart_js() {

        if (this.singleton_waiting_to_be_rendered) {
            return;
        }
        this.singleton_waiting_to_be_rendered = true;

        if (!this.rendered) {

            await this.wait_for_datas();
            await this.render_chart_js();
        } else {

            await this.wait_for_datas();
            await this.throttled_update_chart_js();
        }

        this.singleton_waiting_to_be_rendered = false;
    }

    /**
     * Waiting for all_data_loaded
     */
    private async wait_for_datas(): Promise<string> {

        if (this.all_data_loaded) {
            return 'wait_for_datas';
        }

        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (this.all_data_loaded) {
                    clearInterval(interval);
                    resolve('wait_for_datas');
                }
            }, 100);
        });
    }

    private var_datas_updater() {
        if ((!this.var_params) || (!this.var_params.length) || (!this.var_dataset_descriptor)) {
            this.var_datas = null;
            return;
        }

        const res: { [id: number]: VarDataValueResVO } = {};

        for (const i in this.var_params) {
            const var_param = this.var_params[i];
            if (var_param.index == null) {
                res[var_param.id] = new VarDataValueResVO().set_value(0);
            } else {
                res[var_param.id] = VarsClientController.cached_var_datas[var_param.index];
            }
        }
        this.var_datas = res;
    }

    private async mounted() {

        if (this.all_data_loaded) {
            await this.debounced_render_or_update_chart_js();
        }
    }

    private async destroyed() {

        await VarsClientController.getInstance().unRegisterParams(this.var_params, this.varUpdateCallbacks);
    }

    private get_filtered_value(var_data: VarDataValueResVO) {

        if (!var_data) {
            return 0;
        }

        // On peut pas avoir des valeurs null pour les graphs, on change en 0
        if (var_data.value == null) {
            return 0;
        }

        if (!this.filter) {
            return var_data.value;
        }

        let params = [var_data.value];

        if (this.filter_additional_params) {
            params = params.concat(this.filter_additional_params);
        }

        return this.filter.apply(null, params);
    }

    private render_chart_js() {

        if (!this.chart_data) {
            return;
        }

        if (this.rendered) {
            ConsoleHandler.error('PB:render Pie Chart déjà rendu');
            return;
        }

        // if (!!this.rendered) {
        //     // Issu de Bar
        //     this.$data._chart.destroy();
        // }
        this.rendered = true;

        try {

            if (this.chart_plugins.length > 0) {
                (this as any).renderChart(
                    this.chart_data,
                    this.chart_options,
                    this.chart_plugins
                );
            } else {
                // Issu de Pie
                (this as any).renderChart(
                    this.chart_data,
                    this.chart_options
                );
            }
        } catch (error) {
            // ConsoleHandler.warn('PB:render Pie Chart probablement trop tôt:' + error);
            ConsoleHandler.error('PB:render Pie Chart probablement trop tôt:' + error + ':');
            this.rendered = false;
            // setTimeout(this.render_chart_js, 500);
        }
    }

    private update_chart_js() {

        if (!this.chart_data) {
            return;
        }

        if (this.rendered) {
            // Issu de Bar
            this.$data._chart.update();
        }
    }
}