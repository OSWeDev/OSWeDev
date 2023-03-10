import Component from 'vue-class-component';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import './ShowFavoritesFiltersWidgetOptionsComponent.scss';

@Component({
    template: require('./ShowFavoritesFiltersWidgetOptionsComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class ShowFavoritesFiltersWidgetOptionsComponent extends VueComponentBase {


}