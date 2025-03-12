import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { ItemInterface } from '../interface';
import './AddPanel.scss';
import OseliaRunTemplateVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';

@Component({
    template: require('./AddPanel.pug'),
})
export default class AddPanel extends Vue {

    @Prop({ default: () => ({}) })
    public items!: { [id: string]: OseliaRunTemplateVO };

    // La fonction d'ajout
    @Prop({ type: Function, required: true })
    public addItemFn!: (itemId: string) => void;

    public addSearch: string = '';

    // On simule un petit "catalogue"
    private allTemplates: OseliaRunTemplateVO[] = [
        // ...
    ];

    get filteredTemplates(): OseliaRunTemplateVO[] {
        return this.allTemplates
            .filter(t => t.name.toLowerCase().includes(this.addSearch.toLowerCase()))
            .filter(t => !this.items[t.id]); // n’affiche pas ceux déjà ajoutés
    }

    public onAddItem(itemId: number) {
        // Appel direct de la fonction
        this.addItemFn(String(itemId));
    }
}
