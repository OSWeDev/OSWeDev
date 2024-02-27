import { Cell, Geometry, Graph, Rectangle } from "@maxgraph/core";
import DashboardGraphVORefVO from "../../../../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO";
import ModuleTableVO from "../../../../../../shared/modules/ModuleTableVO";
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from "../../../../../../shared/modules/ModuleTableFieldVO";
import VOsTypesManager from "../../../../../../shared/modules/VO/manager/VOsTypesManager";
import ConsoleHandler from "../../../../../../shared/tools/ConsoleHandler";
import VueAppBase from "../../../../../VueAppBase";
import MaxGraphEdgeMapper from "./MaxGraphEdgeMapper";
import MaxGraphMapper from "./MaxGraphMapper";

export default class MaxGraphCellMapper {

    // public static create_parent_container(maxgraph: Graph): Cell {

    //     let new_maxgraph_cell = new Cell('', new Geometry(0, 0, width, height));
    //     new_maxgraph_cell.setVertex(true);
    //     new_maxgraph_cell.setConnectable(false);

    //     maxgraph.setCellStyles('strokeColor', '#555', [new_maxgraph_cell]);
    //     maxgraph.setCellStyles('fillColor', '#444', [new_maxgraph_cell]);
    //     maxgraph.setCellStyles('fontColor', '#fff', [new_maxgraph_cell]);
    //     maxgraph.setCellStyles('align', 'center', [new_maxgraph_cell]);
    //     maxgraph.setCellStyles('verticalAlign', 'middle', [new_maxgraph_cell]);
    //     maxgraph.setCellStyles('labelBackgroundColor', '#444', [new_maxgraph_cell]);
    //     maxgraph.addCell(new_maxgraph_cell, parent); //Adding the cell

    //     return new_maxgraph_cell;
    // }


    public static get_new_maxgraph_cell(maxgraph: Graph, parent: Cell, label: string, x: number, y: number, width: number, height: number): Cell {

        const new_maxgraph_cell = new Cell(label, new Geometry(x, y, width, height));

        new_maxgraph_cell.setVertex(true);
        new_maxgraph_cell.setConnectable(false);
        maxgraph.setCellStyles('strokeColor', '#555', [new_maxgraph_cell]);
        maxgraph.setCellStyles('fillColor', '#444', [new_maxgraph_cell]);
        maxgraph.setCellStyles('fontColor', '#fff', [new_maxgraph_cell]);
        maxgraph.setCellStyles('align', 'center', [new_maxgraph_cell]);
        maxgraph.setCellStyles('verticalAlign', 'middle', [new_maxgraph_cell]);
        maxgraph.setCellStyles('labelBackgroundColor', '#444', [new_maxgraph_cell]);
        maxgraph.addCell(new_maxgraph_cell, parent); //Adding the cell

        return new_maxgraph_cell;
    }

    public _type: string = 'cell';

    public maxgraph_cell: Cell = null;

    public graphvoref: DashboardGraphVORefVO = null;

    public api_type_id: string = null;
    public moduletable: ModuleTableVO = null;
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

        const parent = maxgraph.getDefaultParent();

        const newcell = MaxGraphCellMapper.get_new_maxgraph_cell(
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

    public add_edge(target_cell: MaxGraphCellMapper, field: ModuleTableFieldVO): MaxGraphEdgeMapper {

        if (this.outgoing_edges[field.field_id]) {
            return null;
        }

        const new_edge: MaxGraphEdgeMapper = new MaxGraphEdgeMapper();
        new_edge.source_cell = this;
        new_edge.target_cell = target_cell;
        new_edge.api_type_id = this.api_type_id;
        new_edge.label = VueAppBase.getInstance().vueInstance.t(field.field_label.code_text);
        new_edge.field = field;

        this.outgoing_edges[field.field_id] = new_edge;
        target_cell.incoming_edges.push(new_edge);
        return new_edge;
    }

    /**
     * On peut cacher la relation N/N si toutes les liaisonsde la relation (2) sont actives
     *  et si on a pas explicitement demandé ce type via les graphvoref
     */
    get is_hidden_nn(): boolean {
        if (!VOsTypesManager.isManyToManyModuleTable(ModuleTableController.module_tables_by_vo_type[this.api_type_id])) {
            return false;
        }
        if (!this.outgoing_edges) {
            throw new Error('MaxGraphCellMapper.is_hidden_nn: outgoing_edges not set');
        }

        if (this.graphvoref) {
            return false;
        }

        if (Object.keys(this.outgoing_edges).length != 2) {
            return false;
        }

        for (const i in this.outgoing_edges) {
            if (!this.outgoing_edges[i].is_accepted) {
                return false;
            }
        }

        return true;
    }
}