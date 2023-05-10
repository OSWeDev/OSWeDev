import { Cell, Graph } from "@maxgraph/core";
import ModuleTableField from "../../../../../../shared/modules/ModuleTableField";
import MaxGraphCellMapper from "./MaxGraphCellMapper";

export default class MaxGraphEdgeMapper {

    public _type: string = 'edge';

    public maxgraph_cell: Cell = null;

    public api_type_id: string = null;
    public field: ModuleTableField<any> = null;
    public label: string = null;

    public source_cell: MaxGraphCellMapper = null;
    public target_cell: MaxGraphCellMapper = null;

    get is_accepted(): boolean {
        if ((!this.source_cell) || (!this.source_cell.graphvoref)) {
            return false;
        }

        if (!this.source_cell.graphvoref.values_to_exclude) {
            return true;
        }

        return this.source_cell.graphvoref.values_to_exclude.indexOf(this.field.field_id) == -1;
    }

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