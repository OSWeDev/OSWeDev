import { debounce } from 'lodash';
import { Chart as VueChart } from 'vue-chartjs';
import Chart from "chart.js/auto";
import * as helpers from "chart.js/helpers";
import { _adapters } from 'chart.js';
import { Component, Prop, Watch } from 'vue-property-decorator';
import DatesChartJsAdapters from '../../../../../../shared/modules/FormatDatesNombres/Dates/DatesChartJsAdapters';
import VarMixedChartDataSetDescriptor from '../../../../../../shared/modules/Var/graph/VarMixedChartDataSetDescriptor';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarUpdateCallback from '../../../../../../shared/modules/Var/vos/VarUpdateCallback';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarGetter } from '../../store/VarStore';
import VarsClientController from '../../VarsClientController';
import VarDatasRefsParamSelectComponent from '../datasrefs/paramselect/VarDatasRefsParamSelectComponent';

interface IChartDataset {
    label: string;
    data: number[] | string[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number[];
    fill?: number;
}

const date_adapter = DatesChartJsAdapters.get_adapters();
_adapters._date.override(date_adapter);

/**
 * TODO: We should have the same kind of result exposed here @see https://www.chartjs.org/docs/latest/charts/mixed.html
 */

@Component({
    template: require('./VarMixedChartComponent.pug'),
    components: {
        mixedchart: VueChart,
    }
})
export default class VarMixedChartComponent extends VueComponentBase {

    @ModuleVarGetter
    public isDescMode: boolean;

    /**
     * TODO FIXME DIRTY : cas particulier des vars_params où l'on ne veut pas trimballer le var_id, on veut juste identifier les segments sur axis
     */
    @Prop({ default: null })
    public charts_var_params: { [chart_index: string]: VarDataBaseVO[] };

    @Prop({ default: null })
    public getlabel: (var_param: VarDataBaseVO) => string;

    @Prop({ default: null })
    public charts_var_dataset_descriptor: { [chart_index: string]: VarMixedChartDataSetDescriptor };

    @Prop({ default: null })
    public options: any;

    @Prop({ default: null })
    public filter: () => any;

    @Prop({ default: null })
    public filter_additional_params: any[];

    @Prop({ default: false })
    public reload_on_mount: boolean;

    private singleton_waiting_to_be_rendered: boolean = false;
    private rendered: boolean = false;

    private current_mixed_charts_data: any = null;
    private current_mixed_charts_options: any = null;

    private throttled_update_chart_js = ThrottleHelper.declare_throttle_without_args(this.update_chart_js, 500, { leading: false, trailing: true });
    private debounced_render_or_update_chart_js = debounce(this.render_or_update_chart_js, 100);

    private charts_var_datas: { [chart_index: string]: { [index: string]: VarDataValueResVO } } = {};
    private throttled_var_datas_updater = ThrottleHelper.declare_throttle_without_args(this.var_datas_updater.bind(this), 100, { leading: false, trailing: true });

    private varUpdateCallbacks: { [cb_uid: number]: VarUpdateCallback } = {
        [VarsClientController.get_CB_UID()]: VarUpdateCallback.newCallbackEvery(this.throttled_var_datas_updater.bind(this), VarUpdateCallback.VALUE_TYPE_VALID)
    };

    public async created() {
        window['Chart'] = Chart;
        Chart['helpers'] = helpers;

        await import("chart.js-plugin-labels-dv");
    }

    @Watch('chart_data')
    @Watch('chart_options')
    private async onChartDataChanged() {
        if (!this.chart_data || !this.chart_options) {
            return;
        }

        this.current_mixed_charts_data = this.chart_data;
        this.current_mixed_charts_options = this.chart_options;
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

        if ((!this.charts_var_datas) || (!this.charts_var_dataset_descriptor)) {
            this.charts_var_datas = null;
            return;
        }

        // get all charts_var_datas (we may have many charts in one mixed chart component)
        const res: { [chart_index: string]: { [index: string]: VarDataValueResVO } } = {};

        for (const key in this.charts_var_datas) {
            const chart_var_datas = this.charts_var_datas[key];

            for (const i in chart_var_datas) {
                const var_param = chart_var_datas[i];

                res[key][var_param.index] = VarsClientController.cached_var_datas[var_param.index];
            }
        }

        this.charts_var_datas = res;
    }

    /**
     * get all charts_var_datas (we may have many charts in one mixed chart component)
     *
     * @returns {{ [chart_index: string]: IChartDataset }}
     */
    private get_charts_datasets(): { [chart_index: string]: IChartDataset } {
        const datasets: { [chart_index: string]: IChartDataset } = {};

        for (const chart_index in this.charts_var_params) {

            const data: {
                data: string[] | number[];
                backgroundColor: string[];
                borderColor: string[];
                borderWidth: number[];
                label: string;
            } = this.get_chart_dataset_by_chart_index(chart_index);

            datasets[chart_index] = data;
        }

        return datasets;
    }

    /**
     * Get chart data by the given chart_index
     *
     * @param {string} chart_index
     * @returns {(number[] | string[])}
     */
    private get_chart_dataset_by_chart_index(chart_index: string): IChartDataset {
        const chart_var_dataset_descriptor = this.charts_var_dataset_descriptor[chart_index];
        const chart_var_params = this.charts_var_params[chart_index];
        const chart_var_datas = this.charts_var_datas[chart_index];

        const data: number[] = [];
        const backgroundColor = [];
        const borderColor = [];
        const borderWidth = [];

        if (!chart_var_params || !chart_var_datas) {
            return null;
        }

        for (const var_key in chart_var_params) {
            const var_param: VarDataBaseVO = chart_var_params[var_key];

            data.push(chart_var_datas[var_param.index].value);

            if (chart_var_dataset_descriptor && chart_var_dataset_descriptor.backgroundColor[var_key]) {
                backgroundColor.push(chart_var_dataset_descriptor.backgroundColor[var_key]);
            } else if (chart_var_dataset_descriptor && chart_var_dataset_descriptor.backgroundColor[0]) {
                backgroundColor.push(chart_var_dataset_descriptor.backgroundColor[0]);
            } else {
                backgroundColor.push('#e1ddd5'); // pourquoi #e1ddd5 ? par défaut c'est 'rgba(0, 0, 0, 0.1)'
            }

            if (chart_var_dataset_descriptor && chart_var_dataset_descriptor.borderColor[var_key]) {
                borderColor.push(chart_var_dataset_descriptor.borderColor[var_key]);
            } else if (chart_var_dataset_descriptor && chart_var_dataset_descriptor.borderColor[0]) {
                borderColor.push(chart_var_dataset_descriptor.borderColor[0]);
            } else {
                borderColor.push('#fff');
            }

            if (chart_var_dataset_descriptor && chart_var_dataset_descriptor.borderWidth[var_key]) {
                borderWidth.push(chart_var_dataset_descriptor.borderWidth[var_key]);
            } else if (chart_var_dataset_descriptor && chart_var_dataset_descriptor.borderWidth[0]) {
                borderWidth.push(chart_var_dataset_descriptor.borderWidth[0]);
            } else {
                borderWidth.push(2);
            }
        }

        return {
            label: (!!chart_var_dataset_descriptor.label_translatable_code) ?
                this.t(chart_var_dataset_descriptor.label_translatable_code) :
                this.t(VarsController.get_translatable_name_code(chart_var_dataset_descriptor.var_name)),
            backgroundColor: backgroundColor,
            borderColor: borderColor,
            borderWidth: borderWidth,
            data: data,
        };
    }

    private async mounted() {

        if (this.all_data_loaded) {
            await this.debounced_render_or_update_chart_js();
        }
    }

    private async destroyed() {

        for (let chart_key in this.charts_var_params) {
            let chart_var_params = this.charts_var_params[chart_key];

            await VarsClientController.getInstance().unRegisterParams(chart_var_params, this.varUpdateCallbacks);
        }
    }

    get all_data_loaded(): boolean {

        if ((!this.charts_var_params) || (!this.charts_var_params.length) || (!this.charts_var_dataset_descriptor)) {
            return false;
        }

        for (let chart_key in this.charts_var_params) {
            let chart_var_params = this.charts_var_params[chart_key];

            for (let i in chart_var_params) {
                let var_param: VarDataBaseVO = chart_var_params[i];

                if (
                    (!this.charts_var_datas[chart_key]) ||
                    (!this.charts_var_datas[chart_key][var_param.index]) ||
                    (typeof this.charts_var_datas[chart_key][var_param.index].value === 'undefined')
                ) {
                    return false;
                }
            }
        }
        return true;
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

    @Watch('var_params', { immediate: true })
    private async onChangeVarParam(new_var_params: VarDataBaseVO[], old_var_params: VarDataBaseVO[]) {

        // On doit vérifier qu'ils sont bien différents
        if (VarsController.isSameParamArray(new_var_params, old_var_params)) {
            return;
        }

        if (old_var_params && old_var_params.length) {
            await VarsClientController.getInstance().unRegisterParams(old_var_params, this.varUpdateCallbacks);
        }

        if (new_var_params && new_var_params.length) {
            await VarsClientController.getInstance().registerParams(new_var_params, this.varUpdateCallbacks);
        }

        // this.set_datasets();
        // this.set_labels();
        // this.onchange_all_data_loaded();
    }

    @Watch('var_dataset_descriptor')
    private async onchange_descriptors(
        new_var_dataset_descriptor: VarMixedChartDataSetDescriptor,
        old_var_dataset_descriptor: VarMixedChartDataSetDescriptor
    ) {

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

        for (let chart_key in this.charts_var_params) {
            let chart_var_params = this.charts_var_params[chart_key];

            // sur chaque dimension
            if ((!!old_var_dataset_descriptor) && (chart_var_params) && chart_var_params.length) {
                await VarsClientController.getInstance().unRegisterParams(chart_var_params, this.varUpdateCallbacks);
            }

            if ((!!new_var_dataset_descriptor) && (chart_var_params) && chart_var_params.length) {
                await VarsClientController.getInstance().registerParams(chart_var_params, this.varUpdateCallbacks);
            }
        }

        // this.onchange_all_data_loaded();
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
                    labels: false,
                },
                onClick: (point, event) => {
                    if (!self.isDescMode) {
                        return;
                    }

                    self.$modal.show(
                        VarDatasRefsParamSelectComponent,
                        { var_params: this.charts_var_params },
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

    /**
     * Build datasets by chart_index @see https://www.chartjs.org/docs/latest/charts/mixed.html#mixed-chart-types
     *
     * @returns {IChartDataset[]}
     */
    get datasets(): IChartDataset[] {
        if (!this.all_data_loaded) {
            return null;
        }

        const datasets = this.get_charts_datasets();

        return Object.values(datasets);
    }

    private render_chart_js() {

        if (!this.chart_data) {
            return;
        }

        if (!!this.rendered) {
            ConsoleHandler.error('PB:render Chart Chart déjà rendu');
            return;
        }

        // if (!!this.rendered) {
        //     // Issu de Bar
        //     this.$data._chart.destroy();
        // }
        this.rendered = true;

        try {

            // Issu de Chart
            (this as any).renderChart(
                this.chart_data,
                this.chart_options
            );
        } catch (error) {
            // ConsoleHandler.warn('PB:render Chart Chart probablement trop tôt:' + error);
            ConsoleHandler.error('PB:render Chart Chart probablement trop tôt:' + error + ':');
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

    @Watch('data')
    private async onchange_datasets() {
        await this.debounced_render_or_update_chart_js();
    }

    get labels(): string[] {
        const res = [];

        for (const chart_key in this.charts_var_params) {
            const chart_var_params = this.charts_var_params[chart_key];

            for (const i in chart_var_params) {
                const var_param: VarDataBaseVO = chart_var_params[i];

                res.push(this.getlabel ?
                    this.getlabel(var_param) :
                    this.t(VarsController.get_translatable_name_code_by_var_id(var_param.var_id))
                );
            }
        }

        return res;
    }
}