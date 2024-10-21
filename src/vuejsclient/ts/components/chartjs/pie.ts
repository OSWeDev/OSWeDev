import { debounce } from 'lodash';
import { Pie } from 'vue-chartjs';
import Chart from "chart.js/auto";
import * as helpers from "chart.js/helpers";
import { Component, Prop, Watch } from 'vue-property-decorator';
import VueComponentBase from '../VueComponentBase';
import ChartJsDataSetDescriptor from './descriptor/ChartJsDataSetDescriptor';
import { _adapters, CategoryScale, LinearScale, LogarithmicScale, RadialLinearScale, TimeScale } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

@Component({
    template: require('./pie.pug'),
    components: {
        piechart: Pie
    },
})
export default class ChartJsPieComponent extends VueComponentBase {

    @Prop({ default: {} })
    private options: any;

    @Prop({ default: [] })
    private labels: string[];

    @Prop({ default: {} })
    private plugins: any[];

    @Prop({ default: [] })
    private datasets: ChartJsDataSetDescriptor[];

    private debounced_rerender = debounce(this.rerender, 500);

    public async created() {
        let chart = Chart;
        chart.register(ChartDataLabels, CategoryScale, LinearScale, LogarithmicScale, TimeScale, RadialLinearScale);
        window['Chart'] = chart;
        Chart['helpers'] = helpers;

        await import("chart.js-plugin-labels-dv");
    }

    private mounted() {
        this.debounced_rerender();
    }

    @Watch('datasets')
    @Watch('chart_options_')
    @Watch('chart_plugins')
    @Watch('labels')
    private onchanges() {
        this.debounced_rerender();
    }

    private rerender() {
        this['renderChart'](this.chart_data, this.chart_options, this.chart_plugins);
    }

    get chart_options() {
        // return Object.assign(
        //     {
        //         plugins: {
        //             labels: false,
        //         }
        //     },
        //     this.options
        // );
        if (this.options.plugins) {
            return this.options;
        } else {
            return
        }
    }

    get chart_plugins() {
        if (this.plugins.length > 0) {
            return this.plugins;
        } else {
            return
        }
    }

    get chart_data() {
        return {
            labels: this.labels,
            datasets: this.datasets
        };
    }
}