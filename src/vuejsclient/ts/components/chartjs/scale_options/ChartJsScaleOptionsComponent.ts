
import { Prop, Watch } from 'vue-property-decorator';
import { Scale, TimeScaleOptions } from 'chart.js';
import Component from 'vue-class-component';
import { isEqual } from 'lodash';
import ChartJsScaleTimeOptionsComponent, { ITimeScaleFields } from './fields/time_options/ChartJsScaleTimeOptionsComponent';
import VueComponentBase from '../../VueComponentBase';

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
        default: () => new Object(),
        type: Object,
    })
    private options: Partial<Scale | TimeScaleOptions>;

    private options_props: Partial<Scale | TimeScaleOptions> = null;

    private type: string = null;
    private time: ITimeScaleFields = null;

    // type of scale @TODO: add translation
    private types_options: string[] = [
        '', // May be null (for default)
        'linear',
        'logarithmic',
        'category',
        'time',
        'radialLinear'
    ];

    @Watch('options', { immediate: true, deep: true })
    private on_input_options_changed() {
        if (isEqual(this.options_props, this.options)) {
            return;
        }

        // TODO: make sure we have all required fields
        for (const key in this.options) {
            this[key] = this.options[key];
        }

        this.options_props = this.options;
    }

    @Watch('type')
    private on_type_changed() {
        this.options_props = {
            ...this.options_props,
            type: this.type
        };
    }

    @Watch('time')
    private on_time_changed() {
        this.options_props = {
            ...this.options_props,
            time: this.time // case when its a | TimeScaleOptions
        } as any;
    }

    @Watch('options_props', { immediate: true, deep: true })
    private on_options_changed() {
        this.emit_change();
    }

    private handle_time_options_change(time: ITimeScaleFields) {
        this.time = time;
    }

    private emit_change() {
        this.$emit('on_change', this.options_props);
    }
}