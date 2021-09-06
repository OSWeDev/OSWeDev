import { borderTopRightRadius } from 'html2canvas/dist/types/css/property-descriptors/border-radius';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleContextFilter from '../../../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import SortByVO from '../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import DatatableField from '../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import SimpleDatatableField from '../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import VarDatatableField from '../../../../../../shared/modules/DAO/vos/datatable/VarDatatableField';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import TableColumnDescVO from '../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import DatatableComponentField from '../../../datatable/component/fields/DatatableComponentField';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import TableWidgetOptions from './options/TableWidgetOptions';
import TablePaginationComponent from './pagination/TablePaginationComponent';
import './TableWidgetComponent.scss';

@Component({
    template: require('./TableWidgetComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Datatablecomponentfield: DatatableComponentField,
        Tablepaginationcomponent: TablePaginationComponent
    }
})
export default class TableWidgetComponent extends VueComponentBase {

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

    private throttled_update_visible_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_visible_options.bind(this), 300, { leading: false });

    private pagination_count: number = 0;
    private pagination_offset: number = 0;
    private pagination_pagesize: number = 100;

    private order_asc_on_id: number = null;
    private order_desc_on_id: number = null;

    get crud_activated_api_type(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.crud_api_type_id;
    }

    private sort_by(vo_field_ref: VOFieldRefVO) {
        if (!vo_field_ref) {
            this.order_asc_on_id = null;
            this.order_desc_on_id = null;
            this.update_visible_options();
            return;
        }

        if ((this.order_asc_on_id != vo_field_ref.id) && (this.order_desc_on_id != vo_field_ref.id)) {
            this.order_asc_on_id = vo_field_ref.id;
            this.order_desc_on_id = null;
            this.update_visible_options();
            return;
        }

        if (this.order_asc_on_id != vo_field_ref.id) {
            this.order_asc_on_id = vo_field_ref.id;
            this.order_desc_on_id = null;
            this.update_visible_options();
            return;
        }

        this.order_desc_on_id = vo_field_ref.id;
        this.order_asc_on_id = null;
        this.update_visible_options();
        return;
    }

    private async change_offset(new_offset: number) {
        if (new_offset != this.pagination_offset) {
            this.pagination_offset = new_offset;
            await this.throttled_update_visible_options();
        }
    }

    get columns(): TableColumnDescVO[] {
        let options: TableWidgetOptions = this.widget_options;

        if ((!options) || (!options.columns)) {
            return null;
        }

        let res: TableColumnDescVO[] = [];
        for (let i in options.columns) {
            res.push(Object.assign(new TableColumnDescVO(), options.columns[i]));
        }

        return res;
    }

    get fields(): { [column_id: number]: DatatableField<any, any> } {
        let res: { [column_id: number]: DatatableField<any, any> } = {};

        if (!this.widget_options) {
            return res;
        }

        for (let i in this.widget_options.columns) {
            let column: TableColumnDescVO = this.widget_options.columns[i];

            switch (column.type) {
                case TableColumnDescVO.TYPE_var_ref:
                    let var_data_field: VarDatatableField<any, any> = new VarDatatableField(column.id.toString(), column.var_id, column.filter_type, column.filter_additional_params, this.dashboard.id, column.translatable_name_code_text);
                    res[column.id] = var_data_field;
                    break;
                case TableColumnDescVO.TYPE_vo_field_ref:
                    let moduleTable = VOsTypesManager.getInstance().moduleTables_by_voType[column.api_type_id];
                    let field = moduleTable.get_field_by_id(column.field_id);
                    let data_field: SimpleDatatableField<any, any> = new SimpleDatatableField(field.field_id, field.field_label.code_text);
                    data_field.setModuleTable(moduleTable);
                    res[column.id] = data_field;
                    break;
                case TableColumnDescVO.TYPE_crud_actions:
                    todo
            }
        }

        return res;
    }

    @Watch('get_active_field_filters', { deep: true })
    private async onchange_active_field_filters() {
        await this.throttled_update_visible_options();
    }

    private async update_visible_options() {

        if (!this.widget_options) {
            this.data_rows = [];
            return;
        }

        if ((!this.widget_options.columns) || (!this.widget_options.columns.length)) {
            this.data_rows = [];
            return;
        }

        if (!this.fields) {
            this.data_rows = [];
            return;
        }

        if (!this.dashboard.api_type_ids) {
            this.data_rows = [];
            return;
        }

        let api_type_ids: string[] = [];
        let field_ids: string[] = [];
        let res_field_aliases: string[] = [];

        let sort_by: SortByVO = null;

        if (this.fields && (
            (this.order_asc_on_id && this.fields[this.order_asc_on_id]) ||
            (this.order_desc_on_id && this.fields[this.order_desc_on_id]))) {

            let field = this.order_asc_on_id ? this.fields[this.order_asc_on_id] : this.fields[this.order_desc_on_id];

            sort_by = new SortByVO();
            sort_by.vo_type = field.moduleTable.vo_type;
            sort_by.field_id = field.module_table_field_id;
            sort_by.sort_asc = !!this.order_asc_on_id;
        }


        for (let i in this.fields) {
            let field = this.fields[i];

            if (this.dashboard.api_type_ids.indexOf(field.moduleTable.vo_type) < 0) {
                ConsoleHandler.getInstance().warn('get_filtered_datatable_rows: asking for datas from types not included in request:' +
                    field.datatable_field_uid + ':' + field.moduleTable.vo_type);
                this.data_rows = [];
                return;
            }

            api_type_ids.push(field.moduleTable.vo_type);
            field_ids.push(field.module_table_field_id);
            res_field_aliases.push(field.datatable_field_uid);
        }
        this.data_rows = await ModuleContextFilter.getInstance().get_filtered_datatable_rows(
            api_type_ids,
            field_ids,
            this.get_active_field_filters,
            this.dashboard.api_type_ids,
            this.pagination_pagesize,
            this.pagination_offset,
            sort_by,
            res_field_aliases);

        this.pagination_count = await ModuleContextFilter.getInstance().query_rows_count_from_active_filters(
            api_type_ids,
            field_ids,
            this.get_active_field_filters,
            this.dashboard.api_type_ids);
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

    get widget_options(): TableWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: TableWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as TableWidgetOptions;
                options = new TableWidgetOptions(options.columns, options.page_widget_id, options.crud_api_type_id);
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
    }
}