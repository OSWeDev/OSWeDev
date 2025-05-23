import IWidgetFilterDependancy from "./interfaces/IWidgetFilterDependancy";
import DashboardPageWidgetVOManager from "./manager/DashboardPageWidgetVOManager";
import DashboardPageWidgetVO from "./vos/DashboardPageWidgetVO";
import WidgetFilterDependancyDAG from "./widget_filter_dependancy/dag/WidgetFilterDependancyDAG";
import WidgetFilterDependancyDAGNode from "./widget_filter_dependancy/dag/WidgetFilterDependancyDAGNode";

export default class WidgetFilterDependancyController {

    public static DAG_DEP_NAME: string = "WidgetFilterDependancyController";

    /**
     * On veut construire une arborescence de dépendance entre les widgets en se basant sur les dépendances (IWidgetFilterDependancy)
     */
    public static async get_dependancy_dag<WidgetOptions extends IWidgetFilterDependancy>(page_widgets: DashboardPageWidgetVO[]): Promise<WidgetFilterDependancyDAG> {
        const res: WidgetFilterDependancyDAG = new WidgetFilterDependancyDAG();

        for (const page_widget of page_widgets) {

            const this_node = WidgetFilterDependancyDAGNode.getInstance(res, page_widget);

            const page_widget_options_metadata = await DashboardPageWidgetVOManager.find_widget_options_metadata_by_page_widget_id(page_widget.id);
            if ((!page_widget_options_metadata) || (!page_widget_options_metadata.widget_options)) {
                continue;
            }

            if ((page_widget_options_metadata.widget_options as WidgetOptions).is_relative_to_other_filter) {
                const widget_options = page_widget_options_metadata.widget_options as WidgetOptions;
                const relative_to_other_filter_id = widget_options.relative_to_other_filter_id;

                const dependancy_page_widget = page_widgets.find((other_page_widget) => {
                    return other_page_widget.id === relative_to_other_filter_id;
                });

                if (relative_to_other_filter_id) {
                    const dependancy_node = WidgetFilterDependancyDAGNode.getInstance(res, dependancy_page_widget);

                    dependancy_node.addOutgoingDep(WidgetFilterDependancyController.DAG_DEP_NAME, this_node);
                }
            }
        }

        return res;
    }
}