import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ModuleTableFieldVO from '../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../../../../shared/modules/DAO/vos/ModuleTableVO';
import './SelectionPanel.scss';

@Component({
    template: require('./SelectionPanel.pug'),
})
export default class SelectionPanel extends Vue {

    @Prop({ default: () => ({}) })
    readonly tables_by_table_name!: { [table_name: string]: ModuleTableVO };

    @Prop({ default: null })
    readonly selectedTable!: string | null;

    @Prop({ default: () => ({}) })
    readonly fields_by_table_name_and_field_name!: { [tableName: string]: { [fieldName: string]: ModuleTableFieldVO } };

    @Prop({ default: () => ({}) })
    readonly discarded_field_paths!: { [vo_type: string]: { [field_id: string]: boolean } };

    get has_foreignKeyFieldsFROMSelectedTable(): boolean {
        return Object.keys(this.foreignKeyFieldsFROMSelectedTable).length > 0;
    }

    get foreignKeyFieldsFROMSelectedTable(): { [fName: string]: ModuleTableFieldVO } {
        if (!this.selectedTable) return {};
        const all = this.fields_by_table_name_and_field_name[this.selectedTable] || {};
        const res: { [fName: string]: ModuleTableFieldVO } = {};

        for (const [fname, field] of Object.entries(all)) {

            if (field.field_type !== ModuleTableFieldVO.FIELD_TYPE_foreign_key) {
                continue;
            }

            // Si le champs pointe vers une table qui n'est pas dans les tables affichées, on ne l'affiche pas
            if (!this.tables_by_table_name[field.foreign_ref_vo_type]) {
                continue;
            }

            // Si le champs pointe sur la table elle-même, on ne l'affiche pas
            if (field.foreign_ref_vo_type == this.selectedTable) {
                continue;
            }

            res[fname] = field;
        }
        return res;
    }

    get has_foreignKeyFieldsTOSelectedTable(): boolean {
        return Object.keys(this.foreignKeyFieldsTOSelectedTable).length > 0;
    }

    get foreignKeyFieldsTOSelectedTable(): { [fName: string]: ModuleTableFieldVO } {
        if (!this.selectedTable) return {};
        const res: { [fName: string]: ModuleTableFieldVO } = {};

        for (const foreign_table_name in this.tables_by_table_name) {
            const fields = this.fields_by_table_name_and_field_name[foreign_table_name];
            for (const [fname, field] of Object.entries(fields)) {
                if (field.field_type !== ModuleTableFieldVO.FIELD_TYPE_foreign_key) {
                    continue;
                }
                if (field.foreign_ref_vo_type != this.selectedTable) {
                    continue;
                }
                if (field.module_table_vo_type == this.selectedTable) {
                    continue;
                }
                res[fname] = field;
            }
        }
        return res;
    }

    onRemoveSelectedTable() {
        if (!this.selectedTable) return;
        this.$emit('removeTable', this.selectedTable);
    }

    onSwitchDiscard(table: string, field: string, newIsActive: boolean) {
        const new_discard = !newIsActive;
        this.$emit('switchDiscard', table, field, new_discard);
    }
}
