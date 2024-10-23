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
import MaxGraphCellMapper from './graph_mapper/MaxGraphCellMapper';
import MaxGraphEdgeMapper from './graph_mapper/MaxGraphEdgeMapper';
import MaxGraphMapper from './graph_mapper/MaxGraphMapper';
import TablesGraphItemComponent from './item/TablesGraphItemComponent';
import './TablesGraphComponent.scss';
import ThreadHandler from '../../../../../shared/tools/ThreadHandler';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import { field_names } from '../../../../../shared/tools/ObjectHandler';
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

    @Prop()
    private is_cms_config: boolean;

    private maxgraph: Graph = null;
    private current_dashboard: DashboardVO = null;

    private throttle_init_or_update_graph = ThrottleHelper.declare_throttle_without_args(this.init_or_update_graph.bind(this), 100);
    private graph_mapper: MaxGraphMapper = null;
    private current_cell_mapper: MaxGraphEdgeMapper | MaxGraphCellMapper = null;
    private cms_compatible_dashboards: DashboardVO[] = [];
    private semaphore_init_or_update_graph: boolean = false;
    private semaphore_init_or_update_graph_hitted: boolean = false;

    private async init_or_update_graph() {

        if (this.is_cms_config) {
            this.cms_compatible_dashboards = await query(DashboardVO.API_TYPE_ID)
                .filter_is_true(field_names<DashboardVO>().is_cms_compatible, DashboardVO.API_TYPE_ID)
                .select_vos<DashboardVO>();
            this.current_dashboard = this.cms_compatible_dashboards[0];
        } else {
            this.current_dashboard = this.dashboard;
        }
        if ((!this.current_dashboard) || (!this.current_dashboard.id)) {
            if (!(this.cms_compatible_dashboards.length > 0)) {
                return;
            }
        }

        if (!Client.isBrowserSupported()) {
            throw new Error('Browser not supported');
        }

        if (this.semaphore_init_or_update_graph) {
            this.semaphore_init_or_update_graph_hitted = true;
            return;
        }
        this.semaphore_init_or_update_graph = true;

        if (!this.maxgraph) {

            //
            const codecCustomUserObject = new ObjectCodec(new window['CustomUserObject']());
            codecCustomUserObject.encode = function (enc, obj) {
                const node = enc.document.createElement('CustomUserObject');
                node.textContent = JSON.stringify(obj);

                return node;
            };
            codecCustomUserObject.decode = function (dec, node) {
                let obj = JSON.parse(node.textContent);
                const beatyObj = new window['CustomUserObject']();
                obj = Object.assign(beatyObj, obj);
                return obj;
            };
            CodecRegistry.register(codecCustomUserObject);

            //
            if (this.is_cms_config && this.cms_compatible_dashboards.length > 0) {
                this.graph_mapper = await MaxGraphMapper.reload_from_dashboard(this.cms_compatible_dashboards[0].id);
            } else {
                this.graph_mapper = await MaxGraphMapper.reload_from_dashboard(this.current_dashboard.id);
            }
            if (!this.graph_mapper) {
                throw new Error('MaxGraphMapper not found');
            }

            let container = (this.$refs['container'] as any);
            if (!container) {
                let max_timeout = 10;
                while ((!container) && (max_timeout > 0)) {
                    await ThreadHandler.sleep(1000, 'TablesGraphComponent.no_container');
                    container = (this.$refs['container'] as any);
                    max_timeout--;
                    if (!container) {
                        ConsoleHandler.warn('TablesGraphComponent.no_container');
                    }
                }

                if (!container) {
                    ConsoleHandler.error('TablesGraphComponent.no_container');
                    throw new Error('TablesGraphComponent.no_container');
                }
            }
            container.style.overflow = 'hidden';
            container.style.background = '#F5F5F5';
            container.style.padding = '1em';
            container.style.boxShadow = '1px 1px 1px #888';

            this.graph_mapper.build_maxgraph(container);
            this.maxgraph = this.graph_mapper.maxgraph;
            this.add_droppable_config(this.maxgraph);

            this.maxgraph.addListener('change', () => {
                this.selectionChanged().then().catch((error) => { ConsoleHandler.error(error); });
            });
            this.selectionChanged().then().catch((error) => { ConsoleHandler.error(error); });

        } else {
            await this.graph_mapper.remap();
        }

        this.semaphore_init_or_update_graph = false;
        if (this.semaphore_init_or_update_graph_hitted) {
            this.semaphore_init_or_update_graph_hitted = false;
            this.throttle_init_or_update_graph();
        }

    }

    private async selectionChanged() {

        const selected_cell = this.maxgraph.getSelectionCell();
        if (!selected_cell) {
            this.current_cell_mapper = null;
            return;
        }
        this.current_cell_mapper = this.graph_mapper.maxgraph_elt_by_maxgraph_id[selected_cell.id];
    }

    private async delete_cell(api_type_id: string) {
        this.$emit("del_api_type_id", api_type_id);
    }

    private add_droppable_config(graph_) {
        const funct = (api_type_id: string) => async (graph, evt) => {

            if (this.graph_mapper.cells[api_type_id]) {
                return;
            }

            graph.stopEditing(false);

            const pt = graph.getPointForEvent(evt);


            if (this.is_cms_config && this.cms_compatible_dashboards.length > 0) {
                for (let dashboard of this.cms_compatible_dashboards) {
                    const graphvoref = new DashboardGraphVORefVO();
                    graphvoref.x = pt.x;
                    graphvoref.y = pt.y;
                    graphvoref.width = MaxGraphMapper.default_width;
                    graphvoref.height = MaxGraphMapper.default_height;
                    graphvoref.vo_type = api_type_id;
                    graphvoref.dashboard_id = dashboard.id;
                    await ModuleDAO.getInstance().insertOrUpdateVO(graphvoref);
                }
            } else {
                const graphvoref = new DashboardGraphVORefVO();
                graphvoref.x = pt.x;
                graphvoref.y = pt.y;
                graphvoref.width = MaxGraphMapper.default_width;
                graphvoref.height = MaxGraphMapper.default_height;
                graphvoref.vo_type = api_type_id;
                graphvoref.dashboard_id = this.current_dashboard.id;
                await ModuleDAO.getInstance().insertOrUpdateVO(graphvoref);

            }

            await this.throttle_init_or_update_graph();
            this.$emit("add_api_type_id", api_type_id);

            // //Sélection automatique
            // let v1 = this.graphic_cells[cell.vo_type];
            // graph.setSelectionCell(v1);
        };

        const droppables = document.querySelectorAll('.droppable_vos .droppable_vos_wrapper .api_type_ids .api_type_id');
        droppables.forEach((droppable) => {
            // Creates the image which is used as the drag icon (preview)
            const api_type_id = droppable.getAttribute('api_type_id');
            const dragImage = droppable.cloneNode(true) as Element;
            gestureUtils.makeDraggable(droppable, graph_, funct(api_type_id), dragImage);
        });
    }

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

    private async update_discarded_field_paths(discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } }) {
        this.$emit('update_discarded_field_paths', discarded_field_paths);
    }
}
