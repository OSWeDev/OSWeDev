import { Component, Prop } from 'vue-property-decorator';
import 'vue-tables-2';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import HourRange from '../../../../../../shared/modules/DataRender/vos/HourRange';
import NumRange from '../../../../../../shared/modules/DataRender/vos/NumRange';
import TSRange from '../../../../../../shared/modules/DataRender/vos/TSRange';
import ModuleFormatDatesNombres from '../../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import MatroidController from '../../../../../../shared/modules/Matroid/MatroidController';
import ModuleTableField from '../../../../../../shared/modules/ModuleTableField';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import VueComponentBase from '../../../VueComponentBase';
import VarsClientController from '../../VarsClientController';
import './VarDescComponent.scss';

@Component({
    template: require('./VarDescComponent.pug'),
    components: {
    }
})
export default class VarDescComponent extends VueComponentBase {

    // @ModuleVarGetter
    // private getDescSelectedVarParam: VarDataBaseVO;
    // @ModuleVarAction
    // private setDescSelectedVarParam: (desc_selected_var_param: VarDataBaseVO) => void;

    @Prop()
    private var_param: VarDataBaseVO;

    get ts_range_type(): number {
        return TSRange.RANGE_TYPE;
    }

    get hour_range_type(): number {
        return HourRange.RANGE_TYPE;
    }

    get num_range_type(): number {
        return NumRange.RANGE_TYPE;
    }

    get param_table_name(): string {
        if (!this.var_param) {
            return null;
        }
        return VOsTypesManager.getInstance().moduleTables_by_voType[this.var_param._type].name;
    }

    /**
     * All fields names except the ts_range field
     */
    get var_data_other_fields(): Array<ModuleTableField<any>> {
        if (!this.var_param) {
            return null;
        }

        let res: Array<ModuleTableField<any>> = [];

        let matroid_bases: Array<ModuleTableField<any>> = MatroidController.getInstance().getMatroidFields(this.var_param._type);
        if (!matroid_bases) {
            return null;
        }

        for (let i in matroid_bases) {
            let matroid_base = matroid_bases[i];
            if (this.var_data_has_tsranges && (matroid_base.field_id == VarsController.getInstance().var_conf_by_id[this.var_param.var_id].ts_ranges_field_name)) {
                continue;
            }
            res.push(matroid_base);
        }

        return res;
    }

    get var_data_has_tsranges(): boolean {
        if (!this.var_param) {
            return false;
        }
        return VarsController.getInstance().var_conf_by_id[this.var_param.var_id].ts_ranges_segment_type != null;
    }

    get var_data_ts_ranges_field_id(): string {
        if (!this.var_data_has_tsranges) {
            return null;
        }
        return VarsController.getInstance().var_conf_by_id[this.var_param.var_id].ts_ranges_field_name;
    }

    get var_data_ts_ranges(): TSRange[] {
        if (!this.var_data_has_tsranges) {
            return null;
        }
        return this.var_param[VarsController.getInstance().var_conf_by_id[this.var_param.var_id].ts_ranges_field_name];
    }

    get var_data_has_valid_value(): boolean {
        if ((!this.var_param) || (!this.var_param.has_valid_value)) {
            return false;
        }
        return true;
    }

    get var_data_is_import(): boolean {
        if (!this.var_data_has_valid_value) {
            return false;
        }
        return this.var_param.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT;
    }

    get var_name(): string {
        if (!this.var_param) {
            return null;
        }

        return this.var_param.var_id + ' | ' + this.t(VarsClientController.getInstance().get_translatable_name_code_by_var_id(this.var_param.var_id));
    }

    get var_description(): string {
        if (!this.var_param) {
            return null;
        }

        return this.t(VarsClientController.getInstance().get_translatable_description_code_by_var_id(this.var_param.var_id));
    }

    private async update_var_data() {
        this.var_param.value_ts = null;
        await ModuleDAO.getInstance().insertOrUpdateVO(this.var_param);
        this.snotify.info(this.label('var.desc_mode.update_var_data'));
    }

    get var_data_last_update(): string {
        if (!this.var_data_has_valid_value) {
            return null;
        }

        return ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(this.var_param.value_ts);
    }



    // // get var_param_desc_component():any{
    // //     if (!this.var_param){
    // //         return null;
    // //     }

    // //     let controller = VarsController.getInstance().getVarControllerById(this.var_param.var_id);

    // //     if (!controller) {
    // //         return null;
    // //     }

    // //     controller.varDataParamController.
    // // }

    // // public async update_var_datasources() {

    // //     this.var_datasources = {};
    // //     if (!this.var_param) {
    // //         return;
    // //     }

    // //     let controller = VarsController.getInstance().getVarControllerById(this.var_param.var_id);

    // //     if (!controller) {
    // //         return;
    // //     }

    // //     let datasources: Array<IDataSourceController<any, any>> = controller.getDataSourcesDependencies();

    // //     for (let i in datasources) {
    // //         let datasource = datasources[i];

    // //         let tmp_datasource_data = null;
    // //         tmp_datasource_data = datasource.get_data(this.var_param);

    // //         if (!tmp_datasource_data) {
    // //             await datasource.load_for_batch({
    // //                 [this.var_index]: this.var_param
    // //             });
    // //             tmp_datasource_data = datasource.get_data(this.var_param);
    // //         }

    // //         if (!tmp_datasource_data) {
    // //             this.var_datasources[datasource.name] = '-';
    // //         } else {
    // //             this.var_datasources[datasource.name] = JSON.stringify(tmp_datasource_data);
    // //         }
    // //     }
    // // }

    // // get var_dependencies_tree_prct(): string {
    // //     if (!this.var_param) {
    // //         return null;
    // //     }

    // //     let selectedNode: VarDAGNode = VarsController.getInstance().varDAG.nodes[this.getDescSelectedVarParam];

    // //     if (!selectedNode) {
    // //         return null;
    // //     }

    // //     return this.formatNumber_2decimal(selectedNode.dependencies_tree_prct * 100);
    // // }

    // // get var_dependencies_count(): number {
    // //     if (!this.var_param) {
    // //         return null;
    // //     }

    // //     let selectedNode: VarDAGNode = VarsController.getInstance().varDAG.nodes[this.getDescSelectedVarParam];

    // //     if (!selectedNode) {
    // //         return null;
    // //     }

    // //     return selectedNode.dependencies_count;
    // // }

    // get is_selected_var(): boolean {
    //     return this.getDescSelectedVarParam && (this.getDescSelectedVarParam.index == this.var_index);
    // }

    // get var_index(): string {
    //     if (!this.var_param) {
    //         return null;
    //     }

    //     return this.var_param.index;
    // }

    // get var_description(): string {
    //     if (!this.var_param) {
    //         return null;
    //     }

    //     return this.t(VarsClientController.getInstance().get_translatable_description_code_by_var_id(this.var_param.var_id));
    // }


    // public async get_copy_with_explaining_fields(matroid): Promise<VarDataBaseVO> {
    //     if ((!this.var_param) || (!matroid)) {
    //         return null;
    //     }
    //     return null;
    //     // let controller = VarsClientController.getInstance().getVarControllerById(this.var_param.var_id);

    //     // if (!controller) {
    //     //     return null;
    //     // }

    //     // // On essaie de proposer des params pré-travaillés
    //     // let param: any = {};
    //     // let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[controller.varConf.var_data_vo_type];

    //     // for (let i in moduletable.get_fields()) {
    //     //     let field = moduletable.get_fields()[i];

    //     //     if ([
    //     //         //VarDataBaseVO
    //     //         "var_id",

    //     //         //IDistantVOBase
    //     //         "id",
    //     //         "_type",

    //     //         //IVarDataVOBase
    //     //         "value_type",
    //     //         "value_ts",
    //     //         "missing_datas_infos",
    //     //     ].indexOf(field.field_id) >= 0) {
    //     //         continue;
    //     //     }

    //     //     param[field.field_id] = await SimpleDatatableField.defaultDataToReadIHM(matroid[field.field_id], field, matroid);
    //     // }

    //     // return param;
    // }

    // public cleanUpGraph() {
    //     // Cleanup old graph
    //     let oldsvg = d3.select(this.$el).select("svg > g");
    //     if ((!!oldsvg) && (!!d3.select(this.$el).select("svg").nodes()[0])) {
    //         d3.select(this.$el).select("svg").nodes()[0].innerHTML = "";
    //     }
    // }

    // /**
    //  * On fait un graph de 1 niveau de dep (autour du noeud sélectionné)
    //  */
    // // public async createGraph() {

    // //     this.cleanUpGraph();

    // //     // Create the input graph
    // //     let g = new dagreD3.graphlib.Graph()
    // //         .setGraph({})
    // //         .setDefaultEdgeLabel(function () { return {}; });

    // //     // On s'intéresse au noeud sélectionné et aux incommings et outgoings de ce noeud et c'est tout
    // //     let node_name: string = this.getDescSelectedVarParam;
    // //     let node: VarDAGNode = VarsController.getInstance().varDAG.nodes[node_name];

    // //     if (!node) {
    // //         return;
    // //     }

    // //     g.setNode(node_name, node.getD3NodeDefinition(true));

    // //     for (let i in node.outgoing) {
    // //         let outgoing: VarDAGNode = node.outgoing[i] as VarDAGNode;
    // //         g.setNode(outgoing.name, outgoing.getD3NodeDefinition(true));
    // //         g.setEdge(node_name, outgoing.name);
    // //     }

    // //     for (let i in node.incoming) {
    // //         let incoming: VarDAGNode = node.incoming[i] as VarDAGNode;
    // //         g.setNode(incoming.name, incoming.getD3NodeDefinition(true));
    // //         g.setEdge(incoming.name, node_name);
    // //     }

    // //     g.nodes().forEach(function (v) {
    // //         let n = g.node(v);
    // //         // Round the corners of the nodes
    // //         n.rx = n.ry = 5;
    // //     });

    // //     // Set up an SVG group so that we can translate the final graph.
    // //     let svg = d3.select(this.$el).select("svg");
    // //     let svgGroup = svg.append("g");

    // //     // Set up zoom support
    // //     var zoom = d3.zoom().on("zoom", function () {
    // //         svgGroup.attr("transform", d3.event.transform);
    // //     });
    // //     svg.call(zoom);

    // //     // Create the renderer
    // //     let render = new dagreD3.render();

    // //     // Run the renderer. This is what draws the final graph.
    // //     render(svgGroup, g);

    // //     let self = this;
    // //     svgGroup.selectAll("g.node")
    // //         .each(function (v) {
    // //             $(this).mousedown(() => {
    // //                 self.getDescSelectedVarParam(v);
    // //             });
    // //         });

    // //     // // Center the graph
    // //     // let initialScale = 0.5;
    // //     // svg.call(zoom.transform, d3.zoomIdentity.translate((svg.attr("width") - g.graph().width * initialScale) / 2, 20).scale(initialScale));

    // //     // let xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
    // //     // svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
    // //     // svg.attr("height", g.graph().height + 40);
    // // }

    // @Watch('var_param', { immediate: true })
    // private async onChangeVarParam(new_var_param: VarDataBaseVO, old_var_param: VarDataBaseVO) {

    //     // On doit vérifier qu'ils sont bien différents
    //     if (VarDataBaseVO.are_same(new_var_param, old_var_param)) {
    //         return;
    //     }

    //     if (old_var_param) {
    //     }

    //     if (new_var_param) {
    //         // await this.createGraph();
    //     }
    // }

    // private select_var() {
    //     this.setDescSelectedVarParam(this.var_param);
    // }

    // private un_select_var() {
    //     this.setDescSelectedVarParam(null);
    // }

    // private async update_var_infos() {
    //     // await this.set_loaded_datas_matroids_desc();
    //     // await this.set_computed_datas_matroids_desc();
    //     await this.set_var_params_desc();
    // }


    // // private async set_loaded_datas_matroids_desc(): Promise<void> {
    // //     if (!this.var_index) {
    // //         this.loaded_datas_matroids_desc = null;
    // //     }

    // //     let node = VarsController.getInstance().varDAG.nodes[this.var_index];

    // //     if ((!node.loaded_datas_matroids) || (!node.loaded_datas_matroids.length)) {
    // //         this.loaded_datas_matroids_desc = null;
    // //     }

    // //     let res: string = "";
    // //     for (let i in node.loaded_datas_matroids) {
    // //         let matroid = node.loaded_datas_matroids[i];

    // //         res += ((res == "") ? "" : ";") + JSON.stringify(await this.get_copy_with_explaining_fields(matroid));
    // //     }

    // //     this.loaded_datas_matroids_desc = res;
    // // }

    // // get loaded_datas_matroids_sum_value_desc(): string {
    // //     if (!this.var_index) {
    // //         return null;
    // //     }

    // //     let node = VarsController.getInstance().varDAG.nodes[this.var_index];

    // //     return ((typeof node.loaded_datas_matroids_sum_value !== 'undefined') && (node.loaded_datas_matroids_sum_value != null)) ? node.loaded_datas_matroids_sum_value.toString() : null;
    // // }

    // // private async set_computed_datas_matroids_desc(): Promise<void> {
    // //     if (!this.var_index) {
    // //         this.computed_datas_matroids_desc = null;
    // //     }

    // //     let node = VarsController.getInstance().varDAG.nodes[this.var_index];

    // //     let res: string = "";
    // //     for (let i in node.computed_datas_matroids) {
    // //         let matroid = node.computed_datas_matroids[i];

    // //         res += ((res == "") ? "" : ";") + JSON.stringify(await this.get_copy_with_explaining_fields(matroid));
    // //     }

    // //     this.computed_datas_matroids_desc = res;
    // // }

    // private async set_var_params_desc(): Promise<void> {
    //     if (!this.var_param) {
    //         this.var_params_desc = null;
    //     }

    //     // return this.t(VarsController.getInstance().get_translatable_params_desc_code(this.var_param.var_id), this.get_copy_with_explaining_fields(this.var_param));
    //     this.var_params_desc = JSON.stringify(await this.get_copy_with_explaining_fields(this.var_param));
    // }
}