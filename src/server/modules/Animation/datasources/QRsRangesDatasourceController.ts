import ModuleAnimation from "../../../../shared/modules/Animation/ModuleAnimation";
import ThemeModuleDataRangesVO from "../../../../shared/modules/Animation/params/theme_module/ThemeModuleDataRangesVO";
import VarDataBaseVO from "../../../../shared/modules/Var/vos/VarDataBaseVO";
import RangeHandler from "../../../../shared/tools/RangeHandler";
import DataSourceControllerMatroidIndexedBase from "../../Var/datasource/DataSourceControllerMatroidIndexedBase";

export default class QRsRangesDatasourceController extends DataSourceControllerMatroidIndexedBase {

    public static getInstance(): QRsRangesDatasourceController {
        if (!QRsRangesDatasourceController.instance) {
            QRsRangesDatasourceController.instance = new QRsRangesDatasourceController(
                'QRsRangesDatasourceController',
                [ThemeModuleDataRangesVO.API_TYPE_ID],
                { fr: 'Question/Réponse' });
        }
        return QRsRangesDatasourceController.instance;
    }

    protected static instance: QRsRangesDatasourceController = null;

    public async get_data(param: ThemeModuleDataRangesVO, ds_cache: { [ds_data_index: string]: any; }): Promise<any> {

        let module_ids: number[] = [];
        let theme_ids: number[] = [];

        let param_theme_ids: number[] = RangeHandler.getInstance().get_all_segmented_elements_from_ranges(param.theme_id_ranges);
        let param_module_ids: number[] = RangeHandler.getInstance().get_all_segmented_elements_from_ranges(param.module_id_ranges);

        if (param_theme_ids) {
            theme_ids = theme_ids.concat(param_theme_ids);
        }

        if (param_module_ids) {
            module_ids = module_ids.concat(param_module_ids);
        }

        return await ModuleAnimation.getInstance().getQRsByThemesAndModules(theme_ids, module_ids);
    }
}