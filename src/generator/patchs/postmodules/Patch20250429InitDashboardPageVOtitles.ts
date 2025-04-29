import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import DashboardBuilderController from "../../../shared/modules/DashboardBuilder/DashboardBuilderController";
import DashboardPageVO from "../../../shared/modules/DashboardBuilder/vos/DashboardPageVO";
import DefaultTranslationVO from "../../../shared/modules/Translation/vos/DefaultTranslationVO";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20250429InitDashboardPageVOtitles implements IGeneratorWorker {

    private static instance: Patch20250429InitDashboardPageVOtitles = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250429InitDashboardPageVOtitles';
    }

    public static getInstance(): Patch20250429InitDashboardPageVOtitles {
        if (!Patch20250429InitDashboardPageVOtitles.instance) {
            Patch20250429InitDashboardPageVOtitles.instance = new Patch20250429InitDashboardPageVOtitles();
        }
        return Patch20250429InitDashboardPageVOtitles.instance;
    }

    public async work(db: IDatabase<unknown>) {
        const vos = await query(DashboardPageVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<DashboardPageVO>();

        for (const i in vos) {
            const vo = vos[i];
            vo.title = DashboardBuilderController.PAGE_NAME_CODE_PREFIX + vo.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
            vo.group_filters_title = DashboardBuilderController.PAGE_NAME_CODE_PREFIX + vo.id + ".group_filters" + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        }

        await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(vos);
    }
}