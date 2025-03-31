import { IDatabase } from "pg-promise";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import DashboardWidgetVO from "../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO";
import { field_names } from "../../../shared/tools/ObjectHandler";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20250331RenameFavoriteFilterOptions implements IGeneratorWorker {

    private static instance: Patch20250331RenameFavoriteFilterOptions = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250331RenameFavoriteFilterOptions';
    }

    public static getInstance(): Patch20250331RenameFavoriteFilterOptions {
        if (!Patch20250331RenameFavoriteFilterOptions.instance) {
            Patch20250331RenameFavoriteFilterOptions.instance = new Patch20250331RenameFavoriteFilterOptions();
        }
        return Patch20250331RenameFavoriteFilterOptions.instance;
    }

    public async work(db: IDatabase<unknown>) {
        await query(DashboardWidgetVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<DashboardWidgetVO>().options_component, 'Showfavoritesfilterswidgetoptionscomponent')
            .exec_as_server()
            .update_vos<DashboardWidgetVO>({ [field_names<DashboardWidgetVO>().options_component]: 'Favoritesfilterswidgetoptionscomponent' });
    }
}