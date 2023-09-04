import { Prop, Watch } from 'vue-property-decorator';
import Component from 'vue-class-component';
import { cloneDeep } from 'lodash';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import SupervisionTypeWidgetManager from '../../../../../../../shared/modules/DashboardBuilder/manager/SupervisionTypeWidgetManager';
import SupervisionWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/SupervisionWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import TableColumnDescVO from '../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import WeightHandler from '../../../../../../../shared/tools/WeightHandler';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import TableWidgetColumnsOptionsComponent from '../../table_widget/options/columns/TableWidgetColumnsOptionsComponent';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../../DashboardBuilderWidgetsController';
import './SupervisionWidgetOptionsComponent.scss';

@Component({
    template: require('./SupervisionWidgetOptionsComponent.pug'),
    components: {
        Tablewidgetcolumnsoptionscomponent: TableWidgetColumnsOptionsComponent,
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class SupervisionWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private next_update_options: SupervisionWidgetOptionsVO = null;

    // Update options
    private throttled_update_options = ThrottleHelper.getInstance().declare_throttle_without_args(
        this.update_options.bind(this),
        50,
        { leading: false, trailing: true }
    );

    private supervision_api_type_ids: string[] = [];
    private refresh_button: boolean = true;
    private auto_refresh: boolean = true;
    private show_bulk_edit: boolean = true;
    private limit: number = 100;
    private auto_refresh_seconds: number = 30;

    private supervision_select_options: string[] = [];

    @Watch('page_widget', { immediate: true })
    private async onchange_page_widget() {

        this.supervision_select_options = SupervisionTypeWidgetManager.load_supervision_api_type_ids_by_dashboard(this.dashboard);

        this.initialize();
    }

    @Watch('supervision_api_type_ids')
    private async onchange_supervision_api_type_ids() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.supervision_api_type_ids != this.next_update_options.supervision_api_type_ids) {
            this.next_update_options.supervision_api_type_ids = this.supervision_api_type_ids;

            this.throttled_update_options();
        }
    }

    @Watch('limit')
    private async onchange_limit() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.limit != this.next_update_options.limit) {
            this.next_update_options.limit = this.limit;

            this.throttled_update_options();
        }
    }

    @Watch('auto_refresh_seconds')
    private async onchange_auto_refresh_seconds() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.auto_refresh_seconds != this.next_update_options.auto_refresh_seconds) {
            this.next_update_options.auto_refresh_seconds = this.auto_refresh_seconds;

            this.throttled_update_options();
        }
    }

    @Watch('show_bulk_edit')
    private async onchange_show_bulk_edit() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.show_bulk_edit != this.next_update_options.show_bulk_edit) {
            this.next_update_options.show_bulk_edit = this.show_bulk_edit;

            this.throttled_update_options();
        }
    }

    private initialize() {
        if ((!this.page_widget) || (!this.widget_options)) {
            if (!!this.supervision_api_type_ids) {
                this.supervision_api_type_ids = [];
            }

            if (!!this.auto_refresh_seconds) {
                this.auto_refresh_seconds = 30;
            }

            if (!!this.limit) {
                this.limit = 100;
            }

            if (!this.auto_refresh) {
                this.auto_refresh = true;
            }

            if (!this.show_bulk_edit) {
                this.show_bulk_edit = true;
            }

            if (!this.refresh_button) {
                this.refresh_button = true;
            }
            return;
        }

        if (this.supervision_api_type_ids != this.widget_options.supervision_api_type_ids) {
            this.supervision_api_type_ids = this.widget_options.supervision_api_type_ids;
        }

        if (this.limit != this.widget_options.limit) {
            this.limit = this.widget_options.limit;
        }

        if (this.auto_refresh != this.widget_options.auto_refresh) {
            this.auto_refresh = this.widget_options.auto_refresh;
        }

        if (this.refresh_button != this.widget_options.refresh_button) {
            this.refresh_button = this.widget_options.refresh_button;
        }

        if (this.auto_refresh_seconds != this.widget_options.auto_refresh_seconds) {
            this.auto_refresh_seconds = this.widget_options.auto_refresh_seconds;
        }

        if (this.show_bulk_edit != this.widget_options.show_bulk_edit) {
            this.show_bulk_edit = this.widget_options.show_bulk_edit;
        }
    }

    private supervision_select_label(api_type_id: string): string {
        return this.label('supervision_widget_component.' + api_type_id);
    }

    private get_default_options(): SupervisionWidgetOptionsVO {
        return new SupervisionWidgetOptionsVO([], true, 30);
    }

    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }

        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);

        let name = VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets)[this.page_widget.widget_id].name;
        let get_selected_fields = DashboardBuilderWidgetsController.getInstance().widgets_get_selected_fields[name];
        this.set_selected_fields(get_selected_fields ? get_selected_fields(this.page_widget) : {});
    }

    private async switch_refresh_button() {
        this.refresh_button = !this.refresh_button;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.refresh_button != this.refresh_button) {
            this.next_update_options.refresh_button = this.refresh_button;
            this.throttled_update_options();
        }
    }

    private async switch_auto_refresh() {
        this.auto_refresh = !this.auto_refresh;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.auto_refresh != this.auto_refresh) {
            this.next_update_options.auto_refresh = this.auto_refresh;
            this.throttled_update_options();
        }
    }

    private async switch_show_bulk_edit() {
        this.show_bulk_edit = !this.show_bulk_edit;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.show_bulk_edit != this.show_bulk_edit) {
            this.next_update_options.show_bulk_edit = this.show_bulk_edit;
            this.throttled_update_options();
        }
    }

    /**
     * handle_columns_changes
     *  - Handle columns changes
     *
     * @param {any[]} columns
     */
    private async handle_columns_changes(columns: any[]) {
        this.next_update_options = cloneDeep(this.widget_options);
        this.next_update_options.columns = columns;

        this.throttled_update_options();
    }

    get title_name_code_text(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    get default_title_translation(): string {
        return 'Supervision#' + this.page_widget.id;
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

    get columns(): TableColumnDescVO[] {
        const options: SupervisionWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.columns)) {
            return null;
        }

        let res: TableColumnDescVO[] = [];

        for (const i in options.columns) {
            const column = options.columns[i];

            if (column.readonly == null) {
                column.readonly = true;
            }
            if (column.column_width == null) {
                column.column_width = 0;
            }
            if (column.exportable == null) {
                column.exportable = (column.type != TableColumnDescVO.TYPE_crud_actions);
            }
            if (column.hide_from_table == null) {
                column.hide_from_table = false;
            }
            if (column.can_filter_by == null) {
                column.can_filter_by = column.readonly && (
                    (column.type != TableColumnDescVO.TYPE_crud_actions) ||
                    (column.type != TableColumnDescVO.TYPE_vo_field_ref));
            }

            res.push(new TableColumnDescVO().from(column));
        }

        WeightHandler.getInstance().sortByWeight(res);

        return res;
    }
}