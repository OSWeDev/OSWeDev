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

@Component({
    template: require('./VarDescRegistrationsComponent.pug')
})
export default class VarDescRegistrationsComponent extends VueComponentBase {

    @ModuleVarGetter
    public getDescSelectedIndex: string;
    @ModuleVarAction
    public setDescSelectedIndex: (desc_selected_index: string) => void;

    public mounted() {
        this.createGraph();
    }

    public createGraph() {

        // Create the input graph
        let g = new dagreD3.graphlib.Graph({ compound: true })
            .setGraph({})
            .setDefaultEdgeLabel(function () { return {}; });


        // On crée les vars_ids
        let groups: { [var_id: number]: boolean } = {};
        for (let i in VarsController.getInstance().varDAG.nodes) {
            let node: VarDAGNode = VarsController.getInstance().varDAG.nodes[i];

            if (!groups[node.param.var_id]) {
                groups[node.param.var_id] = true;
                g.setNode(node.param.var_id, {
                    label: VarsController.getInstance().getVarConfById(node.param.var_id).name + ' [' + node.param.var_id + ']',
                    clusterLabelPos: 'top',
                    // style: 'fill: #d3d7e8'
                });
            }
        }


        for (let i in VarsController.getInstance().varDAG.nodes) {
            let node: VarDAGNode = VarsController.getInstance().varDAG.nodes[i];
            let node_name: string = node.name;

            let d3node = { label: node_name };
            if (!VarsController.getInstance().varDAG.nodes[node_name].hasIncoming) {
                d3node['class'] = "type_leaf";
            }
            if (!VarsController.getInstance().varDAG.nodes[node_name].hasOutgoing) {
                d3node['class'] = "type_root";
            }
            g.setNode(node_name, d3node);
            g.setParent(node_name, node.param.var_id);
        }

        g.nodes().forEach(function (v) {
            let node = g.node(v);
            // Round the corners of the nodes
            node.rx = node.ry = 5;
        });

        for (let i in VarsController.getInstance().varDAG.nodes) {
            let node: VarDAGNode = VarsController.getInstance().varDAG.nodes[i];

            if (node.hasOutgoing) {

                let fromName: string = node.name;
                for (let j in node.outgoingNames) {
                    let toName: string = node.outgoingNames[j];

                    g.setEdge(fromName, toName);
                }
            }
        }

        // Set up an SVG group so that we can translate the final graph.
        let svg = d3.select("svg");
        let svgGroup = svg.append("g");

        // Set up zoom support
        var zoom = d3.zoom().on("zoom", function () {
            svgGroup.attr("transform", d3.event.transform);
        });
        svg.call(zoom);

        // Create the renderer
        let render = new dagreD3.render();

        // Run the renderer. This is what draws the final graph.
        render(svgGroup, g);

        // Center the graph
        let initialScale = 0.5;
        svg.call(zoom.transform, d3.zoomIdentity.translate((svg.attr("width") - g.graph().width * initialScale) / 2, 20).scale(initialScale));
        svg.attr('height', g.graph().height * initialScale + 40);

        // let xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
        // svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
        // svg.attr("height", g.graph().height + 40);
    }
}