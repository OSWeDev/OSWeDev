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

    private arrondi_type: number = ARRONDI_TYPE_ROUND;
    private fractionalDigits: number = 0;
    private arrondi: boolean = false;
    private onlyPositive: boolean = false;
    private dot_decimal_marker: boolean = false;

    @Watch('actual_additional_options', { immediate: true })
    private onchange_actual_additional_options() {
        if (!this.actual_additional_options) {
            this.fractionalDigits = 0;
            this.onlyPositive = false;
            this.arrondi = false;
            this.dot_decimal_marker = false;
            this.arrondi_type = ARRONDI_TYPE_ROUND;
            this.onchange_inputs();
            return;
        }

        try {
            let additional_options = JSON.parse(this.actual_additional_options);

            // fractionalDigits: number = 0,
            // arrondi: boolean | number = false,
            // arrondi_type: number = ARRONDI_TYPE_ROUND,
            // onlyPositive: boolean = false,
            // dot_decimal_marker: boolean = false

            this.fractionalDigits = additional_options[0] ? parseInt(additional_options[0]) : 0;
            this.arrondi = additional_options[1];
            this.arrondi_type = additional_options[2];
            this.onlyPositive = additional_options[3];
            this.dot_decimal_marker = additional_options[4];
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    private onchange_inputs() {
        let additional_options = [
            this.fractionalDigits,
            this.arrondi,
            this.arrondi_type,
            this.onlyPositive,
            this.dot_decimal_marker,
        ];

        this.$emit('update_additional_options', JSON.stringify(additional_options));
    }

    private switch_dot_decimal_marker() {
        this.dot_decimal_marker = !this.dot_decimal_marker;

        this.onchange_inputs();
    }

    private switch_arrondi() {
        this.arrondi = !this.arrondi;

        this.onchange_inputs();
    }

    private switch_onlyPositive() {
        this.onlyPositive = !this.onlyPositive;

        this.onchange_inputs();
    }
}