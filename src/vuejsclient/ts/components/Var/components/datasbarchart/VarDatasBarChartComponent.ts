import { Bar } from 'vue-chartjs';
import { Component, Prop, Watch } from 'vue-property-decorator';
import VarsBarDataSetDescriptor from '../../../../../../shared/modules/Var/graph/VarsBarDataSetDescriptor';
import MainAggregateOperatorsHandlers from '../../../../../../shared/modules/Var/MainAggregateOperatorsHandlers';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarGetter } from '../../store/VarStore';
import VarsClientController from '../../VarsClientController';
import VarDatasRefsParamSelectComponent from '../datasrefs/paramselect/VarDatasRefsParamSelectComponent';

@Component({
    extends: Bar
})
export default class VarDatasBarChartComponent extends VueComponentBase {

    @ModuleVarGetter
    public getVarDatas: { [paramIndex: string]: VarDataValueResVO };
    @ModuleVarGetter
    public isDescMode: boolean;

    /**
     * TODO FIXME DIRTY : cas particulier des vars_params où l'on ne veut pas trimballer le var_id, on veut juste identifier les segments sur axis
     */
    @Prop({ default: null })
    public labels: string[];

    @Prop({ default: null })
    public var_dataset_descriptors: VarsBarDataSetDescriptor[];

    @Prop({ default: null })
    public options: any;

    private rendered = false;

    public mounted() {
        if (this.all_data_loaded) {
            setTimeout(this.render_chart_js, 500);
        }
    }

    public destroyed() {

        for (let j in this.var_dataset_descriptors) {
            let var_dataset_descriptor: VarsBarDataSetDescriptor = this.var_dataset_descriptors[j];

            for (let label_index in var_dataset_descriptor.vars_params_by_label_index) {

                VarsClientController.getInstance().unRegisterParams(var_dataset_descriptor.vars_params_by_label_index[label_index]);
            }
        }
        if (!!this.rendered) {
            // Issu de Bar
            this.$data._chart.destroy();
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

                    if ((!this.getVarDatas) || (!this.getVarDatas[var_param.index])) {
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
    private onChange_var_dataset_descriptor(new_datasets: VarsBarDataSetDescriptor[], old_datasets: VarsBarDataSetDescriptor[]) {

        let new_var_params = this.get_all_datas(new_datasets);
        let old_var_params = this.get_all_datas(old_datasets);

        // On doit vérifier qu'ils sont bien différents
        if (VarsController.getInstance().isSameParamArray(new_var_params, old_var_params)) {
            return;
        }

        if (old_var_params && old_var_params.length) {
            VarsClientController.getInstance().unRegisterParams(old_var_params);
        }

        if (new_var_params && new_var_params.length) {
            VarsClientController.getInstance().registerParams(new_var_params);
        }

        this.onchange_all_data_loaded();
    }

    @Watch("all_data_loaded")
    private onchange_all_data_loaded() {
        if (this.all_data_loaded) {
            setTimeout(this.render_chart_js, 500);
        }
    }

    get chartData() {
        if (!this.all_data_loaded) {
            return null;
        }

        return {
            labels: this.labels,
            datasets: this.datasets
        };
    }

    get chartOptions() {
        let self = this;
        return Object.assign({
            // responsive: true,
            // maintainAspectRatio: true,
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
            this.options);
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
                    let var_data_value: number = this.getVarDatas[var_param.index].value;

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
                yAxisID: var_dataset_descriptor.y_axis_id
            };

            if (!!var_dataset_descriptor.label_translatable_code) {
                dataset['label'] = this.t(var_dataset_descriptor.label_translatable_code);
            } else {
                dataset['label'] = this.t(VarsController.getInstance().get_translatable_name_code(var_dataset_descriptor.var_name));
            }

            if (!!var_dataset_descriptor.bg_color) {
                dataset['backgroundColor'] = var_dataset_descriptor.bg_color;
            }

            if (!!var_dataset_descriptor.type) {
                dataset['type'] = var_dataset_descriptor.type;
            }

            res.push(dataset);
        }

        return res;
    }

    private render_chart_js() {

        if (!!this.rendered) {
            // Issu de Bar
            this.$data._chart.destroy();
        }
        this.rendered = true;

        try {

            // Issu de Bar
            (this as any).renderChart(
                this.chartData,
                this.chartOptions
            );
        } catch (error) {
            ConsoleHandler.getInstance().warn('PB:render Bar Chart probablement trop tôt:' + error);
            this.rendered = false;
            setTimeout(this.render_chart_js, 500);
        }
    }
}