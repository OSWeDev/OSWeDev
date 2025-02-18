import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import DashboardPageWidgetVO from "../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DashboardWidgetVO from "../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO";
import VarMixedChartWidgetOptionsVO from "../../../shared/modules/DashboardBuilder/vos/VarMixedChartWidgetOptionsVO";
import VarPieChartWidgetOptionsVO from "../../../shared/modules/DashboardBuilder/vos/VarPieChartWidgetOptionsVO";
import { field_names } from "../../../shared/tools/ObjectHandler";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20250115UpdateGraphsPalettes implements IGeneratorWorker {

    private static instance: Patch20250115UpdateGraphsPalettes = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250115UpdateGraphsPalettes';
    }

    public static getInstance(): Patch20250115UpdateGraphsPalettes {
        if (!Patch20250115UpdateGraphsPalettes.instance) {
            Patch20250115UpdateGraphsPalettes.instance = new Patch20250115UpdateGraphsPalettes();
        }
        return Patch20250115UpdateGraphsPalettes.instance;
    }

    public async work(db: IDatabase<unknown>) {
        const mixed_chart_widget = await query(DashboardWidgetVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<DashboardWidgetVO>().widget_component, "Varmixedchartswidgetcomponent")
            .select_vo<DashboardWidgetVO>();
        const mixed_charts_options: DashboardPageWidgetVO[] = await query(DashboardPageWidgetVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<DashboardPageWidgetVO>().widget_id, mixed_chart_widget.id)
            .select_vos<DashboardPageWidgetVO>();

        const pie_chart_widget = await query(DashboardWidgetVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<DashboardWidgetVO>().widget_component, "Varpiechartwidgetcomponent")
            .select_vo<DashboardWidgetVO>();
        const pie_charts_options: DashboardPageWidgetVO[] = await query(DashboardPageWidgetVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<DashboardPageWidgetVO>().widget_id, pie_chart_widget.id)
            .select_vos<DashboardPageWidgetVO>();

        for (const i in mixed_charts_options) {
            const mixed_chart_option = mixed_charts_options[i];
            const options: VarMixedChartWidgetOptionsVO = JSON.parse(mixed_chart_option.json_options);
            if (options && options.var_charts_options && options.var_charts_options.length > 0) {
                for (const j in options.var_charts_options) {
                    const var_chart_option = options.var_charts_options[j];
                    if (Array.isArray(var_chart_option.color_palette)) {
                        var_chart_option.color_palette = null;
                    } else if (typeof var_chart_option.color_palette != 'object') {
                        var_chart_option.color_palette = null;
                    }
                }
                mixed_chart_option.json_options = JSON.stringify(options);
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(mixed_chart_option);
            }

        }

        for (const i in pie_charts_options) {
            const pie_chart_option = pie_charts_options[i];
            const options: VarPieChartWidgetOptionsVO = JSON.parse(pie_chart_option.json_options);
            if (Array.isArray(options.color_palette)) {
                options.color_palette = null;
            } else if (typeof options.color_palette != 'object') {
                options.color_palette = null;
            }
            pie_chart_option.json_options = JSON.stringify(options);
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(pie_chart_option);
        }
    }
}