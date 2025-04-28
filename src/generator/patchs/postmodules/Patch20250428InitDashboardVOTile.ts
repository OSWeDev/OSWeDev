import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import DashboardBuilderController from "../../../shared/modules/DashboardBuilder/DashboardBuilderController";
import DashboardVO from "../../../shared/modules/DashboardBuilder/vos/DashboardVO";
import DefaultTranslationVO from "../../../shared/modules/Translation/vos/DefaultTranslationVO";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20250428InitDashboardVOTile implements IGeneratorWorker {

    private static instance: Patch20250428InitDashboardVOTile = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250428InitDashboardVOTile';
    }

    public static getInstance(): Patch20250428InitDashboardVOTile {
        if (!Patch20250428InitDashboardVOTile.instance) {
            Patch20250428InitDashboardVOTile.instance = new Patch20250428InitDashboardVOTile();
        }
        return Patch20250428InitDashboardVOTile.instance;
    }

    public async work(db: IDatabase<unknown>) {
        const vos = await query(DashboardVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<DashboardVO>();

        for (const i in vos) {
            const vo = vos[i];
            vo.title = DashboardBuilderController.DASHBOARD_NAME_CODE_PREFIX + vo.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        }

        await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(vos);
    }
}