
export default class DashboardBuilderController {

    /**
     * On ajoute l'id tout simplement après le prefix et on a le code trad
     */

    public static DASHBOARD_NAME_CODE_PREFIX: string = "dashboard.name.";
    public static PAGE_NAME_CODE_PREFIX: string = "dashboard.page.name.";
    public static WIDGET_NAME_CODE_PREFIX: string = "dashboard.widget.name.";
    public static VOFIELDREF_NAME_CODE_PREFIX: string = "dashboard.vofieldref.name.";


    public static getInstance(): DashboardBuilderController {
        if (!DashboardBuilderController.instance) {
            DashboardBuilderController.instance = new DashboardBuilderController();
        }
        return DashboardBuilderController.instance;
    }

    private static instance: DashboardBuilderController = null;

    protected constructor() {
    }
}