import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import VueComponentBase from '../../../VueComponentBase';
import ColumnVO from '../../vos/ColumnVO';

@Component({
    template: require('./ReportingTrendComponent.pug'),
    components: {}
})
export default class ReportingTrendComponent extends VueComponentBase {

    public static TYPE_PERCENT: string = 'percent';
    public static TYPE_AMOUNT: string = 'amount';
    public static TYPE_FIXED: string = 'fixed';

    @Prop()
    private column_data: ColumnVO;

    @Prop({ default: 0.1 })
    private positive_min: number;
    @Prop({ default: 0 })
    private medium_min: number;

    private type_percent: string = ReportingTrendComponent.TYPE_PERCENT;
    private type_amount: string = ReportingTrendComponent.TYPE_AMOUNT;
    private type_fixed: string = ReportingTrendComponent.TYPE_FIXED;
}