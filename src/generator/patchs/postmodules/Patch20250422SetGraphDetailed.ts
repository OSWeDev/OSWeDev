import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import DashboardPageWidgetVO from "../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DashboardWidgetVO from "../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO";
import VarMixedChartWidgetOptionsVO from "../../../shared/modules/DashboardBuilder/vos/VarMixedChartWidgetOptionsVO";
import VarPieChartWidgetOptionsVO from "../../../shared/modules/DashboardBuilder/vos/VarPieChartWidgetOptionsVO";
import { field_names } from "../../../shared/tools/ObjectHandler";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20250422SetGraphDetailed implements IGeneratorWorker {

    private static instance: Patch20250422SetGraphDetailed = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250422SetGraphDetailed';
    }

    public static getInstance(): Patch20250422SetGraphDetailed {
        if (!Patch20250422SetGraphDetailed.instance) {
            Patch20250422SetGraphDetailed.instance = new Patch20250422SetGraphDetailed();
        }
        return Patch20250422SetGraphDetailed.instance;
    }

    public async work(db: IDatabase<unknown>) {
        const mixed_chart_widget = await query(DashboardWidgetVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<DashboardWidgetVO>().widget_component, "Varmixedchartswidgetcomponent")
            .select_vo<DashboardWidgetVO>();
        const mixed_charts_options: DashboardPageWidgetVO[] = await query(DashboardPageWidgetVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<DashboardPageWidgetVO>().widget_id, mixed_chart_widget.id)
            .select_vos<DashboardPageWidgetVO>();

        for (const i in mixed_charts_options) {
            const mixed_chart_option = mixed_charts_options[i];
            const options: VarMixedChartWidgetOptionsVO = JSON.parse(mixed_chart_option.json_options);
            if (options) {
                options.detailed = true;
                mixed_chart_option.json_options = JSON.stringify(options);
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(mixed_chart_option);
            }
        }
    }
}