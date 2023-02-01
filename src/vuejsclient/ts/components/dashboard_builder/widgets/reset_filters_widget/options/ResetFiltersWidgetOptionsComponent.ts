import Component from 'vue-class-component';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import './ResetFiltersWidgetOptionsComponent.scss';

@Component({
    template: require('./ResetFiltersWidgetOptionsComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class ResetFiltersWidgetOptionsComponent extends VueComponentBase {


}