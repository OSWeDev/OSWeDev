import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import DashboardPageWidgetVO from "../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DashboardWidgetVO from "../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO";
import VarMixedChartWidgetOptionsVO from "../../../shared/modules/DashboardBuilder/vos/VarMixedChartWidgetOptionsVO";
import VarPieChartWidgetOptionsVO from "../../../shared/modules/DashboardBuilder/vos/VarPieChartWidgetOptionsVO";
import { field_names } from "../../../shared/tools/ObjectHandler";
import IGeneratorWorker from "../../IGeneratorWorker";
import DashboardGraphColorPaletteVO from "../../../shared/modules/DashboardBuilder/vos/DashboardGraphColorPaletteVO";


export default class Patch20250224AddDefaultPalette implements IGeneratorWorker {

    private static instance: Patch20250224AddDefaultPalette = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250224AddDefaultPalette';
    }

    public static getInstance(): Patch20250224AddDefaultPalette {
        if (!Patch20250224AddDefaultPalette.instance) {
            Patch20250224AddDefaultPalette.instance = new Patch20250224AddDefaultPalette();
        }
        return Patch20250224AddDefaultPalette.instance;
    }

    public async work(db: IDatabase<unknown>) {
        const default_palette: DashboardGraphColorPaletteVO = new DashboardGraphColorPaletteVO();
        default_palette.name = 'Default';
        default_palette.colors = [
            '#FF0000',
            '#00FF00',
            '#0000FF',
            '#FFFF00',
            '#FF00FF',
            '#00FFFF',
            '#FF8000',
            '#FF0080',
            '#80FF00',
            '#8000FF',
            '#0080FF',
            '#00FF80',
            '#FF8080',
            '#80FF80',
            '#8080FF',
            '#FF80FF',
            '#80FFFF',
            '#80FF80',
        ];
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(default_palette);

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
                        var_chart_option.color_palette = default_palette;
                    } else if (typeof var_chart_option.color_palette != 'object') {
                        var_chart_option.color_palette = default_palette;
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
                options.color_palette = default_palette;
            } else if (typeof options.color_palette != 'object') {
                options.color_palette = default_palette;
            }
            pie_chart_option.json_options = JSON.stringify(options);
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(pie_chart_option);
        }
    }
}