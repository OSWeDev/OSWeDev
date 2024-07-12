import { Component, Prop, Watch } from 'vue-property-decorator';
import 'vue-tables-2';
import CardVO from '../vos/CardVO';
import ColumnDataVO from '../vos/ColumnDataVO';
import ColumnVO from '../vos/ColumnVO';
import CustomFilterVueTable from '../vos/CustomFilterVueTable';
import GroupColumnDataVO from '../vos/GroupColumnDataVO';
import ReportingComponentBase from '../_base/ReportingComponentBase';
import ReportingCardComponent from './card/ReportingCardComponent';
import ReportingColumnComponent from './column/ReportingColumnComponent';
import './ReportingComponent.scss';

@Component({
    template: require('./ReportingComponent.pug'),
    components: {
        card_widget: ReportingCardComponent,
        column_widget: ReportingColumnComponent,
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
    public filters: CustomFilterVueTable[];

    @Prop({ default: null })
    public default_filter_date_active_option: string;

    @Prop({ default: null })
    public default_filter_datevs_active_option: string;

    @Prop({ default: {} })
    public vue_tables_options_default: any;

    private selected_card: CardVO = null;
    private filter_title: string = 'client.reporting.filtres';
    private filter_date_active_option: string = null;
    private filter_datevs_active_option: string = null;

    @Watch('filter_date_active_option')
    @Watch('filter_datevs_active_option')
    private on_change_filter_date_active_option(): void {
        this.$emit('change_filter_date', this.filter_date_active_option, this.filter_datevs_active_option);
    }

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
            for (const i in this.$children) {
                if (this.$children[i]['deselect_all']) {
                    this.$children[i]['deselect_all']();
                }
            }
        }
    }

    private getColumnByProps(props: { row: {}, column: string, index: number }): ColumnDataVO {
        if (!this.selected_card_rowsColumnsDatas || !this.selected_card_columns) {
            return null;
        }

        const columnIdentifierName: string = this.selected_card_columns[0];

        const row: GroupColumnDataVO = this.selected_card_rowsColumnsDatas.find((el) => {
            const columnIdentifier: ColumnDataVO = el.columns.find((c) => c.column.name == columnIdentifierName);

            if (columnIdentifier && columnIdentifier.value == props.row[columnIdentifierName]) {
                return true;
            }

            return false;
        });

        if (!row || !row.columns) {
            return null;
        }

        return row.columns.find((c) => c.column.name == props.column);
    }

    private getClassesColumn(column: ColumnVO): string {
        return ColumnVO.GET_CLASSES(column);
    }

    private getClassesColumnData(columnData: ColumnDataVO): string {
        if (!columnData || !columnData.column) {
            return null;
        }

        return this.getClassesColumn(columnData.column);
    }

    get selected_card_columns(): string[] {
        const columns: string[] = [];

        if (this.selected_card && this.selected_card.columnsHeader) {
            for (const i in this.selected_card.columnsHeader) {
                const column: ColumnVO = this.selected_card.columnsHeader[i];

                columns.push(column.name);
            }
        }

        return columns;
    }

    get selected_card_columns_without_first(): string[] {
        if (this.selected_card_columns) {
            return this.selected_card_columns.slice(1, this.selected_card_columns.length);
        }

        return null;
    }

    get selected_card_rowsColumnsDatas(): GroupColumnDataVO[] {
        if (this.select_card && this.selected_card.rowsColumnsDatas) {
            return this.selected_card.rowsColumnsDatas;
        }

        return null;
    }

    get data_selected_card(): any[] {
        const datas: any[] = [];

        if (!this.selected_card_rowsColumnsDatas) {
            return datas;
        }

        for (const i in this.selected_card_rowsColumnsDatas) {
            const datas_to_push: any = {};

            for (const j in this.selected_card_rowsColumnsDatas[i].columns) {
                const column: ColumnDataVO = this.selected_card_rowsColumnsDatas[i].columns[j];

                datas_to_push[column.column.name] = column.value;
            }

            datas.push(datas_to_push);
        }

        return datas;
    }
}