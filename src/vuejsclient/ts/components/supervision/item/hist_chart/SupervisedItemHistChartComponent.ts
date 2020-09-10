import { Bar, Line } from 'vue-chartjs';
import { Component, Prop, Watch } from 'vue-property-decorator';
import 'vue-tables-2';
import ISupervisedItem from '../../../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ISupervisedItemGraphSegmentation from '../../../../../../shared/modules/Supervision/interfaces/ISupervisedItemGraphSegmentation';
import VarBarDataSetDescriptor from '../../../../../../shared/modules/Var/graph/VarBarDataSetDescriptor';
import ISimpleNumberVarData from '../../../../../../shared/modules/Var/interfaces/ISimpleNumberVarData';
import IVarDataParamVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataParamVOBase';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import TimeSegmentHandler from '../../../../../../shared/tools/TimeSegmentHandler';
import VueComponentBase from '../../../VueComponentBase';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import SupervisionController from '../../../../../../shared/modules/Supervision/SupervisionController';
import TSRange from '../../../../../../shared/modules/DataRender/vos/TSRange';
import * as moment from 'moment';


@Component({
    extends: Line
})
export default class SupervisedItemHistChartComponent extends VueComponentBase {

    @Prop({ default: null })
    private filter: () => any;

    @Prop({ default: null })
    private filter_additional_params: any[];

    @Prop({ default: null })
    private options: any;

    @Prop({ default: null })
    private graph_segmentation: ISupervisedItemGraphSegmentation;

    @Prop({ default: null })
    private date_format: string;

    @Prop({ default: null })
    private supervised_item_name: string;

    @Prop({ default: null })
    private supervised_item_vo_type: string;

    @Prop({ default: null })
    private label_translatable_code: string;

    @Prop({ default: null })
    private historiques: ISupervisedItem[];

    private all_data_loaded: boolean = false;

    // @Prop({ default: null })
    // public getlabel: (var_param: IVarDataParamVOBase) => string;

    // @Prop({ default: null })
    // public var_dataset_descriptors: VarBarDataSetDescriptor[];


    // @Prop({ default: false })
    // public reload_on_mount: boolean;

    private labels: string[] = [];
    private values: number[] = [];

    private rendered = false;

    public mounted() {

    }

    get chartData() {
        return {
            labels: this.labels,
            datasets: [{
                data: this.values,
                yAxisID: 'Valeurs de la sonde',
                label: this.label(this.label_translatable_code),
            }]
        };
    }

    get chartOptions() {
        return Object.assign({}, this.options);
    }

    // private get_var_param(var_param: IVarDataParamVOBase, var_dataset_descriptor: VarBarDataSetDescriptor): IVarDataParamVOBase {
    //     let res: IVarDataParamVOBase = Object.assign({}, var_param);
    //     res.var_id = var_dataset_descriptor.var_id;
    //     if (var_dataset_descriptor.var_param_transformer) {
    //         res = var_dataset_descriptor.var_param_transformer(res);
    //     }
    //     return res;
    // }

    private get_filtered_value(last_value: number) {

        // On peut pas avoir des valeurs null pour les graphs, on change en 0
        if (last_value == null) {
            return 0;
        }

        if (!this.filter) {
            return last_value;
        }

        let params = [last_value];

        if (!!this.filter_additional_params) {
            params = params.concat(this.filter_additional_params);
        }

        return this.filter.apply(null, params);
    }

    private render_chart_js() {

        if (!!this.rendered) {
            // Issu de Line
            this.$data._chart.destroy();
        }
        this.rendered = true;

        try {

            // Issu de Line
            (this as any).renderChart(
                this.chartData,
                this.chartOptions
            );
        } catch (error) {
            ConsoleHandler.getInstance().warn('PB:render Line Chart probablement trop tôt:' + error);
            this.rendered = false;
            setTimeout(this.render_chart_js, 500);
        }
    }

    private set_labels_and_values(): void {
        this.all_data_loaded = false;
        this.labels = [];
        this.values = [];

        /**
         * On part de la segmentation
         */
        let current = RangeHandler.getInstance().getSegmentedMin(this.graph_segmentation.range);
        let max = RangeHandler.getInstance().getSegmentedMax(this.graph_segmentation.range);

        let index_historique: number = 0;
        let last_historique_value: number = 0;

        while (this.historiques[index_historique].last_update.isBefore(current)) {
            index_historique++;
        }

        while (current.isSameOrBefore(max)) {

            this.labels.push(current.format(this.date_format));

            /**
             * La valeur se défini par la moyenne des valeurs compatible, ou la valeur la plus proche
             */
            let current_range: TSRange = RangeHandler.getInstance().create_single_elt_TSRange(moment(current), this.graph_segmentation.range.segment_type);
            let somme_historique: number = null;
            let nb_historique: number = 0;
            while (RangeHandler.getInstance().elt_intersects_range(this.historiques[index_historique].last_update, current_range)) {
                if (somme_historique == null) {
                    somme_historique = this.historiques[index_historique].last_value;
                } else {
                    somme_historique += this.historiques[index_historique].last_value;
                }
                index_historique++;
                nb_historique++;
            }

            if (!nb_historique) {
                this.values.push(this.get_filtered_value(last_historique_value));
            } else {
                this.values.push(this.get_filtered_value(somme_historique / nb_historique));
            }

            TimeSegmentHandler.getInstance().incMoment(current, this.graph_segmentation.range.segment_type, 1);
        }

        this.all_data_loaded = true;
    }
}