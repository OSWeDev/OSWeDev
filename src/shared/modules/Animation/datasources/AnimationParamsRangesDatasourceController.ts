import DataSourcesController from "../../DataSource/DataSourcesController";
import IDataSourceController from "../../DataSource/interfaces/IDataSourceController";
import IDistantVOBase from "../../IDistantVOBase";
import VarDAG from "../../Var/graph/var/VarDAG";
import IVarDataParamVOBase from "../../Var/interfaces/IVarDataParamVOBase";
import VarsController from "../../Var/VarsController";
import ModuleAnimation from "../ModuleAnimation";
import ThemeModuleDataParamRangesVO from "../params/theme_module/ThemeModuleDataParamRangesVO";
import ThemeModuleDataRangesVO from "../params/theme_module/ThemeModuleDataRangesVO";

export default class AnimationParamsRangesDatasourceController implements IDataSourceController<ThemeModuleDataRangesVO, ThemeModuleDataParamRangesVO> {

    public static getInstance(): AnimationParamsRangesDatasourceController {
        if (!AnimationParamsRangesDatasourceController.instance) {
            AnimationParamsRangesDatasourceController.instance = new AnimationParamsRangesDatasourceController();
        }
        return AnimationParamsRangesDatasourceController.instance;
    }

    protected static instance: AnimationParamsRangesDatasourceController = null;

    public name: string = 'AnimationParamsRangesDatasourceController';

    public can_use_server_side: boolean = true;
    public can_use_client_side: boolean = true;

    protected cache_params: { [param_name: string]: any } = {};

    public registerDataSource() {
        DataSourcesController.getInstance().registerDataSource(this, []);
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

    public get_data(param: ThemeModuleDataParamRangesVO): { [param_name: string]: any } {
        return this.cache_params;
    }

    public async load_for_batch(vars_params: { [index: string]: ThemeModuleDataParamRangesVO }): Promise<void> {
        let promises = [];

        promises.push((async () =>
            this.cache_params[ModuleAnimation.PARAM_NAME_SEUIL_VALIDATION_MODULE_PRCT] = await ModuleAnimation.getInstance().get_PARAM_NAME_SEUIL_VALIDATION_MODULE_PRCT_value()
        )());

        await Promise.all(promises);
    }
}