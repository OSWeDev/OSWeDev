import LocaleManager from '../../../../tools/LocaleManager';
import IVarDataParamVOBase from '../../interfaces/IVarDataParamVOBase';
import IVarDataVOBase from '../../interfaces/IVarDataVOBase';
import VarsController from '../../VarsController';
import DAGNode from '../dag/DAGNode';
import VarDAG from './VarDAG';
import IVarMatroidDataVO from '../../interfaces/IVarMatroidDataVO';
import IVarMatroidDataParamVO from '../../interfaces/IVarMatroidDataParamVO';

export default class VarDAGNode extends DAGNode {


    // Old version : sans matroids
    public imported: IVarDataVOBase = null;

    // New version : with matroids
    public loaded_datas: IVarMatroidDataVO[] = [];
    public parents_loaded_datas: IVarMatroidDataVO[] = [];

    public computed_datas: IVarMatroidDataVO[] = [];


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
    }

    public setImportedData(imported: IVarDataVOBase, dag: VarDAG) {

        if (!this.hasMarker(VarDAG.VARDAG_MARKER_IMPORTED_DATA)) {
            this.addMarker(VarDAG.VARDAG_MARKER_IMPORTED_DATA, dag);
        }
        this.imported = imported;
    }

    public initializeNode(dag: VarDAG) {
        super.initializeNode(dag);
        this.addMarker(VarDAG.VARDAG_MARKER_VAR_ID + this.param.var_id, dag);
        if (VarsController.getInstance().imported_datas_by_index[this.name]) {
            this.setImportedData(VarsController.getInstance().imported_datas_by_index[this.name], dag);
        }
    }

    public getD3NodeDefinition(use_var_name_as_label: boolean = false): any {
        let label: string = this.name.split('_').splice(1, 100).join(' ');

        if (use_var_name_as_label) {
            label = LocaleManager.getInstance().i18n.t(VarsController.getInstance().get_translatable_name_code(this.param.var_id));
        }
        let d3node = { label: label };
        if (!this.hasIncoming) {
            d3node['class'] = "type_leaf";
        }
        if (!this.hasOutgoing) {
            d3node['class'] = "type_root";
        }

        for (let marker in this.markers) {
            d3node['class'] = ((!!d3node['class']) ? d3node['class'] : "") + " marker_" + marker;
        }

        return d3node;
    }
}
