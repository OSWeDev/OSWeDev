
import { Prop, Watch } from 'vue-property-decorator';
import Component from 'vue-class-component';
import { Scale, TimeScaleOptions } from 'chart.js';
import VueComponentBase from '../../VueComponentBase';
import ChartJsScaleTimeOptionsComponent, { ITimeScaleFields } from './fields/time_options/ChartJsScaleTimeOptionsComponent';

/**
 * Component for chart.js scale options builder.
 * - For any kind of axis (x, y, r).
 * - Shall input all type options for a scale (scale_options).
 * - Shall output a scale (scale_options).
 * @see https://www.chartjs.org/docs/latest/axes/#common-options-to-all-axes
 */
@Component({
    template: require('./ChartJsScaleOptionsComponent.pug'),
    components: {
        Chartjsscaletimeoptionscomponent: ChartJsScaleTimeOptionsComponent
    }
})
export default class ChartJsScaleOptionsComponent extends VueComponentBase {

    @Prop({
        type: Object,
        default: () => new Object()
    })
    private options: Partial<Scale | TimeScaleOptions>;

    private _options: Partial<Scale | TimeScaleOptions> = null;
    private type: string = null;
    private time: ITimeScaleFields = null;

    // type of scale
    private types_options: string[] = [
        'linear',
        'logarithmic',
        'category',
        'time',
        'radialLinear'
    ];

    @Watch('options', { immediate: true, deep: true })
    private on_input_options_changed() {
        this._options = this.options;

        // TODO: make sure we have all required fields
        for (const key in this.options) {
            this[key] = this.options[key];
        }
    }

    @Watch('type')
    private on_type_changed() {
        this._options = {
            ...this._options,
            type: this.type
        };
    }

    @Watch('time')
    private on_time_changed() {
        this._options = {
            ...this._options,
            time: this.time // case when its a | TimeScaleOptions
        } as any;
    }

    @Watch('_options', { immediate: true, deep: true })
    private on_options_changed() {
        this.emit_change();
    }

    private handle_time_options_change(time: ITimeScaleFields) {
        this.time = time;
    }

    private emit_change() {
        this.$emit('on_change', this.options);
    }
}