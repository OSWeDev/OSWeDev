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

    private fractionalDigits: number = 0;
    private onlyPositive: boolean = false;
    private currency: string = '€';
    private humanize: boolean = true;

    @Watch('actual_additional_options', { immediate: true })
    private onchange_actual_additional_options() {
        if (!this.actual_additional_options) {
            this.fractionalDigits = 0;
            this.onlyPositive = false;
            this.currency = '€';
            this.humanize = true;
            this.onchange_inputs();
            return;
        }

        try {
            let additional_options = JSON.parse(this.actual_additional_options);

            // fractionalDigits: number = 0,
            // k: boolean = false,
            // onlyPositive: boolean = false,
            // humanize: boolean = false,
            // currency = "€"

            this.fractionalDigits = additional_options[0] ? parseInt(additional_options[0]) : 0;
            this.onlyPositive = additional_options[2];
            this.currency = additional_options[4];
            this.humanize = additional_options[3];
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    private onchange_inputs() {
        let additional_options = [
            this.fractionalDigits,
            false,
            this.onlyPositive,
            this.humanize,
            this.currency,
        ];

        this.$emit('update_additional_options', JSON.stringify(additional_options));
    }

    private switch_humanize() {
        this.humanize = !this.humanize;

        this.onchange_inputs();
    }

    private switch_onlyPositive() {
        this.onlyPositive = !this.onlyPositive;

        this.onchange_inputs();
    }
}