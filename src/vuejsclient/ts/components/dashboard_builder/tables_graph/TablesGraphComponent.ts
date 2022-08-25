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

    private toggle = true; //Valeur de l'interrupteur.
    private current_cell = null;
    private graphic_cells: { [cellule: string]: typeof mxCell } = {}; //Dictionnaire dans lequel on enregistre les cellules à afficher afin d'éviter d'afficher des doublons.
    private cells: { [api_type_id: string]: any } = {};


    private selectionChanged() {
        /* S'active lors qu'on selectionne une flèche ou une cellule.
        Point interessant, si des flèches se superposent, cliquer sur le nom de la flèche en question fonctionne.
        */
        let cell = editor.graph.getSelectionCell();

        this.$set(this, 'current_cell', cell);
    }

    private async toggleCheck() { //TODO être sûr que cette supression affecte les tables de widget.
        /* Toggle function
            Permet de réactiver une flèche supprimée.
            After delete_arrow.
        */
        const input = document.getElementById("myCheckbox") as HTMLInputElement; //Assertion obligatoire

        let arrowValue: typeof mxCell = editor.graph.getSelectionCell();

        //Est-ce bien une flèche ?
        if (arrowValue.edge != true) {
            return console.log("Ce n'est pas une flèche !");
        }
        let source_cell: typeof mxCell = arrowValue.source; //Cellule source de la flèche selectionnée.
        //Récuppération de la cellule en base SQL
        let db_cells_source = await ModuleDAO.getInstance().getVosByRefFieldsIdsAndFieldsString<DashboardGraphVORefVO>(
            DashboardGraphVORefVO.API_TYPE_ID,
            'dashboard_id',
            [this.dashboard.id],
            'vo_type',
            [arrowValue.source.value.tables_graph_vo_type]
        );
        if ((!db_cells_source) || (!db_cells_source.length)) {
            ConsoleHandler.getInstance().error('mxEvent.MOVE_END:no db cell');
            return;
        }

        let db_cell_source = db_cells_source[0];
        if (input.checked === false && db_cell_source.values_to_exclude.length > 0) {
            //Désactive la suppression si le champs à en effet été supprimé.
            const startIndex = db_cell_source.values_to_exclude.indexOf(arrowValue.value);
            const deleteCount = 1;

            if (startIndex !== -1) {
                db_cell_source.values_to_exclude.splice(startIndex, deleteCount);
                await ModuleDAO.getInstance().insertOrUpdateVO(db_cell_source); //Mise à jour de la base.
                this.initgraph(); //TODO Peut être que cela est trop brutal, on peut essayer simplement avec initcell je pense.
                this.toggle = false;
            }

        } else if (input.checked === true) {
            //Supprime la flèche en question
            //Création des différents champs
            if (!db_cell_source.values_to_exclude) {
                db_cell_source.values_to_exclude = [];
            }
            //Rajout des flèches à éliminer dans ces champs.
            //On rajoute une cible à éliminer.
            if (!db_cell_source.values_to_exclude.includes(arrowValue.value)) { //On évite les doublons
                db_cell_source.values_to_exclude.push(arrowValue.value);
                await ModuleDAO.getInstance().insertOrUpdateVO(db_cell_source); //Mise à jour de la base.
            }
            this.toggle = true;
            this.initgraph(); //On relance le graphe.
        }
    }

    private async delete_cell(cellValue: typeof mxCell) {
        /*Pour supprimer des cellules (ou des flèches)*/

        let db_cells = await ModuleDAO.getInstance().getVosByRefFieldsIdsAndFieldsString<DashboardGraphVORefVO>(
            DashboardGraphVORefVO.API_TYPE_ID,
            'dashboard_id',
            [this.dashboard.id],
            'vo_type',
            [cellValue.value.tables_graph_vo_type]
        );
        if ((!db_cells) || (!db_cells.length)) {
            ConsoleHandler.getInstance().error('mxEvent.MOVE_END:no db cell');
            return;
        }
        let db_cell = db_cells[0];
        await ModuleDAO.getInstance().deleteVOs([db_cell]);
        // editor.graph.removeSelectionCell

        delete this.cells[cellValue.value.tables_graph_vo_type];
        delete this.graphic_cells[cellValue.value.tables_graph_vo_type];
        editor.graph.removeCells([cellValue]);
        this.$emit("del_api_type_id", cellValue.value.tables_graph_vo_type);
    }

    private check_doublon(source: string, target: string, field: string) {
        //Supprime la flèche en question de champs field allant de source vers target , si elle existe.
        let number_arrows: number;
        try {
            number_arrows = this.cells[source].edges.length;
            if (number_arrows > 0) {
                for (let cell of this.cells[source].edges) {
                    if (cell.target.value.tables_graph_vo_type == target && cell.value == field) {
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
            //Adding the cell graphically

            let parent = graph.getDefaultParent();
            let model = graph.getModel();

            let v1 = model.cloneCell(this.cell_prototype);
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
            }
            this.graphic_cells[cell.vo_type] = v1;
            v1 = this.initcell(cell, v1);

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
                this.selectionChanged();
            });
            this.selectionChanged();
            editor.graph.addListener('moveCells', async () => {
                let cell = editor.graph.getSelectionCell();
                let db_cells = await ModuleDAO.getInstance().getVosByRefFieldsIdsAndFieldsString<DashboardGraphVORefVO>(
                    DashboardGraphVORefVO.API_TYPE_ID,
                    'dashboard_id',
                    [this.dashboard.id],
                    'vo_type',
                    [cell.value.tables_graph_vo_type]
                );
                if ((!db_cells) || (!db_cells.length)) {
                    ConsoleHandler.getInstance().error('mxEvent.MOVE_END:no db cell');
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
                        VueAppBase.getInstance().vueInstance.t(VOsTypesManager.getInstance().moduleTables_by_voType[cell.value.tables_graph_vo_type].label.code_text) +
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

        await this.initgraph();
    }

    private async initgraph() {
        this.graphic_cells = {}; //Réinitialisation des cellules à afficher.
        if (editor && editor.graph && Object.values(this.cells) && Object.values(this.cells).length) {
            editor.graph.removeCells(Object.values(this.cells));
        }

        let cells = await ModuleDAO.getInstance().getVosByRefFieldIds<DashboardGraphVORefVO>(DashboardGraphVORefVO.API_TYPE_ID, 'dashboard_id', [this.dashboard.id]);
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
            this.initcell(cells[compteur], v1);
            compteur += 1;
        }
    }
    private initcell(cell: DashboardGraphVORefVO, v1: typeof mxCell) { //TODO Inclure les champs techniques dans targets_to_exclude
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
                let reference_cell = this.graphic_cells[reference.module_table.vo_type];
                //La flèche existe déjà ?
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

                if (reference_cell && (does_exist == false)) {
                    graph.insertEdge(parent, null, this.t(reference.field_label.code_text), reference_cell, v1);
                    graph_layout.addEdge(reference.module_table.vo_type, node_v1); //Nom des deux cellules sous chaîne de caratère.

                } else if (!reference_cell) { //chemin n/n
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
                                try {
                                    is_link_unccepted = Boolean(values_to_exclude.includes(this.t(nn_field.field_label.code_text) + ' / ' + this.t(reference.field_label.code_text)));
                                } catch (error) { //erreur possible si forget_couple[node_v1] n'existe pas
                                    is_link_unccepted = false; //La cible n'est pas interdite.
                                }
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
                                    if (is_link_unccepted == true) {
                                        graph.insertEdge(parent, null, this.t(nn_field.field_label.code_text) + ' / ' + this.t(reference.field_label.code_text), v1, nn_reference_cell, 'strokeColor=red;strokeOacity=30');
                                    } else {
                                        graph.insertEdge(parent, null, this.t(nn_field.field_label.code_text) + ' / ' + this.t(reference.field_label.code_text), v1, nn_reference_cell);
                                        //         graph.insertEdge(parent, null, '', nn_reference_cell, v1); //Utile ?
                                    }
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
                    try { //La flèche est elle acceptée ? On le vérifie en checkant les flèches interdites depuis cette source.
                        is_link_unccepted = Boolean(values_to_exclude.includes(this.t(field.field_label.code_text)));
                    } catch (error) { //erreur possible si forget_couple[node_v1] n'existe pas
                        is_link_unccepted = false; //La cible n'est pas interdite.
                    }

                    if (reference_cell) {
                        //On vérifie que la flèche n'a pas été traçée dans l'autre sens précédement.
                        this.check_doublon(node_v1, field.manyToOne_target_moduletable.vo_type, this.t(field.field_label.code_text)); //Supprime la flèche si celle-ci existe

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
            graph_layout.update_matrix();
        }

        return v1;
    }
}