import moment = require('moment');
import { Moment } from 'moment';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import TSRange from '../../../../shared/modules/DataRender/vos/TSRange';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import SimpleDatatableField from '../datatable/vos/SimpleDatatableField';
import VueComponentBase from '../VueComponentBase';
import './TSRangesInputComponent.scss';

@Component({
    template: require('./TSRangesInputComponent.pug'),
    components: {}
})
export default class TSRangesInputComponent extends VueComponentBase {

    @Prop({ default: false })
    private required: boolean;

    @Prop({ default: false })
    private disabled: boolean;

    @Prop({ default: null })
    private value: TSRange[];

    @Prop({ default: null })
    private field: SimpleDatatableField<any, any>;

    @Prop({ default: null })
    private vo: IDistantVOBase;

    private selectedDates: Date[] = [];

    private new_value: TSRange[] = null;

    @Watch('value', { immediate: true })
    private async onchange_value(): Promise<void> {
        if (RangeHandler.getInstance().are_same(this.new_value, this.value)) {
            return;
        }


        this.new_value = this.value;
        this.selectedDates = [];

        if (!this.value) {
            return;
        }

        RangeHandler.getInstance().foreach_ranges_sync(this.value, (e: Moment) => {
            // Ya certainement mieux....
            this.selectedDates.push(moment(e.format('Y-MM-DD HH:mm')).toDate());
        }, this.field.moduleTableField.segmentation_type);
    }

    @Watch('selectedDates')
    private emitInput(): void {

        this.new_value = [];
        for (let i in this.selectedDates) {
            let selectedDate = this.selectedDates[i];

            this.new_value.push(RangeHandler.getInstance().create_single_elt_TSRange(moment(selectedDate), this.field.moduleTableField.segmentation_type));
        }
        this.new_value = RangeHandler.getInstance().getRangesUnion(this.new_value);
        this.$emit('input', this.new_value);
        this.$emit('input_with_infos', this.new_value, this.field, this.vo);
    }
}