import ThemeModuleDataRangesVO from "../../../../shared/modules/Animation/params/theme_module/ThemeModuleDataRangesVO";
import AnimationUserModuleVO from "../../../../shared/modules/Animation/vos/AnimationUserModuleVO";
import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleDAO from "../../../../shared/modules/DAO/ModuleDAO";
import RangeHandler from "../../../../shared/tools/RangeHandler";
import DataSourceControllerMatroidIndexedBase from "../../Var/datasource/DataSourceControllerMatroidIndexedBase";

export default class UMsRangesDatasourceController extends DataSourceControllerMatroidIndexedBase {

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
        let user_ids: number[] = (param.user_id_ranges && RangeHandler.getSegmentedMin_from_ranges(param.user_id_ranges) >= 0) ?
            RangeHandler.get_all_segmented_elements_from_ranges(param.user_id_ranges) :
            null;
        let module_ids: number[] = (param.module_id_ranges && RangeHandler.getSegmentedMin_from_ranges(param.module_id_ranges) >= 0) ?
            RangeHandler.get_all_segmented_elements_from_ranges(param.module_id_ranges) :
            null;

        let ums_by_module_user: { [module_id: number]: { [user_id: number]: AnimationUserModuleVO } } = {};
        let ums: AnimationUserModuleVO[] = null;

        if (module_ids && user_ids) {
            ums = await ModuleDAO.getInstance().getVosByRefFieldsIds<AnimationUserModuleVO>(
                AnimationUserModuleVO.API_TYPE_ID,
                'module_id',
                module_ids,
                'user_id',
                user_ids,
            );
        } else if (module_ids) {
            ums = await query(AnimationUserModuleVO.API_TYPE_ID).filter_by_num_has('module_id', module_ids).select_vos<AnimationUserModuleVO>();
        } else if (user_ids) {
            ums = await query(AnimationUserModuleVO.API_TYPE_ID).filter_by_num_has('user_id', user_ids).select_vos<AnimationUserModuleVO>();
        }

        for (let i in ums) {
            let um: AnimationUserModuleVO = ums[i];

            if (!ums_by_module_user[um.module_id]) {
                ums_by_module_user[um.module_id] = {};
            }

            ums_by_module_user[um.module_id][um.user_id] = um;
        }
        return ums_by_module_user;
    }
}