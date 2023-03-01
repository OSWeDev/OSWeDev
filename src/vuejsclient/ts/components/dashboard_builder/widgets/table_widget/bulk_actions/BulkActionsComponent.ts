import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import VueComponentBase from "../../../../VueComponentBase";
import BulkActionVO from '../../../../../../../shared/modules/DashboardBuilder/vos/BulkActionVO';

@Component({
    template: require('./TablePaginationComponent.pug'),
    components: {
    }
})
export default class TablePaginationComponent extends VueComponentBase {

    @Prop({ default: null })
    private bulk_action: BulkActionVO;
}