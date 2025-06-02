import DAG from '../../../Var/graph/dagbase/DAG';
import WidgetFilterDependancyDAGNode from './WidgetFilterDependancyDAGNode';

export default class WidgetFilterDependancyDAG extends DAG<WidgetFilterDependancyDAGNode> {

    public constructor() {
        super();
    }
}