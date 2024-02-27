import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ConsoleHandler from '../../../../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../../../../VueComponentBase';

@Component({
    template: require('./HourFilterOptionsComponent.pug'),
    components: {}
})
export default class HourFilterOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private actual_additional_options: string;

    private rounded: boolean = false;
    private negativeValue: boolean = false;
    private positiveSign: boolean = false;
    private formatted: boolean = false;
    private arrondiMinutes: boolean | number = null;

    @Watch('actual_additional_options', { immediate: true })
    private onchange_actual_additional_options() {
        if (!this.actual_additional_options) {
            this.rounded = false;
            this.negativeValue = false;
            this.positiveSign = false;
            this.formatted = false;
            this.arrondiMinutes = null;

            this.onchange_inputs();
            return;
        }

        try {
            const options = JSON.parse(this.actual_additional_options);

            this.rounded = options[0];
            this.negativeValue = options[1];
            this.positiveSign = options[2];
            this.formatted = options[3];
            this.arrondiMinutes = options[4];
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    private onchange_inputs() {
        const options = [
            this.rounded,
            this.negativeValue,
            this.positiveSign,
            this.formatted,
            this.arrondiMinutes,
        ];

        this.$emit('update_additional_options', JSON.stringify(options));
    }

    private switch_rounded() {
        this.rounded = !this.rounded;

        this.onchange_inputs();
    }

    private switch_negativeValue() {
        this.negativeValue = !this.negativeValue;

        this.onchange_inputs();
    }

    private switch_positiveSign() {
        this.positiveSign = !this.positiveSign;

        this.onchange_inputs();
    }

    private switch_formatted() {
        this.formatted = !this.formatted;

        this.onchange_inputs();
    }
}