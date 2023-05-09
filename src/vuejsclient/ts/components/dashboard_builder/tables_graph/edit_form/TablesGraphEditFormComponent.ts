import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardGraphVORefVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO';
import VueComponentBase from '../../../VueComponentBase';
import GraphCellMapper from '../graph_mapper/GraphCellMapper';
import GraphEdgeMapper from '../graph_mapper/GraphEdgeMapper';
import GraphMapper from '../graph_mapper/GraphMapper';
import './TablesGraphEditFormComponent.scss';

@Component({
    template: require('./TablesGraphEditFormComponent.pug'),
    components: {}
})
export default class TablesGraphEditFormComponent extends VueComponentBase {

    @Prop()
    private current_cell_mapper: GraphEdgeMapper | GraphCellMapper;
    @Prop()
    private maxgraph: any;
    @Prop()
    private dashboard: any;
    @Prop()
    private graph_mapper: GraphMapper;


    private async switch_edge_acceptance(edge: GraphEdgeMapper) {

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
            let graphVoRef = new DashboardGraphVORefVO();

            graphVoRef.x = 800;
            graphVoRef.y = 80;
            graphVoRef.width = GraphMapper.default_width;
            graphVoRef.height = GraphMapper.default_height;
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
        await ModuleDAO.getInstance().insertOrUpdateVO(edge.source_cell.graphvoref);
        this.$emit('remap');
    }

    private async confirm_delete_cell() {

        let self = this;

        let edge = this.current_cell_mapper as GraphEdgeMapper;

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

                        await ModuleDAO.getInstance().deleteVOs([edge.source_cell.graphvoref]);
                        this.$emit('remap');
                        this.$emit('delete_cell', edge.source_cell.api_type_id);

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