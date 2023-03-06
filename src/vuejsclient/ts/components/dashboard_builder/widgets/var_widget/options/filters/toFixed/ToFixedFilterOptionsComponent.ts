import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ConsoleHandler from '../../../../../../../../../shared/tools/ConsoleHandler';
import { ARRONDI_TYPE_ROUND } from '../../../../../../../../../shared/tools/Filters';
import VueComponentBase from '../../../../../../VueComponentBase';
import './ToFixedFilterOptionsComponent.scss';

@Component({
    template: require('./ToFixedFilterOptionsComponent.pug'),
    components: {}
})
export default class ToFixedFilterOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private actual_additional_options: string;

    private rounded_type: number = ARRONDI_TYPE_ROUND;
    private fractional_digits: number = 0;
    private rounded: boolean = false;
    private only_positive: boolean = false;
    private dot_decimal_marker: boolean = false;

    @Watch('actual_additional_options', { immediate: true })
    private onchange_actual_additional_options() {
        if (!this.actual_additional_options) {
            this.fractional_digits = 0;
            this.only_positive = false;
            this.rounded = false;
            this.dot_decimal_marker = false;
            this.rounded_type = ARRONDI_TYPE_ROUND;
            this.onchange_inputs();
            return;
        }

        try {
            let options = JSON.parse(this.actual_additional_options);

            // fractional_digits: number = 0,
            // rounded: boolean | number = false,
            // rounded_type: number = ARRONDI_TYPE_ROUND,
            // only_positive: boolean = false,
            // dot_decimal_marker: boolean = false

            this.fractional_digits = options.fractional_digits ? parseInt(options.fractional_digits) : 0;
            this.rounded = options.rounded;
            this.rounded_type = options.rounded_type;
            this.only_positive = options.only_positive;
            this.dot_decimal_marker = options.dot_decimal_marker;
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    private onchange_inputs() {
        let options = {
            fractional_digits: this.fractional_digits,
            rounded: this.rounded,
            rounded_type: this.rounded_type,
            only_positive: this.only_positive,
            dot_decimal_marker: this.dot_decimal_marker,
        };

        this.$emit('update_additional_options', JSON.stringify(options));
    }

    private switch_dot_decimal_marker() {
        this.dot_decimal_marker = !this.dot_decimal_marker;

        this.onchange_inputs();
    }

    private switch_arrondi() {
        this.rounded = !this.rounded;

        this.onchange_inputs();
    }

    private switch_onlyPositive() {
        this.only_positive = !this.only_positive;

        this.onchange_inputs();
    }
}