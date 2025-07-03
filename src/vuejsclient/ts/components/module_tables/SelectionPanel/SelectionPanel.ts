import ModuleTableVO from '../../../../../shared/modules/DAO/vos/ModuleTableVO';
import ModuleTableFieldVO from '../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import './SelectionPanel.scss';
import ModuleTablesClientController from '../ModuleTablesClientController';

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

    @Prop()
    readonly dashboard_id: number;

    get has_foreignKeyFieldsFROMSelectedTable(): boolean {
        return Object.keys(this.foreignKeyFieldsFROMSelectedTable).length > 0;
    }

    get foreignKeyFieldsFROMSelectedTable(): { [fName: string]: ModuleTableFieldVO } {
        if (!this.selectedTable) return {};
        const all = this.fields_by_table_name_and_field_name[this.selectedTable] || {};
        const res: { [fName: string]: ModuleTableFieldVO } = {};

        for (const [fname, field] of Object.entries(all)) {

            if ((field.field_type !== ModuleTableFieldVO.FIELD_TYPE_foreign_key) && (field.field_type !== ModuleTableFieldVO.FIELD_TYPE_refrange_array)) {
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

    get foreignKeyFieldsTOSelectedTable(): { [target_table_fName: string]: ModuleTableFieldVO } {
        if (!this.selectedTable) return {};
        const res: { [target_table_fName: string]: ModuleTableFieldVO } = {};

        for (const foreign_table_name in this.tables_by_table_name) {
            const fields = this.fields_by_table_name_and_field_name[foreign_table_name];
            for (const [fname, field] of Object.entries(fields)) {
                if ((field.field_type !== ModuleTableFieldVO.FIELD_TYPE_foreign_key) && (field.field_type !== ModuleTableFieldVO.FIELD_TYPE_refrange_array)) {
                    continue;
                }
                if (field.foreign_ref_vo_type != this.selectedTable) {
                    continue;
                }
                if (field.module_table_vo_type == this.selectedTable) {
                    continue;
                }
                res[field.module_table_vo_type + '.' + fname] = field;
            }
        }
        return res;
    }

    onRemoveSelectedTable() {
        if (!this.selectedTable) return;
        this.$emit('removeTable', this.selectedTable);
    }

    switch_discarded_field(table: string, field: string) {
        ModuleTablesClientController.switch_discarded_field(this.dashboard_id, table, field);
    }
}
