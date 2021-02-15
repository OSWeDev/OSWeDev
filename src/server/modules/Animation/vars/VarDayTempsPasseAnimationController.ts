import TimeSegment from '../../DataRender/vos/TimeSegment';
import IDataSourceController from '../../DataSource/interfaces/IDataSourceController';
import VarDAG from '../../Var/graph/var/VarDAG';
import VarDAGNode from '../../Var/graph/var/VarDAGNode';
import IVarDataParamVOBase from '../../Var/interfaces/IVarDataParamVOBase';
import SimpleVarConfVO from '../../Var/simple_vars/SimpleVarConfVO';
import VarControllerBase from '../../Var/VarControllerBase';
import AnimationParamsRangesDatasourceController from '../datasources/AnimationParamsRangesDatasourceController';
import UMsRangesDatasourceController from '../datasources/UMsRangesDatasourceController';
import ThemeModuleDataParamRangesController from '../params/theme_module/ThemeModuleDataParamRangesController';
import ThemeModuleDataParamRangesVO from '../params/theme_module/ThemeModuleDataParamRangesVO';
import ThemeModuleDataRangesVO from '../params/theme_module/ThemeModuleDataRangesVO';
import AnimationParametersVO from '../vos/AnimationParametersVO';
import AnimationUserModuleVO from '../vos/AnimationUserModuleVO';

export default class VarDayTempsPasseAnimationController extends VarControllerBase<ThemeModuleDataRangesVO, ThemeModuleDataParamRangesVO> {

    public static VAR_NAME: string = 'VarDayTempsPasseAnimationController';

    public static getInstance(): VarDayTempsPasseAnimationController {
        if (!VarDayTempsPasseAnimationController.instance) {
            VarDayTempsPasseAnimationController.instance = new VarDayTempsPasseAnimationController();
        }
        return VarDayTempsPasseAnimationController.instance;
    }

    protected static instance: VarDayTempsPasseAnimationController = null;

    public segment_type: number = TimeSegment.TYPE_DAY;

    protected constructor(conf: SimpleVarConfVO = null, controller: ThemeModuleDataParamRangesController = null) {
        super(
            conf ? conf : {
                _type: SimpleVarConfVO.API_TYPE_ID,
                id: null,
                var_data_vo_type: ThemeModuleDataRangesVO.API_TYPE_ID,
                name: VarDayTempsPasseAnimationController.VAR_NAME,
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

        let ums_by_module_user: { [module_id: number]: { [user_id: number]: AnimationUserModuleVO } } = UMsRangesDatasourceController.getInstance().get_data(param);
        let animation_params: AnimationParametersVO = AnimationParamsRangesDatasourceController.getInstance().get_data(param);

        let cpt_ums: number = 0;
        let temps_total_passe: number = 0;

        for (let module_id in ums_by_module_user) {
            for (let user_id in ums_by_module_user[module_id]) {
                let aum: AnimationUserModuleVO = ums_by_module_user[module_id][user_id];

                if (!aum.end_date || !aum.start_date) {
                    continue;
                }

                let temps_passe: number = aum.end_date.diff(aum.start_date, 'hours', true);

                if (animation_params && animation_params.limite_temps_passe_module) {
                    if (temps_passe > animation_params.limite_temps_passe_module) {
                        continue;
                    }
                }

                cpt_ums++;

                temps_total_passe += temps_passe;
            }
        }

        res.datafound = !!cpt_ums && !!temps_total_passe;

        if (!res.datafound) {
            return res;
        }

        res.value = temps_total_passe / cpt_ums;

        return res;
    }
}
