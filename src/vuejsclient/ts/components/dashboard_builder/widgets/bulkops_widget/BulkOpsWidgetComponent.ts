import { cloneDeep, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleContextFilter from '../../../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVOHandler from '../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextQueryFieldVO from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DAOController from '../../../../../../shared/modules/DAO/DAOController';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import CRUD from '../../../../../../shared/modules/DAO/vos/CRUD';
import DatatableField from '../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import FieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import FieldValueFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import TableColumnDescVO from '../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import VOsTypesManager from '../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import ObjectHandler, { reflect } from '../../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../../shared/tools/PromiseTools';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import AjaxCacheClientController from '../../../../modules/AjaxCache/AjaxCacheClientController';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import DatatableComponentField from '../../../datatable/component/fields/DatatableComponentField';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import TablePaginationComponent from '../table_widget/pagination/TablePaginationComponent';
import './BulkOpsWidgetComponent.scss';
import BulkOpsWidgetOptions from './options/BulkOpsWidgetOptions';
import ModuleTableVO from '../../../../../../shared/modules/DAO/vos/ModuleTableVO';
import ModuleTableFieldController from '../../../../../../shared/modules/DAO/ModuleTableFieldController';
import ModuleTableController from '../../../../../../shared/modules/DAO/ModuleTableController';
import APIControllerWrapper from '../../../../../../shared/modules/API/APIControllerWrapper';
import ModuleTableFieldVO from '../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';

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
    private get_active_field_filters: FieldFiltersVO;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    private data_rows: any[] = [];

    private pagination_count: number = 0;
    private pagination_offset: number = 0;

    private selected_rows: any[] = [];

    private field_id_selected: string = null;

    private throttled_update_visible_options = ThrottleHelper.declare_throttle_without_args(
        'BulkOpsWidgetComponent.throttled_update_visible_options',
        this.update_visible_options.bind(this), 300, false);

    private loaded_once: boolean = false;
    private is_busy: boolean = false;
    private has_access: boolean = false;

    private new_value: any = null;
    private editable_item: any = null;

    private data_rows_after: any[] = [];
    private last_calculation_cpt: number = 0;
    private old_widget_options: BulkOpsWidgetOptions = null;

    get tablecolumn_field_id() {
        if (!this.field) {
            return null;
        }

        return this.api_type_id + '___' + this.field_id_selected;
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
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as BulkOpsWidgetOptions;
                options = options ? new BulkOpsWidgetOptions(options.api_type_id, options.limit) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    get get_datatable_row_editable_field() {
        /**
         * on force l'id pour être conforme au tablecolumndesc qu'on a dans les dbtables du widget
         */
        return this.field ? CRUD.get_dt_field(this.field).setModuleTable(this.moduletable).auto_update_datatable_field_uid_with_vo_type() : null;
    }

    get moduletable(): ModuleTableVO {
        if (!this.api_type_id) {
            return null;
        }

        const moduletable = ModuleTableController.module_tables_by_vo_type[this.api_type_id];
        return moduletable;
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

        const res: TableColumnDescVO[] = [];

        if (this.moduletable.default_label_field && (this.moduletable.default_label_field.field_id != this.field_id_selected)) {

            const label_col = new TableColumnDescVO();
            label_col.api_type_id = this.api_type_id;
            label_col.field_id = this.moduletable.default_label_field.field_id;
            label_col.type = TableColumnDescVO.TYPE_vo_field_ref;
            label_col.id = 1;
            label_col.readonly = true;
            label_col.column_width = 0;
            label_col.kanban_column = false;
            label_col.custom_label = this.moduletable.default_label_field.field_label.code_text ? this.t(this.moduletable.default_label_field.field_label.code_text) : this.moduletable.default_label_field.field_id;
            res.push(label_col);
        }

        const selected_field = this.moduletable.get_field_by_id(this.field_id_selected);
        const selected_col = new TableColumnDescVO();
        selected_col.api_type_id = this.api_type_id;
        selected_col.field_id = this.field_id_selected;
        selected_col.type = TableColumnDescVO.TYPE_vo_field_ref;
        selected_col.id = 2;
        selected_col.readonly = true;
        selected_col.column_width = 0;
        selected_col.kanban_column = false;
        selected_col.custom_label = selected_field.field_label.code_text ? this.t(selected_field.field_label.code_text) : this.field_id_selected;
        res.push(selected_col);

        return res;
    }

    get fields(): { [column_id: number]: DatatableField<any, any> } {
        const res: { [column_id: number]: DatatableField<any, any> } = {};

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

        const field = this.moduletable.get_field_by_id(this.field_id_selected);
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

    get columns_by_field_id(): { [datatable_field_uid: string]: TableColumnDescVO } {
        if (!this.columns) {
            return null;
        }

        const res: { [datatable_field_uid: string]: TableColumnDescVO } = {};

        for (const i in this.columns) {
            const col = this.columns[i];
            res[col.datatable_field_uid] = col;
        }

        return res;
    }

    get field_id_select_options(): string[] {
        const res: string[] = [];

        if (!this.moduletable) {
            return [];
        }

        const fields = this.moduletable.get_fields();
        fields.forEach((field) => field.is_readonly ? null : res.push(field.field_id));
        return res;
    }

    get pagination_pagesize() {
        if (!this.widget_options) {
            return 0;
        }

        return this.widget_options.limit;
    }

    get fields_labels_by_id(): { [field_id: string]: string } {
        if (!this.moduletable) {
            return {};
        }

        const res: { [field_id: string]: string } = {};
        const fields = this.moduletable.get_fields();

        for (const i in fields) {
            const field = fields[i];

            if (field.is_readonly) {
                continue;
            }

            res[field.field_id] = this.t(field.field_label.code_text);
        }

        return res;
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

    @Watch('api_type_id', { immediate: true })
    private async onchange_api_type_id() {
        if (!this.api_type_id) {
            this.has_access = false;
            return;
        }

        this.has_access = await ModuleAccessPolicy.getInstance().testAccess(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, this.api_type_id));
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

        const res: any[] = [];

        for (const i in this.data_rows) {
            const row = this.data_rows[i];
            const cloned_raw = cloneDeep(row);
            // FIXME : très bizarre à ce niveau mais on doit écraser à la fois la raw et la valeur normale a priori pour que ça passe... vraiment un truc à revoir sur la gestion des trads de colonnes
            cloned_raw[this.get_datatable_row_editable_field.datatable_field_uid + '__raw'] = this.new_value;
            cloned_raw[this.get_datatable_row_editable_field.datatable_field_uid] = this.new_value;
            const cloned_res = cloneDeep(cloned_raw);
            await ContextFilterVOHandler.get_datatable_row_field_data_async(cloned_raw, cloned_res, this.get_datatable_row_editable_field, null);
            res.push(cloned_res);
        }

        this.data_rows_after = res;
    }

    private async update_visible_options() {

        const launch_cpt: number = (this.last_calculation_cpt + 1);

        this.last_calculation_cpt = launch_cpt;

        this.is_busy = true;

        if (
            (!this.widget_options) ||
            (!this.widget_options.api_type_id) ||
            (!this.field_id_selected) ||
            (!this.fields) ||
            (!ObjectHandler.hasAtLeastOneAttribute(this.fields)) ||
            (!this.get_dashboard_api_type_ids) ||
            (!this.get_dashboard_api_type_ids.length)
        ) {
            this.data_rows = [];
            this.loaded_once = true;
            this.is_busy = false;
            return;
        }

        const query_: ContextQueryVO = query(this.widget_options.api_type_id)
            .set_limit(this.widget_options.limit, this.pagination_offset)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
            ));

        FieldValueFilterWidgetManager.add_discarded_field_paths(query_, this.get_discarded_field_paths);

        for (const i in this.fields) {
            const field = this.fields[i];

            if ((field.type == DatatableField.VAR_FIELD_TYPE) ||
                (field.type == DatatableField.COMPONENT_FIELD_TYPE) ||
                (field.type == DatatableField.SELECT_BOX_FIELD_TYPE)) {
                continue;
            }

            if (this.get_dashboard_api_type_ids.indexOf(field.vo_type_id) < 0) {
                ConsoleHandler.warn('select_datatable_rows: asking for datas from types not included in request:' +
                    field.datatable_field_uid + ':' + field.vo_type_id);
                this.data_rows = [];
                this.loaded_once = true;
                this.is_busy = false;
                return;
            }

            if (!query_.base_api_type_id) {
                query_.base_api_type_id = field.vo_type_id;
            }

            query_.add_fields([new ContextQueryFieldVO(field.vo_type_id, field.module_table_field_id, field.datatable_field_uid)]);
        }

        const fields: { [datatable_field_uid: string]: DatatableField<any, any> } = {};
        for (const i in this.fields) {
            const field = this.fields[i];
            fields[field.datatable_field_uid] = field;
        }
        // On ajoute l'id pour bien récupérer une ligne par id, et pas jsute le group by des différentes valeurs qui existent
        if (!fields['id']) {
            query_.add_field('id', 'id', this.widget_options.api_type_id);
        }

        const data_rows = await ModuleContextFilter.instance.select_datatable_rows(query_, this.columns_by_field_id, fields);

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            return;
        }

        // const data_rows = [];
        // const promises = [];
        // for (const i in rows) {
        //     const row = rows[i];

        //     const resData: IDistantVOBase = {
        //         id: row.id,
        //         _type: this.widget_options.api_type_id,
        //     };
        //     for (const j in this.fields) {
        //         const field = this.fields[j];

        //         promises.push(ContextFilterVOHandler.get_datatable_row_field_data_async(row, resData, field, null));
        //     }
        //     data_rows.push(resData);
        // }
        // await all_promises(promises);

        // // Si je ne suis pas sur la dernière demande, je me casse
        // if (this.last_calculation_cpt != launch_cpt) {
        //     return;
        // }

        this.data_rows = data_rows;

        const context_query = cloneDeep(query_);
        context_query.set_limit(0, 0);
        context_query.set_sort(null);

        this.pagination_count = await ModuleContextFilter.instance
            .select_count(context_query);

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            return;
        }

        this.loaded_once = true;
        this.is_busy = false;
    }

    private async change_offset(offset: number) {
        this.pagination_offset = offset;
        await this.throttled_update_visible_options();
    }

    private async refresh() {
        AjaxCacheClientController.getInstance().invalidateUsingURLRegexp(new RegExp('.*' + APIControllerWrapper.get_api_name_from_module_function(ModuleContextFilter.instance.name, reflect<ModuleContextFilter>().select_datatable_rows)));
        AjaxCacheClientController.getInstance().invalidateUsingURLRegexp(new RegExp('.*' + APIControllerWrapper.get_api_name_from_module_function(ModuleContextFilter.instance.name, reflect<ModuleContextFilter>().select_count)));
        await this.throttled_update_visible_options();
    }

    private async confirm_bulkops() {
        const self = this;
        if ((!self.field_id_selected) || (!self.get_dashboard_api_type_ids) || (!self.api_type_id) || (!self.moduletable)) {
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

                                    const new_value = ModuleTableFieldController.translate_field_to_api(self.new_value, self.moduletable.get_field_by_id(self.field_id_selected), false);

                                    const context_query: ContextQueryVO = query(self.api_type_id).using(self.get_dashboard_api_type_ids).add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(self.get_active_field_filters));
                                    FieldValueFilterWidgetManager.add_discarded_field_paths(context_query, this.get_discarded_field_paths);

                                    await ModuleContextFilter.instance.update_vos(
                                        context_query, {
                                        [self.field_id_selected]: new_value
                                    });

                                    AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([self.api_type_id]);

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
                                    ConsoleHandler.error(error);
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

    private onchangevo(vo, field, field_value) {
        if (!this.editable_item) {
            return;
        }

        this.new_value = field_value;
        this.editable_item[this.tablecolumn_field_id] = field_value;
    }

    private field_id_select_label(field_id: string): string {
        return this.fields_labels_by_id ? this.fields_labels_by_id[field_id] : null;
    }

    private mounted() {

        this.editable_item = this.moduletable ? this.moduletable.voConstructor() : null;
        this.stopLoading();
    }

    private get_default_translation_for_column(column: TableColumnDescVO): string {
        if (!column) {
            return null;
        }

        if (column.custom_label) {
            return column.custom_label;
        }

        const field = this.moduletable.get_field_by_id(column.field_id);

        if (!field) {
            return null;
        }

        return this.t(field.field_label_translatable_code);
    }
}