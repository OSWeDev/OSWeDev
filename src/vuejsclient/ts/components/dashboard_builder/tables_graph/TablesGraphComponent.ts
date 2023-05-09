import { Client, CodecRegistry, gestureUtils, Graph, ObjectCodec } from '@maxgraph/core';
import { clone } from '@maxgraph/core/dist/esm/util/cloneUtils';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import DashboardGraphVORefVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../VueComponentBase';
import DroppableVosComponent from '../droppable_vos/DroppableVosComponent';
import TablesGraphEditFormComponent from './edit_form/TablesGraphEditFormComponent';
import GraphCellMapper from './graph_mapper/GraphCellMapper';
import GraphEdgeMapper from './graph_mapper/GraphEdgeMapper';
import GraphMapper from './graph_mapper/GraphMapper';
import TablesGraphItemComponent from './item/TablesGraphItemComponent';
import './TablesGraphComponent.scss';
// const graphConfig = {
//     mxBasePath: '/mx/', //Specifies the path in Client.basePath.
//     ImageBasePath: '/mx/images', // Specifies the path in Client.imageBasePath.
//     mxLanguage: 'en', // Specifies the language for resources in Client.language.
//     mxDefaultLanguage: 'en', // Specifies the default language in Client.defaultLanguage.
//     mxLoadResources: false, // Specifies if any resources should be loaded.  Default is true.
//     mxLoadStylesheets: false, // Specifies if any stylesheets should be loaded.  Default is true
// };

// console.log(JSON.stringify(mxgraph));

// let editor;


// CustomUserObject
window['CustomUserObject'] = function (name, type) {
    this.name = name || 'New Name';
    this.type = type || 'New Type';
    this.clone = function () {
        return clone(this);
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

    private maxgraph: Graph = null;

    private throttle_init_or_update_graph = ThrottleHelper.getInstance().declare_throttle_without_args(this.init_or_update_graph.bind(this), 100);
    private graph_mapper: GraphMapper = null;
    private current_cell_mapper: GraphEdgeMapper | GraphCellMapper = null;

    private async init_or_update_graph() {
        if ((!this.dashboard) || (!this.dashboard.id)) {
            return;
        }

        if (!Client.isBrowserSupported()) {
            throw new Error('Browser not supported');
        }

        if (!this.maxgraph) {

            //
            let codecCustomUserObject = new ObjectCodec(new window['CustomUserObject']());
            codecCustomUserObject.encode = function (enc, obj) {
                let node = enc.document.createElement('CustomUserObject');
                node.textContent = JSON.stringify(obj);

                return node;
            };
            codecCustomUserObject.decode = function (dec, node) {
                let obj = JSON.parse(node.textContent);
                let beatyObj = new window['CustomUserObject']();
                obj = Object.assign(beatyObj, obj);
                return obj;
            };
            CodecRegistry.register(codecCustomUserObject);

            //
            this.graph_mapper = await GraphMapper.load_from_dashboard(this.dashboard.id);

            let container = (this.$refs['container'] as any);
            container.style.overflow = 'hidden';
            container.style.background = '#F5F5F5';
            container.style.padding = '1em';
            container.style.boxShadow = '1px 1px 1px #888';

            this.graph_mapper.build_maxgraph(container);
            this.add_droppable_config(this.maxgraph);

            this.maxgraph.addListener('change', () => {
                this.selectionChanged().then().catch((error) => { ConsoleHandler.error(error); });
            });
            this.selectionChanged().then().catch((error) => { ConsoleHandler.error(error); });

        } else {
            this.graph_mapper.remap();
        }
    }

    private async selectionChanged() {

        let cell = this.maxgraph.getSelectionCell();
        this.current_cell_mapper = this.graph_mapper.maxgraph_elt_by_maxgraph_id[cell.id];
    }

    // private async toggle_check(checked: boolean, edge?: Cell) {
    //     /* Toggle function
    //         Permet de réactiver une flèche supprimée.
    //         After delete_arrow.
    //     */
    //     // const input = document.getElementById("myCheckbox") as HTMLInputElement; //Assertion obligatoire
    //     let arrowValue: Cell;
    //     if (!edge) {
    //         arrowValue = this.maxgraph.getSelectionCell();

    //     } else {
    //         arrowValue = edge;
    //     }
    //     //Est-ce bien une flèche ?
    //     if (!arrowValue) {
    //         return;
    //     }
    //     if (arrowValue.edge != true) {
    //         return console.log("Ce n'est pas une flèche !");
    //     }
    //     let source_cell: Cell = arrowValue.source; //Cellule source de la flèche selectionnée.

    //     //La flèche est-elle n/n ou non ?
    //     let vo_type: string;
    //     let is_n_n: boolean; // lien n/n ou non

    //     if (typeof (arrowValue['field_id']) == 'string') {
    //         vo_type = arrowValue.source.value.tables_graph_vo_type;
    //         is_n_n = false;
    //     } else {
    //         vo_type = arrowValue['field_id']['intermediaire']; //On crée la cellule intermédiare.
    //         is_n_n = true;

    //         this.maxgraph.stopEditing(false);

    //         let cell = new DashboardGraphVORefVO();
    //         cell.x = 800;
    //         cell.y = 80;
    //         cell.width = this.cell_prototype.geometry.width;
    //         cell.height = this.cell_prototype.geometry.height;
    //         cell.vo_type = vo_type;
    //         cell.dashboard_id = this.dashboard.id;
    //         await ModuleDAO.getInstance().insertOrUpdateVO(cell);
    //     }
    //     //Récupération de la cellule en base SQL
    //     let db_cells_source = await query(DashboardGraphVORefVO.API_TYPE_ID)
    //         .filter_by_num_eq('dashboard_id', this.dashboard.id)
    //         .filter_by_text_eq('vo_type', vo_type)
    //         .select_vos<DashboardGraphVORefVO>();

    //     if ((!db_cells_source) || (!db_cells_source.length)) {
    //         ConsoleHandler.error('Event.MOVE_END:no db cell');
    //         return;
    //     }

    //     let db_cell_source = db_cells_source[0];

    //     if ((!checked) && db_cell_source.values_to_exclude.length > 0) {
    //         //Désactive la suppression si le champs à en effet été supprimé.
    //         // Ne marche pas avec is_n_n.
    //         // On retire les valeurs Null dans values_to_exclude pouvant apparaître de manière impromptue.
    //         const results: string[] = [];

    //         if (!this.toggles[arrowValue.source.value.tables_graph_vo_type]) {
    //             return;
    //         }

    //         db_cell_source.values_to_exclude.forEach((element) => {
    //             if (element !== null) {
    //                 results.push(element);
    //             }
    //         });

    //         db_cell_source.values_to_exclude = results;

    //         const startIndex = db_cell_source.values_to_exclude.indexOf(arrowValue['field_id']);
    //         const startIndex_toggles = this.toggles[arrowValue.source.value.tables_graph_vo_type].indexOf(arrowValue['field_id']);
    //         const deleteCount = 1;
    //         if (startIndex !== -1) {
    //             db_cell_source.values_to_exclude.splice(startIndex, deleteCount);
    //             this.toggles[arrowValue.source.value.tables_graph_vo_type].splice(startIndex_toggles, deleteCount);
    //             this.toggle = false;
    //             await ModuleDAO.getInstance().insertOrUpdateVO(db_cell_source); //Mise à jour de la base.
    //             await this.initgraph(); //TODO Peut être que cela est trop brutal, on peut essayer simplement avec initcell je pense.
    //         }

    //     } else if (checked) {
    //         //Supprime la flèche en question
    //         //Création des différents champs
    //         if (!db_cell_source.values_to_exclude) {
    //             db_cell_source.values_to_exclude = [];
    //         }
    //         //Rajout des flèches à éliminer dans ces champs.
    //         //On rajoute une cible à éliminer.
    //         switch (is_n_n) {

    //             case false:
    //                 if (!this.toggles[arrowValue.source.value.tables_graph_vo_type]) {
    //                     break;
    //                 }

    //                 if (!db_cell_source.values_to_exclude.includes(arrowValue['field_id'])) { //On évite les doublons
    //                     db_cell_source.values_to_exclude.push(arrowValue['field_id']);
    //                     this.toggles[arrowValue.source.value.tables_graph_vo_type].push(arrowValue['field_id']);
    //                     this.toggle = true;
    //                     await ModuleDAO.getInstance().insertOrUpdateVO(db_cell_source); //Mise à jour de la base.
    //                 }

    //                 await this.initgraph(); //On relance le graphe.
    //                 break;
    //             case true:
    //                 if (!db_cell_source.values_to_exclude.includes(arrowValue['field_id']['field_id_1'])) { //On évite les doublons
    //                     db_cell_source.values_to_exclude.push(arrowValue['field_id']['field_id_1']);
    //                     this.toggle = true;
    //                 }
    //                 if (!db_cell_source.values_to_exclude.includes(arrowValue['field_id']['field_id_2'])) { //On évite les doublons
    //                     db_cell_source.values_to_exclude.push(arrowValue['field_id']['field_id_2']);
    //                     this.toggle = true;
    //                 }
    //                 await ModuleDAO.getInstance().insertOrUpdateVO(db_cell_source); //Mise à jour de la base.

    //                 await this.initgraph(); //On relance le graphe.
    //                 break;
    //         }
    //     }
    // }

    private async delete_cell(api_type_id: string) {
        this.$emit("del_api_type_id", api_type_id);
    }

    private add_droppable_config(graph_) {
        let funct = (api_type_id: string) => async (graph, evt) => {

            if (this.graph_mapper.cells[api_type_id]) {
                return;
            }

            graph.stopEditing(false);

            let pt = graph.getPointForEvent(evt);

            let cell = new DashboardGraphVORefVO();
            cell.x = pt.x;
            cell.y = pt.y;
            cell.width = GraphMapper.default_width;
            cell.height = GraphMapper.default_height;
            cell.vo_type = api_type_id;
            cell.dashboard_id = this.dashboard.id;
            await ModuleDAO.getInstance().insertOrUpdateVO(cell);

            await this.throttle_init_or_update_graph();

            // //Sélection automatique
            // let v1 = this.graphic_cells[cell.vo_type];
            // graph.setSelectionCell(v1);
            // this.$emit("add_api_type_id", api_type_id);
        };

        let droppables = document.querySelectorAll('.droppable_vos .droppable_vos_wrapper .api_type_ids .api_type_id');
        droppables.forEach((droppable) => {
            // Creates the image which is used as the drag icon (preview)
            let api_type_id = droppable.getAttribute('api_type_id');
            let dragImage = droppable.cloneNode(true) as Element;
            gestureUtils.makeDraggable(droppable, graph_, funct(api_type_id), dragImage);
        });
    }

    // private createGraph() {

    // // Fields are dynamically created HTML labels
    // this.maxgraph.isHtmlLabel = function (cell) {
    //     return !this.isSwimlane(cell) &&
    //         !cell.isEdge();
    // };


    // // Returns the name propertie of the user object for the label
    // this.maxgraph.convertValueToString = function (cell) {
    //     if (cell.value != null && cell.value.name != null) {
    //         return cell.value.name;
    //     }
    //     return cell.getValue().toString();
    // };

    // // Creates a dynamic HTML label for properties
    // this.maxgraph.getLabel = function (cell) {

    //     // console.log('getLabel ', cell);
    //     if (cell && this.isHtmlLabel(cell) && cell.value) {

    //         // let infoWindow = new TablesGraphItemComponent({
    //         //     propsData: {
    //         //         vo_type: cell.value.tables_graph_vo_type
    //         //     },
    //         //     store: this.$store
    //         // });
    //         // setTimeout(() => {
    //         //     infoWindow.$mount("#tables_graph_vo_type__" + cell.value.tables_graph_vo_type);
    //         // }, 1000);

    //         let label = '';
    //         // label += '<div id="tables_graph_vo_type__' + cell.value.tables_graph_vo_type + '">' +
    //         //     '</div>';
    //         label += '<div class="tables_graph_item table_name">' +
    //             VueAppBase.getInstance().vueInstance.t(VOsTypesManager.moduleTables_by_voType[cell.value.tables_graph_vo_type].label.code_text) +
    //             '</div>';

    //         return label;
    //     }


    //     return cell.getValue().toString();
    // };
    // }

    private mounted() {
        this.throttle_init_or_update_graph();
    }

    @Watch('dashboard', { immediate: true })
    private async onchange_dashboard() {
        if (!this.dashboard) {
            return;
        }

        await this.throttle_init_or_update_graph();
    }

    // private async initgraph(red_by_default: boolean = false) {

    //     this.graphic_cells = {}; //Réinitialisation des cellules à afficher.
    //     if (this.maxgraph && Object.values(this.cells) && Object.values(this.cells).length) {
    //         this.maxgraph.removeCells(Object.values(this.cells));
    //     } //Parfois , le compilateur repasse  sans raison ici et crée alors les cellules en double

    //     //Pour éviter, on vérifie que graphic_cells est bien nul .
    //     if (Object.keys(this.graphic_cells).length != 0) {
    //         return;
    //     }
    //     let cells = await query(DashboardGraphVORefVO.API_TYPE_ID).filter_by_num_eq('dashboard_id', this.dashboard.id).select_vos<DashboardGraphVORefVO>();
    //     let cells_visited: { [vo_type: string]: string } = {};

    //     //On retire les cellules doublons.
    //     for (let i in cells) { //Adding cells to the model
    //         let cell = cells[i];
    //         if (!cells_visited[cell.vo_type]) {
    //             cells_visited[cell.vo_type] = i;
    //         } else {
    //             switch (cell.values_to_exclude) {
    //                 case null:
    //                     await ModuleDAO.getInstance().deleteVOs([cell]); //Suppression de la cellule en base, ainsi les flèches désactivées auparavant ne le seront plus.
    //                     cells.splice(Number(i), 1);  //On retire cette celulle de la liste
    //                     break;
    //                 default:
    //                     //Si une telle cellule existe déjà mais que les valeurs à exclures sont dans celle-ci, on la conserve.
    //                     let previous_cell_index: string = cells_visited[cell.vo_type];
    //                     await ModuleDAO.getInstance().deleteVOs([cells[i]]); //Suppression de la cellule en base, ainsi les flèches désactivées auparavant ne le seront plus.
    //                     cells.splice(Number(previous_cell_index), 1);

    //             }

    //         }
    //     }

    //     for (let i in cells) { //Adding cells to the model

    //         let cell = cells[i];

    //         this.maxgraph.stopEditing(false);

    //         let parent = this.maxgraph.getDefaultParent();
    //         let model = this.maxgraph.getDataModel();

    //         let v1 = model.cloneCell(this.cell_prototype);
    //         //  let v1 = this.cells[cell.vo_type];
    //         model.beginUpdate();
    //         try {

    //             // v1.style.strokeColor = '#F5F5F5';
    //             // v1.style.fillColor = '#FFF';

    //             this.maxgraph.setCellStyles('strokeColor', '#555', [v1]);
    //             this.maxgraph.setCellStyles('fillColor', '#444', [v1]);
    //             v1.geometry.x = cell.x;
    //             v1.geometry.y = cell.y;
    //             // v1.style = this.maxgraph.stylesheet.getDefaultEdgeStyle();
    //             v1.geometry.alternateBounds = new Rectangle(0, 0, cell.width, cell.height);
    //             v1.value.tables_graph_vo_type = cell.vo_type;
    //             const newcell = this.maxgraph.insertVertex(parent, null, cell.x, cell.y, cell.width, cell.height, {
    //                 strokeColor: '#555',
    //                 fillColor: '#444'
    //             });
    //         } finally {
    //             model.endUpdate();
    //             this.graphic_cells[cell.vo_type] = v1; // On enregistre la cellule dans un dictionnaire pour la réutiliser. C'est la cellule graphique.
    //         }


    //     }
    //     //Adding links


    //     let compteur: number = 0;
    //     for (let cellule in this.graphic_cells) {
    //         let v1: Cell = this.graphic_cells[cellule];
    //         //Table associée, on souhaite désactiver par défauts certains chemins.
    //         switch (red_by_default) {
    //             case true:
    //                 let table = VOsTypesManager.moduleTables_by_voType[cellule];
    //                 let is_versioned: boolean = table.is_versioned;
    //                 this.initcell(cells[compteur], v1, is_versioned);
    //                 break;
    //             case false:
    //                 this.initcell(cells[compteur], v1);
    //         }
    //         compteur += 1;
    //     }

    //     //Initialisation des interrupteurs
    //     this.toggles = {};
    //     let vo_types: string[] = [];

    //     for (let cell_name of Object.keys(this.graphic_cells)) {
    //         let vo_type = this.graphic_cells[cell_name].value.tables_graph_vo_type;
    //         if (!vo_types.includes(vo_type)) {
    //             vo_types.push(vo_type);

    //         }
    //     }

    //     for (let cell_name of Object.keys(this.graphic_cells)) {
    //         let vo_type = this.graphic_cells[cell_name].value.tables_graph_vo_type;
    //         if (!vo_types.includes(vo_type)) {
    //             vo_types.push(vo_type);

    //         }
    //     }

    //     let db_cells_sources = await query(DashboardGraphVORefVO.API_TYPE_ID)
    //         .filter_by_text_has('vo_type', vo_types)
    //         .filter_by_num_eq('dashboard_id', this.dashboard.id)
    //         .select_vos<DashboardGraphVORefVO>();

    //     if ((!db_cells_sources) || (!db_cells_sources.length)) {
    //         ConsoleHandler.error('Event.MOVE_END:no db cell');
    //         return;
    //     }

    //     for (let value of db_cells_sources) {
    //         if (value.values_to_exclude === null) {
    //             this.toggles[value.vo_type] = [];  //Indéfini si les interrupteurs n'ont jamais été touchés...
    //         } else {
    //             this.toggles[value.vo_type] = value.values_to_exclude;
    //         }
    //     }
    //     this.end_graphic_cells = this.graphic_cells;
    //     this.end_toggles = this.toggles;
    // }
    // private initcell(cell: DashboardGraphVORefVO, v1: Cell, is_versioned?) { //TODO Inclure les champs techniques dans targets_to_exclude
    //     /*
    //      Incorpore la cellule cell dans le graphique et dessine les flèches qui partent de celle-ci ainsi que celle qui viennent.
    //      On évite de redessiner les flèches déjà construite.
    //     */

    //     //On récupère les flèches à ne pas prendre en compte car supprimées.

    //     this.cells[cell.vo_type] = v1;
    //     let values_to_exclude: string[]; //Voici la liste des flèches à ne pas afficher.
    //     if (cell.values_to_exclude) {
    //         values_to_exclude = cell.values_to_exclude;
    //     } else { values_to_exclude = []; }

    //     let field_values: { [target: string]: { [values: string]: string | { [keys: string]: string } } } = {}; //Afin d'enregistrer le field_id associé pour chaque value. Le string[] convient pour les n/n.
    //     // this.graph_layout.reset();

    //     this.maxgraph.stopEditing(false);

    //     let parent = this.maxgraph.getDefaultParent();
    //     let model = this.maxgraph.getDataModel(); // FIXME TODO  check getModel => getDataModel ???
    //     //Constantes nécessaires:
    //     let node_v1: string = cell.vo_type; //Nom de la cellule source

    //     let is_link_unccepted: boolean; //Si la flèche construite n'est pas censurée
    //     let does_exist: boolean = false; //Si la flèche construite ne l'a pas déjà été.
    //     //First Update : target -> source
    //     model.beginUpdate();
    //     try {

    //         // v1.style.strokeColor = '#F5F5F5';
    //         // v1.style.fillColor = '#FFF';

    //         this.maxgraph.setCellStyles('strokeColor', '#555', [v1]);
    //         this.maxgraph.setCellStyles('fillColor', '#444', [v1]);
    //         // On rajoute les liaisons depuis les autres vos
    //         let references: Array<ModuleTableField<any>> = VOsTypesManager.get_type_references(cell.vo_type);
    //         for (let i in references) {
    //             let reference = references[i];
    //             let reference_cell = this.graphic_cells[reference.module_table.vo_type]; //Cellule reliée à v1 partageant la colonne "reference"
    //             //La flèche existe déjà ?

    //             if (reference_cell) {
    //                 // //Il est possible que la flèche existe déjà dans l'autre sens, dans ce cas , on ne la réaffiche pas.
    //                 // try {
    //                 //     if (this.cells && this.cells[reference.module_table.vo_type] && this.cells[reference.module_table.vo_type].edges) {

    //                 //         let number_arrows: number = this.cells[reference.module_table.vo_type].edges.length;
    //                 //         if (number_arrows > 0) {
    //                 //             for (let cellules of this.cells[reference.module_table.vo_type].edges) {
    //                 //                 if (cellules.target.value.tables_graph_vo_type == node_v1 && cellules.value == this.t(reference.field_label.code_text)) {
    //                 //                     does_exist = true; //On retire cette flèche.
    //                 //                 }
    //                 //             }
    //                 //         }
    //                 //     }
    //                 // } catch (error) {
    //                 //     does_exist = false; //La flèche n'existe pas.
    //                 // }
    //                 // if (!does_exist) {
    //                 this.insert_edge_if_not_exist(parent, this.t(reference.field_label.code_text), reference.module_table.vo_type, node_v1, false);
    //                 // this.maxgraph.insertEdge(parent, null, this.t(reference.field_label.code_text), reference_cell, v1);
    //                 // this.graph_layout.addEdge(reference.module_table.vo_type, node_v1); //Nom des deux cellules sous chaîne de caratère.
    //                 // }
    //                 //chemin n/n , intervient si la cellule reliée n'est pas sur le dashboard. Ce chemin indique qu'il existe une cellule intermédiaire reliant v1 et une autre cellule.
    //             } else if (!reference_cell) { //Si la cellule intermédiaire n'est pas là ,le chemin n/n  sera affiché.
    //                 //TODO-Rajouter dans la matrice d'adjacence les liaisons n/n
    //                 if (VOsTypesManager.isManyToManyModuleTable(reference.module_table)) {
    //                     let nn_fields = VOsTypesManager.getManyToOneFields(reference.module_table.vo_type, []);
    //                     for (let j in nn_fields) {
    //                         let nn_field = nn_fields[j];

    //                         if (nn_field.field_id == reference.field_id) {
    //                             continue;
    //                         }
    //                         let nn_reference_cell = this.graphic_cells[nn_field.manyToOne_target_moduletable.vo_type]; //On rajoute cette flèche dans les flèches crées
    //                         if (nn_reference_cell) {
    //                             try { //La relation n/n peut exister dans le sens inverse, on vérifie que ça n'est pas le cas.
    //                                 let number_arrows: number = this.cells[nn_field.manyToOne_target_moduletable.vo_type].edges.length;
    //                                 if (number_arrows > 0) {
    //                                     for (let cellules of this.cells[nn_field.manyToOne_target_moduletable.vo_type].edges) {
    //                                         if (cellules.target.value.tables_graph_vo_type == node_v1 && cellules.value == this.t(reference.field_label.code_text) + ' / ' + this.t(nn_field.field_label.code_text)) {
    //                                             does_exist = true; //On retire cette flèche.
    //                                         }
    //                                     }
    //                                 }
    //                             } catch (error) {
    //                                 does_exist = false;
    //                             }
    //                             if (does_exist == false) {
    //                                 //TODO Faire en sorte de  conserver la fléche qui  va dans le même sens que les autres flèches reliant les deux cellules en question.
    //                                 // TODO FIXME pour le moment le N/N est fait avec 2 flèches dont une a un label pour les 2
    //                                 let label = this.t(nn_field.field_label.code_text) + ' / ' + this.t(reference.field_label.code_text);
    //                                 this.insert_edge_if_not_exist(parent, label, reference.module_table.vo_type, node_v1, true);

    //                                 if (!field_values[nn_field.manyToOne_target_moduletable.vo_type]) {
    //                                     field_values[nn_field.manyToOne_target_moduletable.vo_type] = {};
    //                                 }//On crée dans un premier temps le dictionnaire
    //                                 //On affiche la relation n/n.
    //                                 field_values[nn_field.manyToOne_target_moduletable.vo_type][label] = { intermediaire: reference.module_table.vo_type, field_id_1: reference.field_id, field_id_2: nn_field.field_id };  //on enregistre dans le dictionnaire [source_inter,field_1,field_2]

    //                                 this.maxgraph.insertEdge(parent, null, label, v1, nn_reference_cell);
    //                                 //    graph.insertEdge(parent, nn_field.field_id, '', nn_reference_cell, v1);

    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     } finally {
    //         model.endUpdate();
    //     } //Obligé de faire une première mise à jour ici du modèle , sinon des flèches traçées ne sont pas mises à jour.

    //     //Second update :source -> target
    //     model.beginUpdate();

    //     try {
    //         // On rajoute les liaisons vers les autres vos
    //         let fields = VOsTypesManager.getManyToOneFields(cell.vo_type, []);
    //         for (let i in fields) {
    //             let field = fields[i];
    //             let reference_cell = this.graphic_cells[field.manyToOne_target_moduletable.vo_type];
    //             if (field.manyToOne_target_moduletable.vo_type != node_v1) {

    //                 //Cas versionné ou non
    //                 if (is_versioned && (["Modificateur", "Créateur"].includes(this.t(field.field_label.code_text)))) {
    //                     try {
    //                         if (!values_to_exclude.includes(field.field_id)) { //Bien initialiser la liste.
    //                             values_to_exclude.push(field.field_id);
    //                             cell.values_to_exclude = values_to_exclude;
    //                             is_link_unccepted = true;
    //                             ModuleDAO.getInstance().insertOrUpdateVO(cell).then().catch((error) => { ConsoleHandler.error(error); });

    //                         }
    //                     } catch { }
    //                 } else {
    //                     try { //La flèche est elle acceptée ? On le vérifie en checkant les flèches interdites depuis cette source.
    //                         is_link_unccepted = Boolean(values_to_exclude.includes(field.field_id));
    //                     } catch (error) { //erreur possible si forget_couple[node_v1] n'existe pas
    //                         is_link_unccepted = false; //La cible n'est pas interdite.
    //                     }
    //                 }


    //                 if (reference_cell) {

    //                     let label = this.t(field.field_label.code_text);

    //                     //On vérifie que la flèche n'a pas été traçée dans l'autre sens précédement.
    //                     this.check_doublon(node_v1, field.manyToOne_target_moduletable.vo_type, label); //Supprime la flèche si celle-ci existe

    //                     if (!field_values[field.manyToOne_target_moduletable.vo_type]) {
    //                         field_values[field.manyToOne_target_moduletable.vo_type] = {};
    //                     }//On crée dans un premier temps le dictionnaire

    //                     field_values[field.manyToOne_target_moduletable.vo_type][label] = field.field_id; //on enregistre dans le dictionnaire.
    //                     if (is_link_unccepted == true) {

    //                         // if (!this.declared_unacepted_links_style) {
    //                         //     this.declared_unacepted_links_style = true;

    //                         //     // let style = new Object();
    //                         //     // style["strokeColor"] = "red";
    //                         //     // style["strokeOpacity"] = 30;
    //                         //     styleUtils.addStylename();
    //                         //     // this.graph_layout.getStylesheet().putCellStyle('UNACCEPTED', style);
    //                         // }

    //                         // this.maxgraph.insertEdge(parent, null, this.t(field.field_label.code_text), v1, reference_cell, "strokeColor=red;strokeOpacity=30"); //Note that the source and target vertices should already have been inserted into the model.
    //                         this.maxgraph.insertEdge(parent, null, label, v1, reference_cell, {
    //                             strokeColor: 'red',
    //                             strokeOpacity: 30
    //                         }); //Note that the source and target vertices should already have been inserted into the model.
    //                     } else {
    //                         this.maxgraph.insertEdge(parent, null, label, v1, reference_cell);
    //                         // this.graph_layout.addEdge(field.manyToOne_target_moduletable.vo_type, node_v1); //Nom des deux cellules sous chaîne de caratère.
    //                     }

    //                 }
    //             }
    //         }
    //         // graph.setCellStyles('strokeColor', '#F5F5F5', [parent]);
    //         // graph.setCellStyles('fillColor', '#FFF', [parent]);
    //         // var style = graph.getModel().getStyle(v1);
    //         // var newStyle = Utils.setStyle(style, 'strokeColor', 'red');
    //         // newStyle = Utils.setStyle(newStyle, 'fillColor', 'white');
    //         // var cs = new Array();
    //         // cs[0] = cell;
    //         // graph.setCellStyle(newStyle, cs);

    //     } finally {
    //         model.endUpdate();
    //         for (let arrow in this.cells[node_v1].edges) {
    //             // Il est possible que target soit la cellule source, dans ce cas , ça ne marchera pas.
    //             let target: string = this.cells[node_v1].edges[arrow].target.value.tables_graph_vo_type;
    //             if (target != node_v1) {
    //                 let value: string = this.cells[node_v1].edges[arrow].value;
    //                 try {
    //                     if (!this.cells[node_v1].edges[arrow]['field_id']) { //Si le field_id n'a pas été renseigné.
    //                         this.cells[node_v1].edges[arrow]['field_id'] = field_values[target][value];
    //                     }
    //                 } catch {
    //                 }
    //             }
    //         }
    //         // graph_layout.update_matrix();
    //     }
    //     return v1;
    // }

    // private insert_edge_if_not_exist(parent, label, source_api_type_id: string, dest_api_type_id: string, is_nn: boolean = false) {
    //     if (!this.cells[source_api_type_id]) {
    //         ConsoleHandler.error("insert_edge_if_not_exist : source_api_type_id " + source_api_type_id + " n'existe pas dans le graphique");
    //         return;
    //     }
    //     if (!this.cells[dest_api_type_id]) {
    //         ConsoleHandler.error("insert_edge_if_not_exist : dest_api_type_id " + dest_api_type_id + " n'existe pas dans le graphique");
    //         return;
    //     }

    //     if (!this.semaphore_edges[source_api_type_id]) {
    //         this.semaphore_edges[source_api_type_id] = {};
    //     }
    //     if (!!this.semaphore_edges[source_api_type_id][dest_api_type_id]) {
    //         return;
    //     }
    //     this.semaphore_edges[source_api_type_id][dest_api_type_id] = true;

    //     const new_edge = this.maxgraph.insertEdge(parent, null, label, this.cells[source_api_type_id], this.cells[dest_api_type_id]);
    //     // this.graph_layout.addEdge(source_api_type_id, dest_api_type_id); //Nom des deux cellules sous chaîne de caratère.

    //     this.is_nn_from_edge_id[new_edge.id] = is_nn;
    //     this.api_type_id_from_edge_id[new_edge.id] = source_api_type_id;
    // }

}
