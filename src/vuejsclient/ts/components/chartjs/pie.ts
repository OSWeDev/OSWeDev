import { debounce } from 'lodash';
import { Pie } from 'vue-chartjs';
import 'chartjs-plugin-labels';
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
        this['renderChart'](this.chartData, this.options);
    }

    get chartData() {
        return {
            labels: this.labels,
            datasets: this.datasets
        };
    }
}