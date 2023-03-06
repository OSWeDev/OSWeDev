import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ConsoleHandler from '../../../../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../../../../VueComponentBase';
import './PercentFilterOptionsComponent.scss';

@Component({
    template: require('./PercentFilterOptionsComponent.pug'),
    components: {}
})
export default class PercentFilterOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private actual_additional_options: string;

    private fractional_digits: number = 0;
    private pts: boolean = false;
    private explicit_sign: boolean = false;
    private evol_from_prct: boolean = false;
    private treat_999_as_infinite: boolean = true;

    @Watch('actual_additional_options', { immediate: true })
    private onchange_actual_additional_options() {
        if (!this.actual_additional_options) {
            this.fractional_digits = 0;
            this.pts = false;
            this.explicit_sign = false;
            this.evol_from_prct = false;
            this.treat_999_as_infinite = true;
            this.onchange_inputs();
            return;
        }

        try {
            let options = JSON.parse(this.actual_additional_options);

            // fractional_digits: number = 0,
            // pts: boolean = false,
            // explicit_sign: boolean = false,
            // evol_from_prct: boolean = false,
            // treat_999_as_infinite: boolean = true

            this.fractional_digits = options.fractional_digits ? parseInt(options.fractional_digits) : 0;
            this.pts = options.pts;
            this.explicit_sign = options.explicit_sign;
            this.evol_from_prct = options.evol_from_prct;
            this.treat_999_as_infinite = options.treat_999_as_infinite;
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    private onchange_inputs() {
        let options = {
            fractional_digits: this.fractional_digits,
            pts: this.pts,
            explicit_sign: this.explicit_sign,
            evol_from_prct: this.evol_from_prct,
            treat_999_as_infinite: this.treat_999_as_infinite,
        };

        this.$emit('update_additional_options', JSON.stringify(options));
    }

    private switch_pts() {
        this.pts = !this.pts;

        this.onchange_inputs();
    }

    private switch_explicit_sign() {
        this.explicit_sign = !this.explicit_sign;

        this.onchange_inputs();
    }

    private switch_evol_from_prct() {
        this.evol_from_prct = !this.evol_from_prct;

        this.onchange_inputs();
    }

    private switch_treat_999_as_infinite() {
        this.treat_999_as_infinite = !this.treat_999_as_infinite;

        this.onchange_inputs();
    }
}