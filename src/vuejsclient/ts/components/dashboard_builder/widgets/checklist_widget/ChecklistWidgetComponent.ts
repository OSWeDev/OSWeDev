import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ICheckList from '../../../../../../shared/modules/CheckList/interfaces/ICheckList';
import ICheckListItem from '../../../../../../shared/modules/CheckList/interfaces/ICheckListItem';
import ICheckPoint from '../../../../../../shared/modules/CheckList/interfaces/ICheckPoint';
import ModuleCheckListBase from '../../../../../../shared/modules/CheckList/ModuleCheckListBase';
import CheckListVO from '../../../../../../shared/modules/CheckList/vos/CheckListVO';
import ContextFilterHandler from '../../../../../../shared/modules/ContextFilter/ContextFilterHandler';
import ModuleContextFilter from '../../../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import SortByVO from '../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import WeightHandler from '../../../../../../shared/tools/WeightHandler';
import AjaxCacheClientController from '../../../../modules/AjaxCache/AjaxCacheClientController';
import CheckListControllerBase from '../../../CheckList/CheckListControllerBase';
import CheckListItemComponent from '../../../CheckList/Item/CheckListItemComponent';
import CheckListModalComponent from '../../../CheckList/modal/CheckListModalComponent';
import { ModuleDAOAction, ModuleDAOGetter } from '../../../dao/store/DaoStore';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import TablePaginationComponent from '../table_widget/pagination/TablePaginationComponent';
import './ChecklistWidgetComponent.scss';
import ChecklistItemModalComponent from './checklist_item_modal/ChecklistItemModalComponent';
import ChecklistWidgetOptions from './options/ChecklistWidgetOptions';

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
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private throttled_update_visible_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_visible_options.bind(this), 100, { leading: false, trailing: true });

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

    private checklistitems: { [id: number]: ICheckListItem } = {};
    private checkpoints: { [id: number]: ICheckPoint } = {};

    private infos_cols_labels: string[] = [];

    private filter_text: string = null;

    private show_anyway: boolean = false;

    private item_id: number = null;
    private step_id: number = null;

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

        for (let name in CheckListControllerBase.controller_by_name) {
            let controller = CheckListControllerBase.controller_by_name[name];

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

        for (let name in CheckListControllerBase.controller_by_name) {
            let controller = CheckListControllerBase.controller_by_name[name];

            if (controller.checklist_shared_module.checklist_name == this.checklist.name) {
                return controller.checklist_shared_module;
            }
        }
        return null;
    }

    get selected_checklist_item() {
        if ((!this.checklistitems) || (!this.item_id)) {
            return null;
        }

        return this.checklistitems[this.item_id];
    }

    get selected_checkpoint() {
        if ((!this.checkpoints) || (!this.step_id)) {
            return null;
        }

        return this.checkpoints[this.step_id];
    }

    get ordered_checkpoints(): ICheckPoint[] {

        if ((!this.checkpoints) || (!ObjectHandler.getInstance().hasAtLeastOneAttribute(this.checkpoints))) {
            return null;
        }

        let res: ICheckPoint[] = [];

        res = Object.values(this.checkpoints);
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
        this.checklistitems[vo.id] = await ModuleDAO.getInstance().getVoById(this.checklist_shared_module.checklistitem_type_id, vo.id);
        if (this.checklistitems[vo.id].archived) {
            delete this.checklistitems[vo.id];
        }
        if (!ObjectHandler.getInstance().hasAtLeastOneAttribute(this.checklistitems)) {
            this.checklistitems = {};
        }
        await this.throttled_update_visible_options();
    }

    get ordered_checklistitems() {

        if (!this.checklist_controller) {
            return null;
        }

        let res: ICheckListItem[] = [];

        this.show_anyway = false;

        if (!this.checklistitems) {
            return [];
        }

        res = Object.values(this.checklistitems);

        if (this.filter_text) {

            res = res.filter((e: ICheckListItem) => {
                for (let i in e) {
                    let field = e[i];

                    if (typeof field !== 'string') {
                        continue;
                    }

                    if (field.indexOf(this.filter_text) >= 0) {
                        return true;
                    }
                }

                let infos_cols_content = this.checklist_controller.get_infos_cols_content(e);
                for (let i in infos_cols_content) {
                    let field = infos_cols_content[i];

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

        if ((!this.checklists) || (!this.checklists.length)) {
            this.checklists = await ModuleDAO.getInstance().getVos<CheckListVO>(CheckListVO.API_TYPE_ID);
            this.checklists_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(this.checklists);
        }

        this.update_visible_options();
    }

    get has_checklistitems() {
        if (!this.checklistitems) {
            return false;
        }

        return ObjectHandler.getInstance().hasAtLeastOneAttribute(this.checklistitems);
    }

    private async createNew() {
        let e = this.checklist_controller.getCheckListItemNewInstance();
        let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(e);
        if ((!res) || !res.id) {
            ConsoleHandler.getInstance().error('CheckListComponent:createNew:failed');
            this.throttled_update_visible_options();
            return;
        }
        e.id = res.id;

        this.openmodal(e, null);
    }

    private async deleteSelectedItem(item: ICheckListItem) {
        let res: InsertOrDeleteQueryResult[] = await ModuleDAO.getInstance().deleteVOs([item]);
        if ((!res) || (!res.length) || (!res[0]) || (!res[0].id)) {
            this.snotify.error(this.label('CheckListComponent.deleteSelectedItem.failed'));
            return;
        }
        delete this.checklistitems[item.id];
        if (!ObjectHandler.getInstance().hasAtLeastOneAttribute(this.checklistitems)) {
            this.checklistitems = {};
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
                ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_DELETE, this.checklist_shared_module.checklistitem_type_id));
        }

        if (this.can_update_right == null) {
            this.can_update_right = await ModuleAccessPolicy.getInstance().testAccess(
                ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, this.checklist_shared_module.checklistitem_type_id));
        }

        if (this.can_create_right == null) {
            this.can_create_right = await ModuleAccessPolicy.getInstance().testAccess(
                ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, this.checklist_shared_module.checklistitem_type_id));
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

        let self = this;
        let promises = [];

        let checklistitems: { [id: number]: ICheckListItem } = {};
        let filters = cloneDeep(this.get_active_field_filters);
        if (!filters[self.checklist_shared_module.checklistitem_type_id]) {
            filters[self.checklist_shared_module.checklistitem_type_id] = {};
        }
        filters = ContextFilterHandler.getInstance().clean_context_filters_for_request(filters);

        promises.push((async () => {

            let filter = new ContextFilterVO();
            filter.field_id = 'checklist_id';
            filter.vo_type = self.checklist_shared_module.checklistitem_type_id;
            filter.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS;
            filter.param_numeric = self.checklist.id;

            filters[self.checklist_shared_module.checklistitem_type_id]['checklist_id'] =
                ContextFilterHandler.getInstance().add_context_filter_to_tree(
                    filters[self.checklist_shared_module.checklistitem_type_id]['checklist_id'],
                    filter);

            filter = new ContextFilterVO();
            filter.field_id = 'archived';
            filter.vo_type = self.checklist_shared_module.checklistitem_type_id;
            filter.filter_type = ContextFilterVO.TYPE_BOOLEAN_FALSE_ALL;

            filters[self.checklist_shared_module.checklistitem_type_id]['archived'] =
                ContextFilterHandler.getInstance().add_context_filter_to_tree(
                    filters[self.checklist_shared_module.checklistitem_type_id]['archived'],
                    filter);

            let sort_by = new SortByVO();
            sort_by.field_id = 'id';
            sort_by.sort_asc = false;
            sort_by.vo_type = self.checklist_shared_module.checklistitem_type_id;

            let items: ICheckListItem[] = await ModuleContextFilter.getInstance().query_vos_from_active_filters<ICheckListItem>(
                self.checklist_shared_module.checklistitem_type_id,
                filters,
                this.dashboard.api_type_ids,
                this.pagination_pagesize,
                this.pagination_offset,
                sort_by
            );
            checklistitems = (items && items.length) ? VOsTypesManager.getInstance().vosArray_to_vosByIds(items) : [];
        })());

        let checkpoints: { [id: number]: ICheckPoint } = {};
        promises.push((async () => {
            checkpoints = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVosByRefFieldIds<ICheckPoint>(
                self.checklist_shared_module.checkpoint_type_id, 'checklist_id', [self.checklist.id]));
        })());

        await Promise.all(promises);

        self.checklistitems = checklistitems;
        self.checkpoints = checkpoints;

        await this.checklist_controller.component_hook_onAsyncLoading(
            this.getStoredDatas, this.storeDatas, this.checklist, this.checklistitems, this.checkpoints);

        this.infos_cols_labels = this.checklist_controller.get_infos_cols_labels();


        this.pagination_count = await ModuleContextFilter.getInstance().query_vos_count_from_active_filters(
            self.checklist_shared_module.checklistitem_type_id,
            filters,
            this.dashboard.api_type_ids);

        this.loaded_once = true;
        this.is_busy = false;
    }

    private async refresh() {
        AjaxCacheClientController.getInstance().invalidateUsingURLRegexp(new RegExp('.*' + ModuleContextFilter.APINAME_get_filtered_datatable_rows));
        AjaxCacheClientController.getInstance().invalidateUsingURLRegexp(new RegExp('.*' + ModuleContextFilter.APINAME_query_rows_count_from_active_filters));
        await this.throttled_update_visible_options();
    }

    @Watch('widget_options', { immediate: true })
    private async onchange_widget_options() {

        await this.throttled_update_visible_options();
    }

    get title_name_code_text() {
        if (!this.widget_options) {
            return null;
        }
        return this.widget_options.title_name_code_text;
    }

    get widget_options(): ChecklistWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: ChecklistWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as ChecklistWidgetOptions;
                options = options ? new ChecklistWidgetOptions(
                    options.page_widget_id, options.limit, options.checklist_id,
                    options.delete_all_button, options.create_button, options.refresh_button, options.export_button) : null;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
    }

    private async confirm_delete_all() {
        let self = this;

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

    private async openmodal(selected_checklist_item: ICheckListItem, selected_checkpoint: ICheckPoint) {
        this.get_Checklistitemmodalcomponent.openmodal(this.checklist, selected_checklist_item, selected_checkpoint, this.ordered_checkpoints);
    }
}