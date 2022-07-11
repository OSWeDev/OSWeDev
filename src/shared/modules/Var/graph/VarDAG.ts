import Dates from "../../FormatDatesNombres/Dates/Dates";
import VarBatchPerfVO from "../vos/VarBatchPerfVO";
import VarPerfElementVO from "../vos/VarPerfElementVO";
import DAG from "./dagbase/DAG";
import VarDAGNode from "./VarDAGNode";

export default class VarDAG extends DAG<VarDAGNode> {

    public perfs: VarBatchPerfVO;

    public constructor(batch_id: number) {
        super();

        this.perfs = new VarBatchPerfVO();
        this.perfs.batch_id = batch_id;
        this.perfs.cache_datas = new VarPerfElementVO();
        this.perfs.compute_node = new VarPerfElementVO();
        this.perfs.create_tree = new VarPerfElementVO();
        this.perfs.get_vars_to_compute = new VarPerfElementVO();
        this.perfs.load_nodes_datas = new VarPerfElementVO();
        this.perfs.current_estimated_remaining_time = 0;
        this.perfs.end_time = null;
        this.perfs.initial_estimated_time = 0;
        this.perfs.start_time = performance.now();
        this.perfs.nb_batch_vars = 0;
    }

    /**
     * @returns le temps total estimé du vardag (donc du batch pour la partie calcul des vars) et donc en incluant le temps écoulé depuis la mise en place
     */
    get total_estimated_time(): number {
        if (!this.perfs) {
            return null;
        }

        return this.perfs.current_estimated_remaining_time + (performance.now() - this.perfs.start_time);
    }
}