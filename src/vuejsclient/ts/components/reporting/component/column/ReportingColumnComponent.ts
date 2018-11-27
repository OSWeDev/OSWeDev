import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import VueComponentBase from '../../../VueComponentBase';
import ColumnVO from '../../vos/ColumnVO';
import ModuleTableField from '../../../../../../shared/modules/ModuleTableField';
import ReportingTrendComponent from '../trend/ReportingTrendComponent';
import ColumnDataVO from '../../vos/ColumnDataVO';

@Component({
    template: require('./ReportingColumnComponent.pug'),
    components: {
        trend_widget: ReportingTrendComponent
    }
})
export default class ReportingColumnComponent extends VueComponentBase {

    @Prop({ default: null })
    public columnData: ColumnDataVO;

    public mounted(): void { }

    get classes(): string {
        if (!this.columnData || !this.columnData.column) {
            return null;
        }

        return ColumnVO.GET_CLASSES(this.columnData.column);
    }

    get isAmountSlot(): boolean {
        return this.columnData.type == ReportingTrendComponent.TYPE_AMOUNT;
    }

    get isPercentSlot(): boolean {
        return (this.columnData.type == ReportingTrendComponent.TYPE_PERCENT);
    }

    get isFixedSlot(): boolean {
        return (this.columnData.type == ReportingTrendComponent.TYPE_FIXED);
    }
}