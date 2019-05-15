import * as d3 from 'd3';
import * as dagreD3 from 'dagre-d3';
import { Component } from 'vue-property-decorator';
import 'vue-tables-2';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleVarAction, ModuleVarGetter } from '../../../store/VarStore';
import './VarDescRegistrationsComponent.scss';
import moment = require('moment');
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import VarDAG from '../../../../../../../shared/modules/Var/graph/var/VarDAG';
import VarDAGNode from '../../../../../../../shared/modules/Var/graph/var/VarDAGNode';
// import 'tipsy/src/javascripts/jquery.tipsy.js';
// import 'tipsy/src/stylesheets/tipsy.css';
import IVarDataParamVOBase from '../../../../../../../shared/modules/Var/interfaces/IVarDataParamVOBase';

@Component({
    template: require('./VarDescRegistrationsComponent.pug')
})
export default class VarDescRegistrationsComponent extends VueComponentBase {

    @ModuleVarGetter
    public getDescSelectedIndex: string;
    @ModuleVarAction
    public setDescSelectedIndex: (desc_selected_index: string) => void;

    @ModuleVarGetter
    public isWaiting: boolean;
    @ModuleVarGetter
    public isUpdating: boolean;
    @ModuleVarGetter
    public isStepping: boolean;

    @ModuleVarGetter
    public getStepNumber: number;

    private graph_params: string = null;
    private hover_desc: string = null;


    get descSelectedParam(): IVarDataParamVOBase {
        if (!!this.getDescSelectedIndex) {
            let selectedNode: VarDAGNode = VarsController.getInstance().varDAG.nodes[this.getDescSelectedIndex];

            if (!selectedNode) {
                return null;
            }

            return selectedNode.param;
        }
        return null;
    }

    get is_stepping() {
        return this.isStepping;
    }

    get is_waiting() {
        return this.isWaiting;
    }

    public switch_stepper() {
        VarsController.getInstance().switch_stepper();
    }

    public continue_stepper() {
        VarsController.getInstance().next_step();
    }

    public createGraph() {

        // Cleanup old graph
        let oldsvg = d3.select(this.$el).select("svg > g");
        if ((!!oldsvg) && (!!d3.select(this.$el).select("svg").nodes()[0])) {
            d3.select(this.$el).select("svg").nodes()[0].innerHTML = "";
        }

        // Create the input graph
        let g = new dagreD3.graphlib.Graph({ compound: true })
            // let g = new dagreD3.graphlib.Graph()
            .setGraph({})
            .setDefaultEdgeLabel(function () { return {}; });

        let graph_params_obj = ((!!this.graph_params) && (this.graph_params != "")) ? JSON.parse(this.graph_params) : null;

        // On crée les vars_ids
        let groups: { [var_id: number]: boolean } = {};
        let groups_links: { [var_id: number]: number[] } = {};
        for (let i in VarsController.getInstance().varDAG.nodes) {
            let node: VarDAGNode = VarsController.getInstance().varDAG.nodes[i];

            // On filtre sur les filtres fournis
            if (graph_params_obj) {
                let filtered: boolean = false;
                for (let field_name in graph_params_obj) {
                    if ((!!node.param[field_name]) && (node.param[field_name] != graph_params_obj[field_name])) {
                        filtered = true;
                        break;
                    }
                }
                if (filtered) {
                    continue;
                }
            }

            if (!groups[node.param.var_id]) {
                groups[node.param.var_id] = true;
                g.setNode(node.param.var_id.toString(), {
                    label: VarsController.getInstance().getVarConfById(node.param.var_id).name + ' [' + node.param.var_id + ']',
                    clusterLabelPos: 'top'
                });
                groups_links[node.param.var_id] = [];
            }
        }


        let descriptions: { [index: string]: string } = {};
        let existingNodes: { [name: string]: boolean } = {};
        for (let i in VarsController.getInstance().varDAG.nodes) {
            let node: VarDAGNode = VarsController.getInstance().varDAG.nodes[i];
            let node_name: string = node.name;

            // On filtre sur les filtres fournis
            if (graph_params_obj) {
                let filtered: boolean = false;
                for (let field_name in graph_params_obj) {
                    if ((!!node.param[field_name]) && (node.param[field_name] != graph_params_obj[field_name])) {
                        filtered = true;
                        break;
                    }
                }
                if (filtered) {
                    continue;
                }
            }

            g.setNode(node_name, node.getD3NodeDefinition());
            existingNodes[node_name] = true;
            g.setParent(node_name, node.param.var_id.toString());
            descriptions[node_name] = JSON.stringify(node.markers).replace(/,/g, ",\n");
        }

        g.nodes().forEach(function (v) {
            let node = g.node(v);
            // Round the corners of the nodes
            node.rx = node.ry = 5;
        });

        // On va diminuer drastiquement les liens en ne mettant les liens entre var_ids différents que sur les groupes
        // et en mettant les liens entre vars_id identiques uniquement sur les nodes
        for (let i in VarsController.getInstance().varDAG.nodes) {
            let fromNode: VarDAGNode = VarsController.getInstance().varDAG.nodes[i];
            let fromName: string = fromNode.name;

            if (!existingNodes[fromName]) {
                continue;
            }

            if (fromNode.hasOutgoing) {

                for (let j in fromNode.outgoingNames) {
                    let toName: string = fromNode.outgoingNames[j];
                    let toNode: VarDAGNode = VarsController.getInstance().varDAG.nodes[toName];

                    if (!existingNodes[toName]) {
                        continue;
                    }
                    g.setEdge(fromName, toName);

                    // if (toNode.param.var_id == fromNode.param.var_id) {
                    //     g.setEdge(fromName, toName);
                    // } else {
                    //     if (groups_links[fromNode.param.var_id].indexOf(toNode.param.var_id) < 0) {
                    //         g.setEdge(fromName, toName);
                    //         // g.setEdge(fromNode.param.var_id.toString(), toNode.param.var_id.toString());
                    //         groups_links[fromNode.param.var_id].push(toNode.param.var_id);
                    //     }
                    // }
                }
            }
        }

        // Set up an SVG group so that we can translate the final graph.
        let svg = d3.select(this.$el).select("svg");
        let svgGroup = svg.append("g");

        // Simple function to style the tooltip for the given node.
        // var styleTooltip = function (name) {
        //     return "<p class='name'>" + name + "</p><p class='description'>" + descriptions[name] + "</p>";
        // };

        // Set up zoom support
        var zoom = d3.zoom().on("zoom", function () {
            svgGroup.attr("transform", d3.event.transform);
        });
        svg.call(zoom);

        // Create the renderer
        let render = new dagreD3.render();

        // Run the renderer. This is what draws the final graph.
        render(svgGroup, g);

        let self = this;
        svgGroup.selectAll("g.node")
            .each(function (v) {
                $(this).mousedown(() => {
                    self.setDescSelectedIndex(v);
                    // self.hover_desc = descriptions[v];
                });
            });


        // svgGroup.selectAll("g.node")
        //     .attr("title", function (v) { return styleTooltip(v); })
        //     .each(function (v) { $(this)['tipsy']({ gravity: "w", opacity: 1, html: true }); });

        // Center the graph
        let initialScale = 0.2;
        svg.call(zoom.transform, d3.zoomIdentity.translate((svg.attr("width") - g.graph().width * initialScale) / 2, 20).scale(initialScale));

        // let xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
        // svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
        // svg.attr("height", g.graph().height + 40);
    }
}