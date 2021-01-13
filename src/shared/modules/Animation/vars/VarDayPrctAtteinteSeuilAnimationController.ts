import TimeSegment from '../../DataRender/vos/TimeSegment';
import IDataSourceController from '../../DataSource/interfaces/IDataSourceController';
import VarDAG from '../../Var/graph/var/VarDAG';
import VarDAGNode from '../../Var/graph/var/VarDAGNode';
import IVarDataParamVOBase from '../../Var/interfaces/IVarDataParamVOBase';
import SimpleVarConfVO from '../../Var/simple_vars/SimpleVarConfVO';
import VarControllerBase from '../../Var/VarControllerBase';
import AnimationController from '../AnimationController';
import AnimationParamsRangesDatasourceController from '../datasources/AnimationParamsRangesDatasourceController';
import QRsRangesDatasourceController from '../datasources/QRsRangesDatasourceController';
import UQRsRangesDatasourceController from '../datasources/UQRsRangesDatasourceController';
import ModuleAnimation from '../ModuleAnimation';
import ThemeModuleDataParamRangesController from '../params/theme_module/ThemeModuleDataParamRangesController';
import ThemeModuleDataParamRangesVO from '../params/theme_module/ThemeModuleDataParamRangesVO';
import ThemeModuleDataRangesVO from '../params/theme_module/ThemeModuleDataRangesVO';
import AnimationQRVO from '../vos/AnimationQRVO';
import AnimationUserQRVO from '../vos/AnimationUserQRVO';

export default class VarDayPrctAtteinteSeuilAnimationController extends VarControllerBase<ThemeModuleDataRangesVO, ThemeModuleDataParamRangesVO> {

    public static VAR_NAME: string = 'VarDayPrctAtteinteSeuilAnimationController';

    public static getInstance(): VarDayPrctAtteinteSeuilAnimationController {
        if (!VarDayPrctAtteinteSeuilAnimationController.instance) {
            VarDayPrctAtteinteSeuilAnimationController.instance = new VarDayPrctAtteinteSeuilAnimationController();
        }
        return VarDayPrctAtteinteSeuilAnimationController.instance;
    }

    protected static instance: VarDayPrctAtteinteSeuilAnimationController = null;

    public segment_type: number = TimeSegment.TYPE_DAY;

    protected constructor(conf: SimpleVarConfVO = null, controller: ThemeModuleDataParamRangesController = null) {
        super(
            conf ? conf : {
                _type: SimpleVarConfVO.API_TYPE_ID,
                id: null,
                var_data_vo_type: ThemeModuleDataRangesVO.API_TYPE_ID,
                name: VarDayPrctAtteinteSeuilAnimationController.VAR_NAME,
            } as SimpleVarConfVO,
            controller ? controller : ThemeModuleDataParamRangesController.getInstance()
        );
    }

    /**
     * Returns the datasources this var depends on
     */
    public getDataSourcesDependencies(): Array<IDataSourceController<any, any>> {
        return [
            AnimationParamsRangesDatasourceController.getInstance(),
            QRsRangesDatasourceController.getInstance(),
            UQRsRangesDatasourceController.getInstance(),
        ];
    }

    /**
     * Returns the datasources this var depends on predeps
     */
    public getDataSourcesPredepsDependencies(): Array<IDataSourceController<any, any>> {
        return [];
    }

    /**
     * Returns the var_ids that we depend upon (or might depend)
     * @param BATCH_UID
     */
    public getVarsIdsDependencies(): number[] {
        return [];
    }


    /**
     * Returns the dataparam needed to updateData of the given param. Example : Week sum of worked hours needs worked hours of each day of the given week
     * @param BATCH_UID
     * @param param
     */
    public getParamDependencies(varDAGNode: VarDAGNode, varDAG: VarDAG): IVarDataParamVOBase[] {
        return [];
    }

    /**
     * Fonction qui prépare la mise à jour d'une data
     */
    public updateData(varDAGNode: VarDAGNode, varDAG: VarDAG): ThemeModuleDataRangesVO {

        let param: ThemeModuleDataParamRangesVO = varDAGNode.param as ThemeModuleDataParamRangesVO;
        let res: ThemeModuleDataRangesVO = ThemeModuleDataParamRangesController.getInstance().cloneParam(param) as ThemeModuleDataRangesVO;
        res.value = null;

        let qrs_by_theme_module: { [theme_id: number]: { [module_id: number]: AnimationQRVO[] } } = QRsRangesDatasourceController.getInstance().get_data(param);
        let uqrs_by_theme_module_qr: { [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationUserQRVO } } } = UQRsRangesDatasourceController.getInstance().get_data_by_qr_ids(param);
        let animation_params: { [param_name: string]: any } = AnimationParamsRangesDatasourceController.getInstance().get_data(param);

        let cpt_modules: number = 0;
        let cpt_modules_ok: number = 0;

        for (let theme_id in qrs_by_theme_module) {
            for (let module_id in qrs_by_theme_module[theme_id]) {
                cpt_modules++;

                if (!qrs_by_theme_module[theme_id][module_id].length) {
                    continue;
                }

                let cpt_ok: number = 0;

                for (let i in qrs_by_theme_module[theme_id][module_id]) {
                    let qr: AnimationQRVO = qrs_by_theme_module[theme_id][module_id][i];

                    let uqr: AnimationUserQRVO = null;

                    if (uqrs_by_theme_module_qr && uqrs_by_theme_module_qr[theme_id] && uqrs_by_theme_module_qr[theme_id][module_id]) {
                        uqr = uqrs_by_theme_module_qr[theme_id][module_id][qr.id];
                    }

                    if (AnimationController.getInstance().isUserQROk(qr, uqr)) {
                        cpt_ok++;
                    }
                }

                let prct_reussite: number = cpt_ok / qrs_by_theme_module[theme_id][module_id].length;

                if (prct_reussite >= animation_params[ModuleAnimation.PARAM_NAME_SEUIL_VALIDATION_MODULE_PRCT]) {
                    cpt_modules_ok++;
                }
            }
        }

        res.datafound = !!cpt_modules;

        if (!res.datafound) {
            return res;
        }

        res.value = cpt_modules_ok / cpt_modules;

        return res;
    }
}
