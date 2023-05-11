import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VOsTypesManager from '../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
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

                // on doit aussi avoir un CRUD défini pour avoir un ID obligatoirement dispo
                // on doit aussi avoir un CRUD qui colle soit à l'API_TYPE_ID du kanban_column si on change un enum
                //  soit à un API_TYPE_ID qui contient un lien (N/1) vers l'API_TYPE_ID du kanban_column
                // Dans tous les cas la valeur du champs kanban doit être unique (donc sur un enum c'est clair, sur un field d'un vo lié, on checke le paramètre d'unicité)

                if (!page_widget_options.crud_api_type_id) {
                    ConsoleHandler.warn('Il faut définir un type CRUD sur le tableWidget pour utiliser le kanban');
                    return null;
                }

                if (page_widget_options.crud_api_type_id != kanban_column.api_type_id) {

                    let kanban_column_field = VOsTypesManager.moduleTables_by_voType[kanban_column.api_type_id].get_field_by_id(kanban_column.field_id);
                    if (!kanban_column_field.is_unique) {
                        ConsoleHandler.warn('Le champ ' + kanban_column.field_id + ' de l\'API_TYPE_ID ' + kanban_column.api_type_id + ' n\'est pas unique et pas le type du CRUD utilisé sur ce tableau, on ne peut donc pas utiliser le kanban');
                        return null;
                    }

                    let crud_table = VOsTypesManager.moduleTables_by_voType[page_widget_options.crud_api_type_id];
                    let fields = crud_table.get_fields();

                    let found = 0;
                    for (let i in fields) {
                        let field = fields[i];

                        if (field.manyToOne_target_moduletable && (field.manyToOne_target_moduletable.vo_type == kanban_column.api_type_id)) {
                            found++;
                        }
                    }

                    if (found == 1) {
                        return 'kanban';
                    }

                    if (found > 1) {
                        ConsoleHandler.warn('Le CRUD utilisé sur ce tableau a plusieurs champs qui pointent vers l\'API_TYPE_ID ' + kanban_column.api_type_id + ' on ne peut donc pas utiliser le kanban');
                        return null;
                    }

                    ConsoleHandler.warn('Le champ ' + kanban_column.field_id + ' de l\'API_TYPE_ID ' + kanban_column.api_type_id + ' n\'est pas lié directement au type du CRUD utilisé sur ce tableau, on ne peut donc pas utiliser le kanban');
                    return null;
                }

                return 'kanban';
            }
        }

        return null;
    }
}