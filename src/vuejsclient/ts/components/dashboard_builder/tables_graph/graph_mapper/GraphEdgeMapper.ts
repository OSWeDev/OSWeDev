import { Cell, Graph } from "@maxgraph/core";
import ModuleTableField from "../../../../../../shared/modules/ModuleTableField";
import GraphCellMapper from "./GraphCellMapper";

export default class GraphEdgeMapper {

    public _type: string = 'edge';

    public maxgraph_cell: Cell = null;

    public api_type_id: string = null;
    public field: ModuleTableField<any> = null;
    public label: string = null;

    public source_cell: GraphCellMapper = null;
    public target_cell: GraphCellMapper = null;

    public is_accepted: boolean = true;

    public add_to_maxgraph(maxgraph: Graph): Cell {
        if (this.maxgraph_cell) {
            return null;
        }

        if (this.is_hidden_nn) {
            return null;
        }

        let parent = maxgraph.getDefaultParent();
        let label = this.label;
        const new_edge = maxgraph.insertEdge(parent, null, label, this.source_cell.maxgraph_cell, this.target_cell.maxgraph_cell, this.is_accepted ? {
            strokeColor: 'green',
        } : {
            strokeColor: 'red',
        });
        this.maxgraph_cell = new_edge;
        return new_edge;
    }

    get is_hidden_nn(): boolean {
        return this.source_cell.is_hidden_nn;
    }
}