import { debounce } from 'lodash';
import { Pie } from 'vue-chartjs';
import 'chart.js-plugin-labels-dv';
import { Component, Prop, Watch } from 'vue-property-decorator';
import VueComponentBase from '../VueComponentBase';
import ChartJsDataSetDescriptor from './descriptor/ChartJsDataSetDescriptor';

@Component({
    extends: Pie
})
export default class ChartJsPieComponent extends VueComponentBase {

    @Prop({ default: {} })
    private options: any;

    @Prop({ default: [] })
    private labels: string[];

    @Prop({ default: [] })
    private datasets: ChartJsDataSetDescriptor[];

    private debounced_rerender = debounce(this.rerender, 500);

    private mounted() {
        this.debounced_rerender();
    }

    @Watch('datasets')
    @Watch('options')
    @Watch('labels')
    private onchanges() {
        this.debounced_rerender();
    }

    private rerender() {
        let options = Object.assign(
            {
                plugins: {
                    labels: false,
                }
            },
            this.options
        );
        this['renderChart'](this.chartData, options);
    }

    get chartData() {
        return {
            labels: this.labels,
            datasets: this.datasets
        };
    }
}