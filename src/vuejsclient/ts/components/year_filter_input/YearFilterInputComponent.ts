import { Prop, Vue } from 'vue-property-decorator';
import Component from 'vue-class-component';
import { cloneDeep } from 'lodash';
import VueComponentBase from '../VueComponentBase';
import './YearFilterInputComponent.scss';

@Component({
    template: require('./YearFilterInputComponent.pug'),
    components: {}
})
export default class YearFilterInputComponent extends VueComponentBase {

    @Prop({ default: 'view' })
    private mode: 'configuration' | 'view';

    @Prop({ default: null })
    private years: string[];

    @Prop({ default: null })
    private selected_years: { [year: number]: boolean };

    @Prop({ default: null })
    private custom_filter_name: string;

    @Prop({ default: null })
    private input_label: string;

    @Prop({ default: null })
    private is_vo_field_ref: boolean;

    @Prop({ default: true })
    private is_years_selectionnable: boolean;

    @Prop({ default: false })
    private can_use_year_cumulated: boolean;

    @Prop({ default: false })
    private can_select_all: boolean;

    // Is All Years Selected Toggle Button
    // - Shall be highlight or true when selected_years empty
    // - Shall be false when selected_years has at least one selected
    @Prop({ default: false })
    private is_all_years_selected: boolean;

    /**
     * Handle toggle selected year
     *  - Called when we click on toggle year button
     *
     * @param i index in selected year array
     */
    private toggle_selected_year(i: string) {
        if (!this.is_years_selectionnable) {
            return;
        }

        // Cannot change binded prop directly
        const selected_years = cloneDeep(this.selected_years);

        Vue.set(selected_years, i, !selected_years[i]);

        if (!(Object.keys(selected_years)?.length > 0)) {
            // if there is no selected_years
            this.set_is_all_years_selected(true);
        } else {
            this.set_is_all_years_selected(false);
        }

        this.set_selected_years(selected_years);
    }

    /**
     * Handle Toggle Select All
     *  - Called when we click on toggle select all
     */
    private toggle_select_all() {
        const is_all_years_selected = !this.is_all_years_selected;

        if (is_all_years_selected) {
            // If is all years selected reset selected_years
            this.set_selected_years({});
        }

        this.set_is_all_years_selected(is_all_years_selected);
    }

    /**
     * set_selected_years
     *  - Emit event to parent component
     *
     * @param {{ [year: number]: boolean }} selected_years
     */
    private set_selected_years(selected_years: { [year: number]: boolean }) {
        this.$emit('onchange_selected_year', selected_years);
    }

    /**
     * set_is_all_years_selected
     * - Emit event to parent component
     *
     * @param {boolean} is_all_years_selected
     */
    private set_is_all_years_selected(is_all_years_selected: boolean) {
        this.$emit('onchange_all_years_selected', is_all_years_selected);
    }
}