import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import VueComponentBase from '../../../VueComponentBase';
import ColumnVO from '../../vos/ColumnVO';
import ColumnDataVO from '../../vos/ColumnDataVO';

@Component({
    template: require('./ReportingTrendComponent.pug'),
    components: {}
})
export default class ReportingTrendComponent extends VueComponentBase {

    @Prop()
    private column_data: ColumnDataVO;

    @Prop({ default: 0.1 })
    private positive_min: number;
    @Prop({ default: 0 })
    private medium_min: number;

    private type_percent: string = ColumnVO.TYPE_PERCENT;
    private type_amount: string = ColumnVO.TYPE_AMOUNT;
    private type_fixed: string = ColumnVO.TYPE_FIXED;

    get column(): ColumnVO {
        return (this.column_data && this.column_data.column) ? this.column_data.column : null;
    }
}