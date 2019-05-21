import DAG from '../DAG';
import DAGNode from '../DAGNode';
import DAGVisitorBase from '../DAGVisitorBase';

export default class DAGVisitorCheckCycle<TDag extends DAG<any>> extends DAGVisitorBase<TDag> {

    public has_cycle: boolean = false;

    // On check toujours en top => bottom, on part du principe que l'arbre est cohérent (les liens top / bottom sont isos bottom top)
    public constructor(protected nodeNameChecked: string, dag: TDag) {
        super(true, dag);
    }

    public async visit(node: DAGNode, path: string[]): Promise<boolean> {
        if (node.name === this.nodeNameChecked) {
            this.has_cycle = true;
            console.error("cycle detected: " + this.nodeNameChecked + " <- " + path.join(" <- "));
            return false;
        }
        return true;
    }
}