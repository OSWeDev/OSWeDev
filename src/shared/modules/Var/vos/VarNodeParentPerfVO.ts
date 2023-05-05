import IDistantVOBase from '../../IDistantVOBase';
import VarDAGNode from '../graph/VarDAGNode';

export default class VarNodeParentPerfVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "var_node_parent_perf";

    /**
     * @param node null si la perf appartient à var_dag.perfs ou le nom du node lié
     * @param perf_name le nom de la perf
     * @returns
     */
    public static create_new(node: VarDAGNode, perf_name: string): VarNodeParentPerfVO {
        let res = new VarNodeParentPerfVO();
        res.node = node;
        res.perf_name = perf_name;
        return res;
    }

    public _type: string = VarNodeParentPerfVO.API_TYPE_ID;
    public id: number;

    public node: VarDAGNode = null;
    public perf_name: string = null;

    public constructor() { }
}