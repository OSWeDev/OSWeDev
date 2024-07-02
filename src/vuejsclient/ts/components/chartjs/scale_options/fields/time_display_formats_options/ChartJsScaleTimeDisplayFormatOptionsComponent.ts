
import { Prop, Watch } from 'vue-property-decorator';
import Component from 'vue-class-component';
import { isEqual } from 'lodash';
import VueComponentBase from '../../../../VueComponentBase';

@Component({
    template: require('./ChartJsScaleTimeDisplayFormatOptionsComponent.pug'),
    components: {}
})
export default class ChartJsScaleTimeDisplayFormatOptionsComponent extends VueComponentBase {

    @Prop({
        type: Object,
        default: () => new Object()
    })
    private options: { time_unit: string, display_format: string };

    private options_props: { time_unit: string, display_format: string } = null;

    private time_unit: any = {};
    private display_format: string = null;

    private time_unit_options: any[] = [
        { label: this.label('chart_js_scale_options_component.time_unit_millisecond_options'), value: 'millisecond' },
        { label: this.label('chart_js_scale_options_component.time_unit_second_options'), value: 'second' },
        { label: this.label('chart_js_scale_options_component.time_unit_minute_options'), value: 'minute' },
        { label: this.label('chart_js_scale_options_component.time_unit_hour_options'), value: 'hour' },
        { label: this.label('chart_js_scale_options_component.time_unit_day_options'), value: 'day' },
        { label: this.label('chart_js_scale_options_component.time_unit_week_options'), value: 'week' },
        { label: this.label('chart_js_scale_options_component.time_unit_month_options'), value: 'month' },
        { label: this.label('chart_js_scale_options_component.time_unit_quarter_options'), value: 'quarter' },
        { label: this.label('chart_js_scale_options_component.time_unit_year_options'), value: 'year' },
    ];

    private display_format_options: string[] = [
        'MMM',
        'MMM D',
        'MMM D, YYYY',
        'dddd, MMM D, YYYY',
        'MMMM',
        'MMMM YYYY',
        'D MMMM',
        'D MMMM YYYY',
        'YYYY',
        'h:mm a',
        'h:mm:ss a',
        'h:mm:ss a z',
        'h:mm:ss a Z',
        'H:mm',
        'H:mm:ss',
        'H:mm:ss z',
        'H:mm:ss Z',
        'MMMM Do YYYY, h:mm:ss a',
        'MMMM Do YYYY, h:mm:ss a z',
        'MMMM Do YYYY, h:mm:ss a Z',
        'dddd, MMMM Do YYYY, h:mm:ss a',
        'dddd, MMMM Do YYYY, h:mm:ss a z',
        'dddd, MMMM Do YYYY, h:mm:ss a Z'
    ];

    @Watch('options', { immediate: true, deep: true })
    private on_input_options_changes() {
        if (isEqual(this.options_props, this.options)) {
            return;
        }

        // TODO: make sure we have all required fields
        for (const key in this.options) {
            if (key == 'time_unit') {
                this.time_unit = this.time_unit_options.find((option) => option.value == this.options[key]);
                continue;
            }

            this[key] = this.options[key];
        }

        this.options_props = this.options;
    }

    @Watch('options_props', { deep: true })
    private on_options_props_changed() {
        this.emit_change();
    }

    @Watch('time_unit')
    private on_time_unit_changed() {
        this.options_props = {
            ...this.options_props,
            time_unit: this.time_unit?.value
        };
    }

    @Watch('display_format')
    private on_display_format_changed() {
        this.options_props = {
            ...this.options_props,
            display_format: this.display_format
        };
    }

    private emit_change() {
        this.$emit('on_change', this.options_props);
    }
}