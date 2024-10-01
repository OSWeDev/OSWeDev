import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import Filters from '../../../../../../../../shared/tools/Filters';
import VueComponentBase from '../../../../../VueComponentBase';
import AmountFilterOptionsComponent from './amount/AmountFilterOptionsComponent';
import HourFilterOptionsComponent from './hour/HourFilterOptionsComponent';
import PercentFilterOptionsComponent from './percent/PercentFilterOptionsComponent';
import ToFixedFilterOptionsComponent from './toFixed/ToFixedFilterOptionsComponent';
import ToFixedCeilFilterOptionsComponent from './toFixedCeil/ToFixedCeilFilterOptionsComponent';
import ToFixedFloorFilterOptionsComponent from './toFixedFloor/ToFixedFloorFilterOptionsComponent';
import TstzFilterOptionsComponent from './tstz/TstzFilterOptionsComponent';
import './WidgetFilterOptionsComponent.scss';

@Component({
    template: require('./WidgetFilterOptionsComponent.pug'),
    components: {
        Amountfilteroptionscomponent: AmountFilterOptionsComponent,
        Hourfilteroptionscomponent: HourFilterOptionsComponent,
        Tofixedfloorfilteroptionscomponent: ToFixedFloorFilterOptionsComponent,
        Tofixedceilfilteroptionscomponent: ToFixedCeilFilterOptionsComponent,
        Tofixedfilteroptionscomponent: ToFixedFilterOptionsComponent,
        Percentfilteroptionscomponent: PercentFilterOptionsComponent,
        Tstzfilteroptionscomponent: TstzFilterOptionsComponent
    }
})
export default class WidgetFilterOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private actual_additional_options: string;

    @Prop({ default: null })
    private actual_filter_type: string;

    private filter_type: string = null;
    private filter_uids: string[] = [
        'none',
        Filters.FILTER_TYPE_amount,
        Filters.FILTER_TYPE_percent,
        Filters.FILTER_TYPE_toFixed,
        Filters.FILTER_TYPE_toFixedCeil,
        Filters.FILTER_TYPE_toFixedFloor,
        Filters.FILTER_TYPE_tstz,
        Filters.FILTER_TYPE_hour,
    ];

    get filter_names(): { [filter_uid: string]: string } {
        const res: { [filter_uid: string]: string } = {};

        for (const i in this.filter_uids) {
            const filter_uid = this.filter_uids[i];

            res[filter_uid] = this.label('filters.names.__' + filter_uid + '__');
        }
        return res;
    }

    get filter_by_names(): { [filter_name: string]: string } {
        const res: { [filter_name: string]: string } = {};

        for (const i in this.filter_uids) {
            const filter_uid = this.filter_uids[i];

            res[this.label('filters.names.__' + filter_uid + '__')] = filter_uid;
        }
        return res;
    }

    @Watch('actual_filter_type', { immediate: true })
    private onchange_actual_filter_type() {
        if (this.filter_type) {
            const ftype = this.filter_by_names[this.filter_type];
            if (ftype != this.actual_filter_type) {
                this.filter_type = this.filter_names[this.actual_filter_type];
                this.$emit('update_additional_options', null);
            }
        } else {
            this.filter_type = this.filter_names[this.actual_filter_type];
        }
    }

    private update_additional_options(additional_options) {
        this.$emit('update_additional_options', additional_options);
    }

    @Watch('filter_type')
    private onchange_filter_type() {
        const ftype = this.filter_by_names[this.filter_type];
        if (ftype != this.actual_filter_type) {
            this.$emit('update_filter_type', ftype);
        }
    }
}