import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import DashboardBuilderController from "../../../shared/modules/DashboardBuilder/DashboardBuilderController";
import DashboardWidgetVO from "../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO";
import DefaultTranslationVO from "../../../shared/modules/Translation/vos/DefaultTranslationVO";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20250429InitDashboardWidgetVOTile implements IGeneratorWorker {

    private static instance: Patch20250429InitDashboardWidgetVOTile = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250429InitDashboardWidgetVOTile';
    }

    public static getInstance(): Patch20250429InitDashboardWidgetVOTile {
        if (!Patch20250429InitDashboardWidgetVOTile.instance) {
            Patch20250429InitDashboardWidgetVOTile.instance = new Patch20250429InitDashboardWidgetVOTile();
        }
        return Patch20250429InitDashboardWidgetVOTile.instance;
    }

    public async work(db: IDatabase<unknown>) {
        const vos = await query(DashboardWidgetVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<DashboardWidgetVO>();

        for (const i in vos) {
            const vo = vos[i];
            vo.title = DashboardBuilderController.WIDGET_NAME_CODE_PREFIX + vo.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        }

        await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(vos);
    }
}