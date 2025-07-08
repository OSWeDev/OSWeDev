import DashboardPageVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import './DashboardHistoryController.scss';

export default class DashboardHistoryController {

    public static select_page(
        current_page: DashboardPageVO,
        next_page: DashboardPageVO,
        add_page_history_store_func: (page_history: DashboardPageVO) => void,
        set_dashboard_page: (page: DashboardPageVO) => void) {

        add_page_history_store_func(current_page);
        set_dashboard_page(next_page);
    }

    public static select_previous_page(
        page_history: DashboardPageVO[],
        set_dashboard_page: (page: DashboardPageVO) => void,
        pop_page_history: (fk) => void
    ) {
        set_dashboard_page(page_history[page_history.length - 1]);
        pop_page_history(null);
    }

    // public select_page_clear_navigation(page: DashboardPageVO) {
    //     this.set_page_history([]);
    //     this.set_dashboard_page(page);
    // }
}