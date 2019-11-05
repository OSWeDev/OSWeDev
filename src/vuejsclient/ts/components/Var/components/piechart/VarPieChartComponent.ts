import { Pie } from 'vue-chartjs';
import { Component, Prop, Watch } from 'vue-property-decorator';
import 'vue-tables-2';
import VarPieDataSetDescriptor from '../../../../../../shared/modules/Var/graph/VarPieDataSetDescriptor';
import ISimpleNumberVarData from '../../../../../../shared/modules/Var/interfaces/ISimpleNumberVarData';
import IVarDataParamVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataParamVOBase';
import IVarDataVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataVOBase';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarAction, ModuleVarGetter } from '../../store/VarStore';
import './VarPieChartComponent.scss';
import moment = require('moment');

@Component({
    extends: Pie
})
export default class VarPieChartComponent extends VueComponentBase {
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
    public var_dataset_descriptor: VarPieDataSetDescriptor;

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

    private rendered: boolean = false;

    public mounted() {

        this.render_chart_js();
    }

    public destroyed() {

        for (let i in this.var_params) {

            let var_param: IVarDataParamVOBase = Object.assign({}, this.var_params[i]);

            VarsController.getInstance().unregisterDataParam(var_param);
        }
    }

    get all_data_loaded(): boolean {

        if ((!this.var_params) || (!this.var_params.length) || (!this.var_dataset_descriptor)) {
            return false;
        }

        for (let i in this.var_params) {

            let var_param: IVarDataParamVOBase = Object.assign({}, this.var_params[i]);

            let param_index: string = VarsController.getInstance().getIndex(var_param);

            if ((!this.getVarDatas) || (!this.getVarDatas[param_index])) {
                return false;
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

                let var_param: IVarDataParamVOBase = Object.assign({}, old_var_params[i]);

                VarsController.getInstance().unregisterDataParam(var_param);
            }
        }

        if (new_var_params) {
            for (let i in new_var_params) {

                let var_param: IVarDataParamVOBase = Object.assign({}, new_var_params[i]);
                VarsController.getInstance().registerDataParam(var_param);
            }
        }

        // this.set_datasets();
        this.set_labels();
        this.onchange_all_data_loaded();
    }

    @Watch('var_dataset_descriptor')
    private onchange_descriptors(new_var_dataset_descriptor: VarPieDataSetDescriptor, old_var_dataset_descriptor: VarPieDataSetDescriptor) {

        // On doit vérifier qu'ils sont bien différents
        new_var_dataset_descriptor = new_var_dataset_descriptor ? new_var_dataset_descriptor : null;
        old_var_dataset_descriptor = old_var_dataset_descriptor ? old_var_dataset_descriptor : null;
        let same: boolean = true;
        if (((!old_var_dataset_descriptor) && (!!new_var_dataset_descriptor)) ||
            ((!!old_var_dataset_descriptor) && (!new_var_dataset_descriptor)) ||
            ((!!new_var_dataset_descriptor) && (!!old_var_dataset_descriptor) && (new_var_dataset_descriptor.var_id != old_var_dataset_descriptor.var_id))) {
            same = false;
        }
        if (same) {
            return;
        }

        for (let i in this.var_params) {

            // sur chaque dimension
            if (!!old_var_dataset_descriptor) {
                let var_param: IVarDataParamVOBase = Object.assign({}, this.var_params[i]);
                VarsController.getInstance().unregisterDataParam(var_param);
            }
            if (!!new_var_dataset_descriptor) {
                let var_param: IVarDataParamVOBase = Object.assign({}, this.var_params[i]);
                VarsController.getInstance().registerDataParam(var_param);
            }
        }

        this.set_labels();
        this.onchange_all_data_loaded();
    }

    @Watch("all_data_loaded")
    private onchange_all_data_loaded() {
        if (this.all_data_loaded) {
            this.set_labels();
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
        },
            this.options);
    }

    get datasets(): any[] {

        let res: any[] = [];

        if (!this.all_data_loaded) {
            return null;
        }

        let dataset_datas: number[] = [];
        let backgrounds: string[] = [];
        for (let j in this.var_params) {
            let var_param: IVarDataParamVOBase = this.var_params[j];

            dataset_datas.push(this.get_filtered_value(this.getVarDatas[VarsController.getInstance().getIndex(var_param)] as ISimpleNumberVarData));
            if (this.var_dataset_descriptor && this.var_dataset_descriptor.backgrounds[j]) {
                backgrounds.push(this.var_dataset_descriptor.backgrounds[j]);
            } else {
                backgrounds.push('#e1ddd5');
            }
        }

        let dataset = {
            label: (!!this.var_dataset_descriptor.label_translatable_code) ?
                this.t(this.var_dataset_descriptor.label_translatable_code) :
                this.t(VarsController.getInstance().get_translatable_name_code(this.var_dataset_descriptor.var_id)),
            data: dataset_datas,
            backgroundColor: backgrounds
        };

        res.push(dataset);

        return res;
    }

    private render_chart_js() {

        if (!this.chartData) {
            return;
        }

        if (!!this.rendered) {
            // Issu de Bar
            this.$data._chart.destroy();
        }
        this.rendered = true;

        try {

            // Issu de Pie
            (this as any).renderChart(
                this.chartData,
                this.chartOptions
            );
        } catch (error) {
            ConsoleHandler.getInstance().warn('PB:render Pie Chart probablement trop tôt:' + error);
            this.rendered = false;
            setTimeout(this.render_chart_js, 500);
        }
    }

    @Watch('datasets')
    private onchange_datasets() {

        this.render_chart_js();
    }

    private set_labels(): string[] {
        this.labels = [];

        for (let i in this.var_params) {
            this.labels.push(this.getlabel(this.var_params[i]));
        }

        return this.labels;
    }
}