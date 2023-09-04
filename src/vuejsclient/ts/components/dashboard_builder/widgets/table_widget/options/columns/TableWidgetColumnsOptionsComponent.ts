import Component from 'vue-class-component';
import { VueNestable, VueNestableHandle } from 'vue-nestable';
import { Prop, Watch } from 'vue-property-decorator';
import { cloneDeep } from 'lodash';
import DashboardPageWidgetVO from '../../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import TableColumnDescVO from '../../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import ConsoleHandler from '../../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../../InlineTranslatableText/InlineTranslatableText';
import TableWidgetColumnOptionsComponent from './item/TableWidgetColumnOptionsComponent';
import VueAppController from '../../../../../../../VueAppController';
import VueComponentBase from '../../../../../VueComponentBase';
import './TableWidgetColumnsOptionsComponent.scss';

@Component({
    template: require('./TableWidgetColumnsOptionsComponent.pug'),
    components: {
        Tablewidgetcolumnoptionscomponent: TableWidgetColumnOptionsComponent,
        Inlinetranslatabletext: InlineTranslatableText,
        Vuenestablehandle: VueNestableHandle,
        Vuenestable: VueNestable,
    }
})
export default class TableWidgetColumnsOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: [] })
    private columns: TableColumnDescVO[];

    private throttled_update_columns = ThrottleHelper.getInstance().declare_throttle_without_args(
        this.update_columns.bind(this),
        50,
        { leading: false, trailing: true }
    );

    private next_update_columns: TableColumnDescVO[] = null;

    private editable_columns: TableColumnDescVO[] = null;

    @Watch('columns', { deep: true, immediate: true })
    private async onchange_columns() {
        this.editable_columns = cloneDeep(this.columns);
    }

    /**
     * on_columns_change
     *  - Update columns configuration
     *
     * @returns {Promise<void>}
     */
    private async on_columns_change(): Promise<void> {
        this.next_update_columns = cloneDeep(this.columns);

        if (!this.next_update_columns) {
            return null;
        }

        // On applique les nouveaux poids
        for (const i in this.editable_columns) {
            const column = this.editable_columns[i];

            if (column.type == TableColumnDescVO.TYPE_header) {
                for (const j in column.children) {
                    const child = column.children[j];

                    child.weight = parseInt(j);
                }
            } else {
                column.weight = parseInt(i);
            }
        }

        this.next_update_columns = this.editable_columns;

        this.throttled_update_columns();
    }

    /**
     * update_column
     *  - Update column configuration in widget_options
     *
     * @param {TableColumnDescVO} update_column
     * @returns {Promise<void>}
     */
    private async update_column(update_column: TableColumnDescVO): Promise<void> {
        this.next_update_columns = cloneDeep(this.columns);

        if (!this.next_update_columns) {
            return null;
        }

        let old_column: TableColumnDescVO = null;

        let k: number;
        const i = this.next_update_columns?.findIndex((column) => {

            if (column.id == update_column.id) {
                old_column = column;

                return true;
            }

            if (column.type == TableColumnDescVO.TYPE_header) {
                for (const u in column.children) {
                    const child = column.children[u];

                    if (child.id == update_column.id) {
                        old_column = child;
                        k = parseInt(u);

                        return true;
                    }
                }
            }

            return false;
        });

        if (i < 0) {
            ConsoleHandler.error('update_column failed');
            return null;
        }

        // Si on essaye de mettre à jour le tri par defaut, on réinitialise tous les autres pour en avoir qu'un seul actif
        if (old_column.default_sort_field != update_column.default_sort_field) {
            for (let i_col in this.next_update_columns) {
                const column = this.next_update_columns[i_col];

                if (column.id == old_column.id) {
                    continue;
                }

                if (column.default_sort_field != null) {
                    column.default_sort_field = null;
                }
            }
        }

        if (typeof (k) != 'undefined') {
            this.next_update_columns[i].children[k] = update_column;
        } else {
            this.next_update_columns[i] = update_column;
        }

        this.throttled_update_columns();
    }

    /**
     * remove_column
     *  - Remove column configuration in widget_options
     *
     * @param {TableColumnDescVO} del_column
     * @returns {Promise<void>}
     */
    private async remove_column(del_column: TableColumnDescVO): Promise<void> {
        this.next_update_columns = cloneDeep(this.columns);

        if (!this.next_update_columns) {
            return null;
        }

        let k: number;

        const i = this.next_update_columns?.findIndex((column) => {

            if (column.id == del_column.id) {
                return column.id == del_column.id;
            }

            if (column.type == TableColumnDescVO.TYPE_header) {
                for (let u in column.children) {
                    let child = column.children[u];
                    if (child.id == del_column.id) {
                        k = parseInt(u);
                        return child.id == del_column.id;
                    }
                }
            }
        });

        if (i < 0) {
            ConsoleHandler.error('remove_column failed');
            return null;
        }

        if (typeof (k) != 'undefined') {
            this.next_update_columns[i].children.splice(k);

        } else {
            this.next_update_columns.splice(i, 1);
        }

        this.throttled_update_columns();
    }

    /**
     * add_column
     *  - Add column configuration
     *
     * @param {TableColumnDescVO} add_column
     * @returns {Promise<void>}
     */
    private async add_column(add_column: TableColumnDescVO): Promise<void> {
        this.next_update_columns = cloneDeep(this.columns);

        if (!this.next_update_columns) {
            this.next_update_columns = [];
        }

        let found = false;
        let i = -1;

        if ((!!add_column) && (!!this.next_update_columns)) {
            i = this.next_update_columns.findIndex((ref_elt) => {
                return ref_elt.id == add_column.id;
            });
        }

        if (i < 0) {
            add_column.weight = 0;
            i = 0;
        } else {
            found = true;
        }

        if (!found) {
            if (!this.next_update_columns) {
                this.next_update_columns = [];
            }

            this.next_update_columns.push(add_column);
        }

        this.throttled_update_columns();
    }

    /**
     * get_new_column_id
     * - Get new column id
     *
     * @returns {number}
     */
    private get_new_column_id(): number {
        this.next_update_columns = cloneDeep(this.columns);

        if (!this.next_update_columns) {
            this.next_update_columns = [];
        }

        const ids = this.next_update_columns?.map(
            (c) => c.id ? c.id : 0
        );

        let max = -1;
        for (const i in ids) {
            if (max < ids[i]) {
                max = ids[i];
            }
        }

        return max + 1;
    }

    /**
     * beforeMove
     *
     * @param param0
     * @returns {boolean}
     */
    private beforeMove({ dragItem, pathFrom, pathTo }): boolean {
        // Si on essaye de faire un 3eme niveau, on refuse
        if (pathTo.length > 2) {
            return false;
        }

        // On ne peut mettre les type header que sur le 1er niveau
        if (dragItem.type == TableColumnDescVO.TYPE_header) {
            return pathTo.length === 1;
        }

        // Si on essaye de créer un 2nd niveau sur une colonne qui n'est pas header, on refuse
        if ((pathFrom.length === 1) && (pathTo.length == 2) && this.columns[pathTo[0]].type == TableColumnDescVO.TYPE_vo_field_ref) {
            return false;
        }

        return true;
    }

    private async update_columns() {
        this.$emit('change', this.next_update_columns);
    }

    private read_label(label: string): string {
        const translation = VueAppController.getInstance().ALL_FLAT_LOCALE_TRANSLATIONS;
        const text = translation[label + '.___LABEL___'];

        return text;
    }
}