import Component from 'vue-class-component';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import './SaveFavoritesFiltersWidgetOptionsComponent.scss';

@Component({
    template: require('./SaveFavoritesFiltersWidgetOptionsComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class SaveFavoritesFiltersWidgetOptionsComponent extends VueComponentBase {


}