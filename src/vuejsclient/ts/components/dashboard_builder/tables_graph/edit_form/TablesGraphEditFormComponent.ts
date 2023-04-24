import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import VOsTypesManager from '../../../../../../shared/modules/VO/manager/VOsTypesManager';
import VueAppBase from '../../../../../VueAppBase';
import VueComponentBase from '../../../VueComponentBase';
import './TablesGraphEditFormComponent.scss';

@Component({
    template: require('./TablesGraphEditFormComponent.pug'),
    components: {}
})
export default class TablesGraphEditFormComponent extends VueComponentBase {
    //TODO Doit fonctionner avec  l'interrupteur de selection.
    //TODO Compléxité , réactivité parfois initgraph ne se lance pas complétement.
    @Prop()
    private cellData: any;

    @Prop()
    private toggle: boolean;
    @Prop()
    private toggles: { [vo_type: number]: string[] }; //vo_type cellule source -> liste des field_id des flèches

    @Prop()
    private all_cells; //All cells of the graph { [cellule: string]: typeof mxCell }

    private all_edges = {}; //All edges of the graph { [edge_id: string]: typeof mxCell }
    @Watch('all_cells', { immediate: true })
    private onchange_all_cells() {
        this.all_edges = {};
        if (Object.keys(this.all_cells).length > 0) {
            for (let cell of Object.keys(this.all_cells)) {
                this.all_edges[cell] = [];
                if (this.all_cells[cell].edges) {
                    for (let edge of this.all_cells[cell].edges) {
                        if (edge.source.id == this.all_cells[cell].id) {
                            this.all_edges[cell].push(edge);
                        } //Si c'est bien la cellule source
                    }
                }
            }
        }

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

        if (Object.keys(this.all_cells).length > 0) {
            let all_edges = this.all_edges;
            let all_cells = this.all_cells;
            let keys = Object.keys(this.all_cells);
            let res = keys.reduce(function (filtered, key) {
                if (all_edges[key].length > 0) { //On affiche les interrupteurs des cellules sources uniquement
                    filtered[key] = all_cells[key];
                }
                return filtered;
            }, {});
            return Object.keys(res);
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
    private async confirm_delete_arrow(edge) {

        if (!this.toggles[edge.source.value.tables_graph_vo_type].includes(edge.field_id)) {
            this.$emit('toggle_check', true, edge);
        } else {
            this.$emit('toggle_check', false, edge);
        }



    }

    private async confirm_delete_arrow_selected() {
        if (!this.toggle) {
            this.$emit('toggle_check', true); //Obligé d'envoyer un string car parfois toggle_check est appelé avec null en arg...;
        } else {
            this.$emit('toggle_check', false);
        }
    }
}