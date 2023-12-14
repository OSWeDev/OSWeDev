// import VarDAGNode from '../../../../../../../server/modules/Var/vos/VarDAGNode';
// import VarsController from "../../../../../../../shared/modules/Var/VarsController";
// import LocaleManager from "../../../../../../../shared/tools/LocaleManager";

// export default class D3VarDagSVGController {

//     // istanbul ignore next: nothing to test : getInstance
//     public static getInstance() {
//         if (!D3VarDagSVGController.instance) {
//             D3VarDagSVGController.instance = new D3VarDagSVGController();
//         }

//         return D3VarDagSVGController.instance;
//     }

//     private static instance: D3VarDagSVGController = null;

//     private constructor() { }

//     public getD3NodeDefinition(node: VarDAGNode, use_var_name_as_label: boolean = false): any {
//         let label: string = node.var_data.index.split('_').splice(1, 100).join(' ');

//         if (use_var_name_as_label) {
//             label = LocaleManager.getInstance().i18n.t(VarsController.get_translatable_name_code(node.var_controller.varConf.name));
//         }
//         let d3node = { label: label };
//         if (!node.hasIncoming) {
//             d3node['class'] = ((!!d3node['class']) ? d3node['class'] : "") + " type_root";
//         }
//         if (!node.hasOutgoing) {
//             d3node['class'] = ((!!d3node['class']) ? d3node['class'] : "") + " type_leaf";
//         }

//         return d3node;
//     }
// }