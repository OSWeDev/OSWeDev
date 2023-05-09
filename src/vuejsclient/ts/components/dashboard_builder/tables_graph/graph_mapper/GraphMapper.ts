import { Cell, Graph } from "@maxgraph/core";
import { query } from "../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleDAO from "../../../../../../shared/modules/DAO/ModuleDAO";
import DashboardGraphVORefVO from "../../../../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO";
import ModuleTable from "../../../../../../shared/modules/ModuleTable";
import { VOsTypesManager } from "../../../../../../shared/modules/VO/manager/VOsTypesManager";
import ConsoleHandler from "../../../../../../shared/tools/ConsoleHandler";
import VueAppBase from "../../../../../VueAppBase";
import GraphCellMapper from "./GraphCellMapper";
import GraphEdgeMapper from "./GraphEdgeMapper";

export default class GraphMapper {

    public static default_width: number = 200;
    public static default_height: number = 50;

    public static async load_from_dashboard(dashboard_id: number): Promise<GraphMapper> {

        if (!dashboard_id) {
            return null;
        }

        let vos_refs: DashboardGraphVORefVO[] = await query(DashboardGraphVORefVO.API_TYPE_ID).filter_by_num_eq('dashboard_id', dashboard_id).select_vos<DashboardGraphVORefVO>();
        if (!vos_refs || !vos_refs.length) {
            return null;
        }

        let res = new GraphMapper();
        res.dashboard_id = dashboard_id;

        /**
         * On ajoute d'abord les cellules / vo_type
         */
        let api_type_ids: string[] = [];
        let tables: Array<ModuleTable<any>> = [];
        for (let i in vos_refs) {
            const graphvoref: DashboardGraphVORefVO = vos_refs[i];

            const cell = res.add_cell_from_graphvoref(graphvoref);
            res.cells[cell.api_type_id] = cell;

            api_type_ids.push(cell.api_type_id);
            tables.push(cell.moduletable);
        }

        /**
         * Puis les relations N/N activées automatiquement par ces types
         */
        let activated_many_to_many = GraphMapper.get_activated_many_to_many(api_type_ids);
        for (let i in activated_many_to_many) {
            let api_type_id = activated_many_to_many[i];

            let graphvoref = new DashboardGraphVORefVO();
            graphvoref.x = 800;
            graphvoref.y = 80;
            graphvoref.width = GraphMapper.default_width;
            graphvoref.height = GraphMapper.default_height;
            graphvoref.vo_type = api_type_id;
            graphvoref.dashboard_id = dashboard_id;

            // Si on ajoute un N/N, on désactive par défaut les liaisons (nouvelles donc)
            let fields = VOsTypesManager.moduleTables_by_voType[api_type_id].get_fields();
            graphvoref.values_to_exclude = fields.map((field) => field.field_id);

            let insert_res = await ModuleDAO.getInstance().insertOrUpdateVO(graphvoref);
            if ((!insert_res) || (!insert_res.id)) {
                ConsoleHandler.error('Impossible de créer le graphvoref pour le type: ' + api_type_id);
                throw new Error('Impossible de créer le graphvoref pour le type: ' + api_type_id);
            }
            graphvoref.id = insert_res.id;

            const cell = res.add_cell_from_graphvoref(graphvoref);
            res.cells[cell.api_type_id] = cell;

            api_type_ids.push(cell.api_type_id);
            tables.push(cell.moduletable);
        }

        /**
         * Puis les edges entre ces types
         */
        for (let i in tables) {
            const table: ModuleTable<any> = tables[i];

            let fields = table.get_fields();
            for (let j in fields) {
                const field = fields[j];

                if (!field.manyToOne_target_moduletable) {
                    continue;
                }

                let edge: GraphEdgeMapper = new GraphEdgeMapper();
                edge.source_cell = res.cells[table.vo_type];
                edge.target_cell = res.cells[field.manyToOne_target_moduletable.vo_type];
                edge.label = VueAppBase.getInstance().vueInstance.t(field.field_label.code_text);
                edge.field = field;
                edge.api_type_id = field.module_table.vo_type;
                edge.is_accepted = true;

                res.edges.push(edge);
            }
        }

        /**
         * Enfin, on inactive les edges qui ne sont pas acceptés
         */
        for (let i in vos_refs) {
            const graphvoref: DashboardGraphVORefVO = vos_refs[i];

            let cell: GraphCellMapper = res.cells[graphvoref.vo_type];

            if ((!cell) || (!cell.outgoing_edges)) {
                continue;
            }

            for (let index_field_id in graphvoref.values_to_exclude) {
                let field_id: string = graphvoref.values_to_exclude[index_field_id];

                if (!cell.outgoing_edges[field_id]) {
                    continue;
                }
                cell.outgoing_edges[field_id].is_accepted = false;
            }
        }

        return res;
    }

    /**
     * On agrémente la liste des active_api_type_ids par les relations N/N dont les types liés sont actifs
     */
    private static get_activated_many_to_many(api_type_ids: string[]): string[] {

        let res: string[] = [];
        let nn_tables = VOsTypesManager.get_manyToManyModuleTables();
        for (let i in nn_tables) {
            let nn_table = nn_tables[i];

            if (api_type_ids.indexOf(nn_table.vo_type) >= 0) {
                continue;
            }

            let nnfields = nn_table.get_fields();
            let has_inactive_relation = false;
            for (let j in nnfields) {
                let nnfield = nnfields[j];

                if (api_type_ids.indexOf(nnfield.manyToOne_target_moduletable.vo_type) < 0) {
                    has_inactive_relation = true;
                    break;
                }
            }

            if (!has_inactive_relation) {
                res.push(nn_table.vo_type);
            }
        }

        return res;
    }

    public dashboard_id: number = null;

    public maxgraph: Graph = null;

    public cells: { [api_type_id: string]: GraphCellMapper } = {};
    public edges: GraphEdgeMapper[] = [];

    public maxgraph_elt_by_maxgraph_id: { [maxgraph_id: string]: GraphCellMapper | GraphEdgeMapper } = {};
    public maxgraph_nn_edges: { [api_type_id: string]: Cell } = {};

    /**
     * Objectif : Rendre le graphique compatible avec les mappers configurés
     * @param dashboard_id
     * @returns
     */
    public async remap() {

        /**
         * Checke les cellules à ajouter / supprimer
         *  On doit ajouter les cellules qu'on a pas dans cell.maxgraph_cell et qui devraient être affichées
         */
        this.add_remove_cells_of_maxgraph();

        /**
         * On a pas de params sur les cells, on passe à l'ajout / suppression des edges
         *  et on remap les params des edges pour ceux qui sont déjà présents (juste la couleur si pas accepté)
         */
        this.add_remove_remap_edges_of_maxgraph();
    }

    public build_maxgraph(container: HTMLElement) {

        if (!this.maxgraph) {
            this.maxgraph = new Graph(container);
            this.maxgraph.setConnectable(false);
            this.maxgraph.setCellsDisconnectable(false);
            this.maxgraph.setPanning(true);
            this.maxgraph.setAllowDanglingEdges(false);

            this.maxgraph.addListener('moveCells', async () => {
                let cell = this.maxgraph.getSelectionCell();
                let db_cells = await query(DashboardGraphVORefVO.API_TYPE_ID)
                    .filter_by_num_eq('dashboard_id', this.dashboard_id)
                    .filter_by_text_eq('vo_type', cell.value.tables_graph_vo_type)
                    .select_vos<DashboardGraphVORefVO>();

                if ((!db_cells) || (!db_cells.length)) {
                    ConsoleHandler.error('Event.MOVE_END:no db cell');
                    return;
                }
                let db_cell = db_cells[0];
                db_cell.x = cell.geometry.x;
                db_cell.y = cell.geometry.y;
                db_cell.width = cell.geometry.width;
                db_cell.height = cell.geometry.height;
                await ModuleDAO.getInstance().insertOrUpdateVO(db_cell);
            });

            this.maxgraph.centerZoom = false;
            this.maxgraph.swimlaneNesting = false;
            // this.maxgraph.dropEnabled = true;
            this.maxgraph.dropEnabled = false;
            this.maxgraph.cellsEditable = false;
            this.maxgraph.htmlLabels = false;
        }

        if (!this.cells) {
            return;
        }

        for (let i in this.cells) {
            const cell: GraphCellMapper = this.cells[i];

            const maxgraph_cell: Cell = cell.add_to_maxgraph(this.maxgraph);
            if (!!maxgraph_cell) {
                continue;
            }
            this.maxgraph_elt_by_maxgraph_id[maxgraph_cell.id] = cell;
        }

        for (let i in this.edges) {
            const edge: GraphEdgeMapper = this.edges[i];

            const maxgraph_edge: Cell = edge.add_to_maxgraph(this.maxgraph);
            if (!!maxgraph_edge) {
                continue;
            }
            this.maxgraph_elt_by_maxgraph_id[maxgraph_edge.id] = edge;
        }

        /**
         * On ajoute les relations cachées N/N qu'on a pour le moment ignorées, en reliant par une flèche au lieu d'une cellule + 2 flèches
         */
        this.add_nn_hidden_relations();
    }

    /**
     * On ajoute les relations cachées N/N qu'on a pour le moment ignorées, en reliant par une flèche au lieu d'une cellule + 2 flèches
     */
    private add_nn_hidden_relations() {

        for (let i in this.cells) {
            const cell: GraphCellMapper = this.cells[i];

            if (!cell.is_hidden_nn) {
                continue;
            }

            let label: string = cell.label + ' (N/N)';
            let parent = this.maxgraph.getDefaultParent();

            let source_api_type_id = null;
            let dest_api_type_id = null;

            for (let j in cell.outgoing_edges) {
                const edge: GraphEdgeMapper = cell.outgoing_edges[j];

                if (!source_api_type_id) {
                    source_api_type_id = edge.target_cell.api_type_id;
                    continue;
                }
                dest_api_type_id = edge.target_cell.api_type_id;
            }

            const new_edge = this.maxgraph.insertEdge(parent, null, label, this.cells[source_api_type_id], this.cells[dest_api_type_id], {
                endArrow: "classic",
                startArrow: "classic"
            });
            this.maxgraph_nn_edges[cell.api_type_id] = new_edge;
            this.maxgraph_elt_by_maxgraph_id[new_edge.id] = cell;
        }
    }

    private add_cell_from_graphvoref(graphvoref: DashboardGraphVORefVO) {
        let cell: GraphCellMapper = new GraphCellMapper();
        cell.api_type_id = graphvoref.vo_type;
        cell.moduletable = VOsTypesManager.moduleTables_by_voType[cell.api_type_id];
        cell.label = VueAppBase.getInstance().vueInstance.t(cell.moduletable.label.code_text);
        cell.graphvoref = graphvoref;

        this.cells[cell.api_type_id] = cell;
        return cell;
    }

    private add_remove_cells_of_maxgraph() {
        let allowed_vertices_ids: { [id: string]: boolean } = {};
        let cells_to_delete: Cell[] = [];
        for (let i in this.cells) {
            const cell = this.cells[i];

            if ((!cell.maxgraph_cell) && (!cell.is_hidden_nn)) {
                const newCell: Cell = cell.add_to_maxgraph(this.maxgraph);
                cell.maxgraph_cell = newCell;
                allowed_vertices_ids[newCell.id] = true;
                continue;
            }

            if ((!!cell.maxgraph_cell) && (cell.is_hidden_nn)) {
                cell.maxgraph_cell = null;
                cells_to_delete.push(cell.maxgraph_cell);
                continue;
            }

            if (cell.maxgraph_cell) {
                allowed_vertices_ids[cell.maxgraph_cell.id] = true;
            }
        }
        this.maxgraph.removeCells(cells_to_delete);

        let vertices = this.maxgraph.getChildVertices(this.maxgraph.getDefaultParent());
        cells_to_delete = [];
        for (let i in vertices) {
            const cell: Cell = vertices[i];

            if (!allowed_vertices_ids[cell.id]) {
                cells_to_delete.push(cell);
            }
        }
        this.maxgraph.removeCells(cells_to_delete);

        this.add_nn_hidden_relations();
    }

    private add_remove_remap_edges_of_maxgraph() {
        let allowed_edges_ids: { [id: string]: boolean } = {};
        let edges_to_delete: Cell[] = [];
        for (let i in this.edges) {
            const edge = this.edges[i];

            if ((!edge.maxgraph_cell) && (!edge.is_hidden_nn)) {
                const newEdge: Cell = edge.add_to_maxgraph(this.maxgraph);
                edge.maxgraph_cell = newEdge;
                allowed_edges_ids[newEdge.id] = true;
                continue;
            }

            if ((!!edge.maxgraph_cell) && (edge.is_hidden_nn)) {
                edge.maxgraph_cell = null;
                edges_to_delete.push(edge.maxgraph_cell);
                continue;
            }

            if (edge.maxgraph_cell) {
                allowed_edges_ids[edge.maxgraph_cell.id] = true;

                // On check la conf ici => on l'écrase en fait
                this.maxgraph.setCellStyle(
                    edge.is_accepted ? {
                        strokeColor: 'green',
                    } : {
                        strokeColor: 'red',
                    }, [edge.maxgraph_cell]);
            }
        }
        this.maxgraph.removeCells(edges_to_delete);

        let edges = this.maxgraph.getChildEdges(this.maxgraph.getDefaultParent());
        edges_to_delete = [];
        for (let i in edges) {
            const edge: Cell = edges[i];

            if (!allowed_edges_ids[edge.id]) {
                edges_to_delete.push(edge);
            }
        }
        this.maxgraph.removeCells(edges_to_delete);
    }
}