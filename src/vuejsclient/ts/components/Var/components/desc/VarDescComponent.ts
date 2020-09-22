import * as d3 from 'd3';
import { Component, Prop, Watch } from 'vue-property-decorator';
import 'vue-tables-2';
import SimpleDatatableField from '../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarAction, ModuleVarGetter } from '../../store/VarStore';
import './VarDescComponent.scss';

@Component({
    template: require('./VarDescComponent.pug')
})
export default class VarDescComponent extends VueComponentBase {

    @ModuleVarGetter
    public getStepNumber: number;
    @ModuleVarGetter
    public isStepping: number;

    @ModuleVarGetter
    public getDescSelectedVarParam: VarDataBaseVO;
    @ModuleVarAction
    public setDescSelectedVarParam: (desc_selected_var_param: VarDataBaseVO) => void;
    @ModuleVarGetter
    public isDescDepsOpened: boolean;
    @ModuleVarAction
    public setDescDepsOpened: (desc_deps_opened: boolean) => void;

    @Prop()
    public var_param: VarDataBaseVO;
    @Prop({ default: 0 })
    public depth: number;
    @Prop({ default: 2 })
    public max_depth: number;

    private step_number: number = 0;
    private var_datasources: { [datasource_name: string]: string } = {};

    private loaded_datas_matroids_desc: string = null;
    private computed_datas_matroids_desc: string = null;
    private var_params_desc: string = null;

    // get var_param_desc_component():any{
    //     if (!this.var_param){
    //         return null;
    //     }

    //     let controller = VarsController.getInstance().getVarControllerById(this.var_param.var_id);

    //     if (!controller) {
    //         return null;
    //     }

    //     controller.varDataParamController.
    // }

    // public async update_var_datasources() {

    //     this.var_datasources = {};
    //     if (!this.var_param) {
    //         return;
    //     }

    //     let controller = VarsController.getInstance().getVarControllerById(this.var_param.var_id);

    //     if (!controller) {
    //         return;
    //     }

    //     let datasources: Array<IDataSourceController<any, any>> = controller.getDataSourcesDependencies();

    //     for (let i in datasources) {
    //         let datasource = datasources[i];

    //         let tmp_datasource_data = null;
    //         tmp_datasource_data = datasource.get_data(this.var_param);

    //         if (!tmp_datasource_data) {
    //             await datasource.load_for_batch({
    //                 [this.var_index]: this.var_param
    //             });
    //             tmp_datasource_data = datasource.get_data(this.var_param);
    //         }

    //         if (!tmp_datasource_data) {
    //             this.var_datasources[datasource.name] = '-';
    //         } else {
    //             this.var_datasources[datasource.name] = JSON.stringify(tmp_datasource_data);
    //         }
    //     }
    // }

    // get var_dependencies_tree_prct(): string {
    //     if (!this.var_param) {
    //         return null;
    //     }

    //     let selectedNode: VarDAGNode = VarsController.getInstance().varDAG.nodes[this.getDescSelectedVarParam];

    //     if (!selectedNode) {
    //         return null;
    //     }

    //     return this.formatNumber_2decimal(selectedNode.dependencies_tree_prct * 100);
    // }

    // get var_dependencies_count(): number {
    //     if (!this.var_param) {
    //         return null;
    //     }

    //     let selectedNode: VarDAGNode = VarsController.getInstance().varDAG.nodes[this.getDescSelectedVarParam];

    //     if (!selectedNode) {
    //         return null;
    //     }

    //     return selectedNode.dependencies_count;
    // }

    get is_selected_var(): boolean {
        return this.getDescSelectedVarParam && (this.getDescSelectedVarParam.index == this.var_index);
    }

    get var_index(): string {
        if (!this.var_param) {
            return null;
        }

        return this.var_param.index;
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

    public async get_copy_with_explaining_fields(matroid): Promise<VarDataBaseVO> {
        if ((!this.var_param) || (!matroid)) {
            return null;
        }

        let controller = VarsController.getInstance().getVarControllerById(this.var_param.var_id);

        if (!controller) {
            return null;
        }

        // On essaie de proposer des params pré-travaillés
        let param: any = {};
        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[controller.varConf.var_data_vo_type];

        for (let i in moduletable.get_fields()) {
            let field = moduletable.get_fields()[i];

            if ([
                //VarDataBaseVO
                "var_id",

                //IDistantVOBase
                "id",
                "_type",

                //IVarDataVOBase
                "value_type",
                "value_ts",
                "missing_datas_infos",
            ].indexOf(field.field_id) >= 0) {
                continue;
            }

            param[field.field_id] = await SimpleDatatableField.defaultDataToReadIHM(matroid[field.field_id], field, matroid);
        }

        return param;
    }

    public cleanUpGraph() {
        // Cleanup old graph
        let oldsvg = d3.select(this.$el).select("svg > g");
        if ((!!oldsvg) && (!!d3.select(this.$el).select("svg").nodes()[0])) {
            d3.select(this.$el).select("svg").nodes()[0].innerHTML = "";
        }
    }

    /**
     * On fait un graph de 1 niveau de dep (autour du noeud sélectionné)
     */
    // public async createGraph() {

    //     this.cleanUpGraph();

    //     // Create the input graph
    //     let g = new dagreD3.graphlib.Graph()
    //         .setGraph({})
    //         .setDefaultEdgeLabel(function () { return {}; });

    //     // On s'intéresse au noeud sélectionné et aux incommings et outgoings de ce noeud et c'est tout
    //     let node_name: string = this.getDescSelectedVarParam;
    //     let node: VarDAGNode = VarsController.getInstance().varDAG.nodes[node_name];

    //     if (!node) {
    //         return;
    //     }

    //     g.setNode(node_name, node.getD3NodeDefinition(true));

    //     for (let i in node.outgoing) {
    //         let outgoing: VarDAGNode = node.outgoing[i] as VarDAGNode;
    //         g.setNode(outgoing.name, outgoing.getD3NodeDefinition(true));
    //         g.setEdge(node_name, outgoing.name);
    //     }

    //     for (let i in node.incoming) {
    //         let incoming: VarDAGNode = node.incoming[i] as VarDAGNode;
    //         g.setNode(incoming.name, incoming.getD3NodeDefinition(true));
    //         g.setEdge(incoming.name, node_name);
    //     }

    //     g.nodes().forEach(function (v) {
    //         let n = g.node(v);
    //         // Round the corners of the nodes
    //         n.rx = n.ry = 5;
    //     });

    //     // Set up an SVG group so that we can translate the final graph.
    //     let svg = d3.select(this.$el).select("svg");
    //     let svgGroup = svg.append("g");

    //     // Set up zoom support
    //     var zoom = d3.zoom().on("zoom", function () {
    //         svgGroup.attr("transform", d3.event.transform);
    //     });
    //     svg.call(zoom);

    //     // Create the renderer
    //     let render = new dagreD3.render();

    //     // Run the renderer. This is what draws the final graph.
    //     render(svgGroup, g);

    //     let self = this;
    //     svgGroup.selectAll("g.node")
    //         .each(function (v) {
    //             $(this).mousedown(() => {
    //                 self.getDescSelectedVarParam(v);
    //             });
    //         });

    //     // // Center the graph
    //     // let initialScale = 0.5;
    //     // svg.call(zoom.transform, d3.zoomIdentity.translate((svg.attr("width") - g.graph().width * initialScale) / 2, 20).scale(initialScale));

    //     // let xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
    //     // svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
    //     // svg.attr("height", g.graph().height + 40);
    // }

    @Watch('var_param', { immediate: true })
    private async onChangeVarParam(new_var_param: VarDataBaseVO, old_var_param: VarDataBaseVO) {

        // On doit vérifier qu'ils sont bien différents
        if (VarsController.getInstance().isSameParam(new_var_param, old_var_param)) {
            return;
        }

        if (old_var_param) {
        }

        if (new_var_param) {
            // await this.createGraph();
        }
    }

    @Watch('getStepNumber')
    private async onStepNumber(new_var_param: number, old_var_param: number) {

        // On refresh le graph automatiquement si le step_number change et que l'on est en train de step
        if (new_var_param == old_var_param) {
            return;
        }

        if (new_var_param == this.step_number) {
            return;
        }

        if (!this.isStepping) {
            return;
        }

        this.step_number = new_var_param;
        // await this.createGraph();
    }

    private select_var() {
        this.setDescSelectedVarParam(this.var_param);
    }

    private un_select_var() {
        this.setDescSelectedVarParam(null);
    }

    private async update_var_infos() {
        // await this.set_loaded_datas_matroids_desc();
        // await this.set_computed_datas_matroids_desc();
        await this.set_var_params_desc();
    }

    private async update_var_data() {
        await VarsController.getInstance().registerDataParamAndReturnVarData(this.var_param, true, true);
        await this.update_var_infos();
    }

    // private async set_loaded_datas_matroids_desc(): Promise<void> {
    //     if (!this.var_index) {
    //         this.loaded_datas_matroids_desc = null;
    //     }

    //     let node = VarsController.getInstance().varDAG.nodes[this.var_index];

    //     if ((!node.loaded_datas_matroids) || (!node.loaded_datas_matroids.length)) {
    //         this.loaded_datas_matroids_desc = null;
    //     }

    //     let res: string = "";
    //     for (let i in node.loaded_datas_matroids) {
    //         let matroid = node.loaded_datas_matroids[i];

    //         res += ((res == "") ? "" : ";") + JSON.stringify(await this.get_copy_with_explaining_fields(matroid));
    //     }

    //     this.loaded_datas_matroids_desc = res;
    // }

    // get loaded_datas_matroids_sum_value_desc(): string {
    //     if (!this.var_index) {
    //         return null;
    //     }

    //     let node = VarsController.getInstance().varDAG.nodes[this.var_index];

    //     return ((typeof node.loaded_datas_matroids_sum_value !== 'undefined') && (node.loaded_datas_matroids_sum_value != null)) ? node.loaded_datas_matroids_sum_value.toString() : null;
    // }

    // private async set_computed_datas_matroids_desc(): Promise<void> {
    //     if (!this.var_index) {
    //         this.computed_datas_matroids_desc = null;
    //     }

    //     let node = VarsController.getInstance().varDAG.nodes[this.var_index];

    //     let res: string = "";
    //     for (let i in node.computed_datas_matroids) {
    //         let matroid = node.computed_datas_matroids[i];

    //         res += ((res == "") ? "" : ";") + JSON.stringify(await this.get_copy_with_explaining_fields(matroid));
    //     }

    //     this.computed_datas_matroids_desc = res;
    // }

    private async set_var_params_desc(): Promise<void> {
        if (!this.var_param) {
            this.var_params_desc = null;
        }

        // return this.t(VarsController.getInstance().get_translatable_params_desc_code(this.var_param.var_id), this.get_copy_with_explaining_fields(this.var_param));
        this.var_params_desc = JSON.stringify(await this.get_copy_with_explaining_fields(this.var_param));
    }
}