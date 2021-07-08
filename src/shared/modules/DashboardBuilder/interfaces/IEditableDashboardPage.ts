import IDashboardGridItem from "./IDashboardGridItem";
import IDashboardPageVO from "./IDashboardPageVO";

export default interface IEditableDashboardPage extends IDashboardPageVO {
    layout: IDashboardGridItem[];
}