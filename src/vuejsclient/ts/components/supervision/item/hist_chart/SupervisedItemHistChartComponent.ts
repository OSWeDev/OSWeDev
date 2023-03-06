import { debounce } from 'lodash';
import { Line } from 'vue-chartjs';
import 'chartjs-plugin-labels';
import { Component, Prop, Watch } from 'vue-property-decorator';
import TSRange from '../../../../../../shared/modules/DataRender/vos/TSRange';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ISupervisedItem from '../../../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ISupervisedItemGraphSegmentation from '../../../../../../shared/modules/Supervision/interfaces/ISupervisedItemGraphSegmentation';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import VueComponentBase from '../../../VueComponentBase';

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
    private label_translatable_code: string;

    @Prop({ default: null })
    private historiques: ISupervisedItem[];

    private debounced_rerender = debounce(this.rerender, 500);

    private mounted() {
        this.debounced_rerender();
    }

    @Watch('graph_segmentation')
    @Watch('historiques')
    private onchanges() {
        this.debounced_rerender();
    }

    private rerender() {
        this['renderChart'](this.chartData, this.chartOptions);
    }

    get chartData() {
        return {
            labels: this.labels,
            datasets: [{
                data: this.values,
                label: this.label(this.label_translatable_code),
            }]
        };
    }

    private getRandomInt() {
        return Math.floor(Math.random() * (50 - 5 + 1)) + 5;
    }

    get chartOptions() {
        return Object.assign(
            {
                plugins: {
                    labels: false,
                }
            },
            this.options ? this.options : {}
        );
    }

    private get_filtered_value(last_value: number) {

        // On peut pas avoir des valeurs null pour les graphs, on change en 0
        if (last_value == null) {
            return 0;
        }

        if (!this.filter) {
            return last_value;
        }

        let params = [last_value];

        for (let additional_param_key in this.filter_additional_params) {
            params = params.concat(this.filter_additional_params[additional_param_key]);
        }

        return this.filter.apply(null, params);
    }

    get labels(): string[] {
        let res: string[] = [];

        /**
         * On part de la segmentation
         */
        let current = RangeHandler.getSegmentedMin(this.graph_segmentation.range);
        let max = RangeHandler.getSegmentedMax(this.graph_segmentation.range);

        while (current <= max) {

            res.push(Dates.format(current, this.date_format));

            current = Dates.add(current, 1, this.graph_segmentation.range.segment_type);
        }

        return res;
    }

    get values(): number[] {
        let res: number[] = [];

        /**
         * On part de la segmentation
         */
        let current = RangeHandler.getSegmentedMin(this.graph_segmentation.range);
        let max = RangeHandler.getSegmentedMax(this.graph_segmentation.range);

        let index_historique: number = 0;
        let last_historique_value: number = 0;

        while (this.historiques[index_historique] && (this.historiques[index_historique].last_update < current)) {
            index_historique++;
        }

        while (current <= max) {

            /**
             * La valeur se défini par la moyenne des valeurs compatible, ou la valeur la plus proche
             */
            let current_range: TSRange = RangeHandler.create_single_elt_TSRange(current, this.graph_segmentation.range.segment_type);
            let somme_historique: number = null;
            let nb_historique: number = 0;
            while (this.historiques[index_historique] && RangeHandler.elt_intersects_range(this.historiques[index_historique].last_update, current_range)) {
                last_historique_value = this.historiques[index_historique].last_value;
                if (somme_historique == null) {
                    somme_historique = this.historiques[index_historique].last_value;
                } else {
                    somme_historique += this.historiques[index_historique].last_value;
                }
                index_historique++;
                nb_historique++;
            }

            if (!nb_historique) {
                res.push(this.get_filtered_value(last_historique_value));
            } else {
                res.push(this.get_filtered_value(somme_historique / nb_historique));
            }

            current = Dates.add(current, 1, this.graph_segmentation.range.segment_type);
        }

        return res;
    }
}