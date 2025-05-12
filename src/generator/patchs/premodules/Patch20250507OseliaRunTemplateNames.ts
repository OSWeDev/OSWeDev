import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250507OseliaRunTemplateNames implements IGeneratorWorker {

    private static instance: Patch20250507OseliaRunTemplateNames = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250507OseliaRunTemplateNames';
    }

    public static getInstance(): Patch20250507OseliaRunTemplateNames {
        if (!Patch20250507OseliaRunTemplateNames.instance) {
            Patch20250507OseliaRunTemplateNames.instance = new Patch20250507OseliaRunTemplateNames();
        }
        return Patch20250507OseliaRunTemplateNames.instance;
    }

    public async work(db: IDatabase<unknown>) {
        try {

            await db.query("update ref.module_oselia_oselia_run_template set name = template_name;");
        } catch (error) {
            //
        }
    }
}