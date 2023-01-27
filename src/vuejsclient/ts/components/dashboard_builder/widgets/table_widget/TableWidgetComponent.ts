import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VueComponentBase from '../../../VueComponentBase';
import TableWidgetKanbanComponent from './kanban/TableWidgetKanbanComponent';
import TableWidgetOptions from './options/TableWidgetOptions';
import Tablewidgettablecomponent from './table/Tablewidgettablecomponent';
import './TableWidgetComponent.scss';

//TODO Faire en sorte que les champs qui n'existent plus car supprimés du dashboard ne se conservent pas lors de la création d'un tableau

@Component({
    template: require('./TableWidgetComponent.pug'),
    components: {
        Tablewidgetkanbancomponent: TableWidgetKanbanComponent,
        Tablewidgettablecomponent: Tablewidgettablecomponent
    }
})
export default class TableWidgetComponent extends VueComponentBase {

    @Prop({ default: false })
    private is_edit_mode: boolean;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    get table_view(): string {
        if (!this.page_widget) {
            return null;
        }

        let page_widget_options = JSON.parse(this.page_widget.json_options) as TableWidgetOptions;

        if (!page_widget_options) {
            return null;
        }

        if (!page_widget_options.use_kanban_by_default_if_exists) {
            return null;
        }

        if (page_widget_options.use_kanban_by_default_if_exists) {

            let columns = page_widget_options.columns;

            if (!columns) {
                return null;
            }

            let kanban_column = columns.find((column) => {
                return column.kanban_column;
            });

            if (kanban_column) {
                return 'kanban';
            }
        }

        return null;
    }
}