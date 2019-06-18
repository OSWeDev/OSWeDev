import IDataSourceController from '../../DataSource/interfaces/IDataSourceController';
import VarDAG from '../graph/var/VarDAG';
import VarDAGNode from '../graph/var/VarDAGNode';
import IVarDataParamVOBase from '../interfaces/IVarDataParamVOBase';
import IVarDataVOBase from '../interfaces/IVarDataVOBase';
import SimpleVarConfVO from '../simple_vars/SimpleVarConfVO';
import VarControllerBase from '../VarControllerBase';
import VarDataParamControllerBase from '../VarDataParamControllerBase';
import VarsController from '../VarsController';
import VarsDatasourceFieldsController from './VarsDatasourceFieldsController';

export default abstract class VarDatasourceControllerBase<
    TData extends IVarDataVOBase & TDataParam,
    TDataParam extends IVarDataParamVOBase,
    TDatasourceData extends IVarDataVOBase & TDatasourceDataParam,
    TDatasourceDataParam extends IVarDataParamVOBase> extends VarControllerBase<TData, TDataParam> {

    public constructor(
        protected datasource: IDataSourceController<TDatasourceData, TDatasourceDataParam>,
        protected field_id: string,
        var_data_vo_type: string,
        protected varDataConstructor: () => TData,
        data_param_controller: VarDataParamControllerBase<TDataParam>) {

        super({
            _type: SimpleVarConfVO.API_TYPE_ID,
            id: null,
            var_data_vo_type: var_data_vo_type,
            name: VarsDatasourceFieldsController.getInstance().getName(datasource.name, field_id),
        } as SimpleVarConfVO, data_param_controller);
    }

    /**
     * Returns the datasources this var depends on
     */
    public getDataSourcesDependencies(): Array<IDataSourceController<any, any>> {
        return [this.datasource];
    }

    /**
     * Returns the var_ids that we depend upon (or might depend)
     */
    public getVarsIdsDependencies(): number[] {
        return [];
    }

    /**
     * Returns the dataparam needed to updateData of the given param. Example : Week sum of worked hours needs worked hours of each day of the given week
     */
    public async getParamDependencies(
        varDAGNode: VarDAGNode,
        varDAG: VarDAG): Promise<IVarDataParamVOBase[]> {

        return [];
    }

    public async updateData(varDAGNode: VarDAGNode, varDAG: VarDAG) {

        let param: TDataParam = varDAGNode.param as TDataParam;

        let res: TData = Object.assign(this.varDataConstructor(), param);
        res.var_id = this.varConf.id;

        let datasource_data: IVarDataVOBase = this.datasource.get_data(param as any);

        this.populateVarData(res, datasource_data);

        VarsController.getInstance().setVarData(res, true);
    }

    protected abstract populateVarData(res: TData, datasource_data: IVarDataVOBase);
}