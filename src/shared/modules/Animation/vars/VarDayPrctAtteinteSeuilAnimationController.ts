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
import UMsRangesDatasourceController from '../datasources/UMsRangesDatasourceController';
import UQRsRangesDatasourceController from '../datasources/UQRsRangesDatasourceController';
import ThemeModuleDataParamRangesController from '../params/theme_module/ThemeModuleDataParamRangesController';
import ThemeModuleDataParamRangesVO from '../params/theme_module/ThemeModuleDataParamRangesVO';
import ThemeModuleDataRangesVO from '../params/theme_module/ThemeModuleDataRangesVO';
import AnimationParametersVO from '../vos/AnimationParametersVO';
import AnimationQRVO from '../vos/AnimationQRVO';
import AnimationUserModuleVO from '../vos/AnimationUserModuleVO';
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
            UMsRangesDatasourceController.getInstance(),
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
        let uqrs_by_theme_module_qr: { [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationUserQRVO[] } } } = UQRsRangesDatasourceController.getInstance().get_data_by_qr_ids(param);
        let animation_params: AnimationParametersVO = AnimationParamsRangesDatasourceController.getInstance().get_data(param);
        let ums_by_module_user: { [module_id: number]: { [user_id: number]: AnimationUserModuleVO } } = UMsRangesDatasourceController.getInstance().get_data(param);

        let cpt_modules: number = 0;
        let cpt_modules_ok: number = 0;

        for (let theme_id in qrs_by_theme_module) {
            for (let module_id in qrs_by_theme_module[theme_id]) {
                cpt_modules++;

                if (!qrs_by_theme_module[theme_id][module_id].length) {
                    continue;
                }

                let cpt_ok: number = 0;
                let nb_user_has_finished: number = 0;
                let user_id_check: { [user_id: number]: boolean } = {};

                for (let i in qrs_by_theme_module[theme_id][module_id]) {
                    let qr: AnimationQRVO = qrs_by_theme_module[theme_id][module_id][i];

                    if (uqrs_by_theme_module_qr && uqrs_by_theme_module_qr[theme_id] && uqrs_by_theme_module_qr[theme_id][module_id]) {
                        for (let j in uqrs_by_theme_module_qr[theme_id][module_id][qr.id]) {
                            let uqr: AnimationUserQRVO = uqrs_by_theme_module_qr[theme_id][module_id][qr.id][j];

                            if (ums_by_module_user && ums_by_module_user[module_id] && ums_by_module_user[module_id][uqr.user_id] && ums_by_module_user[module_id][uqr.user_id].end_date) {
                                if (!user_id_check[uqr.user_id]) {
                                    nb_user_has_finished++;
                                    user_id_check[uqr.user_id] = true;
                                }
                            } else {
                                continue;
                            }

                            if (AnimationController.getInstance().isUserQROk(qr, uqr)) {
                                cpt_ok++;
                            }
                        }
                    }
                }

                let total_qrs: number = (qrs_by_theme_module[theme_id][module_id].length * nb_user_has_finished);

                let prct_reussite: number = total_qrs ? (cpt_ok / total_qrs) : 0;

                if (prct_reussite >= animation_params.seuil_validation_module_prct) {
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
