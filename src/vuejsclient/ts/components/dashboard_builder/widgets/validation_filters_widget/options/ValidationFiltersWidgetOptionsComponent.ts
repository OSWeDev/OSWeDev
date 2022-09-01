import Component from 'vue-class-component';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import './ValidationFiltersWidgetOptionsComponent.scss';

@Component({
    template: require('./ValidationFiltersWidgetOptionsComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class ValidationFiltersWidgetOptionsComponent extends VueComponentBase {


}