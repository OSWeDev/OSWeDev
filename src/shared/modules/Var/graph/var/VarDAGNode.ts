import LocaleManager from '../../../../tools/LocaleManager';
import ModulesManager from '../../../ModulesManager';
import IVarDataVOBase from '../../interfaces/IVarDataVOBase';
import VarsController from '../../VarsController';
import DAGNode from '../dag/DAGNode';
import VarDAG from './VarDAG';

export default class VarDAGNode extends DAGNode {

    /**
     * Factory de noeuds en fonction du nom
     */
    public static getInstance(name: string, dag: VarDAG, param: IVarDataVOBase): VarDAGNode {
        if (!!dag.nodes[name]) {
            return dag.nodes[name];
        }

        return new VarDAGNode(name, dag, param).connect_to_DAG() as VarDAGNode;
    }


    // New version : with matroids
    public loaded_datas_matroids: IVarDataVOBase[] = null;
    public computed_datas_matroids: IVarDataVOBase[] = null;
    public loaded_datas_matroids_sum_value: number = null;

    public ignore_unvalidated_datas: boolean = false;

    public needs_to_load_precompiled_or_imported_data: boolean = true;
    public needs_parent_to_load_precompiled_or_imported_data: boolean = false;

    // -------
    // Markers
    // -------
    public marked_for_next_update: boolean = false;
    public marked_for_update: boolean = false;
    public ongoing_update: boolean = false;

    public imported_or_precomputed_data_loaded: boolean = false;

    public needs_deps_loading: boolean = true;
    public deps_loaded: boolean = false;

    public computed: boolean = false;
    public computed_at_least_once: boolean = false;
    // -------

    // Used for the deps heatmap
    public dependencies_count: number = null;
    public dependencies_list: string[] = null;
    public dependencies_tree_prct: number = null;

    // inheritance types pb forces redeclaration
    public incoming: { [node_name: string]: VarDAGNode } = {};
    public outgoing: { [node_name: string]: VarDAGNode } = {};


    /**
     * Use the factory
     */
    private constructor(name: string, dag: VarDAG, public param: IVarDataVOBase) {
        super(name, dag);

        // On en profite pour afficher l'info de la nécessité ou non de chargement de data pour les matroids
        let var_controller = VarsController.getInstance().getVarControllerById(param.var_id);
        if (((!var_controller.can_load_precompiled_or_imported_datas_client_side) && (!ModulesManager.getInstance().isServerSide)) ||
            ((!var_controller.can_load_precompiled_or_imported_datas_server_side) && (!!ModulesManager.getInstance().isServerSide))) {
            this.needs_to_load_precompiled_or_imported_data = false;
        } else {
            this.needs_to_load_precompiled_or_imported_data = true;
        }

        // Par défaut on a pas de parent donc...
        this.needs_parent_to_load_precompiled_or_imported_data = false;
    }

    public getD3NodeDefinition(use_var_name_as_label: boolean = false): any {
        let label: string = this.name.split('_').splice(1, 100).join(' ');

        if (use_var_name_as_label) {
            label = LocaleManager.getInstance().i18n.t(VarsController.getInstance().get_translatable_name_code(this.param.var_id));
        }
        let d3node = { label: label };
        if (!this.hasIncoming) {
            d3node['class'] = ((!!d3node['class']) ? d3node['class'] : "") + " type_root";
        }
        if (!this.hasOutgoing) {
            d3node['class'] = ((!!d3node['class']) ? d3node['class'] : "") + " type_leaf";
        }

        return d3node;
    }


    /**
     * @param node_name
     */
    public removeNodeFromIncoming(node_name: string) {

        if ((!!this.incoming) && (!!this.incoming[node_name])) {
            delete this.incoming[node_name];

            let indexof = this.incomingNames.indexOf(node_name);
            if (indexof >= 0) {
                this.incomingNames.splice(indexof, 1);
            }
        }

        // Si on a plus d'incoming,
        //  on devient une root, mais si on a pas de marker registered, on sert à rien, donc on lance une suppression sur ce noeud automatiquement
        if ((!this.incomingNames) || (this.incomingNames.length == 0)) {

            if (!this.hasMarker(VarDAG.VARDAG_MARKER_REGISTERED)) {
                this.dag.deletedNode(this.name, null);
                return;
            }

            this.dag.roots[this.name] = this;
        }
    }
}
