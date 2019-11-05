import { Bar } from 'vue-chartjs';
import { Component, Prop, Watch } from 'vue-property-decorator';
import 'vue-tables-2';
import VarBarDataSetDescriptor from '../../../../../../shared/modules/Var/graph/VarBarDataSetDescriptor';
import ISimpleNumberVarData from '../../../../../../shared/modules/Var/interfaces/ISimpleNumberVarData';
import IVarDataParamVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataParamVOBase';
import IVarDataVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataVOBase';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarAction, ModuleVarGetter } from '../../store/VarStore';
import './VarDataBarChartComponent.scss';
import moment = require('moment');

@Component({
    extends: Bar
    // template: require('./VarDataBarChartComponent.pug'),
    // components: {
    //     Bar: Bar
    // }
})
export default class VarDataBarChartComponent extends VueComponentBase {
    @ModuleVarGetter
    public getVarDatas: { [paramIndex: string]: IVarDataVOBase };
    @ModuleVarAction
    public setDescSelectedIndex: (desc_selected_index: string) => void;
    @ModuleVarGetter
    public isDescMode: boolean;

    /**
     * TODO FIXME DIRTY : cas particulier des vars_params où l'on ne veut pas trimballer le var_id, on veut juste identifier les segments sur axis
     */
    @Prop({ default: null })
    public var_params: IVarDataParamVOBase[];

    @Prop({ default: null })
    public getlabel: (var_param: IVarDataParamVOBase) => string;

    @Prop({ default: null })
    public var_dataset_descriptors: VarBarDataSetDescriptor[];

    @Prop({ default: null })
    public options: any;

    @Prop({ default: null })
    public filter: () => any;

    @Prop({ default: null })
    public filter_additional_params: any[];

    @Prop({ default: false })
    public reload_on_mount: boolean;

    // private datasets: any[] = [];
    private labels: string[] = [];

    // private chartData: any = {};
    // private chartOptions: any = {};
    private rendered = false;

    public mounted() {

    }

    public destroyed() {

        for (let i in this.var_params) {

            // sur chaque dimension
            for (let j in this.var_dataset_descriptors) {
                let var_dataset_descriptor: VarBarDataSetDescriptor = this.var_dataset_descriptors[j];

                let var_param: IVarDataParamVOBase = this.get_var_param(this.var_params[i], var_dataset_descriptor);
                VarsController.getInstance().unregisterDataParam(var_param);
            }
        }
    }

    private get_var_param(var_param: IVarDataParamVOBase, var_dataset_descriptor: VarBarDataSetDescriptor): IVarDataParamVOBase {
        let res: IVarDataParamVOBase = Object.assign({}, var_param);
        res.var_id = var_dataset_descriptor.var_id;
        if (var_dataset_descriptor.var_param_transformer) {
            res = var_dataset_descriptor.var_param_transformer(res);
        }
        return res;
    }

    get all_data_loaded(): boolean {

        if ((!this.var_params) || (!this.var_params.length) || (!this.var_dataset_descriptors) || (!this.var_dataset_descriptors.length)) {
            return false;
        }

        for (let i in this.var_params) {

            for (let j in this.var_dataset_descriptors) {
                let var_dataset_descriptor: VarBarDataSetDescriptor = this.var_dataset_descriptors[j];

                let var_param: IVarDataParamVOBase = this.get_var_param(this.var_params[i], var_dataset_descriptor);
                let param_index: string = VarsController.getInstance().getIndex(var_param);

                if ((!this.getVarDatas) || (!this.getVarDatas[param_index])) {
                    return false;
                }
            }
        }
        return true;
    }

    private get_filtered_value(var_data: ISimpleNumberVarData) {

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
    private onChangeVarParam(new_var_params: IVarDataParamVOBase[], old_var_params: IVarDataParamVOBase[]) {

        // On doit vérifier qu'ils sont bien différents
        if (VarsController.getInstance().isSameParamArray(new_var_params, old_var_params)) {
            return;
        }

        if (old_var_params) {
            for (let i in old_var_params) {

                // sur chaque dimension
                for (let j in this.var_dataset_descriptors) {
                    let var_dataset_descriptor: VarBarDataSetDescriptor = this.var_dataset_descriptors[j];

                    let var_param: IVarDataParamVOBase = this.get_var_param(old_var_params[i], var_dataset_descriptor);
                    VarsController.getInstance().unregisterDataParam(var_param);
                }
            }
        }

        if (new_var_params) {
            for (let i in new_var_params) {

                // sur chaque dimension
                for (let j in this.var_dataset_descriptors) {
                    let var_dataset_descriptor: VarBarDataSetDescriptor = this.var_dataset_descriptors[j];

                    let var_param: IVarDataParamVOBase = this.get_var_param(new_var_params[i], var_dataset_descriptor);
                    VarsController.getInstance().registerDataParam(var_param);
                }
            }
        }

        // this.set_datasets();
        this.set_labels();
        this.onchange_all_data_loaded();
    }

    @Watch('var_dataset_descriptors')
    private onchange_descriptors(new_var_dataset_descriptors: VarBarDataSetDescriptor[], old_var_dataset_descriptors: VarBarDataSetDescriptor[]) {

        // On doit vérifier qu'ils sont bien différents
        new_var_dataset_descriptors = new_var_dataset_descriptors ? new_var_dataset_descriptors : [];
        old_var_dataset_descriptors = old_var_dataset_descriptors ? old_var_dataset_descriptors : [];
        let same: boolean = true;
        for (let i in new_var_dataset_descriptors) {
            if ((!old_var_dataset_descriptors[i]) || (new_var_dataset_descriptors[i].var_id != old_var_dataset_descriptors[i].var_id)) {
                same = false;
                break;
            }
        }
        if (same) {
            return;
        }

        for (let i in this.var_params) {

            // sur chaque dimension
            if (!!old_var_dataset_descriptors) {
                for (let j in old_var_dataset_descriptors) {
                    let var_dataset_descriptor: VarBarDataSetDescriptor = old_var_dataset_descriptors[j];

                    let var_param: IVarDataParamVOBase = this.get_var_param(this.var_params[i], var_dataset_descriptor);
                    VarsController.getInstance().unregisterDataParam(var_param);
                }
            }
            if (!!new_var_dataset_descriptors) {
                for (let j in new_var_dataset_descriptors) {
                    let var_dataset_descriptor: VarBarDataSetDescriptor = new_var_dataset_descriptors[j];

                    let var_param: IVarDataParamVOBase = this.get_var_param(this.var_params[i], var_dataset_descriptor);
                    VarsController.getInstance().registerDataParam(var_param);
                }
            }
        }

        // this.set_datasets();
        this.set_labels();
        this.onchange_all_data_loaded();
        // this.set_chartData();
        // this.set_chartOptions();
    }

    @Watch("all_data_loaded")
    private onchange_all_data_loaded() {
        if (this.all_data_loaded) {
            // this.set_datasets();
            this.set_labels();
            // this.set_chartData();
            // this.set_chartOptions();

            this.render_chart_js();
        }
    }

    // private set_chartData() {
    //     if (!this.all_data_loaded) {
    //         return null;
    //     }

    // Vue.set(this.chartData, 'labels', this.labels);
    // Vue.set(this.chartData, 'datasets', this.datasets);
    // }

    get chartData() {
        if (!this.all_data_loaded) {
            return null;
        }

        return {
            labels: this.labels,
            datasets: this.datasets
        };
    }

    // private set_chartOptions() {
    //     this.chartOptions = this.options;
    // }

    get chartOptions() {
        return Object.assign({
            // responsive: true,
            // maintainAspectRatio: true,
        },
            this.options);
    }

    get datasets(): any[] {

        let res: any[] = [];

        if (!this.all_data_loaded) {
            return null;
        }

        for (let i in this.var_dataset_descriptors) {
            let var_dataset_descriptor: VarBarDataSetDescriptor = this.var_dataset_descriptors[i];

            let dataset_datas: number[] = [];
            for (let j in this.var_params) {

                let var_param: IVarDataParamVOBase = this.get_var_param(this.var_params[j], var_dataset_descriptor);
                let var_data_value: number = this.get_filtered_value(this.getVarDatas[VarsController.getInstance().getIndex(var_param)] as ISimpleNumberVarData);

                if ((!!var_dataset_descriptor.var_value_filter) && !var_dataset_descriptor.var_value_filter(var_param, var_data_value)) {
                    dataset_datas.push(null);
                } else {
                    dataset_datas.push(var_data_value);
                }
            }

            let dataset = {
                data: dataset_datas,
                yAxisID: var_dataset_descriptor.y_axis_id
            };

            if (!!var_dataset_descriptor.label_translatable_code) {
                dataset['label'] = this.t(var_dataset_descriptor.label_translatable_code);
            } else {
                dataset['label'] = this.t(VarsController.getInstance().get_translatable_name_code(var_dataset_descriptor.var_id));
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

        // if (!this.chartData) {
        //     return;
        // }

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

    // @Watch('datasets')
    // private onchange_datasets() {

    //     this.set_chartData();
    //     this.set_chartOptions();
    // }

    private set_labels(): string[] {
        this.labels = [];

        for (let i in this.var_params) {
            this.labels.push(this.getlabel(this.var_params[i]));
        }

        return this.labels;
    }
}