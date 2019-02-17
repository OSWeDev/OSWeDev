import DAGNode from './DAGNode';
import DAG from './DAG';

export default class DAGVisitorBase<TDAG extends DAG<any>> {

    public static VISIT_TOP_DOWN: boolean = true;
    public static VISIT_DOWN_UP: boolean = false;

    public constructor(public top_down: boolean, protected dag: TDAG) { }

    /**
     * Le visiteur doit renvoyer true si il doit continuer, false sinon
     */
    public async visit(node: DAGNode, path: string[]): Promise<boolean> {
        return false;
    }
}