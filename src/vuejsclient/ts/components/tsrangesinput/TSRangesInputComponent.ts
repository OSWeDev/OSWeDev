

import moment from 'moment';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import SimpleDatatableFieldVO from '../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import TSRange from '../../../../shared/modules/DataRender/vos/TSRange';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import VueComponentBase from '../VueComponentBase';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';

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
    private field: SimpleDatatableFieldVO<any, any>;

    @Prop({ default: null })
    private segmentation_type: number;

    @Prop({ default: null })
    private vo: IDistantVOBase;

    private segmentation_type_: number = null;
    private selectedDates: Date[] = [];

    private new_value: TSRange[] = null;
    private custom_key: string = null;

    @Watch('value', { immediate: true })
    private async onchange_value(): Promise<void> {
        if (RangeHandler.are_same(this.new_value, this.value)) {
            return;
        }

        if (!this.segmentation_type_) {
            this.onchange_field();
        }

        this.new_value = this.value;

        if (!this.value) {
            this.selectedDates = [];
            return;
        }

        let selectedDates: Date[] = [];

        RangeHandler.foreach_ranges_sync(this.value, (e: number) => {
            // On met UTC false car le composant v-date-picker utilise sans UTC et il compare directement la date
            // Ca pose donc un soucis de comparaison pour v-date-picker
            // Il faut bien laisser utc(false)
            selectedDates.push(moment.unix(e).utc().startOf('day').toDate());
        }, this.segmentation_type_);

        this.selectedDates = selectedDates;
    }

    @Watch('field', { immediate: true })
    private onchange_field() {
        if (!!this.field) {
            if (this.segmentation_type == null) {
                if (this.field.moduleTableField) {
                    this.segmentation_type_ = this.field.segmentation_type;
                }
                return;
            }
        }
        this.segmentation_type_ = this.segmentation_type;
    }

    @Watch('selectedDates')
    private emitInput(): void {
        if (this.is_type_quarter) {
            return;
        }

        let new_value = [];
        for (let i in this.selectedDates) {
            let selectedDate = this.selectedDates[i];

            new_value.push(RangeHandler.create_single_elt_TSRange(moment(selectedDate).utc(true).unix(), this.segmentation_type_));
        }

        /**
         * On check que c'est bien une nouvelle value
         */
        let old_value = this.vo ? this.vo[this.field.datatable_field_uid] : null;
        if ((old_value == new_value) ||
            (RangeHandler.are_same(old_value, new_value)) ||
            (RangeHandler.are_same(this.new_value, new_value))
        ) {
            return;
        }
        this.new_value = new_value;

        this.$emit('input', new_value);
        this.$emit('input_with_infos', new_value, this.field, this.vo);
    }

    private mounted() {
        this.custom_key = 'custom_key_' + Math.floor(Math.random() * 1000000);
    }

    private onchange_selected_quarters(selected_quarters: string[][]) {
        if (!this.is_type_quarter) {
            return;
        }

        let new_value: TSRange[] = [];
        for (let i in selected_quarters) {
            let selected_quarter: string[] = selected_quarters[i];

            new_value.push(RangeHandler.create_single_elt_TSRange(Dates.parse(selected_quarter[0], 'YYYY-MM-DD', false), this.segmentation_type_));
        }

        /**
         * On check que c'est bien une nouvelle value
         */
        let old_value = this.vo ? this.vo[this.field.datatable_field_uid] : null;
        if ((old_value == new_value) ||
            (RangeHandler.are_same(old_value, new_value)) ||
            (RangeHandler.are_same(this.new_value, new_value))
        ) {
            return;
        }
        this.new_value = new_value;

        this.$emit('input', new_value);
        this.$emit('input_with_infos', new_value, this.field, this.vo);
    }

    private option_format_quarter(quarter: number): string {
        return this.label('time_segment.quarter') + quarter;
    }

    private option_format_quarter_selected(year: number, quarter: number): string {
        return year + ' ' + this.option_format_quarter(quarter);
    }

    get disabled_dates(): any {
        if (!this.disabled) {
            return null;
        }

        return {
            weekdays: [1, 2, 3, 4, 5, 6, 7]
        };
    }

    get is_type_quarter(): boolean {
        return this.segmentation_type_ == TimeSegment.TYPE_QUARTER;
    }
}