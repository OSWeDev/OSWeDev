import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import TableColumnDescVO from '../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import VOsTypesManager from '../../../../../../../shared/modules/VOsTypesManager';
import { VueNestable, VueNestableHandle } from 'vue-nestable';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import TableWidgetColumnOptionsComponent from './column/TableWidgetColumnOptionsComponent';
import TableWidgetOptions from './TableWidgetOptions';
import './TableWidgetOptionsComponent.scss';
import { cloneDeep } from 'lodash';
import WeightHandler from '../../../../../../../shared/tools/WeightHandler';

@Component({
    template: require('./TableWidgetOptionsComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Tablewidgetcolumnoptionscomponent: TableWidgetColumnOptionsComponent,
        Vuenestable: VueNestable,
        Vuenestablehandle: VueNestableHandle,
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
    private vocus_button: boolean = false;
    private delete_button: boolean = false;

    private editable_columns: TableColumnDescVO[] = null;

    get crud_api_type_id_select_options(): string[] {
        return this.dashboard.api_type_ids;
    }

    private crud_api_type_id_select_label(api_type_id: string): string {
        return this.t(VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id].label.code_text);
    }

    @Watch('page_widget', { immediate: true })
    private onchange_page_widget() {
        if ((!this.page_widget) || (!this.widget_options)) {
            if (!!this.crud_api_type_id_selected) {
                this.crud_api_type_id_selected = null;
            }
            if (!!this.vocus_button) {
                this.vocus_button = false;
            }
            if (!!this.delete_button) {
                this.delete_button = true;
            }
            return;
        }

        if (this.crud_api_type_id_selected != this.widget_options.crud_api_type_id) {
            this.crud_api_type_id_selected = this.widget_options.crud_api_type_id;
        }

        if (this.vocus_button != this.widget_options.vocus_button) {
            this.vocus_button = this.widget_options.vocus_button;
        }
        if (this.delete_button != this.widget_options.delete_button) {
            this.delete_button = this.widget_options.delete_button;
        }
    }

    @Watch('crud_api_type_id_selected')
    private async onchange_crud_api_type_id_selected() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new TableWidgetOptions(null, this.page_widget.id, null, false, true);
        }

        if (this.next_update_options.crud_api_type_id != this.crud_api_type_id_selected) {
            this.next_update_options.crud_api_type_id = this.crud_api_type_id_selected;

            /**
             * Si on configure un crud_api_type_id_selected et qu'on a pas de colonne pour traiter les crud actions, on rajoute la colonne
             */

            if ((!!this.crud_api_type_id_selected) && ((!this.next_update_options.columns) || (!this.next_update_options.columns.find((column: TableColumnDescVO) => column.type == TableColumnDescVO.TYPE_crud_actions)))) {
                let crud_actions_column = new TableColumnDescVO();
                crud_actions_column.api_type_id = this.crud_api_type_id_selected;
                crud_actions_column.page_widget_id = this.page_widget.id;
                crud_actions_column.type = TableColumnDescVO.TYPE_crud_actions;
                crud_actions_column.weight = -1;
                await this.add_column(crud_actions_column);
                return;
            } else if (!!this.crud_api_type_id_selected) {
                // On check qu'on a le bon type
                let existing_column = this.next_update_options.columns.find((column: TableColumnDescVO) => column.type == TableColumnDescVO.TYPE_crud_actions);
                if (existing_column.api_type_id != this.crud_api_type_id_selected) {
                    existing_column.api_type_id = this.crud_api_type_id_selected;
                }
            }

            await this.throttled_update_options();
        }
    }

    private async changed_columns() {

        /**
         * On applique les nouveaux poids
         */
        for (let i in this.editable_columns) {
            let column = this.editable_columns[i];

            this.columns.find((c) => c.id == column.id).weight = parseInt(i.toString());
        }

        await ModuleDAO.getInstance().insertOrUpdateVOs(this.columns);
        this.next_update_options = this.widget_options;
        this.next_update_options.columns = this.columns;
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
            this.next_update_options = new TableWidgetOptions(null, this.page_widget.id, null, false, true);
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
            this.editable_columns = null;
            return null;
        }

        let res: TableColumnDescVO[] = [];
        for (let i in options.columns) {
            res.push(Object.assign(new TableColumnDescVO(), options.columns[i]));
        }
        WeightHandler.getInstance().sortByWeight(res);

        this.editable_columns = cloneDeep(res);

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
        return 'Table#' + this.page_widget.id;
    }

    get widget_options(): TableWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: TableWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as TableWidgetOptions;
                options = options ? new TableWidgetOptions(options.columns, options.page_widget_id, options.crud_api_type_id, options.vocus_button, options.delete_button) : null;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
    }

    // @Watch('vocus_button')
    // @Watch('delete_button')
    // private async onchange_switches() {
    //     if (this.widget_options && (
    //         (this.delete_button != this.widget_options.delete_button) ||
    //         (this.vocus_button != this.widget_options.vocus_button))) {

    //         this.next_update_options = this.widget_options;

    //         if (!this.next_update_options) {
    //             this.next_update_options = new TableWidgetOptions(null, this.page_widget.id, null, false, true);
    //         }

    //         this.next_update_options.vocus_button = this.vocus_button;
    //         this.next_update_options.delete_button = this.delete_button;
    //         await this.throttled_update_options();
    //         }
    //     }

    private async switch_vocus_button() {
        this.vocus_button = !this.vocus_button;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new TableWidgetOptions(null, this.page_widget.id, null, false, true);
        }

        if (this.next_update_options.vocus_button != this.vocus_button) {
            this.next_update_options.vocus_button = this.vocus_button;
            await this.throttled_update_options();
        }
    }

    private async switch_delete_button() {
        this.delete_button = !this.delete_button;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new TableWidgetOptions(null, this.page_widget.id, null, false, true);
        }

        if (this.next_update_options.delete_button != this.delete_button) {
            this.next_update_options.delete_button = this.delete_button;
            await this.throttled_update_options();
        }
    }
}