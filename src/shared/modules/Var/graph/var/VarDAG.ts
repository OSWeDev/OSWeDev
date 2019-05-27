import DAG from '../dag/DAG';
import VarDAGNode from './VarDAGNode';
import VarDAGVisitorMarkForDeletion from './visitors/VarDAGVisitorMarkForDeletion';
import IVarDataParamVOBase from '../../interfaces/IVarDataParamVOBase';
import VarsController from '../../VarsController';
import ObjectHandler from '../../../../tools/ObjectHandler';

export default class VarDAG extends DAG<VarDAGNode> {

    public static VARDAG_MARKER_REGISTERED: string = 'REGISTERED';

    public static VARDAG_MARKER_IMPORTED_DATA: string = 'IMPORTED_DATA';

    public static VARDAG_MARKER_VAR_ID: string = 'VAR_ID_';
    public static VARDAG_MARKER_DATASOURCE_NAME: string = 'DATASOURCE_NAME_';

    public static VARDAG_MARKER_NEEDS_DEPS_LOADING: string = 'NEEDS_DEPS_LOADING';
    public static VARDAG_MARKER_DEPS_LOADED: string = 'DEPS_LOADED';

    public static VARDAG_MARKER_DATASOURCES_LIST_LOADED: string = 'DATASOURCES_LIST_LOADED';

    public static VARDAG_MARKER_NEEDS_PREDEPS_DATASOURCE_LOADING: string = 'NEEDS_PREDEPS_DATASOURCE_LOADING';
    public static VARDAG_MARKER_PREDEPS_DATASOURCE_LOADED: string = 'PREDEPS_DATASOURCE_LOADED';

    // public static VARDAG_MARKER_BATCH_DATASOURCE_LOADED: string = 'BATCH_DATASOURCE_LOADED';
    // public static VARDAG_MARKER_BATCH_DATASOURCE_UNLOADED: string = 'BATCH_DATASOURCE_UNLOADED';

    public static VARDAG_MARKER_COMPUTED: string = 'COMPUTED';
    public static VARDAG_MARKER_COMPUTED_AT_LEAST_ONCE: string = 'COMPUTED_AT_LEAST_ONCE';

    public static VARDAG_MARKER_MARKED_FOR_DELETION: string = 'MARKED_FOR_DELETION';
    public static VARDAG_MARKER_MARKED_FOR_UPDATE: string = 'MARKED_FOR_UPDATE';
    public static VARDAG_MARKER_ONGOING_UPDATE: string = 'ONGOING_UPDATE';
    public static VARDAG_MARKER_MARKED_FOR_NEXT_UPDATE: string = 'MARKED_FOR_NEXT_UPDATE';

    public dependencies_heatmap_lvl_0: number = 0;
    public dependencies_heatmap_lvl_1: number = null;
    public dependencies_heatmap_lvl_2: number = null;
    public dependencies_heatmap_lvl_3: number = null;
    public dependencies_heatmap_lvl_4: number = null;
    public dependencies_heatmap_lvl_5: number = null;
    public dependencies_heatmap_max: number = null;

    private dependencies_heatmap_version: number = 0;


    public registerParams(params: IVarDataParamVOBase[]) {
        for (let i in params) {
            let param: IVarDataParamVOBase = params[i];
            let index: string = VarsController.getInstance().getIndex(param);

            if (!index) {
                continue;
            }

            let node: VarDAGNode = this.nodes[index];

            if (!node) {

                // On ajoute le noeud à l'arbre
                // Quand on ajoute un noeud, on doit demander à charger ses deps dès que possible
                this.add(index, param);
                node = this.nodes[index];
            }

            node.addMarker(VarDAG.VARDAG_MARKER_REGISTERED, this);
        }
    }

    public unregisterIndexes(indexes: string[]) {
        for (let i in indexes) {
            let index: string = indexes[i];
            let node: VarDAGNode = this.nodes[index];

            if (!!node) {
                node.removeMarker(VarDAG.VARDAG_MARKER_REGISTERED, this);
            }
        }
    }

    public refreshDependenciesHeatmap() {

        for (let i in this.nodes) {
            let node = this.nodes[i];

            node.dependencies_count = null;
        }

        for (let i in this.leafs) {
            let node = this.leafs[i];

            node.dependencies_count = 1;

            if (this.dependencies_heatmap_max == null) {
                this.dependencies_heatmap_max = 1;
            }

            let nodes_to_visit: { [node_name: string]: VarDAGNode } = node.incoming as { [node_name: string]: VarDAGNode };

            while (nodes_to_visit && ObjectHandler.getInstance().hasAtLeastOneAttribute(nodes_to_visit)) {

                let next_nodes_to_visit: { [node_name: string]: VarDAGNode } = {};

                for (let j in nodes_to_visit) {

                    let node_to_visit = nodes_to_visit[j];
                    let dependencies_count: number = 1;

                    for (let k in node_to_visit.outgoing) {
                        let node_to_visit_dep: VarDAGNode = node_to_visit.outgoing[k] as VarDAGNode;

                        if (node_to_visit_dep.dependencies_count == null) {
                            dependencies_count = null;
                            break;
                        }

                        dependencies_count += node_to_visit_dep.dependencies_count;
                    }

                    if (dependencies_count == null) {
                        continue;
                    }

                    node_to_visit.dependencies_count = dependencies_count;

                    if (this.dependencies_heatmap_max < node_to_visit.dependencies_count) {
                        this.dependencies_heatmap_max = node_to_visit.dependencies_count;
                    }

                    for (let k in node_to_visit.incoming) {
                        let next_node_to_visit: VarDAGNode = node_to_visit.incoming[k] as VarDAGNode;

                        next_nodes_to_visit[next_node_to_visit.name] = next_node_to_visit;
                    }
                }

                nodes_to_visit = next_nodes_to_visit;
            }
        }


        this.dependencies_heatmap_lvl_5 = Math.round(this.dependencies_heatmap_max * (5 / 6));
        this.dependencies_heatmap_lvl_4 = Math.round(this.dependencies_heatmap_max * (4 / 6));
        this.dependencies_heatmap_lvl_3 = Math.round(this.dependencies_heatmap_max * (3 / 6));
        this.dependencies_heatmap_lvl_2 = Math.round(this.dependencies_heatmap_max * (2 / 6));
        this.dependencies_heatmap_lvl_1 = Math.round(this.dependencies_heatmap_max * (1 / 6));

        this.dependencies_heatmap_version++;

        VarsController.getInstance().set_dependencies_heatmap_version(this.dependencies_heatmap_version);
    }
}
