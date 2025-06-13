import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import './AddPanel.scss';
import OseliaRunTemplateVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';
import VueComponentBase from '../../../../VueComponentBase';
import OseliaRunVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunVO';

@Component({
    template: require('./AddPanel.pug'),
})
export default class AddPanel extends VueComponentBase {
    @Prop({ default: () => ({}) })
    public items!: Array<OseliaRunTemplateVO | OseliaRunVO> | { [id: string]: OseliaRunTemplateVO | OseliaRunVO };

    @Prop({ default: 'templates' })
    public displayMode!: 'templates' | 'runs';

    @Prop({ type: Function, required: true })
    public changeDisplayModeFn!: (mode: 'templates' | 'runs') => void;

    @Prop({ type: Function, required: true })
    public addItemFn!: (itemId: string) => void;

    @Prop({ default: 'none' })
    public type_of_item_displayed: 'template' | 'run' | 'none';

    public localDisplayMode: 'templates' | 'runs' = 'templates';
    public addSearch: string = '';

    get itemsArray(): Array<OseliaRunTemplateVO | OseliaRunVO> {
        const rawItems = Array.isArray(this.items)
            ? this.items
            : Object.values(this.items);
        if (!this.addSearch) {
            return rawItems;
        }
        const searchLower = this.addSearch.toLowerCase();
        return rawItems.filter((item) =>
            item.name?.toLowerCase().includes(searchLower)
        );
    }

    @Watch('displayMode', { immediate: true })
    private syncDisplayMode() {
        this.localDisplayMode = this.displayMode;
    }

    // Appel direct de la fonction
    public onAddItem(itemId: number) {
        this.addItemFn(String(itemId));
    }
    private mounted() {
        if (this.type_of_item_displayed === 'run') {
            this.localDisplayMode = 'runs';
        }
        this.onModeChange();
    }
    private onModeChange() {
        if (this.changeDisplayModeFn) {
            this.changeDisplayModeFn(this.localDisplayMode);
        }
    }


}
