import LocaleManager from '../../../tools/LocaleManager';
import VarsController from '../VarsController';
import VarDAGNode from './VarDAGNode';

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
        let label: string = node.var_index.split('_').splice(1, 100).join(' ');

        if (use_var_name_as_label) {
            label = LocaleManager.getInstance().i18n.t(VarsController.getInstance().get_translatable_name_code(node.param.var_id));
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