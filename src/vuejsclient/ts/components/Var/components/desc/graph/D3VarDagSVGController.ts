import VarDAGNode from "../../../../../../../shared/modules/Var/graph/VarDAGNode";
import LocaleManager from "../../../../../../../shared/tools/LocaleManager";
import VarsClientController from "../../../VarsClientController";

export default class D3VarDagSVGController {

    public static getInstance() {
        if (!D3VarDagSVGController.instance) {
            D3VarDagSVGController.instance = new D3VarDagSVGController();
        }

        return D3VarDagSVGController.instance;
    }

    private static instance: D3VarDagSVGController = null;

    private constructor() { }

    public getD3NodeDefinition(node: VarDAGNode, use_var_name_as_label: boolean = false): any {
        let label: string = node.var_data.index.split('_').splice(1, 100).join(' ');

        if (use_var_name_as_label) {
            label = LocaleManager.getInstance().i18n.t(VarsClientController.getInstance().get_translatable_name_code(node.var_controller.varConf.name));
        }
        let d3node = { label: label };
        if (!node.hasIncoming) {
            d3node['class'] = ((!!d3node['class']) ? d3node['class'] : "") + " type_root";
        }
        if (!node.hasOutgoing) {
            d3node['class'] = ((!!d3node['class']) ? d3node['class'] : "") + " type_leaf";
        }

        return d3node;
    }
}