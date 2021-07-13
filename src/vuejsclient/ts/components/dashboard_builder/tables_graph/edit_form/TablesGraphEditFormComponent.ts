import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import VueAppBase from '../../../../../VueAppBase';
import VueComponentBase from '../../../VueComponentBase';
import './TablesGraphEditFormComponent.scss';

@Component({
    template: require('./TablesGraphEditFormComponent.pug'),
    components: {}
})
export default class TablesGraphEditFormComponent extends VueComponentBase {

    @Prop()
    private cellData: any;

    get cell_name(): string {
        if ((!this.cellData) || (!this.cellData.value)) {
            return null;
        }

        if (!VOsTypesManager.getInstance().moduleTables_by_voType[this.cellData.value.tables_graph_vo_type]) {
            return null;
        }

        return VueAppBase.getInstance().vueInstance.t(VOsTypesManager.getInstance().moduleTables_by_voType[this.cellData.value.tables_graph_vo_type].label.code_text);
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
}