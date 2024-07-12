import { cloneDeep, isEqual } from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleCheckListBase from '../../../../../../shared/modules/CheckList/ModuleCheckListBase';
import ICheckListItem from '../../../../../../shared/modules/CheckList/interfaces/ICheckListItem';
import ICheckPoint from '../../../../../../shared/modules/CheckList/interfaces/ICheckPoint';
import CheckListVO from '../../../../../../shared/modules/CheckList/vos/CheckListVO';
import ModuleContextFilter from '../../../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import DAOController from '../../../../../../shared/modules/DAO/DAOController';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import FieldFilterVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import FieldValueFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import VOsTypesManager from '../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import ObjectHandler, { field_names } from '../../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../../shared/tools/PromiseTools';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import WeightHandler from '../../../../../../shared/tools/WeightHandler';
import AjaxCacheClientController from '../../../../modules/AjaxCache/AjaxCacheClientController';
import CheckListControllerBase from '../../../CheckList/CheckListControllerBase';
import CheckListItemComponent from '../../../CheckList/Item/CheckListItemComponent';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDAOAction, ModuleDAOGetter } from '../../../dao/store/DaoStore';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import TablePaginationComponent from '../table_widget/pagination/TablePaginationComponent';
import './ChecklistWidgetComponent.scss';
import ChecklistItemModalComponent from './checklist_item_modal/ChecklistItemModalComponent';
import ChecklistWidgetOptions from './options/ChecklistWidgetOptions';

/**
 * Datatable of checklist items
 */
@Component({
    template: require('./ChecklistWidgetComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Tablepaginationcomponent: TablePaginationComponent,
        Checklistitemcomponent: CheckListItemComponent
    }
})
export default class ChecklistWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_Checklistitemmodalcomponent: ChecklistItemModalComponent;

    @ModuleDAOGetter
    private getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    private storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private throttled_update_visible_options = ThrottleHelper.declare_throttle_without_args(this.update_visible_options.bind(this), 100, { leading: false, trailing: true });

    private pagination_count: number = 0;
    private pagination_offset: number = 0;

    private can_delete_all_right: boolean = null;
    private can_delete_right: boolean = null;
    private can_update_right: boolean = null;
    private can_create_right: boolean = null;

    private loaded_once: boolean = false;
    private is_busy: boolean = false;

    private checklists: CheckListVO[] = [];
    private checklists_by_ids: { [id: number]: CheckListVO } = {};

    private modalinit: boolean = false;

    private checklist_items_by_id: { [id: number]: ICheckListItem } = {};
    private checkpoints_by_id: { [id: number]: ICheckPoint } = {};

    private infos_cols_labels: string[] = [];

    private filter_text: string = null;

    private show_anyway: boolean = false;

    private item_id: number = null;
    private step_id: number = null;
    private last_calculation_cpt: number = 0;
    private old_widget_options: ChecklistWidgetOptions = null;

    get pagination_pagesize(): number {
        if (!this.widget_options) {
            return 100;
        }

        return this.widget_options.limit;
    }

    get checklist_controller(): CheckListControllerBase {
        if (!this.checklist) {
            return null;
        }

        for (const name in CheckListControllerBase.controller_by_name) {
            const controller = CheckListControllerBase.controller_by_name[name];

            if (controller.checklist_shared_module.checklist_name == this.checklist.name) {
                return controller;
            }
        }

        return null;
    }

    get checklist_shared_module(): ModuleCheckListBase {
        if (!this.checklist) {
            return null;
        }

        for (const name in CheckListControllerBase.controller_by_name) {
            const controller = CheckListControllerBase.controller_by_name[name];

            if (controller.checklist_shared_module.checklist_name == this.checklist.name) {
                return controller.checklist_shared_module;
            }
        }

        return null;
    }

    get selected_checklist_item() {
        if ((!this.checklist_items_by_id) || (!this.item_id)) {
            return null;
        }

        return this.checklist_items_by_id[this.item_id];
    }

    get selected_checkpoint() {
        if ((!this.checkpoints_by_id) || (!this.step_id)) {
            return null;
        }

        return this.checkpoints_by_id[this.step_id];
    }

    get ordered_checkpoints(): ICheckPoint[] {

        if ((!this.checkpoints_by_id) || (!ObjectHandler.hasAtLeastOneAttribute(this.checkpoints_by_id))) {
            return null;
        }

        let res: ICheckPoint[] = [];

        res = Object.values(this.checkpoints_by_id);
        WeightHandler.getInstance().sortByWeight(res);
        return res;
    }

    @Watch('modal_show')
    @Watch('checklist_controller')
    @Watch('item_id')
    @Watch('step_id')
    @Watch('checklist_id')
    @Watch('checklist_shared_module')
    private watchers() {
        this.throttled_update_visible_options();
    }

    private async onchangevo(vo: ICheckListItem) {

        if (!vo) {
            return;
        }

        Vue.set(this.checklist_items_by_id, vo.id, await query(this.checklist_shared_module.checklistitem_type_id).filter_by_id(vo.id).select_vo());

        this.get_Checklistitemmodalcomponent.change_selected_checklist_item(this.checklist_items_by_id[vo.id]);

        if (this.checklist_items_by_id[vo.id].archived) {
            delete this.checklist_items_by_id[vo.id];
        }

        if (!ObjectHandler.hasAtLeastOneAttribute(this.checklist_items_by_id)) {
            this.checklist_items_by_id = {};
        }

        await this.throttled_update_visible_options();
    }

    get ordered_checklistitems() {

        if (!this.checklist_controller) {
            return null;
        }

        let res: ICheckListItem[] = [];

        this.show_anyway = false;

        if (!this.checklist_items_by_id) {
            return [];
        }

        res = Object.values(this.checklist_items_by_id);

        if (this.filter_text) {

            res = res.filter((e: ICheckListItem) => {
                for (const i in e) {
                    const field = e[i];

                    if (typeof field !== 'string') {
                        continue;
                    }

                    if (field.indexOf(this.filter_text) >= 0) {
                        return true;
                    }
                }

                const infos_cols_content = this.checklist_controller.get_infos_cols_content(e);
                for (const i in infos_cols_content) {
                    const field = infos_cols_content[i];

                    if (typeof field !== 'string') {
                        continue;
                    }

                    if (field.indexOf(this.filter_text) >= 0) {
                        return true;
                    }
                }

                return false;
            });
        }

        res.sort(this.checklist_controller.items_sorter);

        return res;
    }

    private async mounted() {

        this.get_Checklistitemmodalcomponent.$on("onchangevo", this.onchangevo.bind(this));
        this.get_Checklistitemmodalcomponent.$on("deleteSelectedItem", this.deleteSelectedItem.bind(this));
        this.get_Checklistitemmodalcomponent.$on("update_visible_options", this.throttled_update_visible_options.bind(this));

        this.stopLoading();

        // Initialize the whole checklist VOs
        if ((!this.checklists) || (!this.checklists.length)) {
            this.checklists = await query(CheckListVO.API_TYPE_ID)
                .select_vos<CheckListVO>();

            this.checklists_by_ids = VOsTypesManager.vosArray_to_vosByIds(this.checklists);
        }

        await this.update_visible_options();
    }

    get has_checklist_items() {
        if (!this.checklist_items_by_id) {
            return false;
        }

        return ObjectHandler.hasAtLeastOneAttribute(this.checklist_items_by_id);
    }

    private async createNew() {
        const e = await this.checklist_controller.getCheckListItemNewInstance();
        const res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(e);

        if ((!res) || !res.id) {
            ConsoleHandler.error('CheckListComponent:createNew:failed');
            this.throttled_update_visible_options();
            return;
        }

        e.id = res.id;

        await this.openmodal(e, null);
    }

    private async deleteSelectedItem(item: ICheckListItem) {
        const res: InsertOrDeleteQueryResult[] = await ModuleDAO.getInstance().deleteVOs([item]);

        if ((!res) || (!res.length) || (!res[0]) || (!res[0].id)) {
            this.snotify.error(this.label('CheckListComponent.deleteSelectedItem.failed'));
            return;
        }

        delete this.checklist_items_by_id[item.id];

        if (!ObjectHandler.hasAtLeastOneAttribute(this.checklist_items_by_id)) {
            this.checklist_items_by_id = {};
        }

        this.get_Checklistitemmodalcomponent.closemodal();
    }

    get can_refresh(): boolean {
        return this.widget_options && this.widget_options.refresh_button;
    }

    get can_export(): boolean {
        return this.widget_options && this.widget_options.export_button;
    }

    get can_create(): boolean {
        if (!this.checklist_shared_module) {
            return false;
        }

        return this.can_create_right && this.widget_options.create_button;
    }

    get can_delete_all(): boolean {
        if (!this.checklist_shared_module) {
            return false;
        }

        return this.can_delete_all_right && this.widget_options.delete_all_button;
    }

    @Watch('checklist_shared_module', { immediate: true })
    private async onchange_checklist_shared_module() {
        if (!this.checklist_shared_module) {
            return;
        }

        if (this.can_delete_all_right == null) {
            this.can_delete_all_right = false;
        }

        if (this.can_delete_right == null) {
            this.can_delete_right = await ModuleAccessPolicy.getInstance().testAccess(
                DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_DELETE, this.checklist_shared_module.checklistitem_type_id));
        }

        if (this.can_update_right == null) {
            this.can_update_right = await ModuleAccessPolicy.getInstance().testAccess(
                DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, this.checklist_shared_module.checklistitem_type_id));
        }

        if (this.can_create_right == null) {
            this.can_create_right = await ModuleAccessPolicy.getInstance().testAccess(
                DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, this.checklist_shared_module.checklistitem_type_id));
        }
    }

    private async change_offset(new_offset: number) {
        if (new_offset != this.pagination_offset) {
            this.pagination_offset = new_offset;
            await this.throttled_update_visible_options();
        }
    }

    @Watch('get_active_field_filters', { deep: true })
    private async onchange_active_field_filters() {
        this.is_busy = true;

        await this.throttled_update_visible_options();
    }

    get checklist() {
        if ((!this.widget_options) || (!this.checklists_by_ids)) {
            return null;
        }

        return this.checklists_by_ids[this.widget_options.checklist_id];
    }

    private async update_visible_options() {

        const launch_cpt: number = (this.last_calculation_cpt + 1);

        this.last_calculation_cpt = launch_cpt;

        this.is_busy = true;

        if (!this.widget_options) {
            this.loaded_once = true;
            this.is_busy = false;
            return;
        }

        if (!this.widget_options.checklist_id) {
            this.loaded_once = true;
            this.is_busy = false;
            return;
        }

        if ((!this.checklists) || (!this.checklists.length)) {
            this.loaded_once = true;
            this.is_busy = false;
            return;
        }

        if (!this.checklist) {
            this.loaded_once = true;
            this.is_busy = false;
            return;
        }

        const self = this;
        const promises = [];

        let checklist_items_by_id: { [id: number]: ICheckListItem } = {};
        let field_filters = cloneDeep(this.get_active_field_filters);

        if (!field_filters[self.checklist_shared_module.checklistitem_type_id]) {
            field_filters[self.checklist_shared_module.checklistitem_type_id] = {};
        }

        field_filters = FieldFilterVOManager.clean_field_filters_for_request(field_filters);

        promises.push((async () => {

            // Create context_filter for checklist_id (checklist items that are in this checklist)
            let context_filter = new ContextFilterVO();
            context_filter.field_name = 'checklist_id';
            context_filter.vo_type = self.checklist_shared_module.checklistitem_type_id;
            context_filter.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS_ALL;
            context_filter.param_numeric = self.checklist.id;

            field_filters[self.checklist_shared_module.checklistitem_type_id]['checklist_id'] =
                ContextFilterVOManager.add_context_filter_to_tree(
                    field_filters[self.checklist_shared_module.checklistitem_type_id]['checklist_id'],
                    context_filter
                );

            // Create context_filter for archived (checklist items that are not archived)
            context_filter = new ContextFilterVO();
            context_filter.field_name = 'archived';
            context_filter.vo_type = self.checklist_shared_module.checklistitem_type_id;
            context_filter.filter_type = ContextFilterVO.TYPE_BOOLEAN_FALSE_ALL;

            field_filters[self.checklist_shared_module.checklistitem_type_id]['archived'] =
                ContextFilterVOManager.add_context_filter_to_tree(
                    field_filters[self.checklist_shared_module.checklistitem_type_id]['archived'],
                    context_filter
                );

            // context_query to select checklist items
            const context_query: ContextQueryVO = query(self.checklist_shared_module.checklistitem_type_id)
                .set_limit(this.pagination_pagesize, this.pagination_offset)
                .using(this.get_dashboard_api_type_ids)
                .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(field_filters))
                .set_sort(new SortByVO(self.checklist_shared_module.checklistitem_type_id, 'id', false));
            FieldValueFilterWidgetManager.add_discarded_field_paths(context_query, this.get_discarded_field_paths);

            const items: ICheckListItem[] = await context_query.select_vos<ICheckListItem>();

            // Si je ne suis pas sur la dernière demande, je me casse
            if (this.last_calculation_cpt != launch_cpt) {
                return;
            }

            if (items?.length > 0) {
                checklist_items_by_id = VOsTypesManager.vosArray_to_vosByIds(items);
            }
        })());

        let checkpoints_by_id: { [id: number]: ICheckPoint } = {};

        promises.push((async () => {
            const checkpoints = await query(self.checklist_shared_module.checkpoint_type_id)
                .filter_by_num_eq(field_names<ICheckPoint>().checklist_id, self.checklist.id)
                .select_vos<ICheckPoint>();

            checkpoints_by_id = VOsTypesManager.vosArray_to_vosByIds(checkpoints);
        })());

        await all_promises(promises);

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            return;
        }

        self.checklist_items_by_id = checklist_items_by_id;
        self.checkpoints_by_id = checkpoints_by_id;

        await this.checklist_controller.component_hook_onAsyncLoading(
            this.getStoredDatas,
            this.storeDatas
        );

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            return;
        }

        this.infos_cols_labels = this.checklist_controller.get_infos_cols_labels();

        const query_count: ContextQueryVO = query(self.checklist_shared_module.checklistitem_type_id)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(field_filters));
        FieldValueFilterWidgetManager.add_discarded_field_paths(query_count, this.get_discarded_field_paths);

        this.pagination_count = await ModuleContextFilter.getInstance().select_count(query_count);

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            return;
        }

        this.loaded_once = true;
        this.is_busy = false;
    }

    private async refresh() {
        AjaxCacheClientController.getInstance().invalidateUsingURLRegexp(new RegExp('.*' + ModuleContextFilter.APINAME_select_vos));
        AjaxCacheClientController.getInstance().invalidateUsingURLRegexp(new RegExp('.*' + ModuleContextFilter.APINAME_select_count));
        await this.throttled_update_visible_options();
    }

    @Watch('widget_options', { immediate: true })
    private async onchange_widget_options() {
        if (this.old_widget_options) {
            if (isEqual(this.widget_options, this.old_widget_options)) {
                return;
            }
        }

        this.old_widget_options = cloneDeep(this.widget_options);

        await this.throttled_update_visible_options();
    }

    get title_name_code_text() {
        if (!this.widget_options) {
            return null;
        }
        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    get widget_options(): ChecklistWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: ChecklistWidgetOptions = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as ChecklistWidgetOptions;
                options = options ? new ChecklistWidgetOptions(
                    options.limit, options.checklist_id,
                    options.delete_all_button, options.create_button, options.refresh_button, options.export_button) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    private async confirm_delete_all() {
        const self = this;

        // On demande confirmation avant toute chose.
        // si on valide, on lance la suppression
        self.snotify.confirm(self.label('crud.actions.delete_all.confirmation.body'), self.label('crud.actions.delete_all.confirmation.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
                        self.snotify.info(self.label('crud.actions.delete_all.start'));

                        await ModuleDAO.getInstance().truncate(self.checklist_shared_module.checklistitem_type_id);
                        await self.throttled_update_visible_options();
                    },
                    bold: false
                },
                {
                    text: self.t('NO'),
                    action: (toast) => {
                        self.$snotify.remove(toast.id);
                    }
                }
            ]
        });
    }

    get checklist_header_title(): string {
        if ((!this.widget_options) || (!this.page_widget)) {
            return null;
        }

        return this.get_flat_locale_translations[this.widget_options.get_title_name_code_text(this.page_widget.id)];
    }

    private async openmodal(selected_checklist_item: ICheckListItem, selected_checkpoint: ICheckPoint) {
        this.get_Checklistitemmodalcomponent.openmodal(
            this.checklist,
            selected_checklist_item,
            selected_checkpoint,
            this.ordered_checkpoints
        );
    }
}