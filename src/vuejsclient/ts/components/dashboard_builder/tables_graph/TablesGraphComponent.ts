import {
    Client,
    CodecRegistry,
    constants,
    gestureUtils,
    Graph,
    ObjectCodec,
} from '@maxgraph/core';

import { clone } from '@maxgraph/core/dist/esm/util/cloneUtils';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import DashboardGraphVORefVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ObjectHandler, { field_names } from '../../../../../shared/tools/ObjectHandler';
import ThreadHandler from '../../../../../shared/tools/ThreadHandler';
import ThrottleHelper from '../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../VueComponentBase';
import DroppableVosComponent from '../droppable_vos/DroppableVosComponent';
import TablesGraphEditFormComponent from './edit_form/TablesGraphEditFormComponent';
import MaxGraphCellMapper from './graph_mapper/MaxGraphCellMapper';
import MaxGraphEdgeMapper from './graph_mapper/MaxGraphEdgeMapper';
import MaxGraphMapper from './graph_mapper/MaxGraphMapper';
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

    private throttle_init_or_update_graph = ThrottleHelper.declare_throttle_without_args(
        'TablesGraphComponent.throttle_init_or_update_graph',
        this.initOrUpdateGraph.bind(this),
        100
    );

    private graph_mapper: MaxGraphMapper = null;
    private current_cell_mapper: MaxGraphEdgeMapper | MaxGraphCellMapper = null;
    private cms_compatible_dashboards: DashboardVO[] = [];
    private semaphore_init_or_update_graph: boolean = false;
    private semaphore_init_or_update_graph_hitted: boolean = false;

    @Watch('dashboard', { immediate: true })
    private async onchange_dashboard() {
        if (!this.dashboard) {
            return;
        }

        await this.throttle_init_or_update_graph();
    }

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
        await this.throttle_init_or_update_graph();
    }

    /**
     * Initialisation ou mise à jour du graph
     */
    private async initOrUpdateGraph(): Promise<void> {

        if (!this.canInitOrUpdate()) {
            return;
        }

        if (this.semaphore_init_or_update_graph) {
            this.semaphore_init_or_update_graph_hitted = true;
            return;
        }
        this.semaphore_init_or_update_graph = true;

        try {
            await this.ensureCodecRegistered();
            await this.createOrReloadGraphMapper();
            await this.createGraphIfNeeded();
            await this.reloadGraphMapper();
            await this.enableDragsAndDrops();
        } catch (error) {
            ConsoleHandler.error(error);
        }

        this.semaphore_init_or_update_graph = false;
        if (this.semaphore_init_or_update_graph_hitted) {
            this.semaphore_init_or_update_graph_hitted = false;
            this.throttle_init_or_update_graph();
        }

    }

    private canInitOrUpdate(): boolean {
        if (!this.dashboard || !this.dashboard.id) {
            return false;
        }
        if (!Client.isBrowserSupported()) {
            ConsoleHandler.error('Navigateur non supporté par MaxGraph');
            return false;
        }
        return true;
    }

    /**
     * Enregistre un codec pour nos userObjects custom
     */
    private async ensureCodecRegistered(): Promise<void> {
        const codecCustomUserObject = new ObjectCodec(new window['CustomUserObject']());
        codecCustomUserObject.encode = function (enc, obj) {
            const node = enc.document.createElement('CustomUserObject');
            node.textContent = JSON.stringify(obj);
            return node;
        };
        codecCustomUserObject.decode = function (dec, node) {
            let obj = JSON.parse(node.textContent);
            const beautyObj = new window['CustomUserObject']();
            return Object.assign(beautyObj, obj);
        };
        CodecRegistry.register(codecCustomUserObject);
    }

    /**
     * Récupère ou crée le mapper MaxGraph
     */
    private async createOrReloadGraphMapper(): Promise<void> {
        if (!this.graph_mapper) {
            if (this.is_cms_config && this.cms_compatible_dashboards.length > 0) {
                this.graph_mapper = await MaxGraphMapper.reload_from_dashboard(this.cms_compatible_dashboards[0].id);
            } else {
                this.graph_mapper = await MaxGraphMapper.reload_from_dashboard(this.current_dashboard.id);
            }
        }
        if (!this.graph_mapper) {
            throw new Error('Impossible de récupérer MaxGraphMapper');
        }
    }

    /**
     * Crée le graph MaxGraph s'il n'existe pas encore
     */
    private async createGraphIfNeeded(): Promise<void> {
        if (this.maxgraph) {
            return;
        }
        const container = await this.getContainer();
        this.styleContainer(container);

        this.graph_mapper.build_maxgraph(container);
        this.maxgraph = this.graph_mapper.maxgraph;

        this.configureGraphStyles();
        this.configureGraphInteraction();

        this.maxgraph.addListener('change', () => {
            this.selectionChanged().catch(err => ConsoleHandler.error(err));
        });
        await this.selectionChanged();
    }

    /**
     * Récupère le conteneur HTML
     */
    private async getContainer(): Promise<HTMLElement> {
        let container = this.$refs['container'] as HTMLElement;
        let max_retry = 10;
        while (!container && max_retry > 0) {
            await ThreadHandler.sleep(1000, 'TablesGraphComponent.no_container');
            container = this.$refs['container'] as HTMLElement;
            max_retry--;
        }
        if (!container) {
            throw new Error('Conteneur du graph introuvable');
        }
        return container;
    }

    /**
     * Style basique du conteneur
     */
    private styleContainer(container: HTMLElement): void {
        container.style.overflow = 'hidden';
        container.style.background = '#F5F5F5';
        container.style.padding = '1em';
        container.style.boxShadow = '1px 1px 1px #888';
    }

    /**
     * Configuration des styles (flèches, wrap texte…)
     */
    private configureGraphStyles(): void {
        // Style par défaut pour les edges (flèches coudées)
        const edgeStyle = this.maxgraph.getStylesheet().getDefaultEdgeStyle();
        edgeStyle.edgeStyle = constants.EDGESTYLE.ELBOW;
        this.maxgraph.getStylesheet().putCellStyle('defaultEdge', edgeStyle);

        // Style par défaut pour les vertices (ex: classes UML)
        const vertexStyle = this.maxgraph.getStylesheet().getDefaultVertexStyle();
        vertexStyle.whiteSpace = 'wrap';
        vertexStyle.overflow = 'hidden';
        vertexStyle.rounded = true;
        vertexStyle.labelBackgroundColor = '#ffffff';
        vertexStyle.labelPadding = 8;
        vertexStyle.labelWidth = 200;
        this.maxgraph.getStylesheet().putCellStyle('defaultVertex', vertexStyle);

        // Tooltip complet au survol
        this.maxgraph.getTooltipForCell = (cell) => {
            const mapper = this.graph_mapper.maxgraph_elt_by_maxgraph_id[cell.id];
            if (!mapper) {
                return null;
            }
            return /**FIXME*mapper.vo_type || mapper.field_id || 'Obj'*/ 'TODO';
        };
    }

    /**
     * Active panning, drag&drop
     */
    private configureGraphInteraction(): void {
        // Autorise le déplacement libre (par défaut c'est clic droit)
        // Dans maxgraph/core, on peut juste appeler setPanning(true).
        // S'il n'y a pas panningHandler, on retire la ligne useLeftButtonForPanning.
        this.maxgraph.setPanning(true);

        // Autorise le drop dans le graph
        this.maxgraph.setDropEnabled(true);

        // Empêche la création de liens non connectés
        this.maxgraph.setAllowDanglingEdges(false);

        // Autorise le redimensionnement et le déplacement des blocs
        this.maxgraph.setCellsResizable(true);
        this.maxgraph.setCellsMovable(true);
    }

    /**
     * Remap du graph (positions, dimensions, etc.)
     */
    private async reloadGraphMapper(): Promise<void> {
        await this.graph_mapper.remap();
    }

    /**
     * Active le drag&drop depuis la liste de tables (DroppableVosComponent)
     */
    private async enableDragsAndDrops(): Promise<void> {
        this.addDroppableConfig(this.maxgraph);
    }

    /**
     * Sur changement de sélection dans le graph
     */
    private async selectionChanged(): Promise<void> {
        const selected_cell = this.maxgraph.getSelectionCell();
        if (!selected_cell) {
            this.current_cell_mapper = null;
            return;
        }
        this.current_cell_mapper = this.graph_mapper.maxgraph_elt_by_maxgraph_id[selected_cell.id];
    }

    /**
     * Supprime un bloc du graph
     */
    private async delete_cell(api_type_id: string) {
        this.$emit('del_api_type_id', api_type_id);
    }

    /**
     * Configure le drop pour chaque api_type_id
     */
    private addDroppableConfig(graph_: Graph): void {
        const droppables = document.querySelectorAll(
            '.droppable_vos .droppable_vos_wrapper .api_type_ids .api_type_id'
        );
        droppables.forEach((droppable) => {
            const api_type_id = droppable.getAttribute('api_type_id');
            const dropFn = this.getDropFunction(api_type_id);
            const dragImage = droppable.cloneNode(true) as Element;
            gestureUtils.makeDraggable(droppable, graph_, dropFn, dragImage);
        });
    }

    /**
     * Génère la fonction de drop pour un api_type_id
     */
    private getDropFunction(api_type_id: string): (graph, evt) => Promise<void> {
        return async (graph, evt) => {
            if (this.graph_mapper.cells[api_type_id]) {
                return;
            }
            graph.stopEditing(false);
            const pt = graph.getPointForEvent(evt);

            if (this.is_cms_config && this.cms_compatible_dashboards.length > 0) {
                const all_graphvoref_by_dashboard_id: { [dashboard_id: number]: DashboardGraphVORefVO } = ObjectHandler.mapByNumberFieldFromArray(
                    await query(DashboardGraphVORefVO.API_TYPE_ID)
                        .filter_by_text_eq(field_names<DashboardGraphVORefVO>().vo_type, api_type_id)
                        .filter_by_num_has(field_names<DashboardGraphVORefVO>().dashboard_id, this.cms_compatible_dashboards.map((e) => e.id))
                        .select_vos<DashboardGraphVORefVO>(),
                    field_names<DashboardGraphVORefVO>().dashboard_id
                );

                for (const dashboard of this.cms_compatible_dashboards) {
                    // Si le graph est déjà présent sur le dashboard, on ne le rajoute pas
                    if (all_graphvoref_by_dashboard_id[dashboard.id]) {
                        continue;
                    }

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
            this.$emit('add_api_type_id', api_type_id);
        };
    }

    private mounted(): void {
        this.throttle_init_or_update_graph();
    }

    private async update_discarded_field_paths(discarded_field_paths: {
        [vo_type: string]: { [field_id: string]: boolean };
    }) {
        this.$emit('update_discarded_field_paths', discarded_field_paths);
    }
}
