import IDistantVOBase from '../../IDistantVOBase';

export default class VarComputeTimeLearnBaseVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "var_cmptmlearn";

    public _type: string = VarComputeTimeLearnBaseVO.API_TYPE_ID;
    public id: number;

    public indexes: string[];
    public computation_duration: number;
    public computation_start_time: number;
}