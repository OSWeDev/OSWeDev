import ModuleAnimation from "../../../../shared/modules/Animation/ModuleAnimation";
import ThemeModuleDataRangesVO from "../../../../shared/modules/Animation/params/theme_module/ThemeModuleDataRangesVO";
import AnimationUserQRVO from "../../../../shared/modules/Animation/vos/AnimationUserQRVO";
import RangeHandler from "../../../../shared/tools/RangeHandler";
import DataSourceControllerMatroidIndexedBase from "../../Var/datasource/DataSourceControllerMatroidIndexedBase";
import VarDayPrctAtteinteSeuilAnimationController from "../vars/VarDayPrctAtteinteSeuilAnimationController";

/**
 * récupère les paramètres pour charger les AnimationUserQRVO[] en fonction des modules et des utilisateurs
 * @see {@link VarDayPrctAtteinteSeuilAnimationController} pour un exemple d'utilisation
 */
export default class UQRsRangesDatasourceController extends DataSourceControllerMatroidIndexedBase {

    public static getInstance(): UQRsRangesDatasourceController {
        if (!UQRsRangesDatasourceController.instance) {
            UQRsRangesDatasourceController.instance = new UQRsRangesDatasourceController(
                'UQRsRangesDatasourceController',
                [AnimationUserQRVO.API_TYPE_ID],
                { 'fr-fr': 'Lien User-Question/Réponse' });
        }
        return UQRsRangesDatasourceController.instance;
    }

    protected static instance: UQRsRangesDatasourceController = null;

    /**
     * récupère les paramètres pour charger les AnimationUserQRVO[] en fonction des modules et des utilisateurs.
     * Utilisé pour le calcul de variable @see {@link VarDayPrctAtteinteSeuilAnimationController}
     * @param param ThemeModuleDataRangesVO
     * @param ds_cache
     * @returns AnimationUserQRVO[] by qr_id by module_id by theme_id
     */
    public async get_data(param: ThemeModuleDataRangesVO, ds_cache: { [ds_data_index: string]: any; }): Promise<{ [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationUserQRVO[] } } }> {
        // Protection/ Détection Max_ranges
        let param_theme_ids: number[] = (param.theme_id_ranges && RangeHandler.getInstance().getSegmentedMin_from_ranges(param.theme_id_ranges) >= 0) ?
            RangeHandler.getInstance().get_all_segmented_elements_from_ranges(param.theme_id_ranges) :
            null;
        let param_module_ids: number[] = (param.module_id_ranges && RangeHandler.getInstance().getSegmentedMin_from_ranges(param.module_id_ranges) >= 0) ?
            RangeHandler.getInstance().get_all_segmented_elements_from_ranges(param.module_id_ranges) :
            null;
        let param_user_ids: number[] = (param.user_id_ranges && RangeHandler.getInstance().getSegmentedMin_from_ranges(param.user_id_ranges) >= 0) ?
            RangeHandler.getInstance().get_all_segmented_elements_from_ranges(param.user_id_ranges) :
            null;

        let uqrs: { [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationUserQRVO[] } } } =
            await ModuleAnimation.getInstance().getUQRsByThemesAndModules(
                param_user_ids,
                param_theme_ids,
                param_module_ids
            );

        return uqrs;
    }
}