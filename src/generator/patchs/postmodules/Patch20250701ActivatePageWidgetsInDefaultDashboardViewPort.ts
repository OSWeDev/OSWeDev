import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import DashboardPageWidgetVO from "../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DashboardViewportPageWidgetVO from "../../../shared/modules/DashboardBuilder/vos/DashboardViewportPageWidgetVO";
import DashboardViewportVO from "../../../shared/modules/DashboardBuilder/vos/DashboardViewportVO";
import { field_names } from "../../../shared/tools/ObjectHandler";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20250701ActivatePageWidgetsInDefaultDashboardViewPort implements IGeneratorWorker {

    private static instance: Patch20250701ActivatePageWidgetsInDefaultDashboardViewPort = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250701ActivatePageWidgetsInDefaultDashboardViewPort';
    }

    public static getInstance(): Patch20250701ActivatePageWidgetsInDefaultDashboardViewPort {
        if (!Patch20250701ActivatePageWidgetsInDefaultDashboardViewPort.instance) {
            Patch20250701ActivatePageWidgetsInDefaultDashboardViewPort.instance = new Patch20250701ActivatePageWidgetsInDefaultDashboardViewPort();
        }
        return Patch20250701ActivatePageWidgetsInDefaultDashboardViewPort.instance;
    }

    public async work(db: IDatabase<unknown>) {
        /**
         * On prend tous les widgets et on les active sur le viewport par défaut, pas les autres pour le moment, et on copie les données de positionnement au niveau du viewportvidwget nouvellement créé
         *  // On filtre ceux qui existent pas en lien avec un viewport déjà
         */
        const all_page_widgets = await query(DashboardPageWidgetVO.API_TYPE_ID)
            .filter_by_id_not_in(query(DashboardViewportPageWidgetVO.API_TYPE_ID).field(field_names<DashboardViewportPageWidgetVO>().page_widget_id).exec_as_server())
            .exec_as_server()
            .select_vos<DashboardPageWidgetVO>();
        const default_viewport: DashboardViewportVO = await query(DashboardViewportVO.API_TYPE_ID)
            .filter_is_true(field_names<DashboardViewportVO>().is_default)
            .exec_as_server()
            .select_vo<DashboardViewportVO>();
        if (!default_viewport) {
            throw new Error("No default viewport found, cannot activate page widgets.");
        }

        for (const i in all_page_widgets) {
            const page_widget: DashboardPageWidgetVO = all_page_widgets[i];
            const viewport_widget: DashboardViewportPageWidgetVO = new DashboardViewportPageWidgetVO();

            viewport_widget.page_widget_id = page_widget.id;
            viewport_widget.viewport_id = default_viewport.id;

            // On copie les données de positionnement
            viewport_widget.static = page_widget.static;
            viewport_widget.x = page_widget.x;
            viewport_widget.y = page_widget.y;
            viewport_widget.w = page_widget.w;
            viewport_widget.h = page_widget.h;
            viewport_widget.i = page_widget.i;

            // On active le widget par défaut
            viewport_widget.activated = true;

            // On insère le viewport widget
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(viewport_widget);
        }
    }
}