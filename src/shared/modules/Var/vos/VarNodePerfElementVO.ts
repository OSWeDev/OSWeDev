import IDistantVOBase from '../../IDistantVOBase';
import VarDAG from '../graph/VarDAG';
import VarNodeParentPerfVO from './VarNodeParentPerfVO';


export default class VarNodePerfElementVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "var_node_perf_element";
    public static current_var_dag: VarDAG = null;

    public static get_perf_by_ref(perf_ref: VarNodeParentPerfVO): VarNodePerfElementVO {
        if (!perf_ref) {
            return null;
        }

        if (!perf_ref.node_name) {
            return VarNodePerfElementVO.current_var_dag.perfs[perf_ref.perf_name] as VarNodePerfElementVO;
        } else {
            let node = VarNodePerfElementVO.current_var_dag.nodes[perf_ref.node_name];
            return node ? node.perfs[perf_ref.perf_name] as VarNodePerfElementVO : null;
        }
    }

    public _type: string = VarNodePerfElementVO.API_TYPE_ID;
    public id: number;

    public node_name: string;
    public perf_name: string;

    public total_elapsed_time: number;
    public skipped: boolean = false;
    public nb_calls: number;
    public sum_card: number;

    public child_perfs_ref: VarNodeParentPerfVO[] = [];
    public parent_perf_ref: VarNodeParentPerfVO;

    public end_time: number;
    private _start_time: number;

    private _initial_estimated_work_time: number;
    private _updated_estimated_work_time: number;

    /**
     * Nombre noeuds qui ont un start_time parmi enfants
     */
    private _nb_started_global: number = 0;

    /**
     * Somme des _initial_estimated_work_time enfants
     */
    private _initial_estimated_work_time_global: number = 0;

    /**
     * Somme des _updated_estimated_work_time enfants
     */
    private _updated_estimated_work_time_global: number = 0;

    /**
     * Somme des _start_time enfants
     */
    private _start_time_global: number = 0;

    /**
     * Nombre de noeuds enfants
     */
    private _nb_noeuds_global: number = 0;

    /**
     * @param node_name null si la perf appartient à var_dag.perfs ou le nom du node lié
     * @param perf_name le nom de la perf (réflexivité)
     * @param var_dag obligatoire si on déclare un parent_perf_ref sinon vide
     * @param parent_perf_ref la perf parente si il y en a une
     */
    public constructor(
        node_name: string,
        perf_name: string,
        parent_perf_ref: VarNodeParentPerfVO = null
    ) {
        this.node_name = node_name;
        this.perf_name = perf_name;
        this.parent_perf_ref = parent_perf_ref;

        if (!parent_perf_ref) {
            return;
        }

        let parent_perf = VarNodePerfElementVO.get_perf_by_ref(parent_perf_ref);
        if (!parent_perf) {
            return;
        }

        parent_perf.child_perfs_ref.push(VarNodeParentPerfVO.create_new(this.node_name, this.perf_name));
        parent_perf.nb_noeuds_global++;
    }

    get nb_noeuds_global() {
        return this._nb_noeuds_global;
    }

    set nb_noeuds_global(nb_noeuds_global: number) {
        let old_nb_noeuds_global = this._nb_noeuds_global;
        let diff_nb_noeuds_global = (nb_noeuds_global ? nb_noeuds_global : 0) - (old_nb_noeuds_global ? old_nb_noeuds_global : 0);

        this._nb_noeuds_global = nb_noeuds_global;

        /**
         * On met à jour le parent si on en a
         */
        if (!this.parent_perf_ref) {
            return;
        }

        let parent_perf: VarNodePerfElementVO = VarNodePerfElementVO.get_perf_by_ref(this.parent_perf_ref);
        if (!parent_perf) {
            return;
        }

        parent_perf.nb_noeuds_global += diff_nb_noeuds_global;
    }

    get nb_started_global() {
        return this._nb_started_global;
    }

    set nb_started_global(nb_started_global: number) {
        let old_nb_started_global = this._nb_started_global;
        let diff_nb_started_global = (nb_started_global ? nb_started_global : 0) - (old_nb_started_global ? old_nb_started_global : 0);

        this._nb_started_global = nb_started_global;

        /**
         * On met à jour le parent si on en a
         */
        if (!this.parent_perf_ref) {
            return;
        }

        let parent_perf: VarNodePerfElementVO = VarNodePerfElementVO.get_perf_by_ref(this.parent_perf_ref);
        if (!parent_perf) {
            return;
        }

        parent_perf.nb_started_global += diff_nb_started_global;
    }

    get start_time() {
        return this._start_time;
    }

    set start_time(start_time: number) {
        let old_start_time = this._start_time;
        let diff_start_time = (start_time ? start_time : 0) - (old_start_time ? old_start_time : 0);

        this._start_time = start_time;

        if (!diff_start_time) {
            return;
        }

        /**
         * On met à jour le parent si on en a
         */
        if (!this.parent_perf_ref) {
            return;
        }

        let parent_perf: VarNodePerfElementVO = VarNodePerfElementVO.get_perf_by_ref(this.parent_perf_ref);
        if (!parent_perf) {
            return;
        }

        // si on ajoute un start_time, on impacte le nb de started du parent
        if (!old_start_time) {
            parent_perf.nb_started_global++;
        }

        // si on supprime le start_time, on impacte le nb de started du parent
        if (!start_time) {
            parent_perf.nb_started_global--;
        }

        /**
         * Dans tous les cas on impacte la somme des start_time du parent
         */
        parent_perf.start_time_global += diff_start_time;
    }

    get start_time_global() {
        return this._start_time_global;
    }

    set start_time_global(start_time_global: number) {
        let old_start_time_global = this._start_time_global;
        let diff_start_time_global = (start_time_global ? start_time_global : 0) - (old_start_time_global ? old_start_time_global : 0);

        this._start_time_global = start_time_global;

        /**
         * On met à jour le parent si on en a
         */
        if (!this.parent_perf_ref) {
            return;
        }

        let parent_perf: VarNodePerfElementVO = VarNodePerfElementVO.get_perf_by_ref(this.parent_perf_ref);
        if (!parent_perf) {
            return;
        }

        parent_perf.start_time_global += diff_start_time_global;
    }

    get updated_estimated_work_time() {
        return this._updated_estimated_work_time;
    }

    set updated_estimated_work_time(updated_estimated_work_time: number) {
        let old_updated_estimated_work_time = this._updated_estimated_work_time;
        let diff_updated_estimated_work_time = (updated_estimated_work_time ? updated_estimated_work_time : 0) - (old_updated_estimated_work_time ? old_updated_estimated_work_time : 0);

        this._updated_estimated_work_time = updated_estimated_work_time;

        if (!diff_updated_estimated_work_time) {
            return;
        }

        /**
         * On met à jour le parent si on en a
         */
        if (!this.parent_perf_ref) {
            return;
        }

        let parent_perf: VarNodePerfElementVO = VarNodePerfElementVO.get_perf_by_ref(this.parent_perf_ref);
        if (!parent_perf) {
            return;
        }

        /**
         * On impacte la somme des updated_estimated_work_time du parent
         */
        parent_perf.updated_estimated_work_time_global += diff_updated_estimated_work_time;
    }

    get updated_estimated_work_time_global() {
        return this._updated_estimated_work_time_global;
    }

    set updated_estimated_work_time_global(updated_estimated_work_time_global: number) {
        let old_updated_estimated_work_time_global = this._updated_estimated_work_time_global;
        let diff_updated_estimated_work_time_global = (updated_estimated_work_time_global ? updated_estimated_work_time_global : 0) - (old_updated_estimated_work_time_global ? old_updated_estimated_work_time_global : 0);

        this._updated_estimated_work_time_global = updated_estimated_work_time_global;

        /**
         * On met à jour le parent si on en a
         */
        if (!this.parent_perf_ref) {
            return;
        }

        let parent_perf: VarNodePerfElementVO = VarNodePerfElementVO.get_perf_by_ref(this.parent_perf_ref);
        if (!parent_perf) {
            return;
        }

        parent_perf.updated_estimated_work_time_global += diff_updated_estimated_work_time_global;
    }

    public delete_this_perf() {

        /**
         * On set à 0 le updated_estimated_work_time et le start_time pour faire remonter la suppression
         */
        this.updated_estimated_work_time = 0;
        this.start_time = null;

        let parent_perf: VarNodePerfElementVO = VarNodePerfElementVO.get_perf_by_ref(this.parent_perf_ref);
        if (!!parent_perf) {
            parent_perf.remove_from_children(this);
        }

        for (let i in this.child_perfs_ref) {
            let child_perf_ref = this.child_perfs_ref[i];

            let child_perf: VarNodePerfElementVO = VarNodePerfElementVO.get_perf_by_ref(child_perf_ref);
            if (!!child_perf) {
                child_perf.parent_perf_ref = null;
            }
        }
        delete this.child_perfs_ref;
    }

    public remove_from_children(perf: VarNodePerfElementVO) {
        let found_index = null;
        for (let i in this.child_perfs_ref) {
            let child_perf = this.child_perfs_ref[i];

            if ((child_perf.node_name == perf.node_name) && (child_perf.perf_name == perf.perf_name)) {
                found_index = i;
                break;
            }
        }

        if (found_index != null) {
            this.child_perfs_ref.splice(found_index, 1);
        }
    }

    public skip_and_update_parents_perfs() {

        this.sum_card = 0;
        this.nb_calls = 0;
        this.updated_estimated_work_time = 0;
        this.total_elapsed_time = 0;
        this.start_time = null;
        this.end_time = null;
        this.skipped = true;
    }

    get initial_estimated_work_time() {
        return this._initial_estimated_work_time;
    }

    set initial_estimated_work_time(initial_estimated_work_time: number) {
        let old_initial_estimated_work_time = this._initial_estimated_work_time;
        let diff_initial_estimated_work_time = (initial_estimated_work_time ? initial_estimated_work_time : 0) - (old_initial_estimated_work_time ? old_initial_estimated_work_time : 0);

        this._initial_estimated_work_time = initial_estimated_work_time;
        this._updated_estimated_work_time = initial_estimated_work_time;

        if (!diff_initial_estimated_work_time) {
            return;
        }

        /**
         * On met à jour le parent si on en a
         */
        if (!this.parent_perf_ref) {
            return;
        }

        let parent_perf: VarNodePerfElementVO = VarNodePerfElementVO.get_perf_by_ref(this.parent_perf_ref);
        if (!parent_perf) {
            return;
        }

        /**
         * On impacte la somme des initial_estimated_work_time du parent
         */
        parent_perf.initial_estimated_work_time_global += diff_initial_estimated_work_time;
    }

    get initial_estimated_work_time_global() {
        return this._initial_estimated_work_time_global;
    }

    set initial_estimated_work_time_global(initial_estimated_work_time_global: number) {
        let old_initial_estimated_work_time_global = this._initial_estimated_work_time_global;
        let diff_initial_estimated_work_time_global = (initial_estimated_work_time_global ? initial_estimated_work_time_global : 0) - (old_initial_estimated_work_time_global ? old_initial_estimated_work_time_global : 0);

        this._initial_estimated_work_time_global = initial_estimated_work_time_global;

        /**
         * On met à jour le parent si on en a
         */
        if (!this.parent_perf_ref) {
            return;
        }

        let parent_perf: VarNodePerfElementVO = VarNodePerfElementVO.get_perf_by_ref(this.parent_perf_ref);
        if (!parent_perf) {
            return;
        }

        parent_perf.initial_estimated_work_time_global += diff_initial_estimated_work_time_global;
    }
}