import VarDAGNode from './VarDAGNode';

export default class VarDAG {

    public nb_nodes: number = 0;
    public nodes: { [name: string]: VarDAGNode } = {};

    public roots: { [name: string]: VarDAGNode } = {};
    public leafs: { [name: string]: VarDAGNode } = {};

    public constructor() { }
}
