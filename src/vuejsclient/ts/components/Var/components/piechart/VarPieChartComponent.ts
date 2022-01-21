import debounce from 'lodash/debounce';
import { Pie } from 'vue-chartjs';
import 'chartjs-plugin-labels';
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

@Component({
    extends: Pie
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
    public getlabel: (var_param: VarDataBaseVO) => string;

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

    private rendered: boolean = false;
    private debounced_render_chart_js = debounce(this.render_chart_js, 1000);

    private var_datas: { [index: string]: VarDataValueResVO } = {};
    private throttled_var_datas_updater = ThrottleHelper.getInstance().declare_throttle_without_args(this.var_datas_updater.bind(this), 500, { leading: false, trailing: true });

    private varUpdateCallbacks: { [cb_uid: number]: VarUpdateCallback } = {
        [VarsClientController.get_CB_UID()]: VarUpdateCallback.newCallbackEvery(this.throttled_var_datas_updater.bind(this), VarUpdateCallback.VALUE_TYPE_VALID)
    };

    private var_datas_updater() {

        if ((!this.var_params) || (!this.var_params.length) || (!this.var_dataset_descriptor)) {
            this.var_datas = null;
            return;
        }
        let res: { [index: string]: VarDataValueResVO } = {};

        for (let i in this.var_params) {
            let var_param = this.var_params[i];

            res[var_param.index] = VarsClientController.getInstance().cached_var_datas[var_param.index];
        }
        this.var_datas = res;
    }

    private mounted() {

        if (this.all_data_loaded) {
            this.debounced_render_chart_js();
        }
    }

    private destroyed() {

        VarsClientController.getInstance().unRegisterParams(this.var_params, this.varUpdateCallbacks);
    }

    get all_data_loaded(): boolean {

        if ((!this.var_params) || (!this.var_params.length) || (!this.var_dataset_descriptor)) {
            return false;
        }

        for (let i in this.var_params) {
            let var_param = this.var_params[i];

            if ((!this.var_datas) || (!this.var_datas[var_param.index]) || (typeof this.var_datas[var_param.index].value === 'undefined')) {
                return false;
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
    private onChangeVarParam(new_var_params: VarDataBaseVO[], old_var_params: VarDataBaseVO[]) {

        // On doit vérifier qu'ils sont bien différents
        if (VarsController.getInstance().isSameParamArray(new_var_params, old_var_params)) {
            return;
        }

        if (old_var_params && old_var_params.length) {
            VarsClientController.getInstance().unRegisterParams(old_var_params, this.varUpdateCallbacks);
        }

        if (new_var_params && new_var_params.length) {
            VarsClientController.getInstance().registerParams(new_var_params, this.varUpdateCallbacks);
        }

        // this.set_datasets();
        // this.set_labels();
        // this.onchange_all_data_loaded();
    }

    @Watch('var_dataset_descriptor')
    private onchange_descriptors(new_var_dataset_descriptor: VarPieDataSetDescriptor, old_var_dataset_descriptor: VarPieDataSetDescriptor) {

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
            VarsClientController.getInstance().unRegisterParams(this.var_params, this.varUpdateCallbacks);
        }
        if ((!!new_var_dataset_descriptor) && (this.var_params) && this.var_params.length) {
            VarsClientController.getInstance().registerParams(this.var_params, this.varUpdateCallbacks);
        }

        // this.onchange_all_data_loaded();
    }

    get chartData() {
        if (!this.all_data_loaded) {
            return null;
        }

        this.debounced_render_chart_js();

        return {
            labels: this.labels,
            datasets: this.datasets
        };
    }

    get chartOptions() {
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
                        { var_params: this.var_params },
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

        let dataset_datas: number[] = [];
        let backgrounds: string[] = [];
        for (let j in this.var_params) {
            let var_param: VarDataBaseVO = this.var_params[j];

            dataset_datas.push(this.get_filtered_value(this.var_datas[var_param.index]));
            if (this.var_dataset_descriptor && this.var_dataset_descriptor.backgrounds[j]) {
                backgrounds.push(this.var_dataset_descriptor.backgrounds[j]);
            } else {
                backgrounds.push('#e1ddd5');
            }
        }

        let dataset = {
            label: (!!this.var_dataset_descriptor.label_translatable_code) ?
                this.t(this.var_dataset_descriptor.label_translatable_code) :
                this.t(VarsController.getInstance().get_translatable_name_code(this.var_dataset_descriptor.var_name)),
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

        if (this.all_data_loaded) {
            this.debounced_render_chart_js();
        }
    }

    get labels(): string[] {
        let res = [];

        for (let i in this.var_params) {
            res.push(this.t(VarsController.getInstance().get_translatable_name_code_by_var_id(this.var_params[i].var_id)));
        }

        return res;
    }
}