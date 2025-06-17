import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleTableController from "../../../shared/modules/DAO/ModuleTableController";
import LinkDashboardAndApiTypeIdVO from "../../../shared/modules/DashboardBuilder/vos/LinkDashboardAndApiTypeIdVO";
import CRUDDBLinkVO from "../../../shared/modules/DashboardBuilder/vos/crud/CRUDDBLinkVO";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20250617MigrationCRUDDBLink implements IGeneratorWorker {

    private static instance: Patch20250617MigrationCRUDDBLink = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250617MigrationCRUDDBLink';
    }

    public static getInstance(): Patch20250617MigrationCRUDDBLink {
        if (!Patch20250617MigrationCRUDDBLink.instance) {
            Patch20250617MigrationCRUDDBLink.instance = new Patch20250617MigrationCRUDDBLink();
        }
        return Patch20250617MigrationCRUDDBLink.instance;
    }

    public async work(db: IDatabase<unknown>) {
        // On migre simplement la conf de LinkDashboardAndApiTypeIdVO vers CRUDDBLinkVO
        const link_dashboard_and_api_type_id_vos: LinkDashboardAndApiTypeIdVO[] = await query(LinkDashboardAndApiTypeIdVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<LinkDashboardAndApiTypeIdVO>();

        for (const link of link_dashboard_and_api_type_id_vos) {
            const new_link = new CRUDDBLinkVO();
            new_link.moduletable_ref_id = ModuleTableController.module_tables_by_vo_type[link.api_type_id].id;
            new_link.template_read_db_ref_id = link.dashboard_id;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(new_link);
        }
    }
}