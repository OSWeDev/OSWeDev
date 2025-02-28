import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import './LinkPanel.scss';

@Component({
    template: require('./LinkPanel.pug'),
})
export default class LinkPanel extends Vue {

    @Prop({ default: null })
    readonly selectedLink!: { table: string; field: string, target_table: string } | null;

    @Prop({ default: () => ({}) })
    readonly discarded_field_paths!: { [vo_type: string]: { [field_id: string]: boolean } };

    onSwitchDiscard(table: string, field: string, newIsActive: boolean) {
        const new_discard = !newIsActive;
        this.$emit('switchDiscard', table, field, new_discard);
    }
}
