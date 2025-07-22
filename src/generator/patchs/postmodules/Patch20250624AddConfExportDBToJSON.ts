import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import ModuleTableFieldController from "../../../shared/modules/DAO/ModuleTableFieldController";
import ModuleTableFieldVO from "../../../shared/modules/DAO/vos/ModuleTableFieldVO";
import ModuleTableVO from "../../../shared/modules/DAO/vos/ModuleTableVO";
import DashboardGraphVORefVO from "../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO";
import DashboardPageVO from "../../../shared/modules/DashboardBuilder/vos/DashboardPageVO";
import DashboardPageWidgetVO from "../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DashboardWidgetVO from "../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO";
import ExportVOsToJSONConfVO from "../../../shared/modules/DataExport/vos/ExportVOsToJSONConfVO";
import { field_names } from "../../../shared/tools/ObjectHandler";
import RangeHandler from "../../../shared/tools/RangeHandler";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20250624AddConfExportDBToJSON implements IGeneratorWorker {

    private static instance: Patch20250624AddConfExportDBToJSON = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250624AddConfExportDBToJSON';
    }

    public static getInstance(): Patch20250624AddConfExportDBToJSON {
        if (!Patch20250624AddConfExportDBToJSON.instance) {
            Patch20250624AddConfExportDBToJSON.instance = new Patch20250624AddConfExportDBToJSON();
        }
        return Patch20250624AddConfExportDBToJSON.instance;
    }

    public async work(db: IDatabase<unknown>) {
        // Conf des exports de DB en JSON
        const export_vo_to_json_conf: ExportVOsToJSONConfVO = new ExportVOsToJSONConfVO();

        export_vo_to_json_conf.name = "Export DashBoardVO en JSON";
        export_vo_to_json_conf.description = "Exporter un dashboard en JSON avec les pages / widgets / trads ...";

        const ref_fields_to_follow: number[] = [

            // DashboardVO <= DashboardPageVO.dashboard_id
            ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[DashboardPageVO.API_TYPE_ID][field_names<DashboardPageVO>().dashboard_id].id,

            // DashboardVO <= DashboardGraphVORefVO.dashboard_id
            ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[DashboardGraphVORefVO.API_TYPE_ID][field_names<DashboardGraphVORefVO>().dashboard_id].id,

            // DashboardPageVO <= DashboardPageWidgetVO.page_id
            ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[DashboardPageWidgetVO.API_TYPE_ID][field_names<DashboardPageWidgetVO>().page_id_ranges].id,
        ];
        export_vo_to_json_conf.ref_fields_to_follow_id_ranges = RangeHandler.get_ids_ranges_from_list(ref_fields_to_follow);

        const unique_fields_to_use: number[] = [

            // Les refs vers des moduletables : on utilise l'api_type_id
            ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[ModuleTableVO.API_TYPE_ID][field_names<ModuleTableVO>().vo_type].id,

            // Les refs vers des moduletablefields : on utilise l'ui (vo_type.field_name)
            ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[ModuleTableFieldVO.API_TYPE_ID][field_names<ModuleTableFieldVO>().uid].id,

            // Pour les widgets on utilise le nom du widget
            ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[DashboardWidgetVO.API_TYPE_ID][field_names<DashboardWidgetVO>().name].id,
        ];
        export_vo_to_json_conf.unique_fields_to_use_id_ranges = RangeHandler.get_ids_ranges_from_list(unique_fields_to_use);

        // Techniquement yaura tous les vos d'options de widgets à ajouter ici !

        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(export_vo_to_json_conf);
    }
}