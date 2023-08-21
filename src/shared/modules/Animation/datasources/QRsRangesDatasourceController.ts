import RangeHandler from "../../../tools/RangeHandler";
import DataSourcesController from "../../DataSource/DataSourcesController";
import IDataSourceController from "../../DataSource/interfaces/IDataSourceController";
import IDistantVOBase from "../../IDistantVOBase";
import VarDAG from "../../Var/graph/var/VarDAG";
import IVarDataParamVOBase from "../../Var/interfaces/IVarDataParamVOBase";
import VarsController from "../../Var/VarsController";
import ModuleAnimation from "../ModuleAnimation";
import ThemeModuleDataParamRangesVO from "../params/theme_module/ThemeModuleDataParamRangesVO";
import ThemeModuleDataRangesVO from "../params/theme_module/ThemeModuleDataRangesVO";
import AnimationQRVO from "../vos/AnimationQRVO";


export default class QRsRangesDatasourceController implements IDataSourceController<ThemeModuleDataRangesVO, ThemeModuleDataParamRangesVO> {

    public static getInstance(): QRsRangesDatasourceController {
        if (!QRsRangesDatasourceController.instance) {
            QRsRangesDatasourceController.instance = new QRsRangesDatasourceController();
        }
        return QRsRangesDatasourceController.instance;
    }

    protected static instance: QRsRangesDatasourceController = null;

    public name: string = 'QRsRangesDatasourceController';

    public can_use_server_side: boolean = true;
    public can_use_client_side: boolean = true;

    protected cache_qrs_by_theme_module_qr: { [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationQRVO } } } = {};

    public registerDataSource() {
        DataSourcesController.getInstance().registerDataSource(this, [AnimationQRVO.API_TYPE_ID]);
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

    public get_data(param: ThemeModuleDataParamRangesVO): { [theme_id: number]: { [module_id: number]: AnimationQRVO[] } } {
        if (!this.cache_qrs_by_theme_module_qr) {
            return null;
        }

        let theme_ids: number[] = param.theme_id_ranges ? RangeHandler.getInstance().get_all_segmented_elements_from_ranges(param.theme_id_ranges) : [];
        let module_ids: number[] = param.module_id_ranges ? RangeHandler.getInstance().get_all_segmented_elements_from_ranges(param.module_id_ranges) : [];

        let res: { [theme_id: number]: { [module_id: number]: AnimationQRVO[] } } = {};

        for (let theme_id in this.cache_qrs_by_theme_module_qr) {
            if (theme_ids && theme_ids.length > 0 && theme_ids.indexOf(parseInt(theme_id)) == -1) {
                continue;
            }

            if (!res[theme_id]) {
                res[theme_id] = {};
            }

            for (let module_id in this.cache_qrs_by_theme_module_qr[theme_id]) {
                if (module_ids && module_ids.length > 0 && module_ids.indexOf(parseInt(module_id)) == -1) {
                    continue;
                }

                if (!res[theme_id][module_id]) {
                    res[theme_id][module_id] = [];
                }

                for (let qr_id in this.cache_qrs_by_theme_module_qr[theme_id][module_id]) {
                    res[theme_id][module_id].push(this.cache_qrs_by_theme_module_qr[theme_id][module_id][qr_id]);
                }
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

        let qrs: { [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationQRVO } } } = await ModuleAnimation.getInstance().getQRsByThemesAndModules(theme_ids, module_ids);

        for (let theme_id in qrs) {
            if (theme_ids && theme_ids.length > 0 && theme_ids.indexOf(parseInt(theme_id)) == -1) {
                continue;
            }

            if (!this.cache_qrs_by_theme_module_qr[theme_id]) {
                this.cache_qrs_by_theme_module_qr[theme_id] = {};
            }

            for (let module_id in qrs[theme_id]) {
                if (module_ids && module_ids.length > 0 && module_ids.indexOf(parseInt(module_id)) == -1) {
                    continue;
                }

                if (!this.cache_qrs_by_theme_module_qr[theme_id][module_id]) {
                    this.cache_qrs_by_theme_module_qr[theme_id][module_id] = {};
                }

                for (let qr_id in qrs[theme_id][module_id]) {
                    this.cache_qrs_by_theme_module_qr[theme_id][module_id][qr_id] = qrs[theme_id][module_id][qr_id];
                }
            }
        }
    }
}