import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import CanvasDiagram from './CanvasDiagram/CanvasDiagram';
import SelectionPanel from './SelectionPanel/SelectionPanel';
import LinkPanel from './LinkPanel/LinkPanel';
import AddPanel from './AddPanel/AddPanel';
import './ModuleTablesComponent.scss';

import ModuleTableFieldVO from '../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../../../shared/modules/DAO/vos/ModuleTableVO';

@Component({
    components: {
        CanvasDiagram,
        SelectionPanel,
        LinkPanel,
        AddPanel
    },
    template: require('./ModuleTablesComponent.pug'),
})
export default class ModuleTablesComponent extends Vue {

    @Prop({ default: () => ({}) })
    readonly fields_by_table_name_and_field_name!: { [table_name: string]: { [field_name: string]: ModuleTableFieldVO } };

    @Prop({ default: () => ({}) })
    readonly tables_by_table_name!: { [table_name: string]: ModuleTableVO };

    @Prop({ default: () => ({}) })
    readonly discarded_field_paths!: { [vo_type: string]: { [field_id: string]: boolean } };

    @Prop({ default: () => ({}) })
    readonly all_tables_by_table_name!: { [table_name: string]: ModuleTableVO };

    selectedTable: string | null = null;
    selectedLink: { table: string; field: string } | null = null;
    showAddPanel: boolean = false;

    get showPlusButton(): boolean {
        return Object.keys(this.all_tables_by_table_name).some(tn => !this.tables_by_table_name[tn]);
    }

    onRemoveSelectedTable(tableName: string) {
        this.$emit('removeTable', tableName);
        if (this.selectedTable === tableName) {
            this.selectedTable = null;
        }
    }

    onSwitchDiscard(table: string, field: string, discard: boolean) {
        this.$emit('setDiscardedField', table, field, discard);
    }

    onAddTable(tableName: string) {
        this.$emit('addTable', tableName);
        // this.showAddPanel = false;
    }

    select_table(tableName: string) {
        this.selectedTable = tableName;
    }

    select_link(link: { table: string; field: string }) {
        this.selectedLink = link;
    }
}
