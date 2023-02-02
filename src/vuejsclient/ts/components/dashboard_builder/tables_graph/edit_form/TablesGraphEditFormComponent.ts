import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import VueAppBase from '../../../../../VueAppBase';
import VueComponentBase from '../../../VueComponentBase';
import './TablesGraphEditFormComponent.scss';

@Component({
    template: require('./TablesGraphEditFormComponent.pug'),
    components: {}
})
export default class TablesGraphEditFormComponent extends VueComponentBase {
    //TODO Doit fonctionner avec la l'interrupteur de selection + et également lorsqu'on selectionne.
    //TODO Compléxité , réactivité.
    @Prop()
    private cellData: any;

    @Prop()
    private toggle: boolean;
    @Prop()
    private toggles: { [edge_id: number]: boolean };

    @Prop()
    private all_cells; //All cells of the graph { [cellule: string]: typeof mxCell }

    private toggle_output: boolean = true;
    private all_edges = []; //All edges of the graph { [edge_id: string]: typeof mxCell }

    @Watch('all_cells', { immediate: true })
    private onchange_all_cells() {
        this.all_edges = [];
        if (Object.keys(this.all_cells).length > 0) {
            for (let cell of Object.keys(this.all_cells)) {
                for (let edge of this.all_cells[cell].edges) {
                    if (edge.source.id == this.all_cells[cell].id) {
                        this.all_edges.push(edge);
                    } //Si c'est bien la cellule source
                }
            }
        }

    }

    @Watch('toggles', { immediate: true })
    private onchange_toggles() {
        return;
    }

    get cell_name(): string {
        if ((!this.cellData) || (!this.cellData.value)) {
            return null;
        }

        if (!VOsTypesManager.moduleTables_by_voType[this.cellData.value.tables_graph_vo_type]) {
            return null;
        }

        return VueAppBase.getInstance().vueInstance.t(VOsTypesManager.moduleTables_by_voType[this.cellData.value.tables_graph_vo_type].label.code_text);
    }

    get all_cells_names(): string[] {
        let res = Object.keys(this.all_cells);
        if (res.length > 0) {
            return res;
        } else {
            return null;
        }

    }

    get all_edges_ids(): string[] {
        let res = Object.keys(this.all_edges);
        if (res.length > 0) {
            return res;
        } else {
            return null;
        }
    }

    private delete_cell() {
        this.$emit('delete_cell', this.cellData);
    }
    private async confirm_delete_cell() {

        let self = this;

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

                        await self.delete_cell();
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
    private async confirm_delete_arrow(edge?) {
        if (edge) {
            if (!this.toggles[edge.id]) {
                this.$emit('toggle_check', true, edge);
            } else {
                this.$emit('toggle_check', false, edge);
            }
        }
        if (!this.toggle) {
            this.$emit('toggle_check', true);
        } else {
            this.$emit('toggle_check', false);
        }
    }
}