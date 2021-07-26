import { Component } from 'vue-property-decorator';
import VarDataBaseVO from '../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleVarAction, ModuleVarGetter } from '../../../store/VarStore';
import './VarDescRegistrationsComponent.scss';

@Component({
    template: require('./VarDescRegistrationsComponent.pug')
})
export default class VarDescRegistrationsComponent extends VueComponentBase {

    @ModuleVarGetter
    public getDescSelectedVarParam: VarDataBaseVO;
    @ModuleVarAction
    public setDescSelectedVarParam: (desc_selected_var_param: VarDataBaseVO) => void;

    private graph_params: string = null;
    private hover_desc: string = null;

    // private vardag_size: number = null;
    // private vardag_registered_prct: string = null;

    // private vardags_registered_prct_by_var_id: { [var_id: number]: string } = {};

    public createGraph() {

        // // Cleanup old graph
        // let oldsvg = d3.select(this.$el).select("svg > g");
        // if ((!!oldsvg) && (!!d3.select(this.$el).select("svg").nodes()[0])) {
        //     d3.select(this.$el).select("svg").nodes()[0].innerHTML = "";
        // }

        // // Create the input graph
        // let g = new graphlib.Graph({ compound: true })
        //     // let g = new dagreD3.graphlib.Graph()
        //     .setGraph({})
        //     .setDefaultEdgeLabel(function () { return {}; });

        // let graph_params_obj = ((!!this.graph_params) && (this.graph_params != "")) ? JSON.parse(this.graph_params) : null;

        // // On crée les vars_ids
        // let groups: { [var_id: number]: boolean } = {};
        // let groups_links: { [var_id: number]: number[] } = {};
        // for (let i in VarsController.getInstance().varDAG.nodes) {
        //     let node: VarDAGNode = VarsController.getInstance().varDAG.nodes[i];

        //     // On filtre sur les filtres fournis
        //     if (graph_params_obj) {
        //         let filtered: boolean = false;
        //         for (let field_name in graph_params_obj) {
        //             if ((!!node.param[field_name]) && (node.param[field_name] != graph_params_obj[field_name])) {
        //                 filtered = true;
        //                 break;
        //             }
        //         }
        //         if (filtered) {
        //             continue;
        //         }
        //     }

        //     if (!groups[node.param.var_id]) {
        //         groups[node.param.var_id] = true;
        //         g.setNode(node.param.var_id.toString(), {
        //             label: VarsController.getInstance().getVarConfById(node.param.var_id).name + ' [' + node.param.var_id + ']',
        //             clusterLabelPos: 'top'
        //         });
        //         groups_links[node.param.var_id] = [];
        //     }
        // }


        // let descriptions: { [index: string]: string } = {};
        // let existingNodes: { [name: string]: boolean } = {};
        // for (let i in VarsController.getInstance().varDAG.nodes) {
        //     let node: VarDAGNode = VarsController.getInstance().varDAG.nodes[i];
        //     let node_name: string = node.name;

        //     // On filtre sur les filtres fournis
        //     if (graph_params_obj) {
        //         let filtered: boolean = false;
        //         for (let field_name in graph_params_obj) {
        //             if ((!!node.param[field_name]) && (node.param[field_name] != graph_params_obj[field_name])) {
        //                 filtered = true;
        //                 break;
        //             }
        //         }
        //         if (filtered) {
        //             continue;
        //         }
        //     }

        //     g.setNode(node_name, node.getD3NodeDefinition());
        //     existingNodes[node_name] = true;
        //     g.setParent(node_name, node.param.var_id.toString());
        //     descriptions[node_name] = JSON.stringify(node.markers).replace(/,/g, ",\n");
        // }

        // g.nodes().forEach(function (v) {
        //     let node = g.node(v);
        //     // Round the corners of the nodes
        //     node.rx = node.ry = 5;
        // });

        // // On va diminuer drastiquement les liens en ne mettant les liens entre var_ids différents que sur les groupes
        // // et en mettant les liens entre vars_id identiques uniquement sur les nodes
        // for (let i in VarsController.getInstance().varDAG.nodes) {
        //     let fromNode: VarDAGNode = VarsController.getInstance().varDAG.nodes[i];
        //     let fromName: string = fromNode.name;

        //     if (!existingNodes[fromName]) {
        //         continue;
        //     }

        //     if (fromNode.hasOutgoing) {

        //         for (let j in fromNode.outgoingNames) {
        //             let toName: string = fromNode.outgoingNames[j];
        //             let toNode: VarDAGNode = VarsController.getInstance().varDAG.nodes[toName];

        //             if (!existingNodes[toName]) {
        //                 continue;
        //             }
        //             g.setEdge(fromName, toName);

        //             // if (toNode.param.var_id == fromNode.param.var_id) {
        //             //     g.setEdge(fromName, toName);
        //             // } else {
        //             //     if (groups_links[fromNode.param.var_id].indexOf(toNode.param.var_id) < 0) {
        //             //         g.setEdge(fromName, toName);
        //             //         // g.setEdge(fromNode.param.var_id.toString(), toNode.param.var_id.toString());
        //             //         groups_links[fromNode.param.var_id].push(toNode.param.var_id);
        //             //     }
        //             // }
        //         }
        //     }
        // }

        // // Set up an SVG group so that we can translate the final graph.
        // let svg = d3.select(this.$el).select("svg");
        // let svgGroup = svg.append("g");

        // // Simple function to style the tooltip for the given node.
        // // var styleTooltip = function (name) {
        // //     return "<p class='name'>" + name + "</p><p class='description'>" + descriptions[name] + "</p>";
        // // };

        // // Set up zoom support
        // var zoom = d3.zoom().on("zoom", function () {
        //     svgGroup.attr("transform", d3.event.transform);
        // });
        // svg.call(zoom);

        // // Create the renderer
        // let render_ = new render();

        // // Run the renderer. This is what draws the final graph.
        // render_(svgGroup, g);

        // let self = this;
        // svgGroup.selectAll("g.node")
        //     .each(function (v) {
        //         $(this).mousedown(() => {
        //             self.setDescSelectedVarParam(v); //TODO FIXME on set le param maintenant pas la string, à revoir
        //             // self.hover_desc = descriptions[v];
        //         });
        //     });

        // // Center the graph
        // let initialScale = 0.2;
        // svg.call(zoom.transform, d3.zoomIdentity.translate((svg.attr("width") - g.graph().width * initialScale) / 2, 20).scale(initialScale));

        // // let xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
        // // svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
        // // svg.attr("height", g.graph().height + 40);
    }

    // private refreshDependenciesHeatmap() {
    //     VarsController.getInstance().varDAG.refreshDependenciesHeatmap();

    //     this.vardag_size = VarsController.getInstance().varDAG.nodes_names.length;
    //     this.vardag_registered_prct = this.formatNumber_2decimal((this.vardag_size ? VarsController.getInstance().varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_REGISTERED].length / this.vardag_size : 0) * 100);

    //     let vardags_registered_n_by_var_id: { [var_id: number]: number } = {};
    //     this.vardags_registered_prct_by_var_id = {};

    //     for (let i in VarsController.getInstance().varDAG.nodes) {
    //         let node = VarsController.getInstance().varDAG.nodes[i];

    //         if (!vardags_registered_n_by_var_id[node.param.var_id]) {
    //             vardags_registered_n_by_var_id[node.param.var_id] = 1;
    //         } else {
    //             vardags_registered_n_by_var_id[node.param.var_id]++;
    //         }
    //     }

    //     for (let i in vardags_registered_n_by_var_id) {
    //         this.vardags_registered_prct_by_var_id[i] = this.formatNumber_2decimal((vardags_registered_n_by_var_id[i] / this.vardag_size) * 100);
    //     }
    // }

    // private clearDag() {
    //     VarsController.getInstance().varDAG.deleteMarkedNodes(VarDAG.VARDAG_MARKER_COMPUTED_AT_LEAST_ONCE);
    //     this.vardags_registered_prct_by_var_id = null;
    //     //  FIXME TODO ASAP should work ... VarsController.getInstance().varDAG.deleteMarkedNodes(VarDAG.VARDAG_MARKER_REGISTERED);
    // }
}