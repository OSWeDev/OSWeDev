import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250228DeleteDuplicateGraphVO implements IGeneratorWorker {

    private static instance: Patch20250228DeleteDuplicateGraphVO = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250228DeleteDuplicateGraphVO';
    }

    public static getInstance(): Patch20250228DeleteDuplicateGraphVO {
        if (!Patch20250228DeleteDuplicateGraphVO.instance) {
            Patch20250228DeleteDuplicateGraphVO.instance = new Patch20250228DeleteDuplicateGraphVO();
        }
        return Patch20250228DeleteDuplicateGraphVO.instance;
    }

    public async work(db: IDatabase<unknown>) {

        await db.query("delete from ref.module_dashboardbuilder_dashboard_graphvoref " +
            "where id in ( " +
            "select distinct a.id from ref.module_dashboardbuilder_dashboard_graphvoref a, " +
            "ref.module_dashboardbuilder_dashboard_graphvoref b " +
            "where a.dashboard_id = b.dashboard_id " +
            "and a.id < b.id " +
            "and a.vo_type = b.vo_type);");
    }
}