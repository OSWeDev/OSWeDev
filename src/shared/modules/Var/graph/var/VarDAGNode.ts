import LocaleManager from '../../../../tools/LocaleManager';
import IVarDataParamVOBase from '../../interfaces/IVarDataParamVOBase';
import IVarDataVOBase from '../../interfaces/IVarDataVOBase';
import IVarMatroidDataVO from '../../interfaces/IVarMatroidDataVO';
import VarsController from '../../VarsController';
import DAGNode from '../dag/DAGNode';
import VarDAG from './VarDAG';
import ModulesManager from '../../../ModulesManager';

export default class VarDAGNode extends DAGNode {

    // New version : with matroids
    public loaded_datas_matroids: IVarMatroidDataVO[] = null;
    public computed_datas_matroids: IVarMatroidDataVO[] = null;
    public loaded_datas_matroids_sum_value: number = null;

    public ignore_unvalidated_datas: boolean = false;

    public needs_to_load_precompiled_or_imported_data: boolean = true;
    public needs_parent_to_load_precompiled_or_imported_data: boolean = false;

    // Used for the deps heatmap
    public dependencies_count: number = null;
    public dependencies_list: string[] = null;
    public dependencies_tree_prct: number = null;

    /**
     * Nodes that need this one
     */
    public incoming: { [node_name: string]: VarDAGNode } = {};
    /**
     * Nodes that need this one
     */
    public incomingNames: string[] = [];

    /**
     * Nodes needed by this one
     */
    public outgoing: { [node_name: string]: VarDAGNode } = {};
    /**
     * Nodes needed by this one
     */
    public outgoingNames: string[] = [];


    public constructor(name: string, dag: VarDAG, public param: IVarDataParamVOBase) {
        super(name, dag);

        this.addMarker(VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING, dag);

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

    public initializeNode(dag: VarDAG) {
        super.initializeNode(dag);
        this.addMarker(VarDAG.VARDAG_MARKER_VAR_ID + this.param.var_id, dag);

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

        for (let marker in this.markers) {
            d3node['class'] = ((!!d3node['class']) ? d3node['class'] : "") + " marker_" + marker;
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
