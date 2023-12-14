import DAG from '../../../../shared/modules/Var/graph/dagbase/DAG';
import VarCtrlDAGNode from './VarCtrlDAGNode';

export default class VarCtrlDAG extends DAG<VarCtrlDAGNode> {

    public constructor() {
        super();
    }
}