import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import './AddPanel.scss';
import OseliaRunTemplateVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';
import VueComponentBase from '../../../../VueComponentBase';

@Component({
    template: require('./AddPanel.pug'),
})
export default class AddPanel extends VueComponentBase {

    @Prop({ default: () => ({}) })
    public items!: { [id: string]: OseliaRunTemplateVO };

    // La fonction d'ajout
    @Prop({ type: Function, required: true })
    public addItemFn!: (itemId: string) => void;

    public addSearch: string = '';

    public onAddItem(itemId: number) {
        // Appel direct de la fonction
        this.addItemFn(String(itemId));
    }
}
