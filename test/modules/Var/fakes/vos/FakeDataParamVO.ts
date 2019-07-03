import IDateIndexedVarDataParam from '../../../../../src/shared/modules/Var/interfaces/IDateIndexedVarDataParam';

export default class FakeDataParamVO implements IDateIndexedVarDataParam {

    public static API_TYPE_ID: string = "fake_data_param_vo";

    public id: number;
    public _type: string = FakeDataParamVO.API_TYPE_ID;

    public date_index: string;
    public fake_y_id: number;
    public fake_z_id: number;

    public var_id: number;
    public json_params: string;
}