import { Cell, Editor, Graph } from "@maxgraph/core";
import { query } from "../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleDAO from "../../../../../../shared/modules/DAO/ModuleDAO";
import DashboardGraphVORefVO from "../../../../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO";
import ModuleTable from "../../../../../../shared/modules/ModuleTable";
import VOsTypesManager from "../../../../../../shared/modules/VO/manager/VOsTypesManager";
import ConsoleHandler from "../../../../../../shared/tools/ConsoleHandler";
import VueAppBase from "../../../../../VueAppBase";
import MaxGraphCellMapper from "./MaxGraphCellMapper";
import MaxGraphEdgeMapper from "./MaxGraphEdgeMapper";

export default class MaxGraphMapper {

    public static default_width: number = 200;
    public static default_height: number = 50;

    public static async reload_from_dashboard(dashboard_id: number, graph_mapper: MaxGraphMapper = null): Promise<MaxGraphMapper> {

        if (!dashboard_id) {
            return null;
        }

        let res = graph_mapper ? graph_mapper : new MaxGraphMapper();
        res.dashboard_id = dashboard_id;
        let vos_refs: DashboardGraphVORefVO[] = await query(DashboardGraphVORefVO.API_TYPE_ID).filter_by_num_eq('dashboard_id', dashboard_id).select_vos<DashboardGraphVORefVO>();
        if (!vos_refs || !vos_refs.length) {
            return res;
        }

        /**
         * On ajoute d'abord les cellules / vo_type
         */
        let api_type_ids: string[] = [];
        let tables: Array<ModuleTable<any>> = [];
        for (let i in vos_refs) {
            const graphvoref: DashboardGraphVORefVO = vos_refs[i];

            const cell = res.merge_cell_from_graphvoref(graphvoref);
            res.cells[cell.api_type_id] = cell;

            api_type_ids.push(cell.api_type_id);
            tables.push(cell.moduletable);
        }

        /**
         * Si on avait un graph_mapper en param, on doit supprimer les noeuds dedans qui n'existent plus dans les graphvorefs
         */
        if (graph_mapper) {
            for (let i in graph_mapper.cells) {
                const cell: MaxGraphCellMapper = graph_mapper.cells[i];

                if (api_type_ids.indexOf(cell.api_type_id) == -1) {
                    /**
                     * On supprime le noeud et les edges associés
                     */
                    res.remove_cell(cell);
                }
            }
        }

        /**
         * Puis les relations N/N activées automatiquement par ces types
         */
        let activated_many_to_many = MaxGraphMapper.get_activated_many_to_many(api_type_ids);
        for (let i in activated_many_to_many) {
            let api_type_id = activated_many_to_many[i];

            let graphvoref = new DashboardGraphVORefVO();
            graphvoref.x = 800;
            graphvoref.y = 80;
            graphvoref.width = MaxGraphMapper.default_width;
            graphvoref.height = MaxGraphMapper.default_height;
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

            const cell = res.merge_cell_from_graphvoref(graphvoref);
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

                /**
                 * Si les deux types ne sont pas activés, on ne crée pas l'edge
                 */
                if (!res.cells[table.vo_type] || !res.cells[field.manyToOne_target_moduletable.vo_type]) {
                    continue;
                }

                /**
                 * Si on a déjà l'edge, on ne le recrée pas
                 */
                if (res.cells[table.vo_type].outgoing_edges[field.field_id]) {
                    continue;
                }

                /**
                 * On s'intéresse pour le moment pas aux self-références
                 */
                if (table.vo_type == field.manyToOne_target_moduletable.vo_type) {
                    continue;
                }

                let new_edge: MaxGraphEdgeMapper = res.cells[table.vo_type].add_edge(res.cells[field.manyToOne_target_moduletable.vo_type], field);
                res.edges.push(new_edge);
            }
        }

        MaxGraphMapper.instance = res;
        return res;
    }

    private static instance: MaxGraphMapper = null;

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
    public maxgraph_editor: Editor = null;

    public cells: { [api_type_id: string]: MaxGraphCellMapper } = {};
    public edges: MaxGraphEdgeMapper[] = [];

    public maxgraph_elt_by_maxgraph_id: { [maxgraph_id: string]: MaxGraphCellMapper | MaxGraphEdgeMapper } = {};
    public maxgraph_nn_edges: { [api_type_id: string]: Cell } = {};

    /**
     * Objectif : Rendre le graphique compatible avec les mappers configurés
     * @param dashboard_id
     * @returns
     */
    public async remap() {

        this.maxgraph.model.beginUpdate();

        /**
         * On reload tout le graph
         */
        await MaxGraphMapper.reload_from_dashboard(this.dashboard_id, this);

        /**
         * On réinit le this.maxgraph_elt_by_maxgraph_id pour pouvoir supprimer les maxgraph elt qu'on retrouvera pas dedans
         */
        this.maxgraph_elt_by_maxgraph_id = {};

        /**
         * Checke les cellules à ajouter / supprimer
         *  On doit ajouter les cellules qu'on a pas dans cell.maxgraph_cell et qui devraient être affichées
         */
        this.add_remove_maxgraph_cells();

        /**
         * On a pas de params sur les cells, on passe à l'ajout / suppression des edges
         *  et on remap les params des edges pour ceux qui sont déjà présents (juste la couleur si pas accepté)
         */
        this.add_remove_remap_maxgraph_edges();

        let vertices = this.maxgraph.getChildVertices(this.maxgraph.getDefaultParent());
        let cells_to_delete = [];
        for (let i in vertices) {
            const cell: Cell = vertices[i];

            if (!this.maxgraph_elt_by_maxgraph_id[cell.id]) {
                cells_to_delete.push(cell);
            }
        }
        this.remove_maxgraphcells_from_maxgraph(cells_to_delete);

        this.maxgraph.model.endUpdate();
        this.maxgraph.refresh();
    }

    public build_maxgraph(container: HTMLElement) {

        if (!this.maxgraph) {
            // Bug de déplacement des cellules: avant on avait un éditeur, ça existe plus dans maxGraph je pense que ça vient de là
            //  Pas de solution pour le moment, j'avais pensé à créer une fausse cell dans laquelle on créerait toutes les autres, mais faut bien la redimensionner
            //  et comme c'est plus vraiment bloquant je passe à autre chose
            // this.maxgraph_editor = new Editor(container);

            this.maxgraph = new Graph(container);
            // this.maxgraph_editor.graph = this.maxgraph;

            this.maxgraph.setConnectable(false);
            this.maxgraph.setCellsDisconnectable(false);
            this.maxgraph.setPanning(true);
            this.maxgraph.setAllowDanglingEdges(false);

            /**
             * ! J'ai tenté de simplifier ce bordel avec juste des cells en mettant des vertices avec un label dedans ... je sais pas pourquoi à la suppression ça marche pas, donc je laisse comme ça
             */
            // Fields are dynamically created HTML labels
            this.maxgraph.isHtmlLabel = function (cell) {
                return !this.isSwimlane(cell) &&
                    !cell.isEdge();
            };

            // not editable
            this.maxgraph.isCellEditable = function () {
                return false;
            };

            // Returns the name propertie of the user object for the label
            this.maxgraph.convertValueToString = function (cell) {
                if (cell.value != null && cell.value.name != null) {
                    return cell.value.name;
                }
                return cell.getValue().toString();
            };

            // Creates a dynamic HTML label for properties
            this.maxgraph.getLabel = function (cell) {

                if (cell && this.isHtmlLabel(cell) && cell.value) {

                    let label = '';
                    label += '<div class="tables_graph_item table_name">' +
                        MaxGraphMapper.instance.maxgraph_elt_by_maxgraph_id[cell.id].label +
                        '</div>';

                    return label;
                }


                return cell.getValue().toString();
            };
            /**
             * !
             */

            this.maxgraph.addListener('resizeCells', this.edit_maxgraph_cell_cb.bind(this));
            this.maxgraph.addListener('moveCells', this.edit_maxgraph_cell_cb.bind(this));

            this.maxgraph.centerZoom = false;
            this.maxgraph.swimlaneNesting = false;
            this.maxgraph.dropEnabled = true;

            this.maxgraph.swimlaneSelectionEnabled = false;
            this.maxgraph.gridEnabled = true;
            this.maxgraph.snap = (value) => {
                return Math.round(value / 10) * 10;
            };

            // On doit pouvoir déplacer les cellules même en dehors d'autres cellules
            this.maxgraph.isCellMovable = () => {
                return true;
            };

            this.maxgraph.isCellResizable = () => {
                return true;
            };

            this.maxgraph.isCellSelectable = () => {
                return true;
            };
        }

        if (!this.cells) {
            return;
        }

        this.maxgraph.model.beginUpdate();

        for (let i in this.cells) {
            const cell: MaxGraphCellMapper = this.cells[i];

            const maxgraph_cell: Cell = cell.add_to_maxgraph(this.maxgraph);
            if (!maxgraph_cell) {
                continue;
            }
            this.maxgraph_elt_by_maxgraph_id[maxgraph_cell.id] = cell;
        }

        for (let i in this.edges) {
            const edge: MaxGraphEdgeMapper = this.edges[i];

            const maxgraph_edge: Cell = edge.add_to_maxgraph(this.maxgraph);
            if (!maxgraph_edge) {
                continue;
            }
            this.maxgraph_elt_by_maxgraph_id[maxgraph_edge.id] = edge;
        }

        /**
         * On ajoute les relations cachées N/N qu'on a pour le moment ignorées, en reliant par une flèche au lieu d'une cellule + 2 flèches
         */
        this.add_nn_hidden_relations();

        this.maxgraph.model.endUpdate();
    }

    private async edit_maxgraph_cell_cb() {
        let selected_cell = this.maxgraph.getSelectionCell();

        if (!selected_cell) {
            return;
        }

        let db_cells = await query(DashboardGraphVORefVO.API_TYPE_ID)
            .filter_by_num_eq('dashboard_id', this.dashboard_id)
            .filter_by_text_eq('vo_type', this.maxgraph_elt_by_maxgraph_id[selected_cell.id].api_type_id)
            .select_vos<DashboardGraphVORefVO>();

        if ((!db_cells) || (!db_cells.length)) {
            ConsoleHandler.error('Event.MOVE_END:no db cell');
            return;
        }
        let db_cell = db_cells[0];
        db_cell.x = selected_cell.geometry.x;
        db_cell.y = selected_cell.geometry.y;
        db_cell.width = selected_cell.geometry.width;
        db_cell.height = selected_cell.geometry.height;
        await ModuleDAO.getInstance().insertOrUpdateVO(db_cell);
    }

    /**
     * On ajoute les relations cachées N/N qu'on a pour le moment ignorées, en reliant par une flèche au lieu d'une cellule + 2 flèches
     */
    private add_nn_hidden_relations() {

        for (let i in this.cells) {
            const cell: MaxGraphCellMapper = this.cells[i];

            if (!cell.is_hidden_nn) {
                continue;
            }

            let label: string = cell.label + ' (N/N)';
            let parent = this.maxgraph.getDefaultParent();

            let source_api_type_id = null;
            let dest_api_type_id = null;

            for (let j in cell.outgoing_edges) {
                const edge: MaxGraphEdgeMapper = cell.outgoing_edges[j];

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

    private merge_cell_from_graphvoref(graphvoref: DashboardGraphVORefVO) {

        let cell: MaxGraphCellMapper = this.cells[graphvoref.vo_type];
        if (!cell) {
            cell = new MaxGraphCellMapper();
            cell.api_type_id = graphvoref.vo_type;
            cell.moduletable = VOsTypesManager.moduleTables_by_voType[cell.api_type_id];
            this.cells[cell.api_type_id] = cell;
        }

        cell.label = VueAppBase.getInstance().vueInstance.t(cell.moduletable.label.code_text);
        cell.graphvoref = graphvoref;

        return cell;
    }

    private add_remove_maxgraph_cells() {
        let cells_to_delete: Cell[] = [];
        for (let i in this.cells) {
            const cell = this.cells[i];

            if ((!cell.maxgraph_cell) && (!cell.is_hidden_nn)) {
                const newCell: Cell = cell.add_to_maxgraph(this.maxgraph);
                this.maxgraph_elt_by_maxgraph_id[newCell.id] = cell;
                continue;
            }

            if ((!!cell.maxgraph_cell) && (cell.is_hidden_nn)) {
                cell.maxgraph_cell = null;
                cells_to_delete.push(cell.maxgraph_cell);
                continue;
            }

            if (cell.maxgraph_cell) {
                this.maxgraph_elt_by_maxgraph_id[cell.maxgraph_cell.id] = cell;
            }
        }
        this.remove_maxgraphcells_from_maxgraph(cells_to_delete);

        this.add_nn_hidden_relations();
    }

    private remove_maxgraphcells_from_maxgraph(maxgraphcells_to_delete: Cell[]) {

        if (!maxgraphcells_to_delete || (!maxgraphcells_to_delete.length)) {
            return;
        }

        this.maxgraph.removeCells(maxgraphcells_to_delete);
        for (let i in maxgraphcells_to_delete) {
            const maxgraphcell: Cell = maxgraphcells_to_delete[i];

            delete this.maxgraph_elt_by_maxgraph_id[maxgraphcell.id];
        }
    }

    private add_remove_remap_maxgraph_edges() {
        let edges_to_delete: Cell[] = [];
        for (let i in this.edges) {
            const edge = this.edges[i];

            if ((!edge.maxgraph_cell) && (!edge.is_hidden_nn)) {
                const newEdge: Cell = edge.add_to_maxgraph(this.maxgraph);
                this.maxgraph_elt_by_maxgraph_id[newEdge.id] = edge;
                continue;
            }

            if ((!!edge.maxgraph_cell) && (edge.is_hidden_nn)) {
                edge.maxgraph_cell = null;
                edges_to_delete.push(edge.maxgraph_cell);
                continue;
            }

            if (edge.maxgraph_cell) {
                this.maxgraph_elt_by_maxgraph_id[edge.maxgraph_cell.id] = edge;

                // On check la conf ici => on l'écrase en fait
                this.maxgraph.setCellStyle(
                    edge.is_accepted ? {
                        strokeColor: 'green',
                    } : {
                        strokeColor: 'red',
                    }, [edge.maxgraph_cell]);
            }
        }
        this.remove_maxgraphcells_from_maxgraph(edges_to_delete);
    }

    private remove_cell(cell_to_remove: MaxGraphCellMapper) {
        delete this.cells[cell_to_remove.api_type_id];
        for (let i in cell_to_remove.incoming_edges) {
            const edge: MaxGraphEdgeMapper = cell_to_remove.incoming_edges[i];
            this.edges.splice(this.edges.indexOf(edge), 1);
        }
        for (let i in cell_to_remove.outgoing_edges_array) {
            const edge: MaxGraphEdgeMapper = cell_to_remove.outgoing_edges_array[i];
            this.edges.splice(this.edges.indexOf(edge), 1);
        }
    }
}