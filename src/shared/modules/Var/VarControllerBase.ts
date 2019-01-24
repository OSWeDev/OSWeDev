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
    }

    public async abstract begin_batch(BATCH_UID: number, vars_params: TDataParam[]);
    public async abstract end_batch(BATCH_UID: number, vars_params: TDataParam[]);

    /**
     * Returns the dataparam needed to updateData of the given param. Example : Week sum of worked hours needs worked hours of each day of the given week
     * @param BATCH_UID
     * @param param
     */
    public async abstract getDependencies(BATCH_UID: number, param: TDataParam): Promise<TDataParam[]>;

    public async abstract updateData(BATCH_UID: number, param: TDataParam);
}