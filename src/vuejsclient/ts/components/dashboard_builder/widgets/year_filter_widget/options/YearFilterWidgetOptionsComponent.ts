import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import Throttle from '../../../../../../../shared/annotations/Throttle';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import WidgetOptionsVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/WidgetOptionsVOManager';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import YearFilterWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/YearFilterWidgetOptionsVO';
import EventifyEventListenerConfVO from '../../../../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import { reflect } from '../../../../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../../page/DashboardPageStore';
import './YearFilterWidgetOptionsComponent.scss';

@Component({
    template: require('./YearFilterWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent
    }
})
export default class YearFilterWidgetOptionsComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    public page_widget: DashboardPageWidgetVO;

    @ModuleDroppableVoFieldsAction
    public set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    public is_vo_field_ref: boolean = true;
    public year_relative_mode: boolean = true;
    public auto_select_year: boolean = true;
    public auto_select_year_relative_mode: boolean = true;

    public custom_filter_name: string = null;

    public min_year: string = null;
    public max_year: string = null;
    public auto_select_year_min: string = null;
    public auto_select_year_max: string = null;
    public next_update_options: YearFilterWidgetOptionsVO = null;

    public relative_to_other_filter_id: number = null;
    public is_relative_to_other_filter: boolean = false;
    public hide_filter: boolean = false;

    // Current filter may show select_all of selectable months
    public can_select_all: boolean = false;

    get default_placeholder_translation(): string {
        return this.label('DOWFilterWidget.filter_placeholder');
    }

    /**
     * Computed widget options
     *  - Called on component|widget creation
     * @returns YearFilterWidgetOptionsVO
     */
    get widget_options(): YearFilterWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: YearFilterWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as YearFilterWidgetOptionsVO;
                options = options ? new YearFilterWidgetOptionsVO(
                    options.is_vo_field_ref,
                    options.vo_field_ref,
                    options.custom_filter_name,
                    options.year_relative_mode,
                    options.min_year,
                    options.max_year,
                    options.auto_select_year,
                    options.auto_select_year_relative_mode,
                    options.auto_select_year_min,
                    options.auto_select_year_max,
                    options.is_relative_to_other_filter,
                    options.relative_to_other_filter_id,
                    options.hide_filter,
                    options.can_select_all,
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    get get_all_widgets(): DashboardWidgetVO[] {
        return this.vuexGet(reflect<this>().get_all_widgets);
    }

    get get_widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return this.vuexGet(reflect<this>().get_widgets_by_id);
    }

    get get_custom_filters(): string[] {
        return this.vuexGet(reflect<this>().get_custom_filters);
    }

    get get_page_widgets(): DashboardPageWidgetVO[] {
        return this.vuexGet(reflect<this>().get_page_widgets);
    }

    get get_page_widgets_components_by_pwid(): { [pwid: number]: VueComponentBase } {
        return this.vuexGet(reflect<this>().get_page_widgets_components_by_pwid);
    }

    get other_filters_by_name(): { [filter_name: string]: DashboardPageWidgetVO } {
        if (!this.get_page_widgets) {
            return null;
        }

        const res: { [filter_name: string]: DashboardPageWidgetVO } = {};

        for (const i in this.get_page_widgets) {
            const get_page_widget = this.get_page_widgets[i];

            if (get_page_widget.id == this.page_widget.id) {
                continue;
            }

            if (get_page_widget.widget_id !== this.page_widget.widget_id) {
                continue;
            }

            if (!get_page_widget.json_options) {
                continue;
            }

            const other_filter_options = JSON.parse(get_page_widget.json_options) as YearFilterWidgetOptionsVO;
            if (!other_filter_options) {
                continue;
            }

            if (other_filter_options.is_vo_field_ref) {
                if ((!other_filter_options.vo_field_ref) || (!other_filter_options.vo_field_ref.api_type_id) || (!other_filter_options.vo_field_ref.field_id)) {
                    continue;
                }

                const name = 'Widget ID:' + get_page_widget.id + ' : ' + other_filter_options.vo_field_ref.api_type_id + '.' + other_filter_options.vo_field_ref.field_id;
                if (res[name]) {
                    continue;
                }
                res[name] = get_page_widget;
            } else {
                if (!other_filter_options.custom_filter_name) {
                    continue;
                }

                const name = 'Widget ID:' + get_page_widget.id + ' : ' + other_filter_options.custom_filter_name;
                if (res[name]) {
                    continue;
                }
                res[name] = get_page_widget;
            }
        }

        return res;
    }

    get has_existing_other_custom_filters(): boolean {
        if (!this.other_custom_filters) {
            return false;
        }

        return this.other_custom_filters.length > 0;
    }

    get other_custom_filters(): string[] {
        if (!this.get_custom_filters) {
            return null;
        }

        const res: string[] = [];

        for (const i in this.get_custom_filters) {
            const get_custom_filter = this.get_custom_filters[i];

            if (get_custom_filter == this.custom_filter_name) {
                continue;
            }

            res.push(get_custom_filter);
        }

        return this.get_custom_filters;
    }

    get vo_field_ref(): VOFieldRefVO {
        const options: YearFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    @Watch(reflect<YearFilterWidgetOptionsComponent>().widget_options, { immediate: true })
    public onchange_widget_options() {
        if (!this.widget_options) {
            this.is_vo_field_ref = true;
            this.year_relative_mode = true;
            this.auto_select_year = true;
            this.auto_select_year_relative_mode = true;
            this.custom_filter_name = null;
            this.min_year = null;
            this.max_year = null;
            this.auto_select_year_min = null;
            this.auto_select_year_max = null;
            this.relative_to_other_filter_id = null;
            this.is_relative_to_other_filter = false;
            this.hide_filter = false;
            this.can_select_all = false;

            return;
        }

        this.is_vo_field_ref = this.widget_options.is_vo_field_ref;
        this.year_relative_mode = this.widget_options.year_relative_mode;
        this.auto_select_year = this.widget_options.auto_select_year;
        this.auto_select_year_relative_mode = this.widget_options.auto_select_year_relative_mode;
        this.custom_filter_name = this.widget_options.custom_filter_name;
        this.min_year = (this.widget_options.min_year == null) ? null : this.widget_options.min_year.toString();
        this.max_year = (this.widget_options.max_year == null) ? null : this.widget_options.max_year.toString();
        this.auto_select_year_min = (this.widget_options.auto_select_year_min == null) ? null : this.widget_options.auto_select_year_min.toString();
        this.auto_select_year_max = (this.widget_options.auto_select_year_max == null) ? null : this.widget_options.auto_select_year_max.toString();
        this.relative_to_other_filter_id = this.widget_options.relative_to_other_filter_id;
        this.is_relative_to_other_filter = this.widget_options.is_relative_to_other_filter;
        this.hide_filter = this.widget_options.hide_filter;
        this.can_select_all = this.widget_options.can_select_all;
    }

    @Watch(reflect<YearFilterWidgetOptionsComponent>().relative_to_other_filter_id)
    public async onchange_relative_to_other_filter_id() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.relative_to_other_filter_id != this.relative_to_other_filter_id) {
            this.next_update_options = this.widget_options;
            this.next_update_options.relative_to_other_filter_id = this.relative_to_other_filter_id;

            await this.update_options();
        }
    }

    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
        throttle_ms: 50,
        leading: false,
    })
    public async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }
        await ModuleDAO.instance.insertOrUpdateVO(this.page_widget);

        const name = this.get_widgets_by_id[this.page_widget.widget_id].name;
        const get_selected_fields = WidgetOptionsVOManager.widgets_get_selected_fields[name];
        this.set_selected_fields(get_selected_fields ? get_selected_fields(this.page_widget) : {});
    }

    @Watch(reflect<YearFilterWidgetOptionsComponent>().min_year)
    public async onchange_min_year() {
        if (!this.widget_options) {
            return;
        }

        const year = (this.min_year == null) ? null : parseInt(this.min_year);
        if (this.widget_options.min_year != year) {
            this.next_update_options = this.widget_options;
            this.next_update_options.min_year = year;

            await this.update_options();
        }
    }

    @Watch(reflect<YearFilterWidgetOptionsComponent>().auto_select_year_min)
    public async onchange_auto_select_year_min() {
        if (!this.widget_options) {
            return;
        }

        const year = (this.auto_select_year_min == null) ? null : parseInt(this.auto_select_year_min);
        if (this.widget_options.auto_select_year_min != year) {
            this.next_update_options = this.widget_options;
            this.next_update_options.auto_select_year_min = year;

            await this.update_options();
        }
    }

    @Watch(reflect<YearFilterWidgetOptionsComponent>().auto_select_year_max)
    public async onchange_auto_select_year_max() {
        if (!this.widget_options) {
            return;
        }

        const year = (this.auto_select_year_max == null) ? null : parseInt(this.auto_select_year_max);
        if (this.widget_options.auto_select_year_max != year) {
            this.next_update_options = this.widget_options;
            this.next_update_options.auto_select_year_max = year;

            await this.update_options();
        }
    }

    @Watch(reflect<YearFilterWidgetOptionsComponent>().max_year)
    public async onchange_max_year() {
        if (!this.widget_options) {
            return;
        }

        const year = (this.max_year == null) ? null : parseInt(this.max_year);
        if (this.widget_options.max_year != year) {
            this.next_update_options = this.widget_options;
            this.next_update_options.max_year = year;

            await this.update_options();
        }
    }

    @Watch(reflect<YearFilterWidgetOptionsComponent>().custom_filter_name)
    public async onchange_custom_filter_name() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.custom_filter_name != this.custom_filter_name) {
            this.next_update_options = this.widget_options;
            this.next_update_options.custom_filter_name = this.custom_filter_name;

            await this.update_options();
        }
    }

    // Accès dynamiques Vuex
    public vuexGet<K extends keyof IDashboardGetters>(getter: K): IDashboardGetters[K] {
        return this.$store.getters[`${this.storeNamespace}/${String(getter)}`];
    }
    public vuexAct<K extends keyof IDashboardPageActionsMethods>(
        action: K,
        ...args: Parameters<IDashboardPageActionsMethods[K]>
    ) {
        this.$store.dispatch(`${this.storeNamespace}/${String(action)}`, ...args);
    }

    public set_custom_filters(custom_filters: string[]) {
        return this.vuexAct(reflect<this>().set_custom_filters, custom_filters);
    }

    public change_custom_filter(custom_filter: string) {
        this.custom_filter_name = custom_filter;
        if (this.get_custom_filters && (this.get_custom_filters.indexOf(custom_filter) < 0)) {
            const custom_filters = Array.from(this.get_custom_filters);
            custom_filters.push(custom_filter);
            this.set_custom_filters(custom_filters);
        }
    }

    public async switch_hide_filter() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new YearFilterWidgetOptionsVO(true, null, null, true, null, null, true, true, null, null, false, null, this.hide_filter);
        }

        this.next_update_options.hide_filter = !this.next_update_options.hide_filter;

        await this.update_options();
    }

    public async switch_is_relative_to_other_filter() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new YearFilterWidgetOptionsVO(true, null, null, true, null, null, true, true, null, null, this.is_relative_to_other_filter, null, false);
        }

        this.next_update_options.is_relative_to_other_filter = !this.next_update_options.is_relative_to_other_filter;

        await this.update_options();
    }

    public async switch_year_relative_mode() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new YearFilterWidgetOptionsVO(true, null, null, this.year_relative_mode, null, null, true, true, null, null, false, null, false);
        }

        this.next_update_options.year_relative_mode = !this.next_update_options.year_relative_mode;

        await this.update_options();
    }

    public async switch_auto_select_year() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new YearFilterWidgetOptionsVO(true, null, null, true, null, null, this.auto_select_year, true, null, null, false, null, false);
        }

        this.next_update_options.auto_select_year = !this.next_update_options.auto_select_year;

        await this.update_options();
    }

    public async switch_auto_select_year_relative_mode() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new YearFilterWidgetOptionsVO(true, null, null, true, null, null, true, this.auto_select_year_relative_mode, null, null, false, null, false);
        }

        this.next_update_options.auto_select_year_relative_mode = !this.next_update_options.auto_select_year_relative_mode;

        await this.update_options();
    }

    /**
     * Toggle Can Select All
     *  - Allow to the user to show select_all of the active filter (years) options
     */
    public async toggle_can_select_all() {
        if (!this.widget_options) {
            return;
        }

        this.widget_options.can_select_all = !this.can_select_all;

        if (!this.next_update_options) {
            this.next_update_options = cloneDeep(this.widget_options);
        }

        await this.update_options();
    }

    public async switch_is_vo_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new YearFilterWidgetOptionsVO(this.is_vo_field_ref, null, null, true, null, null, true, true, null, null, false, null, false);
        }

        this.next_update_options.is_vo_field_ref = !this.next_update_options.is_vo_field_ref;

        await this.update_options();
    }

    public async remove_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.vo_field_ref) {
            return null;
        }

        this.next_update_options.vo_field_ref = null;

        await this.update_options();
    }

    public async add_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new YearFilterWidgetOptionsVO(this.is_vo_field_ref, null, null, true, null, null, true, true, null, null, false, null, false);
        }

        const vo_field_ref = new VOFieldRefVO();
        vo_field_ref.api_type_id = api_type_id;
        vo_field_ref.field_id = field_id;
        vo_field_ref.weight = 0;

        this.next_update_options.vo_field_ref = vo_field_ref;

        await this.update_options();
    }
}