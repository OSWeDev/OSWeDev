import Component from 'vue-class-component';
import { PhotoCollageWrapper } from "vue-photo-collage";
import { Prop } from 'vue-property-decorator';
import VueComponentBase from '../../../../../VueComponentBase';
import './TableWidgetKanbanCardFooterLinksComponent.scss';

@Component({
    template: require('./TableWidgetKanbanCardFooterLinksComponent.pug'),
    components: {
        Photocollagewrapper: PhotoCollageWrapper
    }
})
export default class TableWidgetKanbanCardFooterLinksComponent extends VueComponentBase {

    @Prop({ default: null })
    private links: string[];

    @Prop({ default: null })
    private titles: string[];

    private async link_click(item_id: string, event) {
        if (!this.links) {
            return;
        }

        if (event) {
            event.stopPropagation();
        }

        window.open(window.location.origin + '/' + this.links[item_id], '_blank');
    }
}