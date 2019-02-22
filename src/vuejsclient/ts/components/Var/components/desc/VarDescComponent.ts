import * as d3 from 'd3';
import * as dagreD3 from 'dagre-d3';
import { Component, Prop, Watch } from 'vue-property-decorator';
import 'vue-tables-2';
import VarDAGNode from '../../../../../../shared/modules/Var/graph/var/VarDAGNode';
import IVarDataParamVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataParamVOBase';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarAction, ModuleVarGetter } from '../../store/VarStore';
import './VarDescComponent.scss';
import moment = require('moment');

@Component({
    template: require('./VarDescComponent.pug')
})
export default class VarDescComponent extends VueComponentBase {

    @ModuleVarGetter
    public getDescSelectedIndex: string;
    @ModuleVarAction
    public setDescSelectedIndex: (desc_selected_index: string) => void;
    @ModuleVarGetter
    public isDescDepsOpened: boolean;
    @ModuleVarAction
    public setDescDepsOpened: (desc_deps_opened: boolean) => void;

    @Prop()
    public var_param: IVarDataParamVOBase;
    @Prop({ default: 0 })
    public depth: number;
    @Prop({ default: 2 })
    public max_depth: number;

    get is_selected_var(): boolean {
        return this.getDescSelectedIndex == this.var_index;
    }

    get var_index(): string {
        if (!this.var_param) {
            return null;
        }

        return VarsController.getInstance().getVarControllerById(this.var_param.var_id).varDataParamController.getIndex(this.var_param);
    }

    get var_name(): string {
        if (!this.var_param) {
            return null;
        }

        return this.t(VarsController.getInstance().get_translatable_name_code(this.var_param.var_id));
    }

    get var_description(): string {
        if (!this.var_param) {
            return null;
        }

        return this.t(VarsController.getInstance().get_translatable_description_code(this.var_param.var_id));
    }

    get var_params_desc(): string {
        if (!this.var_param) {
            return null;
        }

        return this.t(VarsController.getInstance().get_translatable_params_desc_code(this.var_param.var_id), this.var_param);
    }

    get var_markers(): string {
        if (!this.var_param) {
            return null;
        }

        return JSON.stringify(VarsController.getInstance().varDAG.nodes[this.getDescSelectedIndex].markers);
    }

    get var_deps(): { [name: string]: VarDAGNode } {
        if (!this.var_param) {
            return null;
        }

        return VarsController.getInstance().varDAG.nodes[
            VarsController.getInstance().getVarControllerById(this.var_param.var_id).varDataParamController.getIndex(this.var_param)].outgoing as { [name: string]: VarDAGNode };
    }


    public cleanUpGraph() {
        // Cleanup old graph
        let oldsvg = d3.select("svg > g");
        if (!!oldsvg) {
            d3.select("svg").nodes()[0].innerHTML = "";
        }
    }

    /**
     * On fait un graph de 1 niveau de dep (autour du noeud sélectionné)
     */
    public createGraph() {

        // this.cleanUpGraph();

        // Create the input graph
        let g = new dagreD3.graphlib.Graph()
            .setGraph({})
            .setDefaultEdgeLabel(function () { return {}; });

        // On s'intéresse au noeud sélectionné et aux incommings et outgoings de ce noeud et c'est tout
        let node_name: string = this.getDescSelectedIndex;
        let node: VarDAGNode = VarsController.getInstance().varDAG.nodes[node_name];
        g.setNode(node_name, node.getD3NodeDefinition(true));

        for (let i in node.outgoing) {
            let outgoing: VarDAGNode = node.outgoing[i] as VarDAGNode;
            g.setNode(outgoing.name, outgoing.getD3NodeDefinition(true));
            g.setEdge(node_name, outgoing.name);
        }

        for (let i in node.incoming) {
            let incoming: VarDAGNode = node.incoming[i] as VarDAGNode;
            g.setNode(incoming.name, incoming.getD3NodeDefinition(true));
            g.setEdge(incoming.name, node_name);
        }

        g.nodes().forEach(function (v) {
            let n = g.node(v);
            // Round the corners of the nodes
            n.rx = n.ry = 5;
        });

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

        let self = this;
        svgGroup.selectAll("g.node")
            .each(function (v) {
                $(this).mousedown(() => {
                    self.setDescSelectedIndex(v);
                });
            });

        // // Center the graph
        // let initialScale = 0.5;
        // svg.call(zoom.transform, d3.zoomIdentity.translate((svg.attr("width") - g.graph().width * initialScale) / 2, 20).scale(initialScale));

        // let xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
        // svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
        // svg.attr("height", g.graph().height + 40);
    }

    @Watch('var_param', { immediate: true })
    private onChangeVarParam(new_var_param: IVarDataParamVOBase, old_var_param: IVarDataParamVOBase) {

        // On doit vérifier qu'ils sont bien différents
        if (VarsController.getInstance().isSameParam(new_var_param, old_var_param)) {
            return;
        }

        if (old_var_param) {
            this.cleanUpGraph();
        }

        if (new_var_param) {
            this.createGraph();
        }
    }

    private select_var() {
        this.setDescSelectedIndex(this.var_index);
    }

    private un_select_var() {
        this.setDescSelectedIndex(null);
    }
}