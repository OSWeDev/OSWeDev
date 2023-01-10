import ModuleAnimation from "../../../../shared/modules/Animation/ModuleAnimation";
import ThemeModuleDataRangesVO from "../../../../shared/modules/Animation/params/theme_module/ThemeModuleDataRangesVO";
import AnimationQRVO from "../../../../shared/modules/Animation/vos/AnimationQRVO";
import RangeHandler from "../../../../shared/tools/RangeHandler";
import DataSourceControllerMatroidIndexedBase from "../../Var/datasource/DataSourceControllerMatroidIndexedBase";

export default class QRsRangesDatasourceController extends DataSourceControllerMatroidIndexedBase {

    public static getInstance(): QRsRangesDatasourceController {
        if (!QRsRangesDatasourceController.instance) {
            QRsRangesDatasourceController.instance = new QRsRangesDatasourceController(
                'QRsRangesDatasourceController',
                [AnimationQRVO.API_TYPE_ID],
                { 'fr-fr': 'Question/Réponse' });
        }
        return QRsRangesDatasourceController.instance;
    }

    protected static instance: QRsRangesDatasourceController = null;

    public async get_data(param: ThemeModuleDataRangesVO): Promise<{ [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationQRVO } } }> {

        let module_ids: number[] = [];
        let theme_ids: number[] = [];

        // Protection/ Détection Max_ranges
        let param_theme_ids: number[] = (param.theme_id_ranges && RangeHandler.getSegmentedMin_from_ranges(param.theme_id_ranges) >= 0) ?
            RangeHandler.get_all_segmented_elements_from_ranges(param.theme_id_ranges) :
            null;
        let param_module_ids: number[] = (param.module_id_ranges && RangeHandler.getSegmentedMin_from_ranges(param.module_id_ranges) >= 0) ?
            RangeHandler.get_all_segmented_elements_from_ranges(param.module_id_ranges) :
            null;

        if (param_theme_ids) {
            theme_ids = theme_ids.concat(param_theme_ids);
        }

        if (param_module_ids) {
            module_ids = module_ids.concat(param_module_ids);
        }

        return ModuleAnimation.getInstance().getQRsByThemesAndModules(theme_ids, module_ids);
    }
}