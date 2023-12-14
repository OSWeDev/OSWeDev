import DAGNodeBase from './DAGNodeBase';

export default class DAG<T extends DAGNodeBase> {

    private static NEXT_UID: number = 0;

    // UID pour ce DAG, qui permettra de séparer les actions / caches en fonction du DAG
    public uid: number = DAG.NEXT_UID++;

    public nb_nodes: number = 0;
    public nodes: { [name: string]: T } = {};

    public roots: { [name: string]: T } = {};
    public leafs: { [name: string]: T } = {};

    public tags: { [tag: string]: { [name: string]: T } } = {};

    public constructor() { }
}
