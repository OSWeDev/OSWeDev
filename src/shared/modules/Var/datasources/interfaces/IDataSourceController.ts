import IVarDataVOBase from '../../interfaces/IVarDataVOBase';
import IVarDataParamVOBase from '../../interfaces/IVarDataParamVOBase';

export default interface IDateIndexedVarDataParam {
    load_for_batch(
        BATCH_UID: number,
        vars_params: { [index: string]: IVarDataParamVOBase },
        imported_datas: { [var_id: number]: { [param_index: string]: IVarDataVOBase } }): Promise<void>;

    get_data(BATCH_UID: number, param: IVarDataParamVOBase): any;

    clean_for_batch(
        BATCH_UID: number,
        vars_params: { [index: string]: IVarDataParamVOBase },
        imported_datas: { [var_id: number]: { [param_index: string]: IVarDataVOBase } }): Promise<void>;
}