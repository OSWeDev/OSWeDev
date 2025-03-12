import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import './LinkPanel.scss';
@Component({
    template: require('./LinkPanel.pug'),
})
export default class LinkPanel extends Vue {

    @Prop({ default: null })
    public selectedLink!: { from: string; to: string } | null;

    @Prop({ default: () => ({}) })
    public hidden_links!: { [id: string]: { [id: string]: boolean } };

    get isHidden(): boolean {
        if (!this.selectedLink) return false;
        const { from, to } = this.selectedLink;
        return this.hidden_links[from]?.[to] ?? false;
    }

    // Méthode pour activer/désactiver le lien
    public onSwitchHidden() {
        if (!this.selectedLink) return;
        const { from, to } = this.selectedLink;

        const currentlyHidden = this.hidden_links[from]?.[to] || false;
        // On émet un event vers le parent
        this.$emit('switchHidden', from, to, !currentlyHidden);
    }
}
