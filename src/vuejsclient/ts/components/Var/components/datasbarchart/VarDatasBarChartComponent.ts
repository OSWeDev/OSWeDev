import debounce from 'lodash/debounce';
import { Bar } from 'vue-chartjs';
import Chart from "chart.js/auto";
import * as helpers from "chart.js/helpers";
import { Component, Prop, Watch } from 'vue-property-decorator';
import VarsBarDataSetDescriptor from '../../../../../../shared/modules/Var/graph/VarsBarDataSetDescriptor';
import MainAggregateOperatorsHandlers from '../../../../../../shared/modules/Var/MainAggregateOperatorsHandlers';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VarUpdateCallback from '../../../../../../shared/modules/Var/vos/VarUpdateCallback';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarGetter } from '../../store/VarStore';
import VarsClientController from '../../VarsClientController';
import VarDatasRefsParamSelectComponent from '../datasrefs/paramselect/VarDatasRefsParamSelectComponent';

@Component({
    template: require('./VarDatasBarChartComponent.pug'),
    components: {
        barchart: Bar
    },
})
export default class VarDatasBarChartComponent extends VueComponentBase {

    @ModuleVarGetter
    private isDescMode: boolean;

    @Prop({ default: false })
    private throttle: boolean;

    @Prop({ default: null })
    private labels: string[];

    @Prop({ default: null })
    private var_dataset_descriptors: VarsBarDataSetDescriptor[];

    @Prop({ default: null })
    private options: any;

    private rendered = false;
    // private debounced_render_chart_js = debounce(this.render_chart_js, 1000);

    private var_datas: { [index: string]: VarDataValueResVO } = {};
    private throttled_var_datas_updater = ThrottleHelper.getInstance().declare_throttle_without_args(this.var_datas_updater.bind(this), 500, { leading: false, trailing: true });
    private debounced_var_datas_updater = debounce(this.var_datas_updater.bind(this), 500);

    private current_chart_data: any = null;
    private current_chart_options: any = null;

    private varUpdateCallbacks: { [cb_uid: number]: VarUpdateCallback } = {
        [VarsClientController.get_CB_UID()]: VarUpdateCallback.newCallbackEvery((() => {
            if (this.throttle) {
                this.throttled_var_datas_updater();
            } else {
                this.debounced_var_datas_updater();
            }
        }).bind(this), VarUpdateCallback.VALUE_TYPE_VALID)
    };

    public async created() {
        window['Chart'] = Chart;
        Chart['helpers'] = helpers;

        await import("chart.js-plugin-labels-dv");
    }

    private var_datas_updater() {
        let res: { [index: string]: VarDataValueResVO } = {};

        if ((!this.var_dataset_descriptors) || (!this.var_dataset_descriptors.length)) {
            this.var_datas = null;
            return;
        }

        for (let j in this.var_dataset_descriptors) {
            let var_dataset_descriptor: VarsBarDataSetDescriptor = this.var_dataset_descriptors[j];

            for (let label_index in var_dataset_descriptor.vars_params_by_label_index) {
                let var_params = var_dataset_descriptor.vars_params_by_label_index[label_index];

                for (let i in var_params) {
                    let var_param = var_params[i];
                    res[var_param.index] = VarsClientController.cached_var_datas[var_param.index];
                }
            }
        }

        this.var_datas = res;
    }

    // private mounted() {
    //     if (this.all_data_loaded) {
    //         this.debounced_render_chart_js();
    //     }
    // }

    private async beforeDestroy() {
        await VarsClientController.getInstance().unRegisterParams(this.get_all_datas(this.var_dataset_descriptors), this.varUpdateCallbacks);
        if (!!this.rendered) {
            // // Issu de Bar
            // this.$data._chart.destroy();
        }
    }

    get all_data_loaded(): boolean {

        if ((!this.var_dataset_descriptors) || (!this.var_dataset_descriptors.length)) {
            return false;
        }

        for (let j in this.var_dataset_descriptors) {
            let var_dataset_descriptor: VarsBarDataSetDescriptor = this.var_dataset_descriptors[j];

            for (let label_index in var_dataset_descriptor.vars_params_by_label_index) {
                let var_params = var_dataset_descriptor.vars_params_by_label_index[label_index];

                for (let i in var_params) {
                    let var_param = var_params[i];

                    if ((!this.var_datas) || (!this.var_datas[var_param.index]) || (typeof this.var_datas[var_param.index].value === 'undefined')) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    private get_all_datas(var_dataset_descriptors: VarsBarDataSetDescriptor[]): VarDataBaseVO[] {

        let res: { [index: string]: VarDataBaseVO } = {};

        if ((!var_dataset_descriptors) || (!var_dataset_descriptors.length)) {
            return null;
        }

        for (let j in var_dataset_descriptors) {
            let var_dataset_descriptor: VarsBarDataSetDescriptor = var_dataset_descriptors[j];

            for (let label_index in var_dataset_descriptor.vars_params_by_label_index) {
                let var_params = var_dataset_descriptor.vars_params_by_label_index[label_index];

                for (let i in var_params) {
                    let var_param = var_params[i];

                    res[var_param.index] = var_param;
                }
            }
        }

        return Object.values(res);
    }

    private get_filtered_value(var_data: VarDataValueResVO, var_dataset_descriptor: VarsBarDataSetDescriptor) {

        if (!var_data) {
            return 0;
        }

        // On peut pas avoir des valeurs null pour les graphs, on change en 0
        if (var_data.value == null) {
            return 0;
        }

        if (!var_dataset_descriptor.filter) {
            return var_data.value;
        }

        let params = [var_data.value];

        if (!!var_dataset_descriptor.filter_additional_params) {
            params = params.concat(var_dataset_descriptor.filter_additional_params);
        }

        return var_dataset_descriptor.filter.apply(null, params);
    }

    @Watch('var_dataset_descriptors', { immediate: true, deep: true })
    private async onChange_var_dataset_descriptor(new_datasets: VarsBarDataSetDescriptor[], old_datasets: VarsBarDataSetDescriptor[]) {

        let new_var_params = this.get_all_datas(new_datasets);
        let old_var_params = this.get_all_datas(old_datasets);

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

        // this.onchange_all_data_loaded();
    }

    // @Watch("all_data_loaded")
    // @Watch('get_all_values', { deep: true })
    // private onchange_all_data_loaded() {
    //     if (this.all_data_loaded) {
    //         this.debounced_render_chart_js();
    //     }
    // }

    @Watch('var_datas', { deep: true })
    private onchange_var_datas() {
        if (this.all_data_loaded) {
            this.$emit('all_data_loaded', this.var_datas);
            // this.debounced_render_chart_js();
        }
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
                // responsive: true,
                // maintainAspectRatio: true,
                plugins: {
                    labels: false,
                },
                onClick: (point, event) => {
                    if (!self.isDescMode) {
                        return;
                    }

                    self.$modal.show(
                        VarDatasRefsParamSelectComponent,
                        { var_params: this.get_all_datas(this.var_dataset_descriptors) },
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

        let res: any[] = [];

        if (!this.all_data_loaded) {
            return null;
        }

        for (let i in this.var_dataset_descriptors) {
            let var_dataset_descriptor: VarsBarDataSetDescriptor = this.var_dataset_descriptors[i];

            let dataset_datas: number[] = [];
            for (let label_index in var_dataset_descriptor.vars_params_by_label_index) {
                let var_params = var_dataset_descriptor.vars_params_by_label_index[label_index];

                let label_values: number[] = [];
                for (let j in var_params) {
                    let var_param: VarDataBaseVO = var_params[j];
                    let var_data_value: number = this.var_datas[var_param.index].value;

                    if ((!!var_dataset_descriptor.var_value_filter) && !var_dataset_descriptor.var_value_filter(var_param, var_data_value)) {
                        label_values.push(null);
                    } else {
                        label_values.push(var_data_value);
                    }
                }

                let value = var_dataset_descriptor.var_value_callback ? var_dataset_descriptor.var_value_callback(label_values) : MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM(label_values);

                if (var_dataset_descriptor.filter) {
                    value = (var_dataset_descriptor.filter_additional_params && var_dataset_descriptor.filter_additional_params.length) ?
                        var_dataset_descriptor.filter.apply(null, [value].concat(var_dataset_descriptor.filter_additional_params)) :
                        var_dataset_descriptor.filter.apply(null, [value]);
                }
                dataset_datas.push(value);
            }

            let dataset = {
                data: dataset_datas,
                yAxisID: var_dataset_descriptor.y_axis_id,
                var_name: var_dataset_descriptor.var_name
            };

            if (!!var_dataset_descriptor.label_translatable_code) {
                dataset['label'] = this.t(var_dataset_descriptor.label_translatable_code);
            } else {
                dataset['label'] = this.t(VarsController.get_translatable_name_code(var_dataset_descriptor.var_name));
            }

            if (!!var_dataset_descriptor.bg_color) {
                dataset['backgroundColor'] = var_dataset_descriptor.bg_color;
            }

            if (!!var_dataset_descriptor.border_color) {
                dataset['borderColor'] = var_dataset_descriptor.border_color;
            }

            if (!!var_dataset_descriptor.type) {
                dataset['type'] = var_dataset_descriptor.type;
            }

            if (!!var_dataset_descriptor.stack) {
                dataset['stack'] = var_dataset_descriptor.stack;
            }

            if (!!var_dataset_descriptor.dataset_options_overrides) {
                dataset = Object.assign(dataset, var_dataset_descriptor.dataset_options_overrides);
            }

            res.push(dataset);
        }

        return res;
    }

    @Watch('chart_data')
    @Watch('chart_options')
    private prepare_current_data_and_options() {
        if (!this.chart_data || !this.chart_options) {
            return;
        }

        this.current_chart_data = this.chart_data;
        this.current_chart_options = this.chart_options;
    }
}