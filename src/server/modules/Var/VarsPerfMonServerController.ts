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

        let matroid_bases: MatroidBase[] = MatroidController.getInstance().getMatroidBases(data);
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

                pmlinfo.min_as_number = range.min;
                pmlinfo.max_as_number = range.max;

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