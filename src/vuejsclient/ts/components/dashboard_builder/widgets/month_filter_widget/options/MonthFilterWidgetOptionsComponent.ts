import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import VOsTypesManager from '../../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../../DashboardBuilderWidgetsController';
import MonthFilterWidgetOptions from './MonthFilterWidgetOptions';
import './MonthFilterWidgetOptionsComponent.scss';

@Component({
    template: require('./MonthFilterWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent
    }
})
export default class MonthFilterWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    @ModuleDashboardPageGetter
    private get_custom_filters: string[];

    @ModuleDashboardPageAction
    private set_custom_filters: (custom_filters: string[]) => void;

    private is_vo_field_ref: boolean = true;
    private month_relative_mode: boolean = true;
    private auto_select_month: boolean = true;
    private auto_select_month_relative_mode: boolean = true;

    private custom_filter_name: string = null;

    private min_month: string = null;
    private max_month: string = null;
    private auto_select_month_min: string = null;
    private auto_select_month_max: string = null;

    private next_update_options: MonthFilterWidgetOptions = null;
    private throttled_update_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

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

        let res: string[] = [];

        for (let i in this.get_custom_filters) {
            let get_custom_filter = this.get_custom_filters[i];

            if (get_custom_filter == this.custom_filter_name) {
                continue;
            }

            res.push(get_custom_filter);
        }

        return this.get_custom_filters;
    }

    private change_custom_filter(custom_filter: string) {
        this.custom_filter_name = custom_filter;
        if (this.get_custom_filters && (this.get_custom_filters.indexOf(custom_filter) < 0)) {
            let custom_filters = Array.from(this.get_custom_filters);
            custom_filters.push(custom_filter);
            this.set_custom_filters(custom_filters);
        }
    }

    @Watch('widget_options', { immediate: true })
    private onchange_widget_options() {
        if (!this.widget_options) {
            this.is_vo_field_ref = true;
            this.month_relative_mode = true;
            this.auto_select_month = true;
            this.auto_select_month_relative_mode = true;
            this.custom_filter_name = null;
            this.min_month = null;
            this.max_month = null;
            this.auto_select_month_min = null;
            this.auto_select_month_max = null;
            return;
        }
        this.is_vo_field_ref = this.widget_options.is_vo_field_ref;
        this.month_relative_mode = this.widget_options.month_relative_mode;
        this.auto_select_month = this.widget_options.auto_select_month;
        this.auto_select_month_relative_mode = this.widget_options.auto_select_month_relative_mode;
        this.custom_filter_name = this.widget_options.custom_filter_name;
        this.min_month = (this.widget_options.min_month == null) ? null : this.widget_options.min_month.toString();
        this.max_month = (this.widget_options.max_month == null) ? null : this.widget_options.max_month.toString();
        this.auto_select_month_min = (this.widget_options.auto_select_month_min == null) ? null : this.widget_options.auto_select_month_min.toString();
        this.auto_select_month_max = (this.widget_options.auto_select_month_max == null) ? null : this.widget_options.auto_select_month_max.toString();
    }

    @Watch('min_month')
    private async onchange_min_month() {
        if (!this.widget_options) {
            return;
        }

        let month = (this.min_month == null) ? null : parseInt(this.min_month);
        if (this.widget_options.min_month != month) {
            this.next_update_options = this.widget_options;
            this.next_update_options.min_month = month;

            await this.throttled_update_options();
        }
    }

    @Watch('auto_select_month_min')
    private async onchange_auto_select_month_min() {
        if (!this.widget_options) {
            return;
        }

        let month = (this.auto_select_month_min == null) ? null : parseInt(this.auto_select_month_min);
        if (this.widget_options.auto_select_month_min != month) {
            this.next_update_options = this.widget_options;
            this.next_update_options.auto_select_month_min = month;

            await this.throttled_update_options();
        }
    }

    @Watch('auto_select_month_max')
    private async onchange_auto_select_month_max() {
        if (!this.widget_options) {
            return;
        }

        let month = (this.auto_select_month_max == null) ? null : parseInt(this.auto_select_month_max);
        if (this.widget_options.auto_select_month_max != month) {
            this.next_update_options = this.widget_options;
            this.next_update_options.auto_select_month_max = month;

            await this.throttled_update_options();
        }
    }

    @Watch('max_month')
    private async onchange_max_month() {
        if (!this.widget_options) {
            return;
        }

        let month = (this.max_month == null) ? null : parseInt(this.max_month);
        if (this.widget_options.max_month != month) {
            this.next_update_options = this.widget_options;
            this.next_update_options.max_month = month;

            await this.throttled_update_options();
        }
    }

    @Watch('custom_filter_name')
    private async onchange_custom_filter_name() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.custom_filter_name != this.custom_filter_name) {
            this.next_update_options = this.widget_options;
            this.next_update_options.custom_filter_name = this.custom_filter_name;

            await this.throttled_update_options();
        }
    }

    private async switch_month_relative_mode() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new MonthFilterWidgetOptions(true, null, null, this.month_relative_mode, null, null, true, true, null, null);
        }

        this.next_update_options.month_relative_mode = !this.next_update_options.month_relative_mode;

        await this.throttled_update_options();
    }

    private async switch_auto_select_month() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new MonthFilterWidgetOptions(true, null, null, true, null, null, this.auto_select_month, true, null, null);
        }

        this.next_update_options.auto_select_month = !this.next_update_options.auto_select_month;

        await this.throttled_update_options();
    }

    private async switch_auto_select_month_relative_mode() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new MonthFilterWidgetOptions(true, null, null, true, null, null, true, this.auto_select_month_relative_mode, null, null);
        }

        this.next_update_options.auto_select_month_relative_mode = !this.next_update_options.auto_select_month_relative_mode;

        await this.throttled_update_options();
    }

    private async switch_is_vo_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new MonthFilterWidgetOptions(this.is_vo_field_ref, null, null, true, null, null, true, true, null, null);
        }

        this.next_update_options.is_vo_field_ref = !this.next_update_options.is_vo_field_ref;

        await this.throttled_update_options();
    }

    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);

        let name = VOsTypesManager.getInstance().vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets)[this.page_widget.widget_id].name;
        let get_selected_fields = DashboardBuilderWidgetsController.getInstance().widgets_get_selected_fields[name];
        this.set_selected_fields(get_selected_fields ? get_selected_fields(this.page_widget) : {});
    }

    get vo_field_ref(): VOFieldRefVO {
        let options: MonthFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    private async remove_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.vo_field_ref) {
            return null;
        }

        this.next_update_options.vo_field_ref = null;

        await this.throttled_update_options();
    }

    get default_placeholder_translation(): string {
        return this.label('DOWFilterWidget.filter_placeholder');
    }

    get widget_options(): MonthFilterWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: MonthFilterWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as MonthFilterWidgetOptions;
                options = options ? new MonthFilterWidgetOptions(
                    options.is_vo_field_ref, options.vo_field_ref, options.custom_filter_name, options.month_relative_mode,
                    options.min_month, options.max_month, options.auto_select_month, options.auto_select_month_relative_mode,
                    options.auto_select_month_min, options.auto_select_month_max) : null;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
    }

    private async add_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new MonthFilterWidgetOptions(this.is_vo_field_ref, null, null, true, null, null, true, true, null, null);
        }

        let vo_field_ref = new VOFieldRefVO();
        vo_field_ref.api_type_id = api_type_id;
        vo_field_ref.field_id = field_id;
        vo_field_ref.weight = 0;

        this.next_update_options.vo_field_ref = vo_field_ref;

        await this.throttled_update_options();
    }
}