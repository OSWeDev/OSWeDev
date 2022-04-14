import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ContextFilterHandler from '../../../../../../shared/modules/ContextFilter/ContextFilterHandler';
import ModuleContextFilter from '../../../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryFieldVO from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import ContextQueryVO from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import CRUD from '../../../../../../shared/modules/DAO/vos/CRUD';
import DatatableField from '../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import TableColumnDescVO from '../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../../shared/modules/ModuleTable';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import AjaxCacheClientController from '../../../../modules/AjaxCache/AjaxCacheClientController';
import DatatableRowController from '../../../datatable/component/DatatableRowController';
import DatatableComponentField from '../../../datatable/component/fields/DatatableComponentField';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import TablePaginationComponent from '../table_widget/pagination/TablePaginationComponent';
import './BulkOpsWidgetComponent.scss';
import BulkOpsWidgetOptions from './options/BulkOpsWidgetOptions';

@Component({
    template: require('./BulkOpsWidgetComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Datatablecomponentfield: DatatableComponentField,
        Tablepaginationcomponent: TablePaginationComponent
    }
})
export default class BulkOpsWidgetComponent extends VueComponentBase {

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

    private data_rows: any[] = [];

    private pagination_count: number = 0;
    private pagination_offset: number = 0;

    private selected_rows: any[] = [];

    private field_id_selected: string = null;

    private throttled_update_visible_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_visible_options.bind(this), 300, { leading: false, trailing: true });

    private loaded_once: boolean = false;
    private is_busy: boolean = false;
    private has_access: boolean = false;

    private new_value: any = null;
    private editable_item: any = null;

    private data_rows_after: any[] = [];

    private onchangevo(vo, field, field_value) {
        if (!this.editable_item) {
            return;
        }

        this.new_value = field_value;
        this.editable_item[this.field_id_selected] = field_value;
    }

    get field() {
        if ((!this.moduletable) || (!this.field_id_selected)) {
            return null;
        }

        return this.moduletable.get_field_by_id(this.field_id_selected);
    }

    get editable_field() {
        return this.field ? CRUD.get_dt_field(this.field).setModuleTable(this.moduletable) : null;
    }

    get moduletable(): ModuleTable<any> {
        if (!this.api_type_id) {
            return null;
        }

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[this.api_type_id];
        return moduletable;
    }

    get field_id_select_options(): string[] {
        let res: string[] = [];

        if (!this.moduletable) {
            return [];
        }

        let fields = this.moduletable.get_fields();
        fields.forEach((field) => field.is_readonly ? null : res.push(field.field_id));
        return res;
    }

    private field_id_select_label(field_id: string): string {
        return this.fields_labels_by_id ? this.fields_labels_by_id[field_id] : null;
    }

    get fields_labels_by_id(): { [field_id: string]: string } {
        if (!this.moduletable) {
            return {};
        }

        let res: { [field_id: string]: string } = {};
        let fields = this.moduletable.get_fields();

        for (let i in fields) {
            let field = fields[i];

            if (field.is_readonly) {
                continue;
            }

            res[field.field_id] = this.t(field.field_label.code_text);
        }

        return res;
    }

    private mounted() {

        this.editable_item = this.moduletable ? this.moduletable.voConstructor() : null;
        this.stopLoading();
    }

    @Watch('api_type_id', { immediate: true })
    private async onchange_api_type_id() {
        if (!this.api_type_id) {
            this.has_access = false;
            return;
        }

        this.has_access = await ModuleAccessPolicy.getInstance().testAccess(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, this.api_type_id));
    }

    get api_type_id(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.api_type_id;
    }

    get columns(): TableColumnDescVO[] {
        if ((!this.moduletable) || (!this.field_id_selected)) {
            return null;
        }

        let res: TableColumnDescVO[] = [];

        if (this.moduletable.default_label_field && (this.moduletable.default_label_field.field_id != this.field_id_selected)) {

            let label_col = new TableColumnDescVO();
            label_col.api_type_id = this.api_type_id;
            label_col.field_id = this.moduletable.default_label_field.field_id;
            label_col.type = TableColumnDescVO.TYPE_vo_field_ref;
            label_col.id = 1;
            label_col.readonly = true;
            label_col.column_width = 0;
            res.push(label_col);
        }

        let selected_col = new TableColumnDescVO();
        selected_col.api_type_id = this.api_type_id;
        selected_col.field_id = this.field_id_selected;
        selected_col.type = TableColumnDescVO.TYPE_vo_field_ref;
        selected_col.id = 2;
        selected_col.readonly = true;
        selected_col.column_width = 0;
        res.push(selected_col);

        return res;
    }

    get fields(): { [column_id: number]: DatatableField<any, any> } {
        let res: { [column_id: number]: DatatableField<any, any> } = {};

        if (!this.moduletable) {
            return res;
        }

        if (!this.field_id_selected) {
            return res;
        }

        let data_field: DatatableField<any, any> = null;
        if (this.moduletable.default_label_field && (this.moduletable.default_label_field.field_id != this.field_id_selected)) {

            data_field = CRUD.get_dt_field(this.moduletable.default_label_field);
            if (data_field['set_translatable_title']) {
                data_field['set_translatable_title'](this.moduletable.default_label_field.field_label.code_text);
            }
            data_field.setModuleTable(this.moduletable).auto_update_datatable_field_uid_with_vo_type();
            res[1] = data_field;
        }

        let field = this.moduletable.get_field_by_id(this.field_id_selected);
        if (!field) {
            return null;
        }
        data_field = CRUD.get_dt_field(field);
        if (data_field['set_translatable_title']) {
            data_field['set_translatable_title'](field.field_label.code_text);
        }
        data_field.setModuleTable(this.moduletable).auto_update_datatable_field_uid_with_vo_type();
        res[2] = data_field;

        return res;
    }

    @Watch('field_id_selected')
    @Watch('get_active_field_filters', { deep: true })
    private async onchange_active_field_filters() {
        this.is_busy = true;

        await this.throttled_update_visible_options();
    }

    @Watch('data_rows')
    @Watch('new_value')
    private async onchange_data_rows() {

        if ((!this.data_rows) || (!this.field_id_selected)) {
            this.data_rows_after = [];
            return;
        }

        let res: any[] = [];

        for (let i in this.data_rows) {
            let row = this.data_rows[i];
            let cloned_raw = cloneDeep(row);
            let cloned_res = cloneDeep(row);
            cloned_raw[this.field_id_selected] = this.new_value;
            await DatatableRowController.getInstance().get_datatable_row_field_data_async(cloned_raw, cloned_res, this.editable_field, null);
            res.push(cloned_res);
        }

        this.data_rows_after = res;
    }

    private async update_visible_options() {

        this.is_busy = true;

        if (!this.widget_options) {
            this.data_rows = [];
            this.loaded_once = true;
            this.is_busy = false;
            return;
        }

        if ((!this.widget_options.api_type_id) || (!this.field_id_selected)) {
            this.data_rows = [];
            this.loaded_once = true;
            this.is_busy = false;
            return;
        }

        if ((!this.fields) || (!ObjectHandler.getInstance().hasAtLeastOneAttribute(this.fields))) {
            this.data_rows = [];
            this.loaded_once = true;
            this.is_busy = false;
            return;
        }

        if (!this.dashboard.api_type_ids) {
            this.data_rows = [];
            this.loaded_once = true;
            this.is_busy = false;
            return;
        }

        let query: ContextQueryVO = new ContextQueryVO();
        query.base_api_type_id = null;
        query.active_api_type_ids = this.dashboard.api_type_ids;
        query.fields = [];
        query.filters = ContextFilterHandler.getInstance().get_filters_from_active_field_filters(
            ContextFilterHandler.getInstance().clean_context_filters_for_request(this.get_active_field_filters)
        );
        query.limit = this.widget_options.limit;
        query.offset = this.pagination_offset;

        for (let i in this.fields) {
            let field = this.fields[i];

            if ((field.type == DatatableField.VAR_FIELD_TYPE) ||
                (field.type == DatatableField.SELECT_BOX_FIELD_TYPE)) {
                continue;
            }

            if (this.dashboard.api_type_ids.indexOf(field.moduleTable.vo_type) < 0) {
                ConsoleHandler.getInstance().warn('select_datatable_rows: asking for datas from types not included in request:' +
                    field.datatable_field_uid + ':' + field.moduleTable.vo_type);
                this.data_rows = [];
                this.loaded_once = true;
                this.is_busy = false;
                return;
            }

            if (!query.base_api_type_id) {
                query.base_api_type_id = field.moduleTable.vo_type;
            }

            query.fields.push(new ContextQueryFieldVO(field.moduleTable.vo_type, field.module_table_field_id, field.datatable_field_uid));
        }


        let rows = await ModuleContextFilter.getInstance().select_datatable_rows(query);

        let data_rows = [];
        let promises = [];
        for (let i in rows) {
            let row = rows[i];

            let resData: IDistantVOBase = {
                id: row.id,
                _type: row._type
            };
            for (let j in this.fields) {
                let field = this.fields[j];

                promises.push(DatatableRowController.getInstance().get_datatable_row_field_data_async(row, resData, field, null));
            }
            data_rows.push(resData);
        }
        await Promise.all(promises);

        this.data_rows = data_rows;

        let context_query = cloneDeep(query);
        context_query.limit = 0;
        context_query.offset = 0;
        context_query.sort_by = null;
        this.pagination_count = await ModuleContextFilter.getInstance().select_count(context_query);

        this.loaded_once = true;
        this.is_busy = false;
    }

    get pagination_pagesize() {
        if (!this.widget_options) {
            return 0;
        }

        return this.widget_options.limit;
    }

    private async change_offset(offset: number) {
        this.pagination_offset = offset;
        await this.throttled_update_visible_options();
    }

    private async refresh() {
        AjaxCacheClientController.getInstance().invalidateUsingURLRegexp(new RegExp('.*' + ModuleContextFilter.APINAME_select_datatable_rows));
        AjaxCacheClientController.getInstance().invalidateUsingURLRegexp(new RegExp('.*' + ModuleContextFilter.APINAME_select_count));
        await this.throttled_update_visible_options();
    }

    @Watch('widget_options', { immediate: true })
    private async onchange_widget_options() {

        await this.throttled_update_visible_options();
    }

    private async confirm_bulkops() {
        let self = this;
        if ((!self.field_id_selected) || (!self.dashboard.api_type_ids) || (!self.api_type_id) || (!self.moduletable)) {
            self.snotify.error(self.label('BulkOpsWidgetComponent.bulkops.failed'));
            return;
        }

        self.snotify.confirm(self.label('BulkOpsWidgetComponent.bulkops.confirmation.body'), self.label('BulkOpsWidgetComponent.bulkops.confirmation.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
                        self.snotify.async(self.label('BulkOpsWidgetComponent.bulkops.start'), () =>
                            new Promise(async (resolve, reject) => {

                                try {

                                    let new_value = self.moduletable.default_get_field_api_version(self.new_value, self.moduletable.get_field_by_id(self.field_id_selected));

                                    let context_query: ContextQueryVO = new ContextQueryVO();
                                    context_query.base_api_type_id = self.api_type_id;
                                    context_query.active_api_type_ids = self.dashboard.api_type_ids;
                                    context_query.filters = ContextFilterHandler.getInstance().get_filters_from_active_field_filters(self.get_active_field_filters);

                                    await ModuleContextFilter.getInstance().update_vos(
                                        context_query,
                                        self.field_id_selected, new_value);
                                    await self.throttled_update_visible_options();
                                    resolve({
                                        body: self.label('BulkOpsWidgetComponent.bulkops.ok'),
                                        config: {
                                            timeout: 10000,
                                            showProgressBar: true,
                                            closeOnClick: false,
                                            pauseOnHover: true,
                                        },
                                    });

                                    return;
                                } catch (error) {
                                    ConsoleHandler.getInstance().error(error);
                                    reject({
                                        body: self.label('BulkOpsWidgetComponent.bulkops.failed'),
                                        config: {
                                            timeout: 10000,
                                            showProgressBar: true,
                                            closeOnClick: false,
                                            pauseOnHover: true,
                                        },
                                    });
                                }
                            })
                        );
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

    get title_name_code_text() {
        if (!this.widget_options) {
            return null;
        }
        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    get widget_options(): BulkOpsWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: BulkOpsWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as BulkOpsWidgetOptions;
                options = options ? new BulkOpsWidgetOptions(options.api_type_id, options.limit) : null;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
    }
}