import IVarDataParamVOBase from './interfaces/IVarDataParamVOBase';
import IVarDataVOBase from './interfaces/IVarDataVOBase';
import VarDataParamControllerBase from './VarDataParamControllerBase';
import VarsController from './VarsController';
import VarConfVOBase from './vos/VarConfVOBase';
import IDataSourceController from '../DataSource/interfaces/IDataSourceController';
import VarDAG from './graph/var/VarDAG';
import VarDAGNode from './graph/var/VarDAGNode';

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

    public async abstract begin_batch(
        vars_params: { [index: string]: IVarDataParamVOBase }, imported_datas: { [var_id: number]: { [param_index: string]: IVarDataVOBase } });
    public async abstract end_batch(
        vars_params: { [index: string]: IVarDataParamVOBase }, imported_datas: { [var_id: number]: { [param_index: string]: IVarDataVOBase } });

    /**
     * Returns the datasources this var depends on
     */
    public abstract getDataSourcesDependencies(): Array<IDataSourceController<any, any>>;

    // /**
    //  * Returns the var_ids that we depend upon (or might depend)
    //  */
    // public abstract getVarsIdsDependencies(): number[];

    // /**
    //  * Returns the dataparam needed to updateData of the given param. Example : Week sum of worked hours needs worked hours of each day of the given week
    //  * @param BATCH_UID
    //  * @param param
    //  * @param params_by_vars_ids gives awereness about the other datas being loaded, giving the possibility to reduce needed deps to the ones not already awaiting. There's no need to handle this, unless there's a clear impact if a data is present or not, changing the number of datas necessary. Best example is the Soldes d'heures where the simple fact that we are already awaiting yesterday's solde can save up to thousands of data deps.
    //  */
    // public async abstract getParamsDependencies(
    //     BATCH_UID: number,
    //     param: TDataParam,
    //     params_by_vars_ids: { [var_id: number]: { [index: string]: IVarDataParamVOBase } },
    //     imported_datas: { [var_id: number]: { [param_index: string]: IVarDataVOBase } }): Promise<IVarDataParamVOBase[]>;

    /**
     * Returns the dataparam needed to updateData of the given param. Example : Week sum of worked hours needs worked hours of each day of the given week
     */
    public async abstract getParamDependencies(
        varDAGNode: VarDAGNode,
        varDAG: VarDAG): Promise<IVarDataParamVOBase[]>;

    // /**
    //  * FIXME TODO : on a pas accès aux imports, mais en fait il sont chargés à cette étape et ça permettrait d'optimiser cette étape. à voir
    //  * @param params
    //  */
    // public getSelfImpacted(params: TDataParam[], registered: { [paramIndex: string]: IVarDataParamVOBase }): TDataParam[] {
    //     return [];
    // }

    public async abstract updateData(varDAGNode: VarDAGNode, varDAG: VarDAG);
}