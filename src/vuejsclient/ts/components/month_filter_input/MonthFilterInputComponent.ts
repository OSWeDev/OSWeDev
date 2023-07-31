import { Prop, Vue } from 'vue-property-decorator';
import Component from 'vue-class-component';
import { cloneDeep } from 'lodash';
import VueComponentBase from '../VueComponentBase';
import './MonthFilterInputComponent.scss';

@Component({
    template: require('./MonthFilterInputComponent.pug'),
    components: {}
})
export default class MonthFilterInputComponent extends VueComponentBase {

    @Prop({ default: 'view' })
    private mode: 'configuration' | 'view';

    @Prop({ default: null })
    private months: string[];

    @Prop({ default: null })
    private selected_months: { [month: number]: boolean };

    @Prop({ default: null })
    private custom_filter_name: string;

    @Prop({ default: null })
    private input_label: string;

    @Prop({ default: null })
    private is_vo_field_ref: boolean;

    @Prop({ default: true })
    private is_months_selectionnable: boolean;

    @Prop({ default: false })
    private can_use_month_cumulated: boolean;

    @Prop({ default: false })
    private can_select_all: boolean;

    // Is All Months Selected Toggle Button
    // - Shall be highlight or true when selected_months empty
    // - Shall be false when selected_months has at least one selected
    @Prop({ default: false })
    private is_all_months_selected: boolean;

    @Prop({ default: false })
    private is_month_cumulated_selected: boolean;

    /**
     * Handle toggle selected month
     *  - Called when we click on toggle month button
     *
     * @param i index in selected month array
     */
    private toggle_selected_month(i: string) {
        if (!this.is_months_selectionnable) {
            return;
        }

        // Cannot change binded prop directly
        const selected_months = cloneDeep(this.selected_months);

        Vue.set(selected_months, i, !selected_months[i]);

        if (!(Object.keys(selected_months)?.length > 0)) {
            // if there is no selected_months
            this.set_is_all_months_selected(true);
        } else {
            this.set_is_all_months_selected(false);
        }

        this.set_selected_months(selected_months);
    }

    /**
     * Handle Toggle Select All
     *  - Called when we click on toggle select all
     */
    private toggle_select_all() {
        let is_all_months_selected = !this.is_all_months_selected;

        if (is_all_months_selected) {
            // If is all months selected reset selected_months
            this.set_selected_months({});
            this.set_month_cumulated_selected(false);
        }

        this.set_is_all_months_selected(is_all_months_selected);
    }

    /**
     * Handle Toggle Cumulative Months
     */
    private toggle_month_cumulated() {
        let is_month_cumulated_selected = !this.is_month_cumulated_selected;

        if (is_month_cumulated_selected) {
            this.set_is_all_months_selected(false);
        }

        this.set_month_cumulated_selected(is_month_cumulated_selected);
    }

    /**
     * set_selected_months
     *  - Emit event to parent component
     *
     * @param {{ [month: number]: boolean }} selected_months
     */
    private set_selected_months(selected_months: { [month: number]: boolean }) {
        this.$emit('onchange_selected_month', selected_months);
    }

    /**
     * set_is_all_months_selected
     * - Emit event to parent component
     *
     * @param {boolean} is_all_months_selected
     */
    private set_is_all_months_selected(is_all_months_selected: boolean) {
        this.$emit('onchange_all_months_selected', is_all_months_selected);
    }

    /**
     * set_month_cumulated_selected
     * - Emit event to parent component
     *
     * @param {boolean} is_month_cumulated_selected
     */
    private set_month_cumulated_selected(is_month_cumulated_selected: boolean) {
        this.$emit('onchange_month_cumulated', is_month_cumulated_selected);
    }
}