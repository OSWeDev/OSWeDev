import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import NumRange from '../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../shared/modules/DataRender/vos/NumSegment';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import VueComponentBase from '../VueComponentBase';
import './IsoWeekDaysInputComponent.scss';
import SimpleDatatableFieldVO from '../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';

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
    private field: SimpleDatatableFieldVO<any, any>;

    @Prop({ default: null })
    private vo: IDistantVOBase;

    private checkedDays: string[] = [];

    private new_value: NumRange[] = null;

    @Watch('value', { immediate: true })
    private async onchange_value(): Promise<void> {
        if (RangeHandler.are_same(this.new_value, this.value)) {
            return;
        }


        this.new_value = this.value;
        this.checkedDays = [];

        if (!this.value) {
            return;
        }

        RangeHandler.foreach_ranges_sync(this.value, (e: number) => {
            this.checkedDays.push(e.toString());
        }, this.field.segmentation_type);
    }

    @Watch('checkedDays')
    private emitInput(): void {

        let new_value = [];
        for (const i in this.checkedDays) {
            const selectedDate = this.checkedDays[i];

            new_value.push(RangeHandler.create_single_elt_NumRange(parseInt(selectedDate.toString()), NumSegment.TYPE_INT));
        }
        new_value = RangeHandler.getRangesUnion(new_value);

        /**
         * On check que c'est bien une nouvelle value
         */
        const old_value = this.vo ? this.vo[this.field.datatable_field_uid] : null;
        if ((old_value == new_value) ||
            (RangeHandler.are_same(old_value, new_value))) {
            return;
        }
        this.new_value = new_value;

        this.$emit('input', this.new_value);
        this.$emit('input_with_infos', this.new_value, this.field, this.vo);
    }
}