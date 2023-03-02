import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import VueComponentBase from "../../../../VueComponentBase";
import BulkActionVO from '../../../../../../../shared/modules/DashboardBuilder/vos/BulkActionVO';
import { debounce } from 'lodash';
import TableWidgetOptions from '../options/TableWidgetOptions';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';

@Component({
    template: require('./BulkActionsComponent.pug'),
    components: {
    }
})
export default class BulkActionsComponent extends VueComponentBase {

    // @Prop({ default: null })
    // private all_bulk_actions: BulkActionVO[];

    // @Prop({ default: null })
    // private page_widget: DashboardPageWidgetVO;

    // private throttle_update_visible_options = debounce(this.throttled_update_visible_options.bind(this), 500);

    // private bulk_actions: BulkActionVO[] = [];

    // private last_calculation_cpt: number = 0;
    // private update_cpt_live: number = 0;
    // private is_busy: boolean = false;

    // @Watch('all_bulk_actions')
    // private async onchange_all_bulk_actions() {
    //     await this.throttle_update_visible_options();
    // }

    // private async throttled_update_visible_options() {

    //     let launch_cpt: number = (this.last_calculation_cpt + 1);

    //     this.last_calculation_cpt = launch_cpt;
    //     this.update_cpt_live++;
    //     this.is_busy = true;

    //     if (!this.widget_options) {
    //         this.bulk_actions = [];
    //         this.is_busy = false;
    //         return;
    //     }

    //     if (!this.widget_options.bulk_actions) {
    //         this.bulk_actions = [];
    //         this.is_busy = false;
    //         return;
    //     }

    //     // Si je ne suis pas sur la dernière demande, je me casse
    //     if (this.last_calculation_cpt != launch_cpt) {
    //         this.update_cpt_live--;
    //         return;
    //     }

    //     this.is_busy = false;
    //     this.update_cpt_live--;
    // }

    // get widget_options(): TableWidgetOptions {
    //     if (!this.page_widget) {
    //         return null;
    //     }

    //     let options: TableWidgetOptions = null;
    //     try {
    //         if (!!this.page_widget.json_options) {
    //             options = JSON.parse(this.page_widget.json_options) as TableWidgetOptions;
    //             options = options ? new TableWidgetOptions(
    //                 options.columns,
    //                 options.is_focus_api_type_id,
    //                 options.limit,
    //                 options.crud_api_type_id,
    //                 options.vocus_button,
    //                 options.delete_button,
    //                 options.delete_all_button,
    //                 options.create_button,
    //                 options.update_button,
    //                 options.refresh_button,
    //                 options.export_button,
    //                 options.can_filter_by,
    //                 options.show_pagination_resumee,
    //                 options.show_pagination_slider,
    //                 options.show_pagination_form,
    //                 options.show_limit_selectable,
    //                 options.limit_selectable,
    //                 options.show_pagination_list,
    //                 options.nbpages_pagination_list,
    //                 options.has_table_total_footer,
    //                 options.hide_pagination_bottom,
    //                 options.default_export_option,
    //                 options.has_default_export_option,
    //                 options.use_kanban_by_default_if_exists,
    //                 options.use_kanban_column_weight_if_exists,
    //                 options.use_for_count,
    //                 options.show_bulk_edit,
    //                 options.bulk_actions,
    //             ) : null;
    //         }
    //     } catch (error) {
    //         ConsoleHandler.error(error);
    //     }

    //     return options;
    // }
}