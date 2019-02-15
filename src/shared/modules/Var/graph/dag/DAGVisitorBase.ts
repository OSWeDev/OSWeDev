import DAGNode from './DAGNode';

export default class DAGVisitorBase {

    public static VISIT_TOP_DOWN: boolean = true;
    public static VISIT_DOWN_UP: boolean = false;

    public constructor(public top_down: boolean) { }

    /**
     * Le visiteur doit renvoyer true si il doit continuer, false sinon
     */
    public visit(node: DAGNode, path: string[]): boolean {
        return false;
    }
}