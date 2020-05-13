import { Component, Prop } from 'vue-property-decorator';
import VueComponentBase from '../../../VueComponentBase';
import ColumnDataVO from '../../vos/ColumnDataVO';
import ColumnVO from '../../vos/ColumnVO';
import ReportingTrendComponent from '../trend/ReportingTrendComponent';

@Component({
    template: require('./ReportingColumnComponent.pug'),
    components: {
        trend_widget: ReportingTrendComponent
    }
})
export default class ReportingColumnComponent extends VueComponentBase {

    @Prop({ default: null })
    public columndata: ColumnDataVO;

    public mounted(): void { }

    get isAmountSlot(): boolean {
        if (!this.column) {
            return false;
        }

        return this.column.type == ColumnVO.TYPE_AMOUNT;
    }

    get isPercentSlot(): boolean {
        if (!this.column) {
            return false;
        }

        return (this.column.type == ColumnVO.TYPE_PERCENT);
    }

    get isFixedSlot(): boolean {
        if (!this.column) {
            return false;
        }

        return (this.column.type == ColumnVO.TYPE_FIXED);
    }

    get column(): ColumnVO {
        return (this.columnData && this.columnData.column) ? this.columnData.column : null;
    }
}