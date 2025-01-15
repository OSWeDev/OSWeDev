import Component from 'vue-class-component';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../VueComponentBase';
import './BlockViewerWidgetComponent.scss';

@Component({
    template: require('./BlockViewerWidgetComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class BlockViewerWidgetComponent extends VueComponentBase {
    private static instance = null;

    public static getInstance(): BlockViewerWidgetComponent {
        if (!this.instance) {
            this.instance = new BlockViewerWidgetComponent();
        }

        return this.instance;
    }
}