import IVarDataParamVOBase from './interfaces/IVarDataParamVOBase';
import IVarDataVOBase from './interfaces/IVarDataVOBase';
import VarDataParamControllerBase from './VarDataParamControllerBase';
import VarsController from './VarsController';
import VarConfVOBase from './vos/VarConfVOBase';
import IDataSourceController from '../DataSource/interfaces/IDataSourceController';
import VarDAG from './graph/var/VarDAG';
import VarDAGNode from './graph/var/VarDAGNode';
import TimeSegment from '../DataRender/vos/TimeSegment';
import IDateIndexedVarDataParam from './interfaces/IDateIndexedVarDataParam';
import TimeSegmentHandler from '../../tools/TimeSegmentHandler';
import moment = require('moment');

export default abstract class VarControllerBase<TData extends IVarDataVOBase & TDataParam, TDataParam extends IVarDataParamVOBase> {

    /**
     * Used for every segmented data, defaults to day segmentation. Used for cumuls, and refining use of the param.date_index
     */
    public abstract segment_type: number;

    protected constructor(
        public varConf: VarConfVOBase,
        public varDataParamController: VarDataParamControllerBase<TDataParam>) {
    }

    public async initialize() {
        this.varConf = await VarsController.getInstance().registerVar(this.varConf, this);
        await this.configure_from_json_params();
    }
    public async configure_from_json_params() { }

    // public async abstract begin_batch(
    //     vars_params: { [index: string]: IVarDataParamVOBase }, imported_datas: { [var_id: number]: { [param_index: string]: IVarDataVOBase } });
    // public async abstract end_batch(
    //     vars_params: { [index: string]: IVarDataParamVOBase }, imported_datas: { [var_id: number]: { [param_index: string]: IVarDataVOBase } });

    /**
     * Returns the datasources this var depends on
     */
    public abstract getDataSourcesDependencies(): Array<IDataSourceController<any, any>>;

    /**
     * Returns the datasources this var depends on predeps
     */
    public getDataSourcesPredepsDependencies(): Array<IDataSourceController<any, any>> {
        return null;
    }

    /**
     * Returns the var_ids that we depend upon (or might depend)
     */
    public abstract getVarsIdsDependencies(): number[];

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
    public async abstract updateData(varDAGNode: VarDAGNode, varDAG: VarDAG);

    public async getSegmentedParamDependencies(
        varDAGNode: VarDAGNode,
        varDAG: VarDAG): Promise<IVarDataParamVOBase[]> {

        let res: IVarDataParamVOBase[] = await this.getParamDependencies(varDAGNode, varDAG);

        for (let i in res) {

            // DIRTY : on fait un peu au pif ici un filtre sur le date_index...
            let e = res[i] as IDateIndexedVarDataParam;

            if (!!e.date_index) {
                e.date_index = VarsController.getInstance().getVarControllerById(e.var_id).getTimeSegment(e).dateIndex;
            }
        }

        return res;
    }

    /**
     * NEEDS to go protected
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


    protected getTimeSegment(param: TDataParam): TimeSegment {
        let date_index: string = ((param as any) as IDateIndexedVarDataParam).date_index;

        return TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment(date_index), this.segment_type);
    }
}