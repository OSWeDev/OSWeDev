import CardVO from '../vos/CardVO';
import { Prop, Component, Vue } from 'vue-property-decorator';
import ReportingCardComponent from './card/ReportingCardComponent';
import FilterVO from '../vos/FilterVO';
import 'vue-tables-2';
import ReportingComponentBase from '../_base/ReportingComponentBase';
import ColumnVO from '../vos/ColumnVO';
import ReportingFilterComponent from './filter/ReportingFilterComponent';
import ReportingColumnComponent from './column/ReportingColumnComponent';
import moment = require('moment');
import GroupColumnDataVO from '../vos/GroupColumnDataVO';

@Component({
    template: require('./ReportingComponent.pug'),
    components: {
        card_widget: ReportingCardComponent,
        filter_widget: ReportingFilterComponent,
        column_widget: ReportingColumnComponent
    }
})
export default class ReportingComponent extends ReportingComponentBase {
    @Prop({ default: null })
    public cards: CardVO[];

    @Prop({ default: null })
    public card_title: string;

    @Prop({ default: null })
    public default_selected_card: CardVO;

    @Prop({ default: null })
    public filters: FilterVO[];

    @Prop({ default: null })
    public filter_title: string;

    @Prop({ default: null })
    public default_filter_date_active_option: string;

    @Prop({ default: null })
    public default_filter_datevs_active_option: string;

    @Prop({ default: () => { } })
    public filtered_rows: () => any[];

    @Prop({ default: null })
    public vue_tables_options_default: any;

    private selected_card: CardVO = null;
    private filter_date_active_option: string = null;
    private filter_datevs_active_option: string = null;

    private mounted() {
        this.selected_card = (this.default_selected_card) ? this.default_selected_card : null;
        this.filter_date_active_option = (this.default_filter_date_active_option) ? this.default_filter_date_active_option : null;
        this.filter_datevs_active_option = (this.default_filter_datevs_active_option) ? this.default_filter_datevs_active_option : null;
    }

    private select_card(card: CardVO): void {
        this.selected_card = card;
    }

    private empty_filters(): void {
        if (this.$children.length > 0) {
            for (let i in this.$children) {
                this.$children[i].$emit('deselect_all');
            }
        }
    }

    get selected_card_columns(): string[] {
        let columns: string[] = [];

        if (this.selected_card && this.selected_card.columnsHeader) {
            for (let i in this.selected_card.columnsHeader) {
                let column: ColumnVO = this.selected_card.columnsHeader[i];

                columns.push(column.name);
            }
        }

        return columns;
    }

    get selected_card_rowsColumnsDatas(): GroupColumnDataVO[] {
        if (this.select_card && this.selected_card.rowsColumnsDatas) {
            return this.selected_card.rowsColumnsDatas[this.filter_date_active_option];
        }

        return null;
    }

    get vue_tables_options(): any {
        let options: any = {};

        if (this.vue_tables_options_default) {
            options = this.vue_tables_options_default;
        }

        if (this.cards) {
            let columnsClasses: any = {};
            for (let i in this.cards) {
                let card: CardVO = this.cards[i];

                if (card.columnsHeader) {
                    for (let j in card.columnsHeader) {
                        let column: ColumnVO = card.columnsHeader[j];

                        if (!columnsClasses[column.name]) {
                            columnsClasses[column.name] = ColumnVO.GET_CLASSES(column);
                        }
                    }
                }
            }
            options.columnsClasses = columnsClasses;
        }

        return options;
    }
}