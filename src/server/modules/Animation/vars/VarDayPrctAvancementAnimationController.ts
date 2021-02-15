import VarServerControllerBase from '../../../../server/modules/Var/VarServerControllerBase';
import TimeSegment from '../../DataRender/vos/TimeSegment';
import QRsRangesDatasourceController from '../datasources/QRsRangesDatasourceController';
import UQRsRangesDatasourceController from '../datasources/UQRsRangesDatasourceController';
import ThemeModuleDataRangesVO from '../params/theme_module/ThemeModuleDataRangesVO';
import AnimationQRVO from '../vos/AnimationQRVO';
import AnimationUserQRVO from '../vos/AnimationUserQRVO';

export default class VarDayPrctAvancementAnimationController extends VarServerControllerBase<ThemeModuleDataRangesVO, ThemeModuleDataParamRangesVO> {

    public static VAR_NAME: string = 'VarDayPrctAvancementAnimationController';

    public static getInstance(): VarDayPrctAvancementAnimationController {
        if (!VarDayPrctAvancementAnimationController.instance) {
            VarDayPrctAvancementAnimationController.instance = new VarDayPrctAvancementAnimationController();
        }
        return VarDayPrctAvancementAnimationController.instance;
    }

    protected static instance: VarDayPrctAvancementAnimationController = null;

    public segment_type: number = TimeSegment.TYPE_DAY;

    protected constructor(conf: SimpleVarConfVO = null, controller: ThemeModuleDataParamRangesController = null) {
        super(
            conf ? conf : {
                _type: SimpleVarConfVO.API_TYPE_ID,
                id: null,
                var_data_vo_type: ThemeModuleDataRangesVO.API_TYPE_ID,
                name: VarDayPrctAvancementAnimationController.VAR_NAME,
            } as SimpleVarConfVO,
            controller ? controller : ThemeModuleDataParamRangesController.getInstance()
        );
    }

    /**
     * Returns the datasources this var depends on
     */
    public getDataSourcesDependencies(): Array<IDataSourceController<any, any>> {
        return [
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
        let uqrs_by_theme_module: { [theme_id: number]: { [module_id: number]: AnimationUserQRVO[] } } = UQRsRangesDatasourceController.getInstance().get_data(param);

        let cpt_qrs: number = 0;
        let cpt_uqrs: number = 0;

        for (let theme_id in qrs_by_theme_module) {
            for (let module_id in qrs_by_theme_module[theme_id]) {
                cpt_qrs += qrs_by_theme_module[theme_id][module_id].length;
            }
        }

        for (let theme_id in uqrs_by_theme_module) {
            for (let module_id in uqrs_by_theme_module[theme_id]) {
                cpt_uqrs += uqrs_by_theme_module[theme_id][module_id].length;
            }
        }

        res.datafound = !!cpt_qrs;

        if (!res.datafound) {
            return res;
        }

        res.value = cpt_uqrs / cpt_qrs;

        return res;
    }
}
