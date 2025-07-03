import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ModuleTableVO from '../../../../../shared/modules/DAO/vos/ModuleTableVO';
import ModuleDataImport from '../../../../../shared/modules/DataImport/ModuleDataImport';
import SupervisionController from '../../../../../shared/modules/Supervision/SupervisionController';
import './AddPanel.scss';
import ModuleTablesClientController from '../ModuleTablesClientController';

@Component({
    template: require('./AddPanel.pug'),
})
export default class AddPanel extends Vue {

    @Prop({ default: () => ({}) })
    readonly all_tables_by_table_name!: { [table_name: string]: ModuleTableVO };

    @Prop({ default: () => ({}) })
    readonly tables_by_table_name!: { [table_name: string]: ModuleTableVO };

    @Prop()
    readonly dashboard_id: number;

    hideVersioned: boolean = true;
    hideInternalImport: boolean = true;
    hideHistoricSupervision: boolean = true;
    addSearch: string = '';

    get filteredTables(): string[] {
        const res: string[] = [];
        const searchLC = (this.addSearch || '').toLowerCase();
        for (const [tn, tVO] of Object.entries(this.all_tables_by_table_name)) {
            if (this.tables_by_table_name[tn]) continue;
            if (this.hideVersioned && this.isVersionedAuxTable(tn)) continue;
            if (this.hideInternalImport && this.isInternalImportTable(tn)) continue;
            if (this.hideHistoricSupervision && this.isHistoricSupervisionTable(tn)) continue;
            const labelLC = tVO.label?.code_text?.toLowerCase?.() || '';
            if (
                searchLC &&
                !tn.toLowerCase().includes(searchLC) &&
                !labelLC.includes(searchLC)
            ) {
                continue;
            }
            res.push(tn);
        }
        return res.sort();
    }

    private async add_table(tn: string) {
        await ModuleTablesClientController.add_new_default_table(this.dashboard_id, tn);
    }

    private isVersionedAuxTable(tn: string): boolean {
        const vo = this.all_tables_by_table_name[tn];
        if (!vo) return false;
        // if (!vo.is_versioned) return false;
        if (tn.startsWith('versioned__') || tn.startsWith('trashed__')) {
            return true;
        }
        if (tn.startsWith('__versioned__') || tn.startsWith('__trashed__')) {
            return true;
        }
        return false;
    }

    private isHistoricSupervisionTable(tn: string): boolean {
        const vo = this.all_tables_by_table_name[tn];
        if (!vo) return false;
        // if (!vo.is_versioned) return false;
        if (vo.database == SupervisionController.SUP_HIST_SCHEMA) {
            return true;
        }
        return false;
    }

    private isInternalImportTable(tn: string): boolean {
        const vo = this.all_tables_by_table_name[tn];
        if (!vo) return false;
        // if (!vo.is_versioned) return false;
        if (vo.database == ModuleDataImport.IMPORT_SCHEMA) {
            return true;
        }
        return false;
    }
}
