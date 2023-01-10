import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import SimpleDatatableFieldVO from '../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import NumRange from '../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../shared/modules/DataRender/vos/NumSegment';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import VueComponentBase from '../VueComponentBase';

@Component({
    template: require('./NumRangeInputComponent.pug'),
    components: {}
})
export default class NumRangeInputComponent extends VueComponentBase {

    @Prop({ default: false })
    private inline_input_mode: boolean;

    @Prop({ default: false })
    private required: boolean;

    @Prop({ default: false })
    private disabled: boolean;

    @Prop({ default: null })
    private value: NumRange;

    @Prop({ default: null })
    private field: SimpleDatatableFieldVO<any, any>;

    @Prop({ default: null })
    private vo: IDistantVOBase;

    private numrange_start: string = null;
    private numrange_end: string = null;
    private is_single: boolean = false;

    private new_value: NumRange = null;

    @Watch('value', { immediate: true })
    private async onchange_value(): Promise<void> {

        if (this.new_value == this.value) {
            return;
        }

        this.new_value = this.value;

        if (!this.value) {
            this.numrange_start = null;
            this.numrange_end = null;
            return;
        }
        this.is_single = (this.value.max - this.value.min == 1) ? true : false;

        this.numrange_start = this.value.min.toString();
        this.numrange_end = !this.is_single ? (this.value.max - 1).toString() : null;
    }
    private toggle_is_single() {
        this.is_single = !this.is_single;
    }

    @Watch('is_single')
    private reset_end() {
        if (this.is_single) {
            this.numrange_end = null;
        }
    }

    @Watch('numrange_start')
    @Watch('numrange_end')
    private emitInput(): void {

        let new_value = null;
        if (!this.is_single && !!this.numrange_start && !!this.numrange_start.length && !!this.numrange_end && !!this.numrange_end.length) {
            new_value = RangeHandler.createNew(NumRange.RANGE_TYPE, Number.parseInt(this.numrange_start), Number.parseInt(this.numrange_end), true, true, NumSegment.TYPE_INT);
        } else if (this.is_single && (!!this.numrange_start && !!this.numrange_start.length && (!this.numrange_end || !this.numrange_end.length))) {
            let num: number = Number.parseInt(this.numrange_start);
            new_value = RangeHandler.create_single_elt_NumRange(num, NumSegment.TYPE_INT);
        } else {
            new_value = null;
        }

        /**
         * On check que c'est bien une nouvelle value
         */
        let old_value = this.vo ? this.vo[this.field.datatable_field_uid] : null;
        if ((old_value == new_value) ||
            (RangeHandler.is_same(old_value, new_value))) {
            return;
        }
        this.new_value = new_value;


        this.$emit('input', this.new_value);
        this.$emit('input_with_infos', this.new_value, this.field, this.vo);
    }

    get custom_id(): string {
        return (!!this.field && !!this.field.module_table_field_id ? this.field.module_table_field_id : '') + "_num_range_is_single_" + (!!this.vo && !!this.vo.id ? this.vo.id.toString() : "new");
    }
}