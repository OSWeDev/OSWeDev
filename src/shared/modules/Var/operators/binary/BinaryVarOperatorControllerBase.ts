import TimeSegmentHandler from '../../../../tools/TimeSegmentHandler';
import IDataSourceController from '../../../DataSource/interfaces/IDataSourceController';
import VarDAG from '../../graph/var/VarDAG';
import VarDAGNode from '../../graph/var/VarDAGNode';
import IVarDataVOBase from '../../interfaces/IVarDataVOBase';
import SimpleVarConfVO from '../../simple_vars/SimpleVarConfVO';
import VarControllerBase from '../../VarControllerBase';
import VarsController from '../../VarsController';
import BinaryVarOperatorsController from './BinaryVarOperatorsController';

export default abstract class BinaryVarOperatorControllerBase<
    TDataLeft extends IVarDataVOBase,
    TDataRight extends IVarDataVOBase,
    TData extends IVarDataVOBase> extends VarControllerBase<TData> {

    public segment_type: number = null;

    public constructor(
        protected left_var: VarControllerBase<TDataLeft>,
        protected operator_name: string,
        protected right_var: VarControllerBase<TDataRight>,
        var_data_api_type_id: string,
        protected varDataConstructor: () => TData) {
        super({
            _type: SimpleVarConfVO.API_TYPE_ID,
            id: null,
            var_data_vo_type: var_data_api_type_id,
            name: BinaryVarOperatorsController.getInstance().getName(left_var.varConf.name, operator_name, right_var.varConf.name),
        } as SimpleVarConfVO);

        this.segment_type = TimeSegmentHandler.getInstance().getSmallestTimeSegmentationType(left_var.segment_type, right_var.segment_type);
    }

    public getDataSourcesDependencies(): Array<IDataSourceController<any>> {
        return [];
    }

    /**
     * Returns the var_ids that we depend upon (or might depend)
     */
    public getVarsIdsDependencies(): number[] {
        return [this.left_var.varConf.id, this.right_var.varConf.id];
    }

    public updateData(varDAGNode: VarDAGNode, varDAG: VarDAG): TData {

        let param: TData = varDAGNode.param as TData;

        let res: TData = Object.assign(this.varDataConstructor(), param);
        res.var_id = this.varConf.id;

        let data_left: TDataLeft = VarsController.getInstance().getVarData(this.get_left_param(varDAGNode, varDAG), true);
        let data_right: TDataRight = VarsController.getInstance().getVarData(this.get_right_param(varDAGNode, varDAG), true);

        res.value = this.calc_value(data_left, data_right);
        return res;
    }

    /**
     * Returns the dataparam needed to updateData of the given param. Example : Week sum of worked hours needs worked hours of each day of the given week
     */
    public getParamDependencies(
        varDAGNode: VarDAGNode,
        varDAG: VarDAG): IVarDataVOBase[] {

        return [this.get_left_param(varDAGNode, varDAG), this.get_right_param(varDAGNode, varDAG)];
    }

    protected abstract calc_value(left_data: TDataLeft, right_data: TDataRight): number;

    protected get_left_param(varDAGNode: VarDAGNode, varDAG: VarDAG): TDataLeft {
        let param: TData = varDAGNode.param as TData;

        let res: TDataLeft = Object.assign({}, param) as any;
        res.var_id = this.left_var.varConf.id;
        return res;
    }

    protected get_right_param(varDAGNode: VarDAGNode, varDAG: VarDAG): TDataRight {
        let param: TData = varDAGNode.param as TData;

        let res: TDataRight = Object.assign({}, param) as any;
        res.var_id = this.right_var.varConf.id;
        return res;
    }
}