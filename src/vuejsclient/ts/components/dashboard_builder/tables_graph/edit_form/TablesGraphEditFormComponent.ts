import Component from 'vue-class-component';
import { Prop, Vue } from 'vue-property-decorator';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardGraphVORefVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import MaxGraphCellMapper from '../graph_mapper/MaxGraphCellMapper';
import MaxGraphEdgeMapper from '../graph_mapper/MaxGraphEdgeMapper';
import MaxGraphMapper from '../graph_mapper/MaxGraphMapper';
import './TablesGraphEditFormComponent.scss';
import ObjectHandler, { field_names } from '../../../../../../shared/tools/ObjectHandler';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';

@Component({
    template: require('./TablesGraphEditFormComponent.pug'),
    components: {}
})
export default class TablesGraphEditFormComponent extends VueComponentBase {

    @Prop()
    private current_cell_mapper: MaxGraphEdgeMapper | MaxGraphCellMapper;
    @Prop()
    private maxgraph: any;
    @Prop()
    private dashboard: any;
    @Prop()
    private graph_mapper: MaxGraphMapper;
    @Prop()
    private cms_compatible_dashboards: DashboardVO[];


    private consolelog(o): string {
        console.log(this.graph_mapper.cells);
        return '';
    }

    private async switch_edge_acceptance(edge: MaxGraphEdgeMapper) {

        if ((!edge) || (edge._type != 'edge')) {
            return;
        }

        const graphvorefs = [];
        if (this.dashboard.is_cms_compatible && this.cms_compatible_dashboards.length > 0) {
            for (let dashboard of this.cms_compatible_dashboards) {
                graphvorefs.push(...(await query(DashboardGraphVORefVO.API_TYPE_ID).filter_by_num_eq(field_names<DashboardGraphVORefVO>().dashboard_id, dashboard.id).select_vos<DashboardGraphVORefVO>()));
            }
        }

        if (!this.maxgraph) {
            throw new Error('TablesGraphEditFormComponent: maxgraph not set');
        }

        if (!this.dashboard) {
            throw new Error('TablesGraphEditFormComponent: dashboard not set');
        }

        if (!edge.source_cell) {
            throw new Error('TablesGraphEditFormComponent: current_cell_mapper.source_cell not set');
        }

        if (!edge.source_cell.graphvoref) {
            // throw new Error('TablesGraphEditFormComponent: current_cell_mapper.source_cell.graphvoref not set');
            /**
             * Si le graphvoref existe pas on le crée - a priori ça ressemble à un N/N
             */
            if (this.cms_compatible_dashboards && this.cms_compatible_dashboards.length > 0) {
                const all_graphvoref_by_dashboard_id: { [dashboard_id: number]: DashboardGraphVORefVO } = ObjectHandler.mapByNumberFieldFromArray(
                    await query(DashboardGraphVORefVO.API_TYPE_ID)
                        .filter_by_text_eq(field_names<DashboardGraphVORefVO>().vo_type, edge.source_cell.api_type_id)
                        .filter_by_num_has(field_names<DashboardGraphVORefVO>().dashboard_id, this.cms_compatible_dashboards.map((e) => e.id))
                        .select_vos<DashboardGraphVORefVO>(),
                    field_names<DashboardGraphVORefVO>().dashboard_id
                );

                for (let dashboard of this.cms_compatible_dashboards) {
                    // Si le graph est déjà présent sur le dashboard, on ne le rajoute pas
                    if (all_graphvoref_by_dashboard_id[dashboard.id]) {
                        continue;
                    }

                    const graphVoRef = new DashboardGraphVORefVO();
                    graphVoRef.x = 800;
                    graphVoRef.y = 80;
                    graphVoRef.width = MaxGraphMapper.default_width;
                    graphVoRef.height = MaxGraphMapper.default_height;
                    graphVoRef.vo_type = edge.source_cell.api_type_id;
                    graphVoRef.dashboard_id = dashboard.id;
                    await ModuleDAO.getInstance().insertOrUpdateVO(graphVoRef);
                }
            } else {
                const graphVoRef = new DashboardGraphVORefVO();
                graphVoRef.x = 800;
                graphVoRef.y = 80;
                graphVoRef.width = MaxGraphMapper.default_width;
                graphVoRef.height = MaxGraphMapper.default_height;
                graphVoRef.vo_type = edge.source_cell.api_type_id;
                graphVoRef.dashboard_id = this.dashboard.id;
                await ModuleDAO.getInstance().insertOrUpdateVO(graphVoRef);
            }
        }
        if (graphvorefs.length > 0) {
            for (let graphvoref of graphvorefs) {
                if (!graphvoref.values_to_exclude) {
                    graphvoref.values_to_exclude = [];
                }
                if (!graphvoref.values_to_exclude.find((e) => e == edge.field.field_id)) {
                    graphvoref.values_to_exclude.push(edge.field.field_id);
                } else {
                    graphvoref.values_to_exclude = graphvoref.values_to_exclude.filter((e) => e != edge.field.field_id);
                }
                const update_res = await ModuleDAO.getInstance().insertOrUpdateVO(graphvoref);
                if (!update_res || !update_res.id) {
                    ConsoleHandler.error('Impossible de mettre à jour le graphvoref');
                    Vue.prototype.$snotify.error(this.label('TablesGraphEditFormComponent.switch_edge_acceptance.error'));
                    graphvoref = await query(DashboardGraphVORefVO.API_TYPE_ID).filter_by_id(graphvoref.id).select_vo<DashboardGraphVORefVO>();
                }
            }
            this.$emit('remap');
        } else {
            if (!edge.source_cell.graphvoref.values_to_exclude) {
                edge.source_cell.graphvoref.values_to_exclude = [];
            }
            if (!edge.source_cell.graphvoref.values_to_exclude.find((e) => e == edge.field.field_id)) {
                edge.source_cell.graphvoref.values_to_exclude.push(edge.field.field_id);
            } else {
                edge.source_cell.graphvoref.values_to_exclude = edge.source_cell.graphvoref.values_to_exclude.filter((e) => e != edge.field.field_id);
            }
            const update_res = await ModuleDAO.getInstance().insertOrUpdateVO(edge.source_cell.graphvoref);
            if (!update_res || !update_res.id) {
                ConsoleHandler.error('Impossible de mettre à jour le graphvoref');
                Vue.prototype.$snotify.error(this.label('TablesGraphEditFormComponent.switch_edge_acceptance.error'));
                edge.source_cell.graphvoref = await query(DashboardGraphVORefVO.API_TYPE_ID).filter_by_id(edge.source_cell.graphvoref.id).select_vo<DashboardGraphVORefVO>();
            }
            this.$emit('remap');
        }
        const discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = {};

        const edges = await query(DashboardGraphVORefVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<DashboardGraphVORefVO>().dashboard_id, this.dashboard.id)
            .select_vos<DashboardGraphVORefVO>();

        for (const i in edges) {
            const vo_type = edges[i].vo_type;
            const db_cell_source = edges[i];

            if (!db_cell_source.values_to_exclude) {
                continue;
            }

            for (const key in db_cell_source.values_to_exclude) {
                const field_id: string = db_cell_source.values_to_exclude[key];

                if (!discarded_field_paths[vo_type]) {
                    discarded_field_paths[vo_type] = {};
                }

                discarded_field_paths[vo_type][field_id] = true;
            }
        }
        this.$emit('update_discarded_field_paths', edges);
    }

    private async confirm_delete_cell() {

        const self = this;

        const cell_to_delete = this.current_cell_mapper as MaxGraphCellMapper;
        let cms_dashboard_to_delete: DashboardGraphVORefVO[] = [];
        const dashboard = await query(DashboardVO.API_TYPE_ID).filter_by_id(cell_to_delete.graphvoref.dashboard_id, DashboardVO.API_TYPE_ID).select_vo<DashboardVO>();
        if (dashboard && dashboard.is_cms_compatible) {
            for (let dashboard of this.cms_compatible_dashboards) {
                const results = await query(DashboardGraphVORefVO.API_TYPE_ID).filter_by_num_eq(field_names<DashboardGraphVORefVO>().dashboard_id, dashboard.id).filter_by_text_eq(field_names<DashboardGraphVORefVO>().vo_type, cell_to_delete.graphvoref.vo_type).select_vos<DashboardGraphVORefVO>();
                cms_dashboard_to_delete.push(...results);
            }
        }
        if ((!cell_to_delete) || (cell_to_delete._type != 'cell')) {
            return;
        }

        if (!this.maxgraph) {
            throw new Error('TablesGraphEditFormComponent: maxgraph not set');
        }

        if (!this.dashboard) {
            throw new Error('TablesGraphEditFormComponent: dashboard not set');
        }

        if (!cell_to_delete.graphvoref) {
            throw new Error('TablesGraphEditFormComponent: current_cell_mapper.source_cell.graphvoref not set');
        }

        // On demande confirmation avant toute chose.
        // si on valide, on lance la suppression
        self.snotify.confirm(self.label('TablesGraphEditFormComponent.confirm_delete_cell.body'), self.label('TablesGraphEditFormComponent.confirm_delete_cell.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
                        self.snotify.info(self.label('TablesGraphEditFormComponent.confirm_delete_cell.start'));
                        if (cms_dashboard_to_delete.length > 0) {
                            await ModuleDAO.getInstance().deleteVOs(cms_dashboard_to_delete);
                        }
                        this.$emit('delete_cell', cell_to_delete.api_type_id);
                        this.$emit('remap');

                        self.snotify.success(self.label('TablesGraphEditFormComponent.confirm_delete_cell.ok'));
                    },
                    bold: false
                },
                {
                    text: self.t('NO'),
                    action: (toast) => {
                        self.$snotify.remove(toast.id);
                    }
                }
            ]
        });
    }
}