import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleDAO from "../../../../shared/modules/DAO/ModuleDAO";
import DashboardGraphVORefVO from "../../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO";
import ConsoleHandler from "../../../../shared/tools/ConsoleHandler";
import LocaleManager from "../../../../shared/tools/LocaleManager";
import { field_names } from "../../../../shared/tools/ObjectHandler";
import VueAppBaseInstanceHolder from "../../../VueAppBaseInstanceHolder";

export default class ModuleTablesClientController {

    public static async add_new_default_table(dashboard_id: number, selected_vo_type: string) {
        // On ajoute la table au DB en l'ajoutant au graph
        const new_db_vo_ref = new DashboardGraphVORefVO();
        new_db_vo_ref.dashboard_id = dashboard_id;
        new_db_vo_ref.vo_type = selected_vo_type;
        new_db_vo_ref.x = 800;
        new_db_vo_ref.y = 80;
        new_db_vo_ref.width = 200;
        new_db_vo_ref.height = 50;
        await ModuleDAO.getInstance().insertOrUpdateVO(new_db_vo_ref);
    }

    public static async switch_discarded_field(dashboard_id: number, table: string, field: string) {

        // On utilise le add pour récupérer la table en base de données
        const table_vo_ref = await query(DashboardGraphVORefVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<DashboardGraphVORefVO>().dashboard_id, dashboard_id)
            .filter_by_text_eq(field_names<DashboardGraphVORefVO>().vo_type, table)
            .select_vo<DashboardGraphVORefVO>();

        if (!table_vo_ref) {
            ConsoleHandler.error('set_discarded_field: Impossible de trouver le graphvoref pour la table :' + table + ' et le dashboard_id :' + dashboard_id);
            return;
        }

        if (!table_vo_ref.values_to_exclude) {
            table_vo_ref.values_to_exclude = [];
        }

        if (!table_vo_ref.values_to_exclude.find((e) => e == field)) {
            table_vo_ref.values_to_exclude.push(field);
        } else {
            table_vo_ref.values_to_exclude = table_vo_ref.values_to_exclude.filter((e) => e != field);
        }
        const update_res = await ModuleDAO.instance.insertOrUpdateVO(table_vo_ref);
        if (!update_res || !update_res.id) {
            ConsoleHandler.error('Impossible de mettre à jour le graphvoref');
            VueAppBaseInstanceHolder.instance.$snotify.error(LocaleManager.label('TablesGraphEditFormComponent.switch_edge_acceptance.error'));
            return;
        }
    }

    public static async removeTable(table_name: string) {

        if ((!this.dashboard) || (!this.dashboard.id)) {
            return;
        }

        if (!table_name) {
            return;
        }

        try {
            await query(DashboardGraphVORefVO.API_TYPE_ID)
                .filter_by_id(this.dashboard.id, DashboardVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<DashboardGraphVORefVO>().vo_type, table_name)
                .delete_vos();
        } catch (error) {
            ConsoleHandler.error('DashboardBuilderComponent.removeTable:' + error);
        }

        this.del_api_type_id(table_name);
    }

}
