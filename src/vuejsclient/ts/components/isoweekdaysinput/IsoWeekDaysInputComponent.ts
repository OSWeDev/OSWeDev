import moment = require('moment');
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import NumRange from '../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../shared/modules/DataRender/vos/NumSegment';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import SimpleDatatableField from '../datatable/vos/SimpleDatatableField';
import VueComponentBase from '../VueComponentBase';
import './IsoWeekDaysInputComponent.scss';

@Component({
    template: require('./IsoWeekDaysInputComponent.pug'),
    components: {}
})
export default class IsoWeekDaysInputComponent extends VueComponentBase {

    @Prop({ default: false })
    private required: boolean;

    @Prop({ default: false })
    private disabled: boolean;

    @Prop({ default: null })
    private value: NumRange[];

    @Prop({ default: null })
    private field: SimpleDatatableField<any, any>;

    @Prop({ default: null })
    private vo: IDistantVOBase;

    private checkedDays: string[] = [];

    private new_value: NumRange[] = null;

    @Watch('value', { immediate: true })
    private async onchange_value(): Promise<void> {
        if (RangeHandler.getInstance().are_same(this.new_value, this.value)) {
            return;
        }


        this.new_value = this.value;
        this.checkedDays = [];

        if (!this.value) {
            return;
        }

        RangeHandler.getInstance().foreach_ranges_sync(this.value, (e: number) => {
            this.checkedDays.push(e.toString());
        }, this.field.moduleTableField.segmentation_type);
    }

    @Watch('checkedDays')
    private emitInput(): void {

        this.new_value = [];
        for (let i in this.checkedDays) {
            let selectedDate = this.checkedDays[i];

            this.new_value.push(RangeHandler.getInstance().create_single_elt_NumRange(parseInt(selectedDate.toString()), NumSegment.TYPE_INT));
        }
        this.new_value = RangeHandler.getInstance().getRangesUnion(this.new_value);
        this.$emit('input', this.new_value);
        this.$emit('input_with_infos', this.new_value, this.field, this.vo);
    }
}