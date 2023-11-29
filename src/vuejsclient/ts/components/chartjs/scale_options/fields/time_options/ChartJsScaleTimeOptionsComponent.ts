
import { Prop, Vue, Watch } from 'vue-property-decorator';
import Component from 'vue-class-component';
import { TimeUnit } from 'chart.js';
import { isEqual } from 'lodash';
import ChartJsScaleTimeDisplayFormatOptionsComponent from '../time_display_formats_options/ChartJsScaleTimeDisplayFormatOptionsComponent';
import VueComponentBase from '../../../../VueComponentBase';

export interface ITimeScaleFields {
    /**
     * Custom parser for dates.
     */
    parser: string | ((v: unknown) => number);
    /**
     * If defined, dates will be rounded to the start of this unit. See Time Units below for the allowed units.
     */
    round: false | TimeUnit;
    /**
     * If boolean and true and the unit is set to 'week', then the first day of the week will be Monday. Otherwise, it will be Sunday.
     * If `number`, the index of the first day of the week (0 - Sunday, 6 - Saturday).
     * @default false
     */
    isoWeekday: boolean | number;
    /**
     * Sets how different time units are displayed.
     */
    displayFormats: {
        [key: string]: string;
    };
    /**
     * The format string to use for the tooltip.
     */
    tooltipFormat: string;
    /**
     * If defined, will force the unit to be a certain type. See Time Units section below for details.
     * @default false
     */
    unit: false | TimeUnit;
    /**
     * The minimum display format to be used for a time unit.
     * @default 'millisecond'
     */
    minUnit: TimeUnit;
}

/**
 * Component for chart.js scale options builder.
 * - For any kind of axis (x, y, r).
 * - Shall input all type options for a scale (scale_options).
 * - Shall output a scale (scale_options).
 * @see https://www.chartjs.org/docs/latest/axes/#common-options-to-all-axes
 */
@Component({
    template: require('./ChartJsScaleTimeOptionsComponent.pug'),
    components: {
        Chartjsscaletimedisplayformatoptionscomponent: ChartJsScaleTimeDisplayFormatOptionsComponent
    }
})
export default class ChartJsScaleTimeOptionsComponent extends VueComponentBase {

    @Prop({
        type: Object,
        default: () => new Object()
    })
    private options: Partial<ITimeScaleFields>;

    private options_props: Partial<ITimeScaleFields> = null;

    private displayFormats: {
        [time_unit: string]: string;
    } = null;

    private isoWeekday: string = null;
    private round: 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year' = null;
    private tooltipFormat: string = null;
    private unit: 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year' = null; // Equivalent of moment unit
    private minUnit: 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year' = null;

    private time_unit_options: string[] = [
        'millisecond',
        'second',
        'minute',
        'hour',
        'day',
        'week',
        'month',
        'quarter',
        'year'
    ];

    @Watch('options', { immediate: true, deep: true })
    private on_input_options_changes() {
        if (isEqual(this.options_props, this.options)) {
            return;
        }

        // TODO: make sure we have all required fields
        for (const key in this.options) {
            this[key] = this.options[key];
        }

        this.options_props = this.options;
    }

    @Watch('displayFormats')
    private on_type_changed() {
        this.options_props = {
            ...this.options_props,
            displayFormats: this.displayFormats
        };
    }

    @Watch('round')
    private on_round_changed() {
        this.options_props = {
            ...this.options_props,
            round: this.round
        };
    }

    @Watch('unit')
    private on_unit_changed() {
        this.options_props = {
            ...this.options_props,
            unit: this.unit
        };
    }

    @Watch('minUnit')
    private on_min_unit_changed() {
        this.options_props = {
            ...this.options_props,
            minUnit: this.minUnit
        };
    }

    @Watch('options_props', { immediate: true, deep: true })
    private on_options_changed() {
        this.emit_change();
    }

    /**
     * add_display_format
     * - Add a display format field value to the displayFormats object.
     */
    private add_display_format() {
        let time_unit = 'millisecond';

        for (const key in this.time_unit_options) {
            time_unit = this.time_unit_options[key];

            if (this.displayFormats && this.displayFormats[time_unit]) {
                continue; // already exists
            } else {
                break;
            }
        }

        this.displayFormats = {
            ...this.displayFormats,
            [time_unit]: 'MMM DD, YYYY h:mm:ss.SSS a', // default add display format
        };
    }

    /**
     * remove_display_format
     * - We need to delete the display format.
     *
     * @param {string} time_unit
     */
    private remove_display_format(time_unit: string) {
        delete this.displayFormats[time_unit];

        // We need to re-assign the object to trigger the watcher
        this.displayFormats = {
            ...this.displayFormats,
        };
    }

    /**
     * handle_display_format_change
     *  - When a display format is changed, we need to update the displayFormats object.
     *  - We need to delete the old display format and add the new one.
     *
     * @param {string} time_unit
     * @param {{ time_unit: string, display_format: string }} display_format
     */
    private handle_display_format_change(time_unit: string, display_format: { time_unit: string, display_format: string }) {
        delete this.displayFormats[time_unit];

        this.displayFormats = {
            ...this.displayFormats,
            [display_format.time_unit]: display_format.display_format
        };
    }

    private emit_change() {
        this.$emit('on_change', this.options_props);
    }
}