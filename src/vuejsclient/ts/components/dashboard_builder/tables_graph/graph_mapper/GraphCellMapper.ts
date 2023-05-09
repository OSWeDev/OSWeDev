import { Cell, Geometry, Graph, Rectangle } from "@maxgraph/core";
import DashboardGraphVORefVO from "../../../../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO";
import ModuleTable from "../../../../../../shared/modules/ModuleTable";
import ModuleTableField from "../../../../../../shared/modules/ModuleTableField";
import { VOsTypesManager } from "../../../../../../shared/modules/VO/manager/VOsTypesManager";
import ConsoleHandler from "../../../../../../shared/tools/ConsoleHandler";
import VueAppBase from "../../../../../VueAppBase";
import GraphEdgeMapper from "./GraphEdgeMapper";
import GraphMapper from "./GraphMapper";

export default class GraphCellMapper {

    public _type: string = 'cell';

    public maxgraph_cell: Cell = null;

    public graphvoref: DashboardGraphVORefVO = null;

    public api_type_id: string = null;
    public moduletable: ModuleTable<any> = null;
    public label: string = null;

    public incoming_edges: GraphEdgeMapper[] = [];
    public outgoing_edges: { [field_id: string]: GraphEdgeMapper } = {};

    get outgoing_edges_array(): GraphEdgeMapper[] {
        return this.outgoing_edges ? Object.values(this.outgoing_edges) : [];
    }

    public add_to_maxgraph(maxgraph: Graph): Cell {
        if (this.maxgraph_cell) {
            return null;
        }

        if (!this.graphvoref) {
            ConsoleHandler.error('GraphCellMapper.add_to_maxgraph: graphvoref not set');
            return null;
        }

        if (this.is_hidden_nn) {
            return null;
        }

        let parent = maxgraph.getDefaultParent();

        let newcell = maxgraph.insertVertex(parent, null, this.label, this.graphvoref.x, this.graphvoref.y, this.graphvoref.width ? this.graphvoref.width : GraphMapper.default_width, this.graphvoref.height ? this.graphvoref.height : GraphMapper.default_height, {
            strokeColor: '#555',
            fillColor: '#444'
        });
        newcell.connectable = false;

        this.maxgraph_cell = newcell;
        return newcell;
    }

    public add_edge(target_cell: GraphCellMapper, field: ModuleTableField<any>) {

        if (!!this.outgoing_edges[field.field_id]) {
            return;
        }

        let new_edge: GraphEdgeMapper = new GraphEdgeMapper();
        new_edge.source_cell = this;
        new_edge.target_cell = target_cell;
        new_edge.api_type_id = this.api_type_id;
        new_edge.label = VueAppBase.getInstance().vueInstance.t(field.field_label.code_text);
        new_edge.field = field;

        this.outgoing_edges[field.field_id] = new_edge;
        target_cell.incoming_edges.push(new_edge);
    }

    /**
     * On peut cacher la relation N/N si toutes les liaisonsde la relation (2) sont actives
     *  et si on a pas explicitement demandé ce type via les graphvoref
     */
    get is_hidden_nn(): boolean {
        if (!VOsTypesManager.isManyToManyModuleTable(VOsTypesManager.moduleTables_by_voType[this.api_type_id])) {
            return false;
        }
        if (!this.outgoing_edges) {
            throw new Error('GraphCellMapper.is_hidden_nn: outgoing_edges not set');
        }

        if (!!this.graphvoref) {
            return false;
        }

        if (Object.keys(this.outgoing_edges).length != 2) {
            return false;
        }

        for (let i in this.outgoing_edges) {
            if (!this.outgoing_edges[i].is_accepted) {
                return false;
            }
        }

        return true;
    }
}