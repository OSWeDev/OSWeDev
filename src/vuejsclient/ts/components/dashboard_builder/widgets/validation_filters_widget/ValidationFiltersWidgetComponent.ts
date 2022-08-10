import Component from 'vue-class-component';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../VueComponentBase';
import TablePaginationComponent from '../table_widget/pagination/TablePaginationComponent';
import './ValidationFiltersWidgetComponent.scss';

@Component({
    template: require('./ValidationFiltersWidgetComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Tablepaginationcomponent: TablePaginationComponent,
    }
})
export default class ValidationFiltersWidgetComponent extends VueComponentBase {


}