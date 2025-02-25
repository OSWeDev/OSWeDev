import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import './LinkPanel.scss';

@Component({
    template: require('./LinkPanel.pug'),
})
export default class LinkPanel extends Vue {

    @Prop({ default: null })
    readonly selectedLink!: { table: string; field: string } | null;

    onDiscardLink() {
        if (!this.selectedLink) return;
        this.$emit('switchDiscard', this.selectedLink.table, this.selectedLink.field, true);
    }
}
