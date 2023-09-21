import { cloneDeep, isEqual, isEmpty } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Vue, Watch } from 'vue-property-decorator';
import ModuleContextFilter from '../../../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import SupervisionTypeWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/SupervisionTypeWidgetManager';
import SupervisionWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/SupervisionWidgetManager';
import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import SupervisionWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/SupervisionWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import SortByVO from '../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ISupervisedItem from '../../../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import SupervisionController from '../../../../../../shared/modules/Supervision/SupervisionController';
import VOsTypesManager from '../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import ThreadHandler from '../../../../../../shared/tools/ThreadHandler';
import AjaxCacheClientController from '../../../../modules/AjaxCache/AjaxCacheClientController';
import { ModuleDAOAction, ModuleDAOGetter } from '../../../dao/store/DaoStore';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import VueComponentBase from '../../../VueComponentBase';
import TablePaginationComponent from '../table_widget/pagination/TablePaginationComponent';
import SupervisionItemModalComponent from './supervision_item_modal/SupervisionItemModalComponent';
import './SupervisionWidgetComponent.scss';

@Component({
    template: require('./SupervisionWidgetComponent.pug'),
    components: {
        Tablepaginationcomponent: TablePaginationComponent,
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class SupervisionWidgetComponent extends VueComponentBase {

    @ModuleDAOGetter
    private getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    private storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;

    @ModuleDashboardPageAction
    private set_query_api_type_ids: (query_api_type_ids: string[]) => void;

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageGetter
    private get_Supervisionitemmodal: SupervisionItemModalComponent;

    @ModuleDashboardPageGetter
    private get_active_api_type_ids: string[];

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private throttled_update_visible_options = ThrottleHelper.declare_throttle_with_stackable_args(
        this.handle_throttled_update_visible_options.bind(this), 100, { leading: false, trailing: true }
    );

    private pagination_count: number = 0;
    private pagination_offset: number = 0;
    private loaded_once: boolean = false;
    private is_busy: boolean = false;

    private items: ISupervisedItem[] = [];
    private selected_items: { [identifier: string]: boolean } = {};
    private items_by_identifier: { [identifier: string]: ISupervisedItem } = {};

    private last_calculation_cpt: number = 0;
    private old_widget_options: SupervisionWidgetOptionsVO = null;

    private available_supervision_api_type_ids: string[] = [];

    @Watch('page_widget', { immediate: true })
    private async onchange_page_widget() {
        this.available_supervision_api_type_ids = SupervisionTypeWidgetManager.load_supervision_api_type_ids_by_dashboard(
            this.dashboard
        );
    }

    @Watch('widget_options', { immediate: true })
    private onchange_widget_options() {
        if (!!this.old_widget_options) {
            if (isEqual(this.widget_options, this.old_widget_options)) {
                return;
            }
        }

        this.old_widget_options = cloneDeep(this.widget_options);
        this.set_query_api_type_ids(this.supervision_api_type_ids);

        this.selected_items = {};

        this.throttled_update_visible_options();
    }

    @Watch('get_active_field_filters', { deep: true })
    @Watch('get_active_api_type_ids')
    private onchange_active_field_filters() {
        this.is_busy = true;

        this.selected_items = {};

        this.throttled_update_visible_options();
    }

    private async mounted() {
        this.stopLoading();

        if (this.widget_options && this.widget_options.auto_refresh) {
            await this.start_auto_refresh();
        }

        this.throttled_update_visible_options();
    }

    private async start_auto_refresh() {
        if (!this.widget_options.auto_refresh || !this.widget_options.auto_refresh_seconds) {
            return;
        }

        while (true) {
            if (!this.widget_options.auto_refresh) {
                return;
            }

            await ThreadHandler.sleep((this.widget_options.auto_refresh_seconds * 1000), 'SupervisionWidgetComponent.start_auto_refresh');

            this.throttled_update_visible_options();
        }
    }

    private async change_offset(new_offset: number) {
        if (new_offset != this.pagination_offset) {
            this.pagination_offset = new_offset;

            this.selected_items = {};

            this.throttled_update_visible_options();
        }
    }

    /**
     * Handle the throttled update visible options
     *
     * @param args
     * @returns {Promise<void>}
     */
    private async handle_throttled_update_visible_options(args: any[]): Promise<void> {
        const options = Array.isArray(args) && args.length > 0 ? args.shift() : null;

        return await this.update_visible_options();
    }

    /**
     * Update visible options
     * - Get the supervision items
     * - Update the pagination count
     * - Update the items
     *
     * @param options
     * @returns {Promise<void>}
     */
    private async update_visible_options(): Promise<void> {

        let launch_cpt: number = (this.last_calculation_cpt + 1);
        let rows: ISupervisedItem[] = [];

        this.is_busy = true;

        if (!(this.supervision_api_type_ids?.length > 0)) {
            this.pagination_count = 0;
            this.loaded_once = true;
            this.is_busy = false;
            this.items = rows;
            return;
        }

        // Get the supervision items
        const data: { items: ISupervisedItem[], total_count: number } = await SupervisionWidgetManager.find_supervision_probs_by_api_type_ids(
            this.dashboard,
            this.widget_options,
            this.get_active_field_filters,
            this.get_active_api_type_ids,
            {
                offset: this.pagination_offset,
                limit: this.limit,
                sorts: [new SortByVO(null, 'name', true)]
            },
        );

        rows = data.items;

        this.loaded_once = true;
        this.is_busy = false;

        this.pagination_count = data.total_count;
        this.items = rows;

        let items_by_identifier: { [identifier: string]: ISupervisedItem } = {};

        for (let i in this.items) {
            const item = this.items[i];

            const identifier: string = this.get_identifier(item);

            items_by_identifier[identifier] = item;
        }

        this.items_by_identifier = items_by_identifier;
    }

    private filter_field_filter_by_supervision_type(
        api_field_filters: FieldFiltersVO,
        supervision_type: string
    ): FieldFiltersVO {

        let available_api_type_ids: string[] = [];

        if (this.get_active_api_type_ids?.length > 0) {
            // Setted Api type ids (default or setted from filters)
            available_api_type_ids = this.get_active_api_type_ids;
        } else {
            // Default (from widget) Api type ids
            available_api_type_ids = this.supervision_api_type_ids;
        }

        for (let i in available_api_type_ids) {
            let api_type_id = available_api_type_ids[i];

            if (api_type_id != supervision_type) {
                delete api_field_filters[api_type_id];
            }

            // On supprime aussi de l'arbre tous les filtres qui ne sont pas du bon type de supervision
            const field_filters = api_field_filters[api_type_id];
            for (const field_id in field_filters) {

                if (!field_filters[field_id]) {
                    continue;
                }

                field_filters[field_id] = ContextFilterVOManager.filter_context_filter_tree_by_vo_type(
                    field_filters[field_id],
                    supervision_type,
                    available_api_type_ids
                );
            }
        }

        return api_field_filters;
    }

    private async refresh() {
        AjaxCacheClientController.getInstance().invalidateUsingURLRegexp(new RegExp('.*' + ModuleContextFilter.APINAME_select_vos));
        AjaxCacheClientController.getInstance().invalidateUsingURLRegexp(new RegExp('.*' + ModuleContextFilter.APINAME_select_count));
        this.throttled_update_visible_options();
    }

    private openModal(item: ISupervisedItem) {
        this.get_Supervisionitemmodal.openmodal(item);
    }

    private get_date(item: ISupervisedItem): string {
        const moduletable = VOsTypesManager.moduleTables_by_voType[item._type];
        const field = moduletable.getFieldFromId('last_update');

        return field ? Dates.format_segment(item.last_update, field.segmentation_type) : null;
    }

    private get_store(item: ISupervisedItem) {

    }

    private select_all() {
        this.toggle_all_selection(true);
    }

    private unselect_all() {
        this.toggle_all_selection(false);
    }

    private toggle_all_selection(value: boolean) {
        for (let i in this.items) {
            let item = this.items[i];

            let identifier: string = this.get_identifier(item);

            Vue.set(this.selected_items, identifier, value);
        }
    }

    private async mark_as_unread() {
        let tosave: ISupervisedItem[] = [];

        for (let identifier in this.selected_items) {
            if (!this.selected_items[identifier]) {
                continue;
            }

            let item: ISupervisedItem = this.items_by_identifier[identifier];

            if (!item) {
                continue;
            }

            switch (item.state) {
                case SupervisionController.STATE_ERROR_READ:
                    item.state = SupervisionController.STATE_ERROR;
                    tosave.push(item);
                    break;
                case SupervisionController.STATE_WARN_READ:
                    item.state = SupervisionController.STATE_WARN;
                    tosave.push(item);
                    break;
            }
        }

        if (tosave.length) {
            await ModuleDAO.getInstance().insertOrUpdateVOs(tosave);
            await this.refresh();
        }
    }

    private async mark_as_read() {
        let tosave: ISupervisedItem[] = [];

        for (let identifier in this.selected_items) {
            if (!this.selected_items[identifier]) {
                continue;
            }

            let item: ISupervisedItem = this.items_by_identifier[identifier];

            if (!item) {
                continue;
            }

            switch (item.state) {
                case SupervisionController.STATE_ERROR:
                    item.state = SupervisionController.STATE_ERROR_READ;
                    tosave.push(item);
                    break;
                case SupervisionController.STATE_WARN:
                    item.state = SupervisionController.STATE_WARN_READ;
                    tosave.push(item);
                    break;
            }
        }

        if (tosave.length) {
            await ModuleDAO.getInstance().insertOrUpdateVOs(tosave);
            await this.refresh();
        }
    }

    private get_identifier(item: ISupervisedItem): string {
        return item._type + '_' + item.id;
    }

    get refresh_button(): boolean {
        return this.widget_options && this.widget_options.refresh_button;
    }

    get show_bulk_edit(): boolean {
        return this.widget_options && this.widget_options.show_bulk_edit;
    }

    get limit(): number {
        if (!this.widget_options) {
            return 100;
        }

        return this.widget_options.limit;
    }

    get widget_options(): SupervisionWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: SupervisionWidgetOptionsVO = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as SupervisionWidgetOptionsVO;
                options = options ? new SupervisionWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    /**
     * supervision_api_type_ids
     *
     * @returns {string[]}
     */
    get supervision_api_type_ids(): string[] {
        return this.widget_options?.supervision_api_type_ids ?? [];
    }

    get title_name_code_text() {
        if (!this.widget_options) {
            return null;
        }
        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    get checklist_header_title(): string {
        if ((!this.widget_options) || (!this.page_widget)) {
            return null;
        }

        return this.get_flat_locale_translations[this.widget_options.get_title_name_code_text(this.page_widget.id)];
    }

    get is_all_selected(): boolean {
        if (isEmpty(this.selected_items)) {
            return false;
        }

        for (let i in this.items_by_identifier) {
            if (!this.selected_items[i]) {
                return false;
            }
        }

        return true;
    }

    get has_one_selected(): boolean {
        if (isEmpty(this.selected_items)) {
            return false;
        }

        for (let i in this.items_by_identifier) {
            if (this.selected_items[i]) {
                return true;
            }
        }
    }
}