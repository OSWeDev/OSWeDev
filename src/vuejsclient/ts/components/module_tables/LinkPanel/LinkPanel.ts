import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import './LinkPanel.scss';
import ModuleTablesClientController from '../ModuleTablesClientController';

@Component({
    template: require('./LinkPanel.pug'),
})
export default class LinkPanel extends Vue {

    @Prop({ default: null })
    readonly selectedLink!: { table: string; field: string, target_table: string } | null;

    @Prop({ default: () => ({}) })
    readonly discarded_field_paths!: { [vo_type: string]: { [field_id: string]: boolean } };

    @Prop()
    readonly dashboard_id: number;

    switch_discarded_field(table: string, field: string) {
        ModuleTablesClientController.switch_discarded_field(this.dashboard_id, table, field);
    }
}
