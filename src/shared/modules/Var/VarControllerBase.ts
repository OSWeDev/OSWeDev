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
        this.varConf.translatable_description = VarsController.getInstance().get_translatable_description_code(this.varConf);
        this.varConf.translatable_name = VarsController.getInstance().get_translatable_name_code(this.varConf);
        this.varConf.translatable_params_desc = VarsController.getInstance().get_translatable_params_desc_code(this.varConf);
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
     * @param params_by_vars_ids gives awereness about the other datas being loaded, giving the possibility to reduce needed deps to the ones not already awaiting. There's no need to handle this, unless there's a clear impact if a data is present or not, changing the number of datas necessary. Best example is the Soldes d'heures where the simple fact that we are already awaiting yesterday's solde can save up to thousands of data deps.
     */
    public async abstract getParamsDependencies(BATCH_UID: number, param: TDataParam, params_by_vars_ids: { [var_id: number]: { [index: string]: TDataParam } }): Promise<TDataParam[]>;

    public async abstract updateData(BATCH_UID: number, param: TDataParam);
}