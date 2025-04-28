import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';

export default class Patch20250428PrepareRemovalTemplateNAmeOseliaRun implements IGeneratorWorker {

    private static instance: Patch20250428PrepareRemovalTemplateNAmeOseliaRun = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250428PrepareRemovalTemplateNAmeOseliaRun';
    }

    public static getInstance(): Patch20250428PrepareRemovalTemplateNAmeOseliaRun {
        if (!Patch20250428PrepareRemovalTemplateNAmeOseliaRun.instance) {
            Patch20250428PrepareRemovalTemplateNAmeOseliaRun.instance = new Patch20250428PrepareRemovalTemplateNAmeOseliaRun();
        }
        return Patch20250428PrepareRemovalTemplateNAmeOseliaRun.instance;
    }


    public async work(db: IDatabase<unknown>) {

        try {

            await db.none('update ref.module_oselia_oselia_run_template set name=template_name where parent_run_id is null;');
            await db.none('update ref.module_oselia_oselia_run_template set name = template_name || \' - \' || name  where parent_run_id is not null;');
        } catch (error) {
            ConsoleHandler.error('Patch20250428PrepareRemovalTemplateNAmeOseliaRun', error);
        }
    }
}