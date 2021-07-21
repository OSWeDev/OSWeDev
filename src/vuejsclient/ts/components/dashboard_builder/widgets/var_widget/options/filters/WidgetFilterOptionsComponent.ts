import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import Filters from '../../../../../../../../shared/tools/Filters';
import VueComponentBase from '../../../../../VueComponentBase';
import AmountFilterOptionsComponent from './amount/AmountFilterOptionsComponent';
import './WidgetFilterOptionsComponent.scss';

@Component({
    template: require('./WidgetFilterOptionsComponent.pug'),
    components: {
        Amountfilteroptionscomponent: AmountFilterOptionsComponent
    }
})
export default class WidgetFilterOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private actual_additional_options: string;

    @Prop({ default: null })
    private actual_filter_type: string;

    private filter_type: string = null;
    private filter_uids: string[] = [
        Filters.FILTER_TYPE_amount
    ];

    get filter_names(): { [filter_uid: string]: string } {
        let res: { [filter_uid: string]: string } = {};

        for (let i in this.filter_uids) {
            let filter_uid = this.filter_uids[i];

            res[filter_uid] = this.label('filters.names.__' + filter_uid + '__');
        }
        return res;
    }

    get filter_by_names(): { [filter_name: string]: string } {
        let res: { [filter_name: string]: string } = {};

        for (let i in this.filter_uids) {
            let filter_uid = this.filter_uids[i];

            res[this.label('filters.names.__' + filter_uid + '__')] = filter_uid;
        }
        return res;
    }

    @Watch('actual_filter_type', { immediate: true })
    private onchange_actual_filter_type() {
        let ftype = this.filter_by_names[this.filter_type];
        if (ftype != this.actual_filter_type) {
            this.filter_type = this.filter_names[this.actual_filter_type];
            this.actual_additional_options = null;
        }
    }

    private update_additional_options(additional_options) {
        this.$emit('update_additional_options', additional_options);
    }

    @Watch('filter_type')
    private onchange_filter_type() {
        let ftype = this.filter_by_names[this.filter_type];
        if (ftype != this.actual_filter_type) {
            this.$emit('update_filter_type', ftype);
        }
    }
}