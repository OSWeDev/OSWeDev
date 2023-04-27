import { debounce } from 'lodash';
import 'chart.js/auto'; // TODO FIXME https://vue-chartjs.org/migration-guides/#tree-shaking
import { Pie } from 'vue-chartjs';
import 'chart.js-plugin-labels-dv';
import { Component, Prop, Watch } from 'vue-property-decorator';
import VueComponentBase from '../VueComponentBase';
import ChartJsDataSetDescriptor from './descriptor/ChartJsDataSetDescriptor';

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

    @Prop({ default: [] })
    private datasets: ChartJsDataSetDescriptor[];

    private debounced_rerender = debounce(this.rerender, 500);

    private mounted() {
        this.debounced_rerender();
    }

    @Watch('datasets')
    @Watch('chart_options_')
    @Watch('labels')
    private onchanges() {
        this.debounced_rerender();
    }

    private rerender() {
        this['renderChart'](this.chart_data, this.chart_options);
    }

    get chart_options() {
        return Object.assign(
            {
                plugins: {
                    labels: false,
                }
            },
            this.options
        );
    }

    get chart_data() {
        return {
            labels: this.labels,
            datasets: this.datasets
        };
    }
}