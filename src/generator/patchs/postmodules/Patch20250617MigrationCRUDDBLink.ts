import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleTableController from "../../../shared/modules/DAO/ModuleTableController";
import DashboardVO from "../../../shared/modules/DashboardBuilder/vos/DashboardVO";
import LinkDashboardAndApiTypeIdVO from "../../../shared/modules/DashboardBuilder/vos/LinkDashboardAndApiTypeIdVO";
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
        // On migre simplement la conf de LinkDashboardAndApiTypeIdVO vers DashboardVO
        const link_dashboard_and_api_type_id_vos: LinkDashboardAndApiTypeIdVO[] = await query(LinkDashboardAndApiTypeIdVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<LinkDashboardAndApiTypeIdVO>();

        for (const link of link_dashboard_and_api_type_id_vos) {

            const dashboard = await query(DashboardVO.API_TYPE_ID)
                .filter_by_id(link.dashboard_id)
                .exec_as_server()
                .select_vo<DashboardVO>();

            if (!dashboard) {
                throw new Error(`Dashboard with id ${link.dashboard_id} not found for link ${link.id}`);
            }

            dashboard.moduletable_crud_template_ref_id = ModuleTableController.module_tables_by_vo_type[link.api_type_id].id;
            dashboard.moduletable_crud_template_type = DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_TYPE_CONSULTATION;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(dashboard);
        }
    }
}