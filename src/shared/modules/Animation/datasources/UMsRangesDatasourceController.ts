import RangeHandler from "../../../tools/RangeHandler";
import ModuleDAO from "../../DAO/ModuleDAO";
import DataSourcesController from "../../DataSource/DataSourcesController";
import IDataSourceController from "../../DataSource/interfaces/IDataSourceController";
import IDistantVOBase from "../../IDistantVOBase";
import VarDAG from "../../Var/graph/var/VarDAG";
import IVarDataParamVOBase from "../../Var/interfaces/IVarDataParamVOBase";
import VarsController from "../../Var/VarsController";
import ThemeModuleDataParamRangesVO from "../params/theme_module/ThemeModuleDataParamRangesVO";
import ThemeModuleDataRangesVO from "../params/theme_module/ThemeModuleDataRangesVO";
import AnimationUserModuleVO from "../vos/AnimationUserModuleVO";

export default class UMsRangesDatasourceController implements IDataSourceController<ThemeModuleDataRangesVO, ThemeModuleDataParamRangesVO> {

    public static getInstance(): UMsRangesDatasourceController {
        if (!UMsRangesDatasourceController.instance) {
            UMsRangesDatasourceController.instance = new UMsRangesDatasourceController();
        }
        return UMsRangesDatasourceController.instance;
    }

    protected static instance: UMsRangesDatasourceController = null;

    public name: string = 'UMsRangesDatasourceController';

    public can_use_server_side: boolean = true;
    public can_use_client_side: boolean = true;

    protected cache_ums_by_module_user: { [module_id: number]: { [user_id: number]: AnimationUserModuleVO } } = {};

    public registerDataSource() {
        DataSourcesController.getInstance().registerDataSource(this, [AnimationUserModuleVO.API_TYPE_ID]);
    }

    public get_updated_params_from_vo_update(vo: IDistantVOBase): { [index: string]: IVarDataParamVOBase } {

        let res: { [index: string]: IVarDataParamVOBase } = {};

        //  On charge simplement tous les registered_vars des var_id concernés:
        for (let i in VarsController.getInstance().varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DATASOURCE_NAME + this.name]) {
            let index: string = VarsController.getInstance().varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DATASOURCE_NAME + this.name][i];
            let param: IVarDataParamVOBase = VarsController.getInstance().varDAG.nodes[index].param;

            // La var_id est concerné, on stageupdate
            res[index] = param;
        }

        return res;
    }

    public get_data(param: ThemeModuleDataParamRangesVO): { [module_id: number]: { [user_id: number]: AnimationUserModuleVO } } {
        if (!this.cache_ums_by_module_user) {
            return null;
        }

        let user_ids: number[] = param.user_id_ranges ? RangeHandler.getInstance().get_all_segmented_elements_from_ranges(param.user_id_ranges) : [];
        let module_ids: number[] = param.module_id_ranges ? RangeHandler.getInstance().get_all_segmented_elements_from_ranges(param.module_id_ranges) : [];

        let res: { [module_id: number]: { [user_id: number]: AnimationUserModuleVO } } = {};

        for (let module_id in this.cache_ums_by_module_user) {
            if (module_ids && module_ids.length > 0 && module_ids.indexOf(parseInt(module_id)) == -1) {
                continue;
            }

            if (!res[module_id]) {
                res[module_id] = [];
            }

            for (let user_id in this.cache_ums_by_module_user[module_id]) {
                if (user_ids.indexOf(parseInt(user_id)) >= 0) {
                    res[module_id][user_id] = this.cache_ums_by_module_user[module_id][user_id];
                }
            }
        }

        return res;
    }

    public async load_for_batch(vars_params: { [index: string]: ThemeModuleDataParamRangesVO }): Promise<void> {

        let module_ids: number[] = [];
        let user_ids: number[] = [];

        for (let i in vars_params) {
            let var_param: ThemeModuleDataParamRangesVO = vars_params[i];

            let param_module_ids: number[] = RangeHandler.getInstance().get_all_segmented_elements_from_ranges(var_param.module_id_ranges);
            let param_user_ids: number[] = RangeHandler.getInstance().get_all_segmented_elements_from_ranges(var_param.user_id_ranges);

            if (param_module_ids) {
                module_ids = module_ids.concat(param_module_ids);
            }

            if (param_user_ids) {
                user_ids = user_ids.concat(param_user_ids);
            }
        }

        let ums: AnimationUserModuleVO[] = await ModuleDAO.getInstance().getVosByRefFieldsIds<AnimationUserModuleVO>(
            AnimationUserModuleVO.API_TYPE_ID,
            'module_id',
            module_ids,
            'user_id',
            user_ids,
        );

        for (let i in ums) {
            let um: AnimationUserModuleVO = ums[i];

            if (!this.cache_ums_by_module_user[um.module_id]) {
                this.cache_ums_by_module_user[um.module_id] = {};
            }

            this.cache_ums_by_module_user[um.module_id][um.user_id] = um;
        }
    }
}