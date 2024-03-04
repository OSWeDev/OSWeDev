import ThemeModuleDataRangesVO from "../../../../shared/modules/Animation/params/theme_module/ThemeModuleDataRangesVO";
import AnimationUserModuleVO from "../../../../shared/modules/Animation/vos/AnimationUserModuleVO";
import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import { field_names } from "../../../../shared/tools/ObjectHandler";
import RangeHandler from "../../../../shared/tools/RangeHandler";
import DataSourceControllerMatroidIndexedBase from "../../Var/datasource/DataSourceControllerMatroidIndexedBase";

export default class UMsRangesDatasourceController extends DataSourceControllerMatroidIndexedBase {

    // istanbul ignore next: nothing to test
    public static getInstance(): UMsRangesDatasourceController {
        if (!UMsRangesDatasourceController.instance) {
            UMsRangesDatasourceController.instance = new UMsRangesDatasourceController(
                'UMsRangesDatasourceController',
                [AnimationUserModuleVO.API_TYPE_ID],
                { 'fr-fr': 'Lien User-Module animation' });
        }
        return UMsRangesDatasourceController.instance;
    }

    protected static instance: UMsRangesDatasourceController = null;

    public async get_data(param: ThemeModuleDataRangesVO): Promise<{ [module_id: number]: { [user_id: number]: AnimationUserModuleVO } }> {

        // Protection/ Détection Max_ranges
        const user_ids: number[] = (param.user_id_ranges && RangeHandler.getSegmentedMin_from_ranges(param.user_id_ranges) >= 0) ?
            RangeHandler.get_all_segmented_elements_from_ranges(param.user_id_ranges) :
            null;
        const module_ids: number[] = (param.module_id_ranges && RangeHandler.getSegmentedMin_from_ranges(param.module_id_ranges) >= 0) ?
            RangeHandler.get_all_segmented_elements_from_ranges(param.module_id_ranges) :
            null;

        const ums_by_module_user: { [module_id: number]: { [user_id: number]: AnimationUserModuleVO } } = {};
        let ums: AnimationUserModuleVO[] = null;

        if (module_ids && user_ids) {
            ums = await query(AnimationUserModuleVO.API_TYPE_ID)
                .filter_by_num_has(field_names<AnimationUserModuleVO>().module_id, module_ids)
                .filter_by_num_has(field_names<AnimationUserModuleVO>().user_id, user_ids)
                .select_vos<AnimationUserModuleVO>();
        } else if (module_ids) {
            ums = await query(AnimationUserModuleVO.API_TYPE_ID).filter_by_num_has(field_names<AnimationUserModuleVO>().module_id, module_ids).select_vos<AnimationUserModuleVO>();
        } else if (user_ids) {
            ums = await query(AnimationUserModuleVO.API_TYPE_ID).filter_by_num_has(field_names<AnimationUserModuleVO>().user_id, user_ids).select_vos<AnimationUserModuleVO>();
        }

        for (const i in ums) {
            const um: AnimationUserModuleVO = ums[i];

            if (!ums_by_module_user[um.module_id]) {
                ums_by_module_user[um.module_id] = {};
            }

            ums_by_module_user[um.module_id][um.user_id] = um;
        }
        return ums_by_module_user;
    }
}