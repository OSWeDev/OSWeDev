import IVarDataParamVOBase from './interfaces/IVarDataParamVOBase';
import IVarDataVOBase from './interfaces/IVarDataVOBase';
import VarCacheBase from './VarCacheBase';
import VarDataParamControllerBase from './VarDataParamControllerBase';
import VarsController from './VarsController';
import VarConfVOBase from './vos/VarConfVOBase';

export default abstract class VarControllerBase<TData extends IVarDataVOBase, TDataParam extends IVarDataParamVOBase> {

    protected constructor(
        public varConf: VarConfVOBase,
        public varDataParamController: VarDataParamControllerBase<TDataParam>) {
    }

    public async initialize() {
        this.varConf = await VarsController.getInstance().registerVar(this.varConf, this);
        await this.configure_from_json_params();
    }
    public async configure_from_json_params() { }

    public async abstract begin_batch(BATCH_UID: number, vars_params: { [index: string]: IVarDataParamVOBase });
    public async abstract end_batch(BATCH_UID: number, vars_params: { [index: string]: IVarDataParamVOBase });

    /**
     * Returns the var_ids that we depend upon (or might depend)
     * @param BATCH_UID
     */
    public async abstract getVarsIdsDependencies(BATCH_UID: number): Promise<number[]>;

    /**
     * Returns the dataparam needed to updateData of the given param. Example : Week sum of worked hours needs worked hours of each day of the given week
     * @param BATCH_UID
     * @param param
     */
    public async abstract getParamsDependencies(BATCH_UID: number, param: TDataParam): Promise<TDataParam[]>;

    public async abstract updateData(BATCH_UID: number, param: TDataParam);
}