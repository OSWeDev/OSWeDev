import { Duration, Moment } from "moment";
import HourRange from "../../../shared/modules/DataRender/vos/HourRange";
import NumRange from "../../../shared/modules/DataRender/vos/NumRange";
import TSRange from "../../../shared/modules/DataRender/vos/TSRange";
import MatroidController from "../../../shared/modules/Matroid/MatroidController";
import MatroidBase from "../../../shared/modules/Matroid/vos/MatroidBase";
import IPerfMonLineInfo from "../../../shared/modules/PerfMon/interfaces/IPerfMonLineInfo";
import VarDAGNode from "../../../shared/modules/Var/graph/VarDAGNode";
import DSControllerPMLInfoVO from "../../../shared/modules/Var/performances/vos/DSControllerPMLInfoVO";
import MatroidBasePMLInfoVO from "../../../shared/modules/Var/performances/vos/MatroidBasePMLInfoVO";
import VarControllerPMLInfoVO from "../../../shared/modules/Var/performances/vos/VarControllerPMLInfoVO";
import VarDataBaseVO from "../../../shared/modules/Var/vos/VarDataBaseVO";
import RangeHandler from "../../../shared/tools/RangeHandler";
import DataSourceControllerBase from "./datasource/DataSourceControllerBase";

export default class VarsPerfMonServerController {

    public static PML__VarsdatasComputerBGThread__do_calculation_run: string = 'VarsdatasComputerBGThread.do_calculation_run';

    public static PML__VarServerControllerBase__computeValue: string = 'VarServerControllerBase.computeValue';

    public static PML__VarsDatasProxy__handle_buffer: string = 'VarsDatasProxy.handle_buffer';
    public static PML__VarsDatasProxy__get_exact_param_from_buffer_or_bdd: string = 'VarsDatasProxy.get_exact_param_from_buffer_or_bdd';
    public static PML__VarsDatasProxy__prepend_var_datas: string = 'VarsDatasProxy.prepend_var_datas';
    public static PML__VarsDatasProxy__get_var_datas_or_ask_to_bgthread: string = 'VarsDatasProxy.get_var_datas_or_ask_to_bgthread';
    public static PML__VarsDatasProxy__append_var_datas: string = 'VarsDatasProxy.append_var_datas';
    public static PML__VarsDatasProxy__get_exact_params_from_buffer_or_bdd: string = 'VarsDatasProxy.get_exact_params_from_buffer_or_bdd';
    public static PML__VarsDatasProxy__get_vars_to_compute_from_buffer_or_bdd: string = 'VarsDatasProxy.get_vars_to_compute_from_buffer_or_bdd';
    public static PML__VarsDatasProxy__update_existing_buffered_older_datas: string = 'VarsDatasProxy.update_existing_buffered_older_datas';
    public static PML__VarsDatasProxy__get_vars_to_compute_from_bdd: string = 'VarsDatasProxy.get_vars_to_compute_from_bdd';
    public static PML__VarsDatasProxy__filter_var_datas_by_indexes: string = 'VarsDatasProxy.filter_var_datas_by_indexes';

    public static PML__VarsComputeController__compute: string = 'VarsComputeController.compute';
    public static PML__VarsComputeController__cache_datas: string = 'VarsComputeController.cache_datas';
    public static PML__VarsComputeController__deploy_deps: string = 'VarsComputeController.deploy_deps';
    public static PML__VarsComputeController__load_nodes_datas: string = 'VarsComputeController.load_nodes_datas';
    public static PML__VarsComputeController__compute_node: string = 'VarsComputeController.compute_node';
    public static PML__VarsComputeController__create_tree: string = 'VarsComputeController.create_tree';
    public static PML__VarsComputeController__handle_deploy_deps: string = 'VarsComputeController.handle_deploy_deps';
    public static PML__VarsComputeController__try_load_cache_complet: string = 'VarsComputeController.try_load_cache_complet';
    public static PML__VarsComputeController__try_load_cache_partiel: string = 'VarsComputeController.try_load_cache_partiel';
    public static PML__VarsComputeController__get_node_deps: string = 'VarsComputeController.get_node_deps';

    public static PML__DataSourcesController__load_node_datas: string = 'DataSourcesController.load_node_datas';

    public static PML__DataSourceControllerBase__load_node_data: string = 'DataSourceControllerBase.load_node_data';

    public static PML__VarsPerfsController__update_perfs_in_bdd: string = 'VarsPerfsController.update_perfs_in_bdd';

    public static PML__VarsDatasVoUpdateHandler__handle_buffer: string = 'VarsDatasVoUpdateHandler.handle_buffer';
    public static PML__VarsDatasVoUpdateHandler__invalidate_datas_and_parents: string = 'VarsDatasVoUpdateHandler.invalidate_datas_and_parents';
    public static PML__VarsDatasVoUpdateHandler__update_param: string = 'VarsDatasVoUpdateHandler.update_param';
    public static PML__VarsDatasVoUpdateHandler__find_invalid_datas_and_push_for_update: string = 'VarsDatasVoUpdateHandler.find_invalid_datas_and_push_for_update';

    public static PML__VarsCacheController__partially_clean_bdd_cache: string = 'VarsCacheController.partially_clean_bdd_cache';

    public static PML__VarsImportsHandler__load_imports_and_split_nodes: string = 'VarsImportsHandler.load_imports_and_split_nodes';
    public static PML__VarsImportsHandler__split_nodes: string = 'VarsImportsHandler.split_nodes';
    public static PML__VarsImportsHandler__aggregate_imports_and_remaining_datas: string = 'VarsImportsHandler.aggregate_imports_and_remaining_datas';

    public static getInstance(): VarsPerfMonServerController {
        if (!VarsPerfMonServerController.instance) {
            VarsPerfMonServerController.instance = new VarsPerfMonServerController();
        }
        return VarsPerfMonServerController.instance;
    }

    private static instance: VarsPerfMonServerController = null;

    protected constructor() {
    }

    public generate_MatroidBasePMLInfoVO_from_data(data: VarDataBaseVO): MatroidBasePMLInfoVO[] {
        let res: MatroidBasePMLInfoVO[] = [];

        if (!data) {
            return res;
        }

        let matroid_bases: Array<MatroidBase<any>> = MatroidController.getInstance().getMatroidBases(data);
        for (let i in matroid_bases) {
            let matroid_base = matroid_bases[i];

            for (let j in matroid_base.ranges) {
                let range = matroid_base.ranges[j];
                let pmlinfo = new MatroidBasePMLInfoVO();

                pmlinfo.cardinal = RangeHandler.getInstance().getCardinal(range);
                pmlinfo.field_id = matroid_base.field_id;
                pmlinfo.vo_type = matroid_base.api_type_id;
                pmlinfo.range_type = range.range_type;
                pmlinfo.segment_type = range.segment_type;
                pmlinfo.is_max_range = RangeHandler.getInstance().is_max_range(range);

                switch (range.range_type) {
                    case NumRange.RANGE_TYPE:
                        pmlinfo.min_as_number = range.min;
                        pmlinfo.max_as_number = range.max;
                        break;
                    case TSRange.RANGE_TYPE:
                        pmlinfo.min_as_number = (range.min as any as Moment).unix();
                        pmlinfo.max_as_number = (range.max as any as Moment).unix();
                        break;
                    case HourRange.RANGE_TYPE:
                        pmlinfo.min_as_number = (range.min as any as Duration).asMilliseconds();
                        pmlinfo.max_as_number = (range.max as any as Duration).asMilliseconds();
                        break;
                }
                res.push(pmlinfo);
            }
        }
        return res;
    }

    public generate_pmlinfos_from_node(node: VarDAGNode): IPerfMonLineInfo[] {
        let res: IPerfMonLineInfo[] = [];

        if ((!node) || (!node.var_data)) {
            return res;
        }
        return this.generate_pmlinfos_from_vardata(node.var_data);
    }

    public generate_pmlinfos_from_vardata(vardata: VarDataBaseVO): IPerfMonLineInfo[] {
        let res: IPerfMonLineInfo[] = [];

        if (!vardata) {
            return res;
        }

        res = this.generate_MatroidBasePMLInfoVO_from_data(vardata);

        let pmlinfo_var = new VarControllerPMLInfoVO();
        pmlinfo_var.var_id = vardata.var_id;
        res.push(pmlinfo_var);

        return res;
    }

    public generate_pmlinfos_from_node_and_ds(node: VarDAGNode, ds: DataSourceControllerBase): IPerfMonLineInfo[] {
        let res: IPerfMonLineInfo[] = [];

        if ((!node) || (!node.var_data)) {
            return res;
        }

        res = this.generate_pmlinfos_from_node(node);

        let pmlinfo_ds = new DSControllerPMLInfoVO();
        pmlinfo_ds.ds_name = ds.name;
        res.push(pmlinfo_ds);

        return res;
    }
}