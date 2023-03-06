import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ConsoleHandler from '../../../../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../../../../VueComponentBase';
import './AmountFilterOptionsComponent.scss';

@Component({
    template: require('./AmountFilterOptionsComponent.pug'),
    components: {}
})
export default class AmountFilterOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private actual_additional_options: string;

    private fractional_digits: number = 0;
    private only_positive: boolean = false;
    private currency: string = '€';
    private humanize: boolean = true;

    @Watch('actual_additional_options', { immediate: true })
    private onchange_actual_additional_options() {
        if (!this.actual_additional_options) {
            this.fractional_digits = 0;
            this.only_positive = false;
            this.currency = '€';
            this.humanize = true;
            this.onchange_inputs();
            return;
        }

        try {
            let options = JSON.parse(this.actual_additional_options);

            // fractional_digits: number = 0,
            // k: boolean = false,
            // only_positive: boolean = false,
            // humanize: boolean = false,
            // currency = "€"

            this.fractional_digits = options.fractional_digits ? parseInt(options.fractional_digits) : 0;
            this.only_positive = options.only_positive;
            this.currency = options.currency;
            this.humanize = options.humanize;
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    private onchange_inputs() {
        let options = {
            fractional_digits: this.fractional_digits,
            only_positive: this.only_positive,
            humanize: this.humanize,
            currency: this.currency,
        };

        this.$emit('update_additional_options', JSON.stringify(options));
    }

    private switch_humanize() {
        this.humanize = !this.humanize;

        this.onchange_inputs();
    }

    private switch_onlyPositive() {
        this.only_positive = !this.only_positive;

        this.onchange_inputs();
    }
}