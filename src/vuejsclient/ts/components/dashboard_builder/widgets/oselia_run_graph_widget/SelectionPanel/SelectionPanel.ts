import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { ItemInterface } from '../interface';
import './SelectionPanel.scss';
import OseliaRunTemplateVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';
@Component({
    template: require('./SelectionPanel.pug'),
})
export default class SelectionPanel extends Vue {

    @Prop({ default: () => ({}) })
    public items!: { [id: string]: OseliaRunTemplateVO };

    @Prop({ default: null })
    public selectedItem!: string | null;

    // Nouvelle prop : la fonction pour supprimer un item
    @Prop({ type: Function, required: true })
    public removeItemFn!: (itemId: string) => void;

    // Nouvelle prop : la fonction pour supprimer un item
    @Prop({ type: Function, required: true })
    public editItemFn!: (itemId: string) => void;

    get currentItem(): OseliaRunTemplateVO | null {
        if (!this.selectedItem) {
            return null;
        }
        return this.items[this.selectedItem] || null;
    }
    // On conserve un event pour switchHidden, par exemple
    public onSwitchHidden(itemId: string, linkTo: string, newIsActive: boolean) {
        this.$emit('switchHidden', itemId, linkTo, !newIsActive);
    }

    public onRemoveSelectedItem() {
        if (!this.selectedItem) return;
        // Appel direct de la fonction
        this.removeItemFn(this.selectedItem);
    }

    public onEditSelectItem() {
        if (!this.selectedItem) return;
        this.editItemFn(this.selectedItem);
    }

}
