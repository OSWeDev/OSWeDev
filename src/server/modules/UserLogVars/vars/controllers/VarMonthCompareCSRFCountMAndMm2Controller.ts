import UserVO from '../../../../../shared/modules/AccessPolicy/vos/UserVO';
import NumRange from '../../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../../shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import UserLogVarsNamesHolder from '../../../../../shared/modules/UserLogVars/vars/UserLogVarsNamesHolder';
import UserMinDataRangesVO from '../../../../../shared/modules/UserLogVars/vars/vos/UserMinDataRangesVO';
import VarDAGNode from '../../../../../shared/modules/Var/graph/VarDAGNode';
import VarsController from '../../../../../shared/modules/Var/VarsController';
import VarCacheConfVO from '../../../../../shared/modules/Var/vos/VarCacheConfVO';
import VarConfVO from '../../../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarPixelFieldConfVO from '../../../../../shared/modules/Var/vos/VarPixelFieldConfVO';
import RangeHandler from '../../../../../shared/tools/RangeHandler';
import VarServerControllerBase from '../../../Var/VarServerControllerBase';
import VarMinCSRFCountController from './VarMinCSRFCountController';

export default class VarMonthCompareCSRFCountMAndMm2Controller extends VarServerControllerBase<UserMinDataRangesVO> {

    public static DEP_CSRFCount: string = 'VarMonthCompareCSRFCountMAndMm2Controller.CSRFCount' + VarsController.MANDATORY_DEP_ID_SUFFIX;
    public static DEP_CSRFCountMm2: string = 'VarMonthCompareCSRFCountMAndMm2Controller.CSRFCountMm2' + VarsController.MANDATORY_DEP_ID_SUFFIX;

    public static getInstance(): VarMonthCompareCSRFCountMAndMm2Controller {
        if (!VarMonthCompareCSRFCountMAndMm2Controller.instance) {
            VarMonthCompareCSRFCountMAndMm2Controller.instance = new VarMonthCompareCSRFCountMAndMm2Controller();
        }
        return VarMonthCompareCSRFCountMAndMm2Controller.instance;
    }

    protected static instance: VarMonthCompareCSRFCountMAndMm2Controller = null;

    protected constructor() {
        super(
            new VarConfVO(UserLogVarsNamesHolder.VarMonthCompareCSRFCountMAndMm2Controller_VAR_NAME, UserMinDataRangesVO.API_TYPE_ID, {
                ts_ranges: TimeSegment.TYPE_MONTH,
            }, null).set_pixel_activated(true).set_pixel_never_delete(true).set_pixel_fields([
                (new VarPixelFieldConfVO())
                    .set_vo_api_type_id(UserVO.API_TYPE_ID)
                    .set_vo_field_id('id')
                    .set_param_field_id('user_id_ranges')
                    .set_range_type(NumRange.RANGE_TYPE)
                    .set_segmentation_type(NumSegment.TYPE_INT)
            ]),
            { 'fr-fr': '% nb chargements M vs M-2' },
            {
                'fr-fr': 'Ratio du nombre de lancement de l\'application réalisés par les utilisateurs sélectionnés sur la période sélectionnée en comparaison à la période M-2.'
            },
            {},
            {});

        this.optimization__has_no_imports = true;
    }

    public getVarCacheConf(): VarCacheConfVO {
        let res: VarCacheConfVO = new VarCacheConfVO();
        res.var_id = this.varConf.id;
        res.cache_startegy = VarCacheConfVO.VALUE_CACHE_STRATEGY_PIXEL;
        return res;
    }

    public getVarControllerDependencies(): { [dep_name: string]: VarServerControllerBase<any> } {
        return {
            [VarMonthCompareCSRFCountMAndMm2Controller.DEP_CSRFCount]: VarMinCSRFCountController.getInstance(),
            [VarMonthCompareCSRFCountMAndMm2Controller.DEP_CSRFCountMm2]: VarMinCSRFCountController.getInstance()
        };
    }

    public getParamDependencies(varDAGNode: VarDAGNode): { [dep_id: string]: UserMinDataRangesVO } {

        let DEP_CSRFCountMm2 = UserMinDataRangesVO.cloneFromVarName<UserMinDataRangesVO, UserMinDataRangesVO>(
            varDAGNode.var_data as UserMinDataRangesVO, VarMinCSRFCountController.getInstance().varConf.name, true);
        DEP_CSRFCountMm2.ts_ranges = RangeHandler.get_ranges_shifted_by_x_segments(
            DEP_CSRFCountMm2.ts_ranges, -2, TimeSegment.TYPE_MONTH);
        DEP_CSRFCountMm2.rebuild_index();

        return {
            [VarMonthCompareCSRFCountMAndMm2Controller.DEP_CSRFCount]: UserMinDataRangesVO.cloneFromVarName<UserMinDataRangesVO, UserMinDataRangesVO>(
                varDAGNode.var_data as UserMinDataRangesVO, VarMinCSRFCountController.getInstance().varConf.name, true),
            [VarMonthCompareCSRFCountMAndMm2Controller.DEP_CSRFCountMm2]: DEP_CSRFCountMm2
        };
    }

    public async get_invalid_params_intersectors_from_dep<T extends VarDataBaseVO>(dep_id: string, intersectors: T[]): Promise<UserMinDataRangesVO[]> {

        switch (dep_id) {
            case VarMonthCompareCSRFCountMAndMm2Controller.DEP_CSRFCount:
                return UserMinDataRangesVO.cloneArrayFrom(intersectors as any as UserMinDataRangesVO[], this.varConf.name);

            case VarMonthCompareCSRFCountMAndMm2Controller.DEP_CSRFCountMm2:
                let DEP_VolumeRealiseAM1s = UserMinDataRangesVO.cloneArrayFrom<UserMinDataRangesVO, UserMinDataRangesVO>(
                    intersectors as any as UserMinDataRangesVO[], this.varConf.name, true);
                DEP_VolumeRealiseAM1s.forEach((DEP_VolumeRealiseAM1) => {
                    DEP_VolumeRealiseAM1.ts_ranges = RangeHandler.get_ranges_shifted_by_x_segments(DEP_VolumeRealiseAM1.ts_ranges, 2, TimeSegment.TYPE_MONTH);
                    DEP_VolumeRealiseAM1.rebuild_index();
                });

                return DEP_VolumeRealiseAM1s;
        }

        return null;
    }

    protected getValue(varDAGNode: VarDAGNode): number {

        let ratio: number = ((varDAGNode.outgoing_deps[VarMonthCompareCSRFCountMAndMm2Controller.DEP_CSRFCount].outgoing_node as VarDAGNode).var_data as UserMinDataRangesVO).value;
        let ratio_mm2: number = ((varDAGNode.outgoing_deps[VarMonthCompareCSRFCountMAndMm2Controller.DEP_CSRFCountMm2].outgoing_node as VarDAGNode).var_data as UserMinDataRangesVO).value;

        if ((!ratio_mm2) ||
            (ratio == null) || (typeof ratio === 'undefined')) {
            return null;
        }

        return (ratio / ratio_mm2) - 1;
    }
}