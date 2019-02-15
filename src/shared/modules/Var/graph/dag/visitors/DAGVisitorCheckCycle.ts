import DAGNode from '../DAGNode';
import DAGVisitorBase from '../DAGVisitorBase';

export default class DAGVisitorCheckCycle extends DAGVisitorBase {

    public has_cycle: boolean = false;

    // On check toujours en top => bottom, on part du principe que l'arbre est cohérent (les liens top / bottom sont isos bottom top)
    public constructor(protected nodeNameChecked: string) {
        super(true);
    }

    public visit(node: DAGNode, path: string[]): boolean {
        if (node.name === this.nodeNameChecked) {
            this.has_cycle = true;
            console.error("cycle detected: " + this.nodeNameChecked + " <- " + path.join(" <- "));
            return false;
        }
        return true;
    }
}