import TSRange from '../../../../../shared/modules/DataRender/vos/TSRange';
import ITSRangesVarDataParam from '../../../../../shared/modules/Var/interfaces/ITSRangesVarDataParam';

export default class FakeDataParamVO implements ITSRangesVarDataParam {

    public static API_TYPE_ID: string = "fake_data_param_vo";

    public id: number;
    public _type: string = FakeDataParamVO.API_TYPE_ID;

    public ts_ranges: TSRange[];

    public var_id: number;
}