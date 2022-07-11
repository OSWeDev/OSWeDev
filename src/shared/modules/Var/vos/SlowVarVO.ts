import INamedVO from '../../../interfaces/INamedVO';
import VarNodePerfElementVO from './VarNodePerfElementVO';

export default class SlowVarVO implements INamedVO {

    public static API_TYPE_ID: string = "slow_var";

    public static TYPE_LABELS: string[] = ['slow_var.type.needs_test', 'slow_var.type.denied', 'slow_var.type.testing'];
    public static TYPE_NEEDS_TEST: number = 0;
    public static TYPE_DENIED: number = 1;
    public static TYPE_TESTING: number = 2;

    public id: number;
    public _type: string = SlowVarVO.API_TYPE_ID;

    public name: string;
    public type: number;

    public create_tree: VarNodePerfElementVO;
    public load_nodes_datas: VarNodePerfElementVO;
    public compute_node: VarNodePerfElementVO;

    public var_id: number;
}