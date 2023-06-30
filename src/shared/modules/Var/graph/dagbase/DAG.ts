import DAGNodeBase from './DAGNodeBase';

export default class DAG<T extends DAGNodeBase> {

    public nb_nodes: number = 0;
    public nodes: { [name: string]: T } = {};

    public roots: { [name: string]: T } = {};
    public leafs: { [name: string]: T } = {};

    public tags: { [tag: string]: { [name: string]: T } } = {};

    public constructor() { }
}
