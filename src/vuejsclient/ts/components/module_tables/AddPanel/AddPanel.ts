import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ModuleTableVO from '../../../../../shared/modules/DAO/vos/ModuleTableVO';
import './AddPanel.scss';

@Component({
    template: require('./AddPanel.pug'),
})
export default class AddPanel extends Vue {

    @Prop({ default: () => ({}) })
    readonly all_tables_by_table_name!: { [table_name: string]: ModuleTableVO };

    @Prop({ default: () => ({}) })
    readonly tables_by_table_name!: { [table_name: string]: ModuleTableVO };

    hideVersioned: boolean = true;
    addSearch: string = '';

    get filteredTables(): string[] {
        const res: string[] = [];
        const searchLC = (this.addSearch || '').toLowerCase();
        for (const [tn, tVO] of Object.entries(this.all_tables_by_table_name)) {
            if (this.tables_by_table_name[tn]) continue;
            if (this.hideVersioned && this.isVersionedAuxTable(tn)) continue;
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

    onAddTable(tn: string) {
        this.$emit('addTable', tn);
    }

    private isVersionedAuxTable(tn: string): boolean {
        const vo = this.all_tables_by_table_name[tn];
        if (!vo) return false;
        if (!vo.is_versioned) return false;
        if (tn.startsWith('versioned__') || tn.startsWith('trashed__')) {
            return true;
        }
        return false;
    }
}
