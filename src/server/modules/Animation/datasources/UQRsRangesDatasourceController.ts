import ModuleAnimation from "../../../../shared/modules/Animation/ModuleAnimation";
import ThemeModuleDataRangesVO from "../../../../shared/modules/Animation/params/theme_module/ThemeModuleDataRangesVO";
import AnimationUserQRVO from "../../../../shared/modules/Animation/vos/AnimationUserQRVO";
import VarDataBaseVO from "../../../../shared/modules/Var/vos/VarDataBaseVO";
import RangeHandler from "../../../../shared/tools/RangeHandler";
import DataSourceControllerMatroidIndexedBase from "../../Var/datasource/DataSourceControllerMatroidIndexedBase";



export default class UQRsRangesDatasourceController extends DataSourceControllerMatroidIndexedBase {

    public static getInstance(): UQRsRangesDatasourceController {
        if (!UQRsRangesDatasourceController.instance) {
            UQRsRangesDatasourceController.instance = new UQRsRangesDatasourceController(
                'UQRsRangesDatasourceController',
                [ThemeModuleDataRangesVO.API_TYPE_ID],
                { fr: 'Lien User-Question/Réponse' });
        }
        return UQRsRangesDatasourceController.instance;
    }

    protected static instance: UQRsRangesDatasourceController = null;

    public async get_data(param: ThemeModuleDataRangesVO, ds_cache: { [ds_data_index: string]: any; }): Promise<any> {

        let param_theme_ids: number[] = RangeHandler.getInstance().get_all_segmented_elements_from_ranges((param as any as ThemeModuleDataRangesVO).theme_id_ranges);
        let param_module_ids: number[] = RangeHandler.getInstance().get_all_segmented_elements_from_ranges((param as any as ThemeModuleDataRangesVO).module_id_ranges);
        let param_user_ids: number[] = RangeHandler.getInstance().get_all_segmented_elements_from_ranges((param as any as ThemeModuleDataRangesVO).user_id_ranges);

        let uqrs: { [theme_id: number]: { [module_id: number]: { [uqr_id: number]: AnimationUserQRVO } } } = await ModuleAnimation.getInstance().getUQRsByThemesAndModules(
            param_user_ids,
            param_theme_ids,
            param_module_ids
        );

        return uqrs;
    }
}