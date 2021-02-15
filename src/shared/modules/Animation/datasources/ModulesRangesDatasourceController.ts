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
import AnimationModuleVO from "../vos/AnimationModuleVO";


export default class ModulesRangesDatasourceController implements IDataSourceController<ThemeModuleDataRangesVO, ThemeModuleDataParamRangesVO> {

    public static getInstance(): ModulesRangesDatasourceController {
        if (!ModulesRangesDatasourceController.instance) {
            ModulesRangesDatasourceController.instance = new ModulesRangesDatasourceController();
        }
        return ModulesRangesDatasourceController.instance;
    }

    protected static instance: ModulesRangesDatasourceController = null;

    public name: string = 'ModulesRangesDatasourceController';

    public can_use_server_side: boolean = true;
    public can_use_client_side: boolean = true;

    protected cache_modules_by_theme_module: { [theme_id: number]: { [module_id: number]: AnimationModuleVO } } = null;

    public registerDataSource() {
        DataSourcesController.getInstance().registerDataSource(this, [AnimationModuleVO.API_TYPE_ID]);
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

    public get_data(param: ThemeModuleDataParamRangesVO): AnimationModuleVO[] {
        if (!this.cache_modules_by_theme_module) {
            return null;
        }

        let theme_ids: number[] = param.theme_id_ranges ? RangeHandler.getInstance().get_all_segmented_elements_from_ranges(param.theme_id_ranges) : [];
        let module_ids: number[] = param.module_id_ranges ? RangeHandler.getInstance().get_all_segmented_elements_from_ranges(param.module_id_ranges) : [];

        let res: AnimationModuleVO[] = [];

        for (let theme_id in this.cache_modules_by_theme_module) {
            if (theme_ids && theme_ids.length > 0 && theme_ids.indexOf(parseInt(theme_id)) == -1) {
                continue;
            }

            for (let module_id in this.cache_modules_by_theme_module[theme_id]) {
                if (module_ids && module_ids.length > 0 && module_ids.indexOf(parseInt(module_id)) == -1) {
                    continue;
                }

                res.push(this.cache_modules_by_theme_module[theme_id][module_id]);
            }
        }

        return res;
    }

    public async load_for_batch(vars_params: { [index: string]: ThemeModuleDataParamRangesVO }): Promise<void> {

        let module_ids: number[] = [];
        let theme_ids: number[] = [];

        for (let i in vars_params) {
            let var_param: ThemeModuleDataParamRangesVO = vars_params[i];

            let param_theme_ids: number[] = RangeHandler.getInstance().get_all_segmented_elements_from_ranges(var_param.theme_id_ranges);
            let param_module_ids: number[] = RangeHandler.getInstance().get_all_segmented_elements_from_ranges(var_param.module_id_ranges);

            if (param_theme_ids) {
                theme_ids = theme_ids.concat(param_theme_ids);
            }

            if (param_module_ids) {
                module_ids = module_ids.concat(param_module_ids);
            }
        }

        let ams: AnimationModuleVO[] = [];

        let promises = [];

        if (module_ids) {
            promises.push((async () => ams = ams.concat(await ModuleDAO.getInstance().getVosByIds<AnimationModuleVO>(AnimationModuleVO.API_TYPE_ID, module_ids)))());
        }

        if (theme_ids) {
            promises.push((async () => ams = ams.concat(await ModuleDAO.getInstance().getVosByRefFieldIds<AnimationModuleVO>(AnimationModuleVO.API_TYPE_ID, 'theme_id', theme_ids)))());
        }

        await Promise.all(promises);

        for (let i in ams) {
            if (!this.cache_modules_by_theme_module[ams[i].theme_id]) {
                this.cache_modules_by_theme_module[ams[i].theme_id] = {};
            }

            this.cache_modules_by_theme_module[ams[i].theme_id][ams[i].id] = ams[i];
        }
    }
}