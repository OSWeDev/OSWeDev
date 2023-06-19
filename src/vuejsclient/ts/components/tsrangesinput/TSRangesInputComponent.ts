

import moment from 'moment';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import SimpleDatatableFieldVO from '../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import TSRange from '../../../../shared/modules/DataRender/vos/TSRange';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import VueComponentBase from '../VueComponentBase';

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
    private vo: IDistantVOBase;

    private selectedDates: Date[] = [];

    private new_value: TSRange[] = null;

    @Watch('value', { immediate: true })
    private async onchange_value(): Promise<void> {
        if (RangeHandler.are_same(this.new_value, this.value)) {
            return;
        }


        this.new_value = this.value;
        this.selectedDates = [];

        if (!this.value) {
            return;
        }

        RangeHandler.foreach_ranges_sync(this.value, (e: number) => {
            // On met UTC false car le composant v-date-picker utilise sans UTC et il compare directement la date
            // Ca pose donc un soucis de comparaison pour v-date-picker
            // Il faut bien laisser utc(false)
            this.selectedDates.push(moment.unix(e).utc().startOf('day').toDate());
        }, this.field.moduleTableField.segmentation_type);
    }

    @Watch('selectedDates')
    private emitInput(): void {

        let new_value = [];
        for (let i in this.selectedDates) {
            let selectedDate = this.selectedDates[i];

            new_value.push(RangeHandler.create_single_elt_TSRange(moment(selectedDate).utc(true).unix(), this.field.moduleTableField.segmentation_type));
        }
        new_value = RangeHandler.getRangesUnion(new_value);

        /**
         * On check que c'est bien une nouvelle value
         */
        let old_value = this.vo ? this.vo[this.field.datatable_field_uid] : null;
        if ((old_value == new_value) ||
            (RangeHandler.are_same(old_value, new_value))) {
            return;
        }
        this.new_value = new_value;

        this.$emit('input', this.new_value);
        this.$emit('input_with_infos', this.new_value, this.field, this.vo);
    }

    get disabled_dates(): any {
        if (!this.disabled) {
            return null;
        }

        return {
            weekdays: [1, 2, 3, 4, 5, 6, 7]
        };
    }
}