import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import VueComponentBase from '../../../VueComponentBase';
import FilterVO from '../../vos/FilterVO';
import DataFilterOption from '../../../../../../shared/modules/DataRender/vos/DataFilterOption';

@Component({
    template: require('./ReportingFilterComponent.pug'),
    components: {}
})
export default class ReportingFilterComponent extends VueComponentBase {

    @Prop({ default: null })
    public filter: FilterVO;

    public filters_values: DataFilterOption[] = [];

    private filter_state_selected: number = DataFilterOption.STATE_SELECTED;
    private filter_state_selectable: number = DataFilterOption.STATE_SELECTABLE;
    private filter_state_unselectable: number = DataFilterOption.STATE_UNSELECTABLE;

    public mounted(): void { }

    public deselect_all(): void {
        this.filters_values = [];
    }

    private select_all(): void {
        this.deselect_all();
        this.filters_values = this.filter.options;
    }
}