import { Cell, Geometry, Graph, Rectangle } from "@maxgraph/core";
import DashboardGraphVORefVO from "../../../../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO";
import ModuleTable from "../../../../../../shared/modules/ModuleTable";
import ModuleTableField from "../../../../../../shared/modules/ModuleTableField";
import { VOsTypesManager } from "../../../../../../shared/modules/VO/manager/VOsTypesManager";
import ConsoleHandler from "../../../../../../shared/tools/ConsoleHandler";
import VueAppBase from "../../../../../VueAppBase";
import MaxGraphEdgeMapper from "./MaxGraphEdgeMapper";
import MaxGraphMapper from "./MaxGraphMapper";
import { clone } from '@maxgraph/core/dist/esm/util/cloneUtils';

// CustomUserObject
window['CustomUserObject'] = function (name, type) {
    this.name = name || 'New Name';
    this.type = type || 'New Type';
    this.clone = function () {
        return clone(this);
    };
};

export default class MaxGraphCellMapper {

    public static get_new_maxgraph_cell(maxgraph: Graph, parent: Cell, label: string, x: number, y: number, width: number, height: number): Cell {

        let new_maxgraph_cell = maxgraph.model.cloneCell(MaxGraphCellMapper.get_cell_prototype());
        maxgraph.setCellStyles('strokeColor', '#555', [new_maxgraph_cell]);
        maxgraph.setCellStyles('fillColor', '#444', [new_maxgraph_cell]);
        maxgraph.setCellStyles('fontColor', '#fff', [new_maxgraph_cell]);
        maxgraph.setCellStyles('align', 'center', [new_maxgraph_cell]);
        maxgraph.setCellStyles('verticalAlign', 'middle', [new_maxgraph_cell]);
        maxgraph.setCellStyles('labelBackgroundColor', '#444', [new_maxgraph_cell]);
        new_maxgraph_cell.geometry.x = x;
        new_maxgraph_cell.geometry.y = y;
        new_maxgraph_cell.geometry.alternateBounds = new Rectangle(0, 0, width, height);
        maxgraph.addCell(new_maxgraph_cell, parent); //Adding the cell

        return new_maxgraph_cell;
    }

    private static get_cell_prototype() {
        let customObject = new window['CustomUserObject']();
        let object = new Cell(customObject, new Geometry(0, 0, 200, 50));
        object.setVertex(true);
        object.setConnectable(false);
        return object;
    }

    public _type: string = 'cell';

    public maxgraph_cell: Cell = null;

    public graphvoref: DashboardGraphVORefVO = null;

    public api_type_id: string = null;
    public moduletable: ModuleTable<any> = null;
    public label: string = null;

    public incoming_edges: MaxGraphEdgeMapper[] = [];
    public outgoing_edges: { [field_id: string]: MaxGraphEdgeMapper } = {};

    get outgoing_edges_array(): MaxGraphEdgeMapper[] {
        return this.outgoing_edges ? Object.values(this.outgoing_edges) : [];
    }

    public add_to_maxgraph(maxgraph: Graph): Cell {
        if (this.maxgraph_cell) {
            return null;
        }

        if (!this.graphvoref) {
            ConsoleHandler.error('MaxGraphCellMapper.add_to_maxgraph: graphvoref not set');
            return null;
        }

        if (this.is_hidden_nn) {
            return null;
        }

        let parent = maxgraph.getDefaultParent();

        let newcell = MaxGraphCellMapper.get_new_maxgraph_cell(
            maxgraph,
            parent,
            this.label,
            this.graphvoref.x,
            this.graphvoref.y,
            this.graphvoref.width ? this.graphvoref.width : MaxGraphMapper.default_width,
            this.graphvoref.height ? this.graphvoref.height : MaxGraphMapper.default_height);

        this.maxgraph_cell = newcell;
        return newcell;
    }

    public add_edge(target_cell: MaxGraphCellMapper, field: ModuleTableField<any>) {

        if (!!this.outgoing_edges[field.field_id]) {
            return;
        }

        let new_edge: MaxGraphEdgeMapper = new MaxGraphEdgeMapper();
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
            throw new Error('MaxGraphCellMapper.is_hidden_nn: outgoing_edges not set');
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