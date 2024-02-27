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


    private consolelog(o): string {
        console.log(this.graph_mapper.cells);
        return '';
    }

    private async switch_edge_acceptance(edge: MaxGraphEdgeMapper) {

        if ((!edge) || (edge._type != 'edge')) {
            return;
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
            const graphVoRef = new DashboardGraphVORefVO();

            graphVoRef.x = 800;
            graphVoRef.y = 80;
            graphVoRef.width = MaxGraphMapper.default_width;
            graphVoRef.height = MaxGraphMapper.default_height;
            graphVoRef.vo_type = edge.source_cell.api_type_id;
            graphVoRef.dashboard_id = this.dashboard.id;
            await ModuleDAO.getInstance().insertOrUpdateVO(graphVoRef);
        }

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

        const discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = {};

        const edges = await query(DashboardGraphVORefVO.API_TYPE_ID)
            .filter_by_num_eq('dashboard_id', this.dashboard.id)
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

                        await ModuleDAO.getInstance().deleteVOs([cell_to_delete.graphvoref]);
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