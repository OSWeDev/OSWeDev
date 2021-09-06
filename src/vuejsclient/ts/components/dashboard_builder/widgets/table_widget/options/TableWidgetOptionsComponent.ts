import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import TableColumnDescVO from '../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import VOsTypesManager from '../../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import TableWidgetColumnOptionsComponent from './column/TableWidgetColumnOptionsComponent';
import TableWidgetOptions from './TableWidgetOptions';
import './TableWidgetOptionsComponent.scss';

@Component({
    template: require('./TableWidgetOptionsComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Tablewidgetcolumnoptionscomponent: TableWidgetColumnOptionsComponent
    }
})
export default class TableWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private next_update_options: TableWidgetOptions = null;
    private throttled_update_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false });

    private crud_api_type_id_selected: string = null;

    get crud_api_type_id_select_options(): string[] {
        return this.dashboard.api_type_ids;
    }

    private crud_api_type_id_select_label(api_type_id: string): string {
        return this.t(VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id].label.code_text);
    }

    @Watch('crud_api_type_id_selected')
    private async onchange_crud_api_type_id_selected() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new TableWidgetOptions(null, this.page_widget.id, null);
        }

        if (this.next_update_options.crud_api_type_id != this.crud_api_type_id_selected) {
            this.next_update_options.crud_api_type_id = this.crud_api_type_id_selected;
            await this.throttled_update_options();
        }
    }

    private async changed_columns() {
        await ModuleDAO.getInstance().insertOrUpdateVOs(this.columns);
        await this.throttled_update_options();
    }

    private async remove_column(del_column: TableColumnDescVO) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.columns) {
            return null;
        }

        let i = this.next_update_options.columns.findIndex((column) => {
            return column.id == del_column.id;
        });

        if (i < 0) {
            return null;
        }

        await ModuleDAO.getInstance().deleteVOs([del_column]);
        this.next_update_options.columns.splice(i, 1);

        await this.throttled_update_options();
    }

    private async add_column(add_column: TableColumnDescVO) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new TableWidgetOptions(null, this.page_widget.id, null);
        }

        let i = -1;
        let found = false;

        if ((!!add_column) && (!!this.next_update_options.columns)) {
            i = this.next_update_options.columns.findIndex((ref_elt) => {
                return ref_elt.id == add_column.id;
            });
        }

        if (i < 0) {
            i = 0;
            add_column.weight = 0;
        } else {
            found = true;
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(add_column);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            ConsoleHandler.getInstance().error("Failed insert new column");
            return null;
        }
        if (!add_column.id) {
            add_column.id = insertOrDeleteQueryResult.id;
        }

        if (!found) {
            if (!this.next_update_options.columns) {
                this.next_update_options.columns = [];
            }
            this.next_update_options.columns.push(add_column);
        }

        await this.throttled_update_options();
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

    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        this.set_page_widget(this.page_widget);
    }

    get title_name_code_text(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.title_name_code_text;
    }

    get default_title_translation(): string {
        return null;
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