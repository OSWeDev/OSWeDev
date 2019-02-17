import DAGNode from '../dag/DAGNode';
import IVarDataParamVOBase from '../../interfaces/IVarDataParamVOBase';
import IVarDataVOBase from '../../interfaces/IVarDataVOBase';
import VarDAG from './VarDAG';

export default class VarDAGNode extends DAGNode {


    public imported: IVarDataVOBase = null;

    public constructor(dag: VarDAG, public param: IVarDataParamVOBase) {
        super(dag);

        this.addMarker(VarDAG.VARDAG_MARKER_VAR_ID + this.param.var_id, dag);
    }

    public setImportedData(imported: IVarDataVOBase, dag: VarDAG) {

        if (!this.hasMarker(VarDAG.VARDAG_MARKER_IMPORTED_DATA)) {
            this.addMarker(VarDAG.VARDAG_MARKER_IMPORTED_DATA, dag);
        }
        this.imported = imported;
    }

    public initializeNode(dag: VarDAG) {
    }

    public prepare_for_deletion(dag: VarDAG) {
        this.removeMarker(VarDAG.VARDAG_MARKER_VAR_ID + this.param.var_id, dag);
    }
}
