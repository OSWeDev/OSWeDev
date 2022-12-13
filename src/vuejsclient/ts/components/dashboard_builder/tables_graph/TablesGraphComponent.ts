import mxgraph from 'mxgraph';
import { Graph } from './graph_tools/Graph';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import DashboardGraphVORefVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import VueAppBase from '../../../../VueAppBase';
import VueComponentBase from '../../VueComponentBase';
import DroppableVosComponent from '../droppable_vos/DroppableVosComponent';
import TablesGraphEditFormComponent from './edit_form/TablesGraphEditFormComponent';
import TablesGraphItemComponent from './item/TablesGraphItemComponent';
import './TablesGraphComponent.scss';
import { watch } from 'fs';
import { isUndefined, keys } from 'lodash';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
const graphConfig = {
    mxBasePath: '/mx/', //Specifies the path in mxClient.basePath.
    mxImageBasePath: '/mx/images', // Specifies the path in mxClient.imageBasePath.
    mxLanguage: 'en', // Specifies the language for resources in mxClient.language.
    mxDefaultLanguage: 'en', // Specifies the default language in mxClient.defaultLanguage.
    mxLoadResources: false, // Specifies if any resources should be loaded.  Default is true.
    mxLoadStylesheets: false, // Specifies if any stylesheets should be loaded.  Default is true
};

const {
    mxClient, mxUtils, mxEvent, mxEditor, mxRectangle, mxGraph, mxGeometry, mxCell,
    mxImage, mxDivResizer, mxObjectCodec, mxCodecRegistry, mxConnectionHandler
} = mxgraph(graphConfig);

window['mxClient'] = mxClient;
window['mxUtils'] = mxUtils;
window['mxRectangle'] = mxRectangle;
window['mxGraph'] = mxGraph;
window['mxEvent'] = mxEvent;
window['mxGeometry'] = mxGeometry;
window['mxCell'] = mxCell;
window['mxImage'] = mxImage;
window['mxEditor'] = mxEditor;
window['mxDivResizer'] = mxDivResizer;
window['mxObjectCodec'] = mxObjectCodec;
window['mxCodecRegistry'] = mxCodecRegistry;
window['mxConnectionHandler'] = mxConnectionHandler;

let editor;


// CustomUserObject
window['CustomUserObject'] = function (name, type) {
    this.name = name || 'New Name';
    this.type = type || 'New Type';
    this.clone = function () {
        return mxUtils.clone(this);
    };
};
@Component({
    template: require('./TablesGraphComponent.pug'),
    components: {
        Tablesgrapheditformcomponent: TablesGraphEditFormComponent,
        Tablesgraphitemcomponent: TablesGraphItemComponent,
        Droppablevoscomponent: DroppableVosComponent
    }
})
export default class TablesGraphComponent extends VueComponentBase {

    @Prop()
    private dashboard: DashboardVO;

    private toggle: boolean = null; //Valeur de l'interrupteur.
    private current_cell = null;
    private graphic_cells: { [cellule: string]: typeof mxCell } = {}; //Dictionnaire dans lequel on enregistre les cellules à afficher afin d'éviter d'afficher des doublons.
    private cells: { [api_type_id: string]: any } = {};


    private async selectionChanged() { //TODO Faire en sorte que lorsqu'on selectionne une autre flèche directement, l'interrupteur se met a jour.
        /* S'active lors qu'on selectionne une flèche ou une cellule.
        Point interessant, si des flèches se superposent, cliquer sur le nom de la flèche en question fonctionne.
        */
        let cell = editor.graph.getSelectionCell();

        try {
            if (cell.edge == true) { //Si la cellule selectionnée est une flèche.
                //Est-ce n/n ?
                let is_n_n: boolean; // lien n/n ou non
                let vo_type: string;
                if (typeof (cell['field_id']) == 'string') {
                    vo_type = cell.source.value.tables_graph_vo_type;
                    is_n_n = false;
                } else {
                    vo_type = cell['field_id']['intermediaire'];
                    is_n_n = true;
                }

                switch (is_n_n) {
                    case (false):
                        let db_cells_source = await query(DashboardGraphVORefVO.API_TYPE_ID)
                            .filter_by_text_eq('vo_type', vo_type)
                            .filter_by_num_eq('dashboard_id', this.dashboard.id)
                            .select_vos<DashboardGraphVORefVO>();

                        if ((!db_cells_source) || (!db_cells_source.length)) {
                            ConsoleHandler.error('mxEvent.MOVE_END:no db cell');
                            return;
                        }

                        let db_cell_source = db_cells_source[0];

                        this.toggle = db_cell_source.values_to_exclude.includes(cell['field_id']); //On vérifie que l'attribut existe à minima

                        if (this.toggle === undefined) {                          //Indéfini si les interrupteurs n'ont jamais été touchés...

                            this.toggle = false;
                        }
                        break;
                    case (true):
                        this.toggle = false; // Une relation n_n est par défaut désactivée.
                        break;
                }
            }
        } catch { this.toggle = false; } //Si l'état de l'interrupteur n'est toujours pas enregistré.
        this.$set(this, 'current_cell', cell);
    }

    private async toggle_check(checked: boolean) { //TODO être sûr que cette supression affecte les tables de widget.
        /* Toggle function
            Permet de réactiver une flèche supprimée.
            After delete_arrow.
        */
        // const input = document.getElementById("myCheckbox") as HTMLInputElement; //Assertion obligatoire

        let arrowValue: typeof mxCell = editor.graph.getSelectionCell();

        //Est-ce bien une flèche ?
        if (arrowValue.edge != true) {
            return console.log("Ce n'est pas une flèche !");
        }
        let source_cell: typeof mxCell = arrowValue.source; //Cellule source de la flèche selectionnée.

        //La flèche est-elle n/n ou non ?
        let vo_type: string;
        let is_n_n: boolean; // lien n/n ou non

        if (typeof (arrowValue['field_id']) == 'string') {
            vo_type = arrowValue.source.value.tables_graph_vo_type;
            is_n_n = false;
        } else {
            vo_type = arrowValue['field_id']['intermediaire']; //On crée la cellule intermédiare.
            is_n_n = true;
            let graph = editor.graph;

            graph.stopEditing(false);

            let cell = new DashboardGraphVORefVO();
            cell.x = 800;
            cell.y = 80;
            cell.width = this.cell_prototype.geometry.width;
            cell.height = this.cell_prototype.geometry.height;
            cell.vo_type = vo_type;
            cell.dashboard_id = this.dashboard.id;
            await ModuleDAO.getInstance().insertOrUpdateVO(cell);
        }
        //Récupération de la cellule en base SQL
        let db_cells_source = await query(DashboardGraphVORefVO.API_TYPE_ID)
            .filter_by_num_eq('dashboard_id', this.dashboard.id)
            .filter_by_text_eq('vo_type', vo_type)
            .select_vos<DashboardGraphVORefVO>();

        if ((!db_cells_source) || (!db_cells_source.length)) {
            ConsoleHandler.error('mxEvent.MOVE_END:no db cell');
            return;
        }

        let db_cell_source = db_cells_source[0];

        if ((!checked) && db_cell_source.values_to_exclude.length > 0) {
            //Désactive la suppression si le champs à en effet été supprimé.
            // Ne marche pas avec is_n_n.
            // On retire les valeurs Null dans values_to_exclude pouvant apparaître de manière impromptue.
            const results: string[] = [];

            db_cell_source.values_to_exclude.forEach((element) => {
                if (element !== null) {
                    results.push(element);
                }
            });

            db_cell_source.values_to_exclude = results;

            const startIndex = db_cell_source.values_to_exclude.indexOf(arrowValue['field_id']);
            const deleteCount = 1;
            if (startIndex !== -1) {
                db_cell_source.values_to_exclude.splice(startIndex, deleteCount);
                this.toggle = false;
                await ModuleDAO.getInstance().insertOrUpdateVO(db_cell_source); //Mise à jour de la base.
                await this.initgraph(); //TODO Peut être que cela est trop brutal, on peut essayer simplement avec initcell je pense.
            }

        } else if (checked) {
            //Supprime la flèche en question
            //Création des différents champs
            if (!db_cell_source.values_to_exclude) {
                db_cell_source.values_to_exclude = [];
            }
            //Rajout des flèches à éliminer dans ces champs.
            //On rajoute une cible à éliminer.
            switch (is_n_n) {

                case false:
                    if (!db_cell_source.values_to_exclude.includes(arrowValue['field_id'])) { //On évite les doublons
                        db_cell_source.values_to_exclude.push(arrowValue['field_id']);
                        this.toggle = true;
                        await ModuleDAO.getInstance().insertOrUpdateVO(db_cell_source); //Mise à jour de la base.
                    }
                    await this.initgraph(); //On relance le graphe.
                    break;
                case true:
                    if (!db_cell_source.values_to_exclude.includes(arrowValue['field_id']['field_id_1'])) { //On évite les doublons
                        db_cell_source.values_to_exclude.push(arrowValue['field_id']['field_id_1']);
                        this.toggle = true;
                    }
                    if (!db_cell_source.values_to_exclude.includes(arrowValue['field_id']['field_id_2'])) { //On évite les doublons
                        db_cell_source.values_to_exclude.push(arrowValue['field_id']['field_id_2']);
                        this.toggle = true;
                    }
                    await ModuleDAO.getInstance().insertOrUpdateVO(db_cell_source); //Mise à jour de la base.

                    await this.initgraph(); //On relance le graphe.
                    break;
            }
        }
    }

    private async delete_cell(cellValue: typeof mxCell) {
        /*Pour supprimer des cellules (et non des flèches)*/

        if (!cellValue.edge) {
            let db_cells = await query(DashboardGraphVORefVO.API_TYPE_ID)
                .filter_by_num_eq('dashboard_id', this.dashboard.id)
                .filter_by_text_eq('vo_type', cellValue.value.tables_graph_vo_type)
                .select_vos<DashboardGraphVORefVO>();

            if ((!db_cells) || (!db_cells.length)) {
                ConsoleHandler.error('mxEvent.MOVE_END:no db cell');
                return;
            }
            let db_cell = db_cells[0];
            await ModuleDAO.getInstance().deleteVOs([db_cell]); //Suppression de la cellule en base, ainsi les flèches désactivées auparavant ne le seront plus.
            // editor.graph.removeSelectionCell

            delete this.cells[cellValue.value.tables_graph_vo_type];
            editor.graph.removeCells([cellValue]);

            await this.initgraph(); //On relance le graphe afin de réafficher les relations n/n si des cellules intermédiaires ont été supprimée.

            this.$emit("del_api_type_id", cellValue.value.tables_graph_vo_type);
        }
    }

    private check_doublon(source: string, target: string, values: string) {
        //Supprime la flèche en question de champs values allant de source vers target , si elle existe.
        let number_arrows: number;
        try {
            number_arrows = this.cells[source].edges.length;
            if (number_arrows > 0) {
                for (let cell of this.cells[source].edges) {
                    if (cell.target.value.tables_graph_vo_type == target && cell.value == values) {
                        editor.graph.removeCells([cell]); //On retire cette flèche.
                    }
                }
            }
        } catch (error) { }

    }

    private addSidebarIcon(graph_, sidebar, prototype) {
        let funct = (api_type_id: string) => async (graph, evt) => {

            if (this.cells[api_type_id]) {
                return;
            }

            graph.stopEditing(false);

            let pt = graph.getPointForEvent(evt);

            let cell = new DashboardGraphVORefVO();
            cell.x = pt.x;
            cell.y = pt.y;
            cell.width = this.cell_prototype.geometry.width;
            cell.height = this.cell_prototype.geometry.height;
            cell.vo_type = api_type_id;
            cell.dashboard_id = this.dashboard.id;
            await ModuleDAO.getInstance().insertOrUpdateVO(cell);

            await this.initgraph(); //Le await est important , on relance le graphe afin d'annhiler les relations n/n affichées inutilement.
            let v1 = this.graphic_cells[cell.vo_type];
            graph.setSelectionCell(v1);
            this.$emit("add_api_type_id", api_type_id);
            // del_api_type_id
        };

        let droppables = document.querySelectorAll('.droppable_vos .droppable_vos_wrapper .api_type_ids .api_type_id');
        droppables.forEach((droppable) => {
            // Creates the image which is used as the drag icon (preview)
            let api_type_id = droppable.getAttribute('api_type_id');
            let dragImage = droppable.cloneNode(true);
            mxUtils.makeDraggable(droppable, graph_, funct(api_type_id), dragImage);
        });

        // // Creates the image which is used as the sidebar icon (drag source)
        // let wrapper = document.createElement('div');
        // wrapper.style.cursor = 'pointer';
        // wrapper.style.backgroundColor = '#c3d9ff';
        // wrapper.style.margin = '10px';
        // wrapper.style.width = '200px';
        // wrapper.style.height = '50px';
        // wrapper.style.textAlign = 'center';
        // wrapper.style.display = 'flex';
        // wrapper.style.flexWrap = 'wrap';
        // wrapper.style.alignItems = 'center';
        // wrapper.style.justifyContent = 'center';
        // wrapper.style.border = '2px dashed crimson';
        // wrapper.innerHTML = '<div>Custom User Object</div><div style="color: #8C8C8C">Drag me to scheme!</div>';
        // sidebar.appendChild(wrapper);

        // // Creates the image which is used as the drag icon (preview)
        // let dragImage = wrapper.cloneNode(true);
        // mxUtils.makeDraggable(wrapper, graph_, funct, dragImage);
    }

    private createGraph() {
        // Checks if the browser is supported
        if (!mxClient.isBrowserSupported()) {
            // Displays an error message if the browser is not supported.
            mxUtils.error('Browser is not supported!', 200, false);
        } else {
            // mxConnectionHandler.prototype.connectImage = new mxImage(require('./handle-connect.png'), 16, 16);

            let container = (this.$refs['container'] as any);
            // container.style.position = 'absolute';
            container.style.overflow = 'hidden';
            // container.style.minHeight = '720px';
            container.style.background = '#F5F5F5';
            container.style.padding = '1em';
            // container.style.background = `url("${require('./grid.gif')}")`;
            container.style.boxShadow = '1px 1px 1px #888';

            let sidebar = (this.$refs['sidebar'] as any);

            if (mxClient.IS_QUIRKS) {
                document.body.style.overflow = 'hidden';
                let a = new mxDivResizer(container);
                let b = new mxDivResizer(sidebar);
            }

            editor = new mxEditor();
            editor.setGraphContainer(container);

            //Creating relative graph
            const graph_layout: InstanceType<typeof Graph> = new Graph();
            editor.graph_layout = graph_layout;
            // editor.graph.setConnectable(true);
            // editor.graph.setCellsDisconnectable(true);
            // editor.graph.setPanning(true);
            editor.graph.setConnectable(false);
            editor.graph.setCellsDisconnectable(false);
            editor.graph.setPanning(true);
            editor.graph.setAllowDanglingEdges(false);

            editor.graph.getSelectionModel().addListener(mxEvent.CHANGE, () => {
                this.selectionChanged().then().catch((error) => { ConsoleHandler.error(error); });
            });
            this.selectionChanged().then().catch((error) => { ConsoleHandler.error(error); });
            editor.graph.addListener('moveCells', async () => {
                let cell = editor.graph.getSelectionCell();
                let db_cells = await query(DashboardGraphVORefVO.API_TYPE_ID)
                    .filter_by_num_eq('dashboard_id', this.dashboard.id)
                    .filter_by_text_eq('vo_type', cell.value.tables_graph_vo_type)
                    .select_vos<DashboardGraphVORefVO>();

                if ((!db_cells) || (!db_cells.length)) {
                    ConsoleHandler.error('mxEvent.MOVE_END:no db cell');
                    return;
                }
                let db_cell = db_cells[0];
                db_cell.x = cell.geometry.x;
                db_cell.y = cell.geometry.y;
                db_cell.width = cell.geometry.width;
                db_cell.height = cell.geometry.height;
                await ModuleDAO.getInstance().insertOrUpdateVO(db_cell);
            });

            editor.graph.centerZoom = false;
            editor.graph.swimlaneNesting = false;
            editor.graph.dropEnabled = true;

            // Fields are dynamically created HTML labels
            editor.graph.isHtmlLabel = function (cell) {
                return !this.isSwimlane(cell) &&
                    !this.model.isEdge(cell);
            };

            // not editable
            editor.graph.isCellEditable = function () {
                return false;
            };

            // Returns the name propertie of the user object for the label
            editor.graph.convertValueToString = function (cell) {
                if (cell.value != null && cell.value.name != null) {
                    return cell.value.name;
                }
                return mxGraph.prototype.convertValueToString.apply(this, arguments); // "supercall"
            };

            // Creates a dynamic HTML label for properties
            editor.graph.getLabel = function (cell) {

                // console.log('getLabel ', cell);
                if (cell && this.isHtmlLabel(cell) && cell.value) {

                    // let infoWindow = new TablesGraphItemComponent({
                    //     propsData: {
                    //         vo_type: cell.value.tables_graph_vo_type
                    //     },
                    //     store: this.$store
                    // });
                    // setTimeout(() => {
                    //     infoWindow.$mount("#tables_graph_vo_type__" + cell.value.tables_graph_vo_type);
                    // }, 1000);

                    let label = '';
                    // label += '<div id="tables_graph_vo_type__' + cell.value.tables_graph_vo_type + '">' +
                    //     '</div>';
                    label += '<div class="tables_graph_item table_name">' +
                        VueAppBase.getInstance().vueInstance.t(VOsTypesManager.moduleTables_by_voType[cell.value.tables_graph_vo_type].label.code_text) +
                        '</div>';

                    return label;
                }

                return mxGraph.prototype.getLabel.apply(this, arguments); // "supercall"
            };

            this.addSidebarIcon(editor.graph, sidebar, this.cell_prototype);
        }
    }

    get cell_prototype() {
        let customObject = new window['CustomUserObject']();
        let object = new mxCell(customObject, new mxGeometry(0, 0, 200, 50), '');
        object.setVertex(true);
        object.setConnectable(false);
        return object;
    }

    private init() {
        let codecCustomUserObject = new mxObjectCodec(new window['CustomUserObject']());
        codecCustomUserObject.encode = function (enc, obj) {
            let node = enc.document.createElement('CustomUserObject');
            mxUtils.setTextContent(node, JSON.stringify(obj));

            return node;
        };
        codecCustomUserObject.decode = function (dec, node) {
            let obj = JSON.parse(mxUtils.getTextContent(node));
            let beatyObj = new window['CustomUserObject']();
            obj = Object.assign(beatyObj, obj);
            return obj;
        };
        mxCodecRegistry.register(codecCustomUserObject);

        this.createGraph();
    }

    private mounted() {
        this.init();
    }

    @Watch('dashboard', { immediate: true })
    private async onchange_dashboard() {
        if (!this.dashboard) {
            return;
        }

        await this.initgraph(true);
    }

    private async initgraph(red_by_default: boolean = false) {
        this.graphic_cells = {}; //Réinitialisation des cellules à afficher.
        if (editor && editor.graph && Object.values(this.cells) && Object.values(this.cells).length) {
            editor.graph.removeCells(Object.values(this.cells));
        }

        let cells = await query(DashboardGraphVORefVO.API_TYPE_ID).filter_by_num_eq('dashboard_id', this.dashboard.id).select_vos<DashboardGraphVORefVO>();
        let cells_visited: { [vo_type: string]: string } = {};
        //On retire les cellules doublons.
        for (let i in cells) { //Adding cells to the model
            let cell = cells[i];
            if (!cells_visited[cell.vo_type]) {
                cells_visited[cell.vo_type] = i;
            } else {
                switch (cell.values_to_exclude) {
                    case null:
                        await ModuleDAO.getInstance().deleteVOs([cell]); //Suppression de la cellule en base, ainsi les flèches désactivées auparavant ne le seront plus.
                        cells.splice(Number(i), 1);  //On retire cette celulle de la liste
                        break;
                    default:
                        //Si une telle cellule existe déjà mais que les valeurs à exclures sont dans celle-ci, on la conserve.
                        let previous_cell_index: string = cells_visited[cell.vo_type];
                        await ModuleDAO.getInstance().deleteVOs([cells[i]]); //Suppression de la cellule en base, ainsi les flèches désactivées auparavant ne le seront plus.
                        cells.splice(Number(previous_cell_index), 1);

                }

            }
        }

        for (let i in cells) { //Adding cells to the model

            let cell = cells[i];

            editor.graph.stopEditing(false);

            let parent = editor.graph.getDefaultParent();
            let model = editor.graph.getModel();

            let v1 = model.cloneCell(this.cell_prototype);
            //  let v1 = this.cells[cell.vo_type];
            model.beginUpdate();
            try {

                // v1.style.strokeColor = '#F5F5F5';
                // v1.style.fillColor = '#FFF';

                editor.graph.setCellStyles('strokeColor', '#555', [v1]);
                editor.graph.setCellStyles('fillColor', '#444', [v1]);
                v1.geometry.x = cell.x;
                v1.geometry.y = cell.y;
                // v1.style = editor.graph.stylesheet.getDefaultEdgeStyle();
                v1.geometry.alternateBounds = new mxRectangle(0, 0, cell.width, cell.height, '');
                v1.value.tables_graph_vo_type = cell.vo_type;
                editor.graph.addCell(v1, parent); //Adding the cell
            } finally {
                model.endUpdate();
                this.graphic_cells[cell.vo_type] = v1; // On enregistre la cellule dans un dictionnaire pour la réutiliser. C'est la cellule graphique.
            }


        }
        //Adding links
        let compteur: number = 0;
        for (let cellule in this.graphic_cells) {
            let v1: typeof mxCell = this.graphic_cells[cellule];
            //Table associée, on souhaite désactiver par défau certains chemins.
            switch (red_by_default) {
                case true:
                    let table = VOsTypesManager.moduleTables_by_voType[cellule];
                    let is_versioned: boolean = table.is_versioned;
                    this.initcell(cells[compteur], v1, is_versioned);
                    break;
                case false:
                    this.initcell(cells[compteur], v1);
            }
            compteur += 1;
        }
    }
    private initcell(cell: DashboardGraphVORefVO, v1: typeof mxCell, is_versioned?) { //TODO Inclure les champs techniques dans targets_to_exclude
        /*
         Incorpore la cellule cell dans le graphique et dessine les flèches qui partent de celle-ci ainsi que celle qui viennent.
         On évite de redessiner les flèches déjà construite.
        */

        //On récupère les flèches à ne pas prendre en compte car supprimées.

        this.cells[cell.vo_type] = v1;
        let values_to_exclude: string[]; //Voici la liste des flèches à ne pas afficher.
        if (cell.values_to_exclude) {
            values_to_exclude = cell.values_to_exclude;
        } else { values_to_exclude = []; }

        let graph = editor.graph;
        let graph_layout: InstanceType<typeof Graph> = editor.graph_layout;
        let field_values: { [target: string]: { [values: string]: string | { [keys: string]: string } } } = {}; //Afin d'enregistrer le field_id associé pour chaque value. Le string[] convient pour les n/n.
        graph_layout.reset();

        graph.stopEditing(false);

        let parent = graph.getDefaultParent();
        let model = graph.getModel();
        //Constantes nécessaires:
        let node_v1: string = cell.vo_type; //Nom de la cellule source

        let is_link_unccepted: boolean; //Si la flèche construite n'est pas censurée
        let does_exist: boolean; //Si la flèche construite ne l'a pas déjà été.
        //First Update : target -> source
        model.beginUpdate();
        try {

            // v1.style.strokeColor = '#F5F5F5';
            // v1.style.fillColor = '#FFF';

            graph.setCellStyles('strokeColor', '#555', [v1]);
            graph.setCellStyles('fillColor', '#444', [v1]);
            // On rajoute les liaisons depuis les autres vos
            let references: Array<ModuleTableField<any>> = VOsTypesManager.getInstance().get_type_references(cell.vo_type);
            for (let i in references) {
                let reference = references[i];
                let reference_cell = this.graphic_cells[reference.module_table.vo_type]; //Cellule reliée à v1 partageant la colonne "reference"
                //La flèche existe déjà ?

                if (reference_cell) {
                    //Il est possible que la flèche existe déjà dans l'autre sens, dans ce cas , on ne la réaffiche pas.
                    try {
                        let number_arrows: number = this.cells[reference.module_table.vo_type].edges.length;
                        if (number_arrows > 0) {
                            for (let cellules of this.cells[reference.module_table.vo_type].edges) {
                                if (cellules.target.value.tables_graph_vo_type == node_v1 && cellules.value == this.t(reference.field_label.code_text)) {
                                    does_exist = true; //On retire cette flèche.
                                }
                            }
                        }
                    } catch (error) {
                        does_exist = false; //La flèche n'existe pas.
                    }
                    if (does_exist == false) {
                        graph.insertEdge(parent, null, this.t(reference.field_label.code_text), reference_cell, v1);
                        graph_layout.addEdge(reference.module_table.vo_type, node_v1); //Nom des deux cellules sous chaîne de caratère.
                    }
                    //chemin n/n , intervient si la cellule reliée n'est pas sur le dashboard. Ce chemin indique qu'il existe une cellule intermédiaire reliant v1 et une autre cellule.
                } else if (!reference_cell) { //Si la cellule intermédiaire n'est pas là ,le chemin n/n  sera affiché.
                    //TODO-Rajouter dans la matrice d'adjacence les liaisons n/n
                    if (VOsTypesManager.getInstance().isManyToManyModuleTable(reference.module_table)) {
                        let nn_fields = VOsTypesManager.getInstance().getManyToOneFields(reference.module_table.vo_type, []);
                        for (let j in nn_fields) {
                            let nn_field = nn_fields[j];

                            if (nn_field.field_id == reference.field_id) {
                                continue;
                            }
                            let nn_reference_cell = this.graphic_cells[nn_field.manyToOne_target_moduletable.vo_type]; //On rajoute cette flèche dans les flèches crées
                            if (nn_reference_cell) {
                                try { //La relation n/n peut exister dans le sens inverse, on vérifie que ça n'est pas le cas.
                                    let number_arrows: number = this.cells[nn_field.manyToOne_target_moduletable.vo_type].edges.length;
                                    if (number_arrows > 0) {
                                        for (let cellules of this.cells[nn_field.manyToOne_target_moduletable.vo_type].edges) {
                                            if (cellules.target.value.tables_graph_vo_type == node_v1 && cellules.value == this.t(reference.field_label.code_text) + ' / ' + this.t(nn_field.field_label.code_text)) {
                                                does_exist = true; //On retire cette flèche.
                                            }
                                        }
                                    }
                                } catch (error) {
                                    does_exist = false;
                                }
                                if (does_exist == false) {
                                    //TODO Faire en sorte de  conserver la fléche qui  va dans le même sens que les autres flèches reliant les deux cellules en question.
                                    // TODO FIXME pour le moment le N/N est fait avec 2 flèches dont une a un label pour les 2

                                    if (!field_values[nn_field.manyToOne_target_moduletable.vo_type]) {
                                        field_values[nn_field.manyToOne_target_moduletable.vo_type] = {};
                                    }//On crée dans un premier temps le dictionnaire
                                    //On affiche la relation n/n.
                                    field_values[nn_field.manyToOne_target_moduletable.vo_type][this.t(nn_field.field_label.code_text) + ' / ' + this.t(reference.field_label.code_text)] = { intermediaire: reference.module_table.vo_type, field_id_1: reference.field_id, field_id_2: nn_field.field_id };  //on enregistre dans le dictionnaire [source_inter,field_1,field_2]

                                    graph.insertEdge(parent, null, this.t(nn_field.field_label.code_text) + ' / ' + this.t(reference.field_label.code_text), v1, nn_reference_cell);
                                    //    graph.insertEdge(parent, nn_field.field_id, '', nn_reference_cell, v1);

                                }
                            }
                        }
                    }
                }
            }
        } finally {
            model.endUpdate();
        } //Obligé de faire une première mise à jour ici du modèle , sinon des flèches traçées ne sont pas mises à jour.

        //Second update :source -> target
        model.beginUpdate();

        try {
            // On rajoute les liaisons vers les autres vos
            let fields = VOsTypesManager.getInstance().getManyToOneFields(cell.vo_type, []);
            for (let i in fields) {
                let field = fields[i];
                let reference_cell = this.graphic_cells[field.manyToOne_target_moduletable.vo_type];
                if (field.manyToOne_target_moduletable.vo_type != node_v1) {

                    //Cas versionné ou non
                    if (is_versioned && (["Modificateur", "Créateur"].includes(this.t(field.field_label.code_text)))) {
                        try {
                            if (!values_to_exclude.includes(field.field_id)) { //Bien initialiser la liste.
                                values_to_exclude.push(field.field_id);
                                cell.values_to_exclude = values_to_exclude;
                                is_link_unccepted = true;
                                ModuleDAO.getInstance().insertOrUpdateVO(cell).then().catch((error) => { ConsoleHandler.error(error); });

                            }
                        } catch {
                            console.log("ici");
                        }
                    } else {
                        try { //La flèche est elle acceptée ? On le vérifie en checkant les flèches interdites depuis cette source.
                            is_link_unccepted = Boolean(values_to_exclude.includes(field.field_id));
                        } catch (error) { //erreur possible si forget_couple[node_v1] n'existe pas
                            is_link_unccepted = false; //La cible n'est pas interdite.
                        }
                    }

                    if (reference_cell) {
                        //On vérifie que la flèche n'a pas été traçée dans l'autre sens précédement.
                        this.check_doublon(node_v1, field.manyToOne_target_moduletable.vo_type, this.t(field.field_label.code_text)); //Supprime la flèche si celle-ci existe

                        if (!field_values[field.manyToOne_target_moduletable.vo_type]) {
                            field_values[field.manyToOne_target_moduletable.vo_type] = {};
                        }//On crée dans un premier temps le dictionnaire

                        field_values[field.manyToOne_target_moduletable.vo_type][this.t(field.field_label.code_text)] = field.field_id; //on enregistre dans le dictionnaire.
                        if (is_link_unccepted == true) {
                            graph.insertEdge(parent, null, this.t(field.field_label.code_text), v1, reference_cell, 'strokeColor=red;strokeOpacity=30'); //Note that the source and target vertices should already have been inserted into the model.
                        } else {
                            graph.insertEdge(parent, null, this.t(field.field_label.code_text), v1, reference_cell);
                            graph_layout.addEdge(field.manyToOne_target_moduletable.vo_type, node_v1); //Nom des deux cellules sous chaîne de caratère.
                        }

                    }
                }
            }
            // graph.setCellStyles('strokeColor', '#F5F5F5', [parent]);
            // graph.setCellStyles('fillColor', '#FFF', [parent]);
            // var style = graph.getModel().getStyle(v1);
            // var newStyle = mxUtils.setStyle(style, 'strokeColor', 'red');
            // newStyle = mxUtils.setStyle(newStyle, 'fillColor', 'white');
            // var cs = new Array();
            // cs[0] = cell;
            // graph.setCellStyle(newStyle, cs);

        } finally {
            model.endUpdate();
            for (let arrow in this.cells[node_v1].edges) {
                // Il est possible que target soit la cellule source, dans ce cas , ça ne marchera pas.
                let target: string = this.cells[node_v1].edges[arrow].target.value.tables_graph_vo_type;
                if (target != node_v1) {
                    let value: string = this.cells[node_v1].edges[arrow].value;
                    try {
                        if (!this.cells[node_v1].edges[arrow]['field_id']) { //Si le field_id n'a pas été renseigné.
                            this.cells[node_v1].edges[arrow]['field_id'] = field_values[target][value];
                        }
                    } catch {
                        console.log("purée!");
                    }
                }
            }
            graph_layout.update_matrix();
        }
        return v1;
    }
}
