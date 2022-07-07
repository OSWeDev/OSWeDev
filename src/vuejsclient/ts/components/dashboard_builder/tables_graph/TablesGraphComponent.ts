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

    private current_cell = null;
    private cells: { [api_type_id: string]: any } = {};

    private selectionChanged() {
        let cell = editor.graph.getSelectionCell();
        this.$set(this, 'current_cell', cell);
    }

    private async delete_cell(cellValue) {

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

        editor.graph.removeCells([cellValue]);
        this.$emit("del_api_type_id", cellValue.value.tables_graph_vo_type);
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

            let v1 = this.initcell(cell);

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
        const bite = new Graph();

        bite.test();
    }

    @Watch('dashboard', { immediate: true })
    private async onchange_dashboard() {
        if (!this.dashboard) {
            return;
        }

        await this.initgraph();
    }

    private async initgraph() {

        if (editor && editor.graph && Object.values(this.cells) && Object.values(this.cells).length) {
            editor.graph.removeCells(Object.values(this.cells));
        }

        let cells = await ModuleDAO.getInstance().getVosByRefFieldIds<DashboardGraphVORefVO>(DashboardGraphVORefVO.API_TYPE_ID, 'dashboard_id', [this.dashboard.id]);
        for (let i in cells) {
            this.initcell(cells[i]);
        }
    }

    private initcell(cell: DashboardGraphVORefVO) {
        let graph = editor.graph;
        let graph_layout: InstanceType<typeof Graph> = editor.graph_layout;
        graph_layout.reset();

        graph.stopEditing(false);

        let parent = graph.getDefaultParent();
        let model = graph.getModel();

        let v1 = model.cloneCell(this.cell_prototype);

        model.beginUpdate();
        try {

            // v1.style.strokeColor = '#F5F5F5';
            // v1.style.fillColor = '#FFF';

            graph.setCellStyles('strokeColor', '#555', [v1]);
            graph.setCellStyles('fillColor', '#444', [v1]);


            v1.geometry.x = cell.x;
            v1.geometry.y = cell.y;
            // v1.style = editor.graph.stylesheet.getDefaultEdgeStyle();
            v1.geometry.alternateBounds = new mxRectangle(0, 0, cell.width, cell.height, '');
            v1.value.tables_graph_vo_type = cell.vo_type;
            let node_v1: string = cell.vo_type;

            // On rajoute les liaisons depuis les autres vos
            let references: Array<ModuleTableField<any>> = VOsTypesManager.getInstance().get_type_references(cell.vo_type);
            for (let i in references) {
                let reference = references[i];
                let reference_cell = this.cells[reference.module_table.vo_type];
                if (reference_cell) {
                    graph.insertEdge(parent, null, this.t(reference.field_label.code_text), reference_cell, v1);
                    graph_layout.addEdge(reference.module_table.vo_type, node_v1); //Nom des deux cellules sous chaîne de caratère.
                } else {
                    //TODO-Rajouter dans la matrice d'adjacence, les liaisons n/n
                    if (VOsTypesManager.getInstance().isManyToManyModuleTable(reference.module_table)) {
                        let nn_fields = VOsTypesManager.getInstance().getManyToOneFields(reference.module_table.vo_type, []);
                        for (let j in nn_fields) {
                            let nn_field = nn_fields[j];

                            if (nn_field.field_id == reference.field_id) {
                                continue;
                            }

                            let nn_reference_cell = this.cells[nn_field.manyToOne_target_moduletable.vo_type];
                            if (nn_reference_cell) {
                                // TODO FIXME pour le moment le N/N est fait avec 2 flèches dont une a un label pour les 2
                                graph.insertEdge(parent, null, this.t(nn_field.field_label.code_text) + ' / ' + this.t(reference.field_label.code_text), v1, nn_reference_cell);
                                graph.insertEdge(parent, null, '', nn_reference_cell, v1);
                            }
                        }
                    }
                }
            }

            // On rajoute les liaisons vers les autres vos
            let fields = VOsTypesManager.getInstance().getManyToOneFields(cell.vo_type, []);
            for (let i in fields) {
                let field = fields[i];
                let reference_cell = this.cells[field.manyToOne_target_moduletable.vo_type];
                if (reference_cell) {
                    graph.insertEdge(parent, null, this.t(field.field_label.code_text), v1, reference_cell);
                    graph_layout.addEdge(field.manyToOne_target_moduletable.vo_type, node_v1); //Nom des deux cellules sous chaîne de caratère.

                }
            }
            graph.addCell(v1, parent);
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

        this.cells[cell.vo_type] = v1;
        return v1;
    }
}