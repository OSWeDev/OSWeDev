
import { Prop, Watch } from 'vue-property-decorator';
import Component from 'vue-class-component';
import VueComponentBase from '../../../../VueComponentBase';
import { isEqual } from 'lodash';

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

    private time_unit: string = null;
    private display_format: string = null;

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
            time_unit: this.time_unit
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