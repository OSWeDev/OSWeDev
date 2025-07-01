import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import DashboardViewportVO from "../../../shared/modules/DashboardBuilder/vos/DashboardViewportVO";
import DashboardVO from "../../../shared/modules/DashboardBuilder/vos/DashboardVO";
import NumSegment from "../../../shared/modules/DataRender/vos/NumSegment";
import { field_names } from "../../../shared/tools/ObjectHandler";
import RangeHandler from "../../../shared/tools/RangeHandler";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20250701ActivateDefaultViewportOnAllDbs implements IGeneratorWorker {

    private static instance: Patch20250701ActivateDefaultViewportOnAllDbs = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250701ActivateDefaultViewportOnAllDbs';
    }

    public static getInstance(): Patch20250701ActivateDefaultViewportOnAllDbs {
        if (!Patch20250701ActivateDefaultViewportOnAllDbs.instance) {
            Patch20250701ActivateDefaultViewportOnAllDbs.instance = new Patch20250701ActivateDefaultViewportOnAllDbs();
        }
        return Patch20250701ActivateDefaultViewportOnAllDbs.instance;
    }

    public async work(db: IDatabase<unknown>) {
        /**
         * On active le viewport par défaut sur tous les dashboards existants
         */

        const all_dashboards = await query(DashboardVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<DashboardVO>();
        const default_viewport = await query(DashboardViewportVO.API_TYPE_ID)
            .filter_is_true(field_names<DashboardViewportVO>().is_default)
            .exec_as_server()
            .select_vo<DashboardViewportVO>();

        if (!default_viewport) {
            throw new Error('Impossible de créer un Dashboard sans viewport par défaut actif.');
        }

        for (const i in all_dashboards) {
            const dashboard: DashboardVO = all_dashboards[i];

            // On doit activer le viewport par défaut à minima quand on crée le db
            if (RangeHandler.getCardinalFromArray(dashboard.activated_viewport_id_ranges) <= 0) {
                dashboard.activated_viewport_id_ranges = [RangeHandler.create_single_elt_NumRange(default_viewport.id, NumSegment.TYPE_INT)];
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(dashboard);
            }
        }
    }
}