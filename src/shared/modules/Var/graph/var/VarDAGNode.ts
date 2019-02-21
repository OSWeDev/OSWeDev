import DAGNode from '../dag/DAGNode';
import IVarDataParamVOBase from '../../interfaces/IVarDataParamVOBase';
import IVarDataVOBase from '../../interfaces/IVarDataVOBase';
import VarDAG from './VarDAG';
import VarsController from '../../VarsController';

export default class VarDAGNode extends DAGNode {


    public imported: IVarDataVOBase = null;

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
    }
}
