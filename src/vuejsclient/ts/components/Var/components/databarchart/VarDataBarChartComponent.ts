import { Bar } from 'vue-chartjs';
import { Component, Prop, Watch } from 'vue-property-decorator';
import 'vue-tables-2';
import VarDataSetDescriptor from '../../../../../../shared/modules/Var/graph/VarDataSetDescriptor';
import ISimpleNumberVarData from '../../../../../../shared/modules/Var/interfaces/ISimpleNumberVarData';
import IVarDataParamVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataParamVOBase';
import IVarDataVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataVOBase';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarAction, ModuleVarGetter } from '../../store/VarStore';
import './VarDataBarChartComponent.scss';
import moment = require('moment');

@Component({
    extends: Bar
})
export default class VarDataBarChartComponent extends VueComponentBase {
    @ModuleVarGetter
    public getVarDatas: { [paramIndex: string]: IVarDataVOBase };
    @ModuleVarGetter
    public getDescSelectedIndex: string;
    @ModuleVarAction
    public setDescSelectedIndex: (desc_selected_index: string) => void;
    @ModuleVarGetter
    public isDescMode: boolean;
    @ModuleVarGetter
    public getUpdatingParamsByVarsIds: { [var_id: number]: { [index: string]: IVarDataParamVOBase } };

    /**
     * TODO FIXME DIRTY : cas particulier des vars_params où l'on ne veut pas trimballer le var_id, on veut juste identifier les segments sur axis
     */
    @Prop({ default: null })
    public var_params: IVarDataParamVOBase[];

    @Prop({ default: null })
    public getlabel: (var_param: IVarDataParamVOBase) => string;

    @Prop({ default: null })
    public var_dataset_descriptors: VarDataSetDescriptor[];

    @Prop({ default: null })
    public options: any;

    @Prop({ default: null })
    public filter: () => any;

    @Prop({ default: null })
    public filter_additional_params: any[];

    @Prop({ default: false })
    public reload_on_mount: boolean;


    public mounted() {

        this.render_chart_js();
    }

    public destroyed() {

        for (let i in this.var_params) {
            let var_param: IVarDataParamVOBase = this.var_params[i];
            VarsController.getInstance().unregisterDataParam(var_param);
        }
    }

    get all_data_loaded(): boolean {

        for (let i in this.var_params) {
            let var_param: IVarDataParamVOBase = this.var_params[i];

            for (let j in this.var_dataset_descriptors) {
                let var_dataset_descriptor: VarDataSetDescriptor = this.var_dataset_descriptors[j];

                let this_var_param: IVarDataParamVOBase = Object.assign({}, var_param);
                this_var_param.var_id = var_dataset_descriptor.var_id;
                let param_index: string = VarsController.getInstance().getIndex(this_var_param);

                if ((!this.getVarDatas) || (!this.getVarDatas[param_index])) {
                    return false;
                }
            }
        }
        return true;
    }

    private get_filtered_value(var_data: ISimpleNumberVarData) {

        if (!var_data) {
            return null;
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

        if (old_var_params) {
            for (let i in old_var_params) {
                let old_var_param: IVarDataParamVOBase = old_var_params[i];
                VarsController.getInstance().unregisterDataParam(old_var_param);
            }
        }

        if (new_var_params) {
            for (let i in new_var_params) {
                let new_var_param: IVarDataParamVOBase = new_var_params[i];
                VarsController.getInstance().registerDataParam(new_var_param, this.reload_on_mount);
            }
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
        return Object.assign({
            responsive: true,
            maintainAspectRatio: true,
        },
            this.options);
    }

    get datasets(): any[] {
        let res: any[] = [];

        if (!this.all_data_loaded) {
            return null;
        }

        for (let i in this.var_dataset_descriptors) {
            let var_dataset_descriptor: VarDataSetDescriptor = this.var_dataset_descriptors[i];

            let dataset_datas: number[] = [];
            for (let j in this.var_params) {
                let var_param: IVarDataParamVOBase = this.var_params[j];

                dataset_datas.push(this.get_filtered_value(this.getVarDatas[VarsController.getInstance().getIndex(var_param)] as ISimpleNumberVarData));
            }

            res.push({
                label: (!!var_dataset_descriptor.label_translatable_code) ?
                    this.t(var_dataset_descriptor) :
                    this.t(VarsController.getInstance().get_translatable_name_code(var_dataset_descriptor.var_id)),
                backgroundColor: var_dataset_descriptor.bg_color,
                data: dataset_datas,
                yAxisID: var_dataset_descriptor.y_axis_id
            });
        }

        return res;
    }

    private render_chart_js() {

        if (!this.chartData) {
            return;
        }

        // Issu de Bar
        this['renderChart'](
            this.chartData,
            this.chartOptions
        );
    }

    @Watch('datasets')
    private onchange_datasets() {

        this.render_chart_js();
    }

    get labels(): string[] {
        let res: string[] = [];

        for (let i in this.var_params) {
            res.push(this.getlabel(this.var_params[i]));
        }

        return res;
    }
}