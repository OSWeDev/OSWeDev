import { debounce, isEqual } from 'lodash';
import { Radar } from 'vue-chartjs';
import Chart from "chart.js/auto";
import * as helpers from "chart.js/helpers";
import { _adapters, CategoryScale, LinearScale, LogarithmicScale, RadialLinearScale, TimeScale } from 'chart.js';
import { Component, Prop, Watch } from 'vue-property-decorator';
import DatesChartJsAdapters from '../../../../../../shared/modules/FormatDatesNombres/Dates/DatesChartJsAdapters';
import VarRadarDataSetDescriptor from '../../../../../../shared/modules/Var/graph/VarRadarDataSetDescriptor';
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

const date_adapter = DatesChartJsAdapters.get_adapters();

_adapters._date.override(date_adapter);

@Component({
    template: require('./VarRadarChartComponent.pug'),
    components: {
        radarchart: Radar,
    }
})
export default class VarRadarChart extends VueComponentBase {
    @ModuleVarGetter
    public isDescMode: boolean;

    /**
     * TODO FIXME DIRTY : cas particulier des vars_params où l'on ne veut pas trimballer le var_id, on veut juste identifier les segments sur axis
     */
    @Prop({ default: null })
    public var_params_by_datasets: { [dataset_label: string]: VarDataBaseVO[] };

    @Prop({ default: null })
    public getlabel: (var_param: VarDataBaseVO) => string[];

    @Prop({ default: null })
    public var_dataset_descriptor: VarRadarDataSetDescriptor;

    @Prop({ default: null })
    public options: any;

    @Prop({ default: null })
    public filter: () => any;

    @Prop({ default: null })
    public filter_additional_params: any[];

    private singleton_waiting_to_be_rendered: boolean = false;
    private rendered: boolean = false;

    private current_chart_data: any = null;
    private current_chart_options: any = null;

    private throttled_update_chart_js = ThrottleHelper.declare_throttle_without_args(this.update_chart_js, 500, { leading: false, trailing: true });
    private debounced_render_or_update_chart_js = debounce(this.render_or_update_chart_js, 100);

    private var_datas: { [index: string]: VarDataValueResVO } = {};
    private throttled_var_datas_updater = ThrottleHelper.declare_throttle_without_args(this.var_datas_updater.bind(this), 100, { leading: false, trailing: true });

    private varUpdateCallbacks: { [cb_uid: number]: VarUpdateCallback } = {
        [VarsClientController.get_CB_UID()]: VarUpdateCallback.newCallbackEvery(this.throttled_var_datas_updater.bind(this), VarUpdateCallback.VALUE_TYPE_VALID)
    };


    get labels(): string[] {
        const res = [];

        for (const i in this.var_params_by_datasets) {
            const var_params = this.var_params_by_datasets[i];

            for (const j in var_params) {
                if (this.getlabel && this.getlabel(var_params[j])) {
                    if (this.getlabel(var_params[j]).length <= 1) {
                        res.push(this.getlabel(var_params[j]));
                    } else {
                        res.push(this.getlabel(var_params[j])[i]);
                    }
                } else {
                    res.push(this.t(VarsController.get_translatable_name_code_by_var_id(var_params[j].var_id)));
                }
            }
            break;
        }

        return res;
    }

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
        let self = this;
        return Object.assign(
            {
                options: {
                },
                plugins: {
                    labels: false
                },
                onClick: (point, event) => {
                    if (!self.isDescMode) {
                        return;
                    }

                    self.$modal.show(
                        VarDatasRefsParamSelectComponent,
                        { var_params: this.var_params_by_datasets },
                        {
                            width: 465,
                            height: 'auto',
                            scrollable: true
                        }
                    );
                }
            },
            this.options
        );
    }

    get datasets(): any[] {

        const res: any[] = [];

        if (!this.all_data_loaded) {
            return null;
        }

        const multiple_datasets = Object.keys(this.var_params_by_datasets).length > 1;

        for (const dataset_label in this.var_params_by_datasets) {
            const var_params = this.var_params_by_datasets[dataset_label];

            const dataset_datas: number[] = [];
            const backgrounds: string[] = [];
            const bordercolors: string[] = [];
            const borderwidths: number[] = [];

            for (const j in var_params) {
                const var_param: VarDataBaseVO = var_params[j];

                // dataset_datas.push(this.get_filtered_value(this.var_datas[var_param.index]));
                dataset_datas.push(this.var_datas[var_param.id].value);

                if (multiple_datasets) {
                    const randomColor = this.getRandomColor();
                    backgrounds.push(randomColor);
                    bordercolors.push(randomColor);
                } else {
                    if (this.var_dataset_descriptor && this.var_dataset_descriptor.backgrounds[j]) {
                        backgrounds.push(this.var_dataset_descriptor.backgrounds[j]);
                    } else if (this.var_dataset_descriptor && this.var_dataset_descriptor.backgrounds[0]) {
                        backgrounds.push(this.var_dataset_descriptor.backgrounds[0]);
                    } else {
                        backgrounds.push('#e1ddd5'); // pourquoi #e1ddd5 ? par défaut c'est 'rgba(0, 0, 0, 0.1)'
                    }

                    if (this.var_dataset_descriptor && this.var_dataset_descriptor.bordercolors[j]) {
                        bordercolors.push(this.var_dataset_descriptor.bordercolors[j]);
                    } else if (this.var_dataset_descriptor && this.var_dataset_descriptor.bordercolors[0]) {
                        bordercolors.push(this.var_dataset_descriptor.bordercolors[0]);
                    } else {
                        bordercolors.push('#fff');
                    }
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
                label: (dataset_label != '') ? dataset_label : 'Label',
                data: dataset_datas,
                backgroundColor: backgrounds,
                borderColor: bordercolors,
                borderWidth: borderwidths,
            };

            res.push(dataset);
        }

        return res;
    }

    get all_data_loaded(): boolean {

        if ((!this.var_params_by_datasets) || (!this.var_dataset_descriptor)) {
            return false;
        }

        for (const i in this.var_params_by_datasets) {
            const var_params = this.var_params_by_datasets[i];

            for (const j in var_params) {
                const var_param = var_params[j];

                if ((!this.var_datas) || (!this.var_datas[var_param.id]) || (typeof this.var_datas[var_param.id].value === 'undefined')) {
                    return false;
                }
            }
        }
        return true;
    }

    @Watch('var_params_by_datasets', { immediate: true })
    private async onChangeVarParam(new_var_params_by_datasets: { [dataset_label: string]: VarDataBaseVO[] }, old_var_params_by_datasets: { [dataset_label: string]: VarDataBaseVO[] }) {

        // On doit vérifier qu'ils sont bien différents
        if (isEqual(new_var_params_by_datasets, old_var_params_by_datasets)) {
            return;
        }

        if (!!old_var_params_by_datasets) {
            for (const i in old_var_params_by_datasets) {
                const old_chart_var_params = old_var_params_by_datasets[i];

                await VarsClientController.getInstance().unRegisterParams(old_chart_var_params, this.varUpdateCallbacks);
            }
        }

        if (!!new_var_params_by_datasets) {
            for (const i in new_var_params_by_datasets) {
                const new_chart_var_params = new_var_params_by_datasets[i];

                await VarsClientController.getInstance().registerParams(new_chart_var_params, this.varUpdateCallbacks);
            }
        }
    }

    @Watch('var_dataset_descriptor')
    private async onchange_descriptors(new_var_dataset_descriptor: VarRadarDataSetDescriptor, old_var_dataset_descriptor: VarRadarDataSetDescriptor) {

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
        if ((!!old_var_dataset_descriptor) && (this.var_params_by_datasets)) {
            for (const i in this.var_params_by_datasets) {
                const old_chart_var_params = this.var_params_by_datasets[i];

                await VarsClientController.getInstance().unRegisterParams(old_chart_var_params, this.varUpdateCallbacks);
            }
        }
        if ((!!new_var_dataset_descriptor) && (this.var_params_by_datasets)) {
            for (const i in this.var_params_by_datasets) {
                const new_chart_var_params = this.var_params_by_datasets[i];

                await VarsClientController.getInstance().registerParams(new_chart_var_params, this.varUpdateCallbacks);
            }
        }
    }

    @Watch('data')
    private async onchange_datasets() {
        await this.debounced_render_or_update_chart_js();
    }

    @Watch('chart_data')
    @Watch('chart_options')
    private async onChartDataChanged() {
        if (!this.chart_data || !this.chart_options) {
            return;
        }
        this.current_chart_data = this.chart_data;
        this.current_chart_options = this.chart_options;
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
            let interval = setInterval(() => {
                if (this.all_data_loaded) {
                    clearInterval(interval);
                    resolve('wait_for_datas');
                }
            }, 100);
        });
    }

    private var_datas_updater() {
        if ((!this.var_params_by_datasets) || (!this.var_dataset_descriptor)) {
            this.var_datas = null;
            return;
        }

        const res: { [id: number]: VarDataValueResVO } = {};

        for (const i in this.var_params_by_datasets) {
            const var_params = this.var_params_by_datasets[i];

            for (const j in var_params) {
                const var_param = var_params[j];

                if (var_param.index == null) {
                    res[var_param.id] = new VarDataValueResVO().set_value(0);
                } else {
                    res[var_param.id] = VarsClientController.cached_var_datas[var_param.index];
                }
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
        if (!!this.var_params_by_datasets) {
            for (const i in this.var_params_by_datasets) {
                const var_params = this.var_params_by_datasets[i];

                await VarsClientController.getInstance().unRegisterParams(var_params, this.varUpdateCallbacks);
            }
        }
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

        if (!!this.filter_additional_params) {
            params = params.concat(this.filter_additional_params);
        }

        return this.filter.apply(null, params);
    }

    
    private render_chart_js() {

        if (!this.chart_data) {
            return;
        }

        if (!!this.rendered) {
            ConsoleHandler.error('PB:render Radar Chart déjà rendu');
            return;
        }

        // if (!!this.rendered) {
        //     // Issu de Bar
        //     this.$data._chart.destroy();
        // }
        this.rendered = true;

        try {

            // Issu de Line
            (this as any).renderChart(
                this.chart_data,
                this.chart_options
            );
        } catch (error) {
            ConsoleHandler.error('PB:render Radar Chart probablement trop tôt:' + error + ':');
            this.rendered = false;
            // setTimeout(this.render_chart_js, 500);
        }
    }

    private update_chart_js() {

        if (!this.chart_data) {
            return;
        }

        if (!!this.rendered) {
            // Issu de Bar
            this.$data._chart.update();
        }
    }

    private getRandomColor() {
        const trans = '0.5'; // 50% transparency
        let color = 'rgba(';
        for (let i = 0; i < 3; i++) {
            color += Math.floor(Math.random() * 255) + ',';
        }
        color += trans + ')'; // add the transparency
        return color;
    }
}