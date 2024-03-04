/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleFormatDatesNombres from '../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20230209AddColumnFormatDatesNombres implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20230209AddColumnFormatDatesNombres {
        if (!Patch20230209AddColumnFormatDatesNombres.instance) {
            Patch20230209AddColumnFormatDatesNombres.instance = new Patch20230209AddColumnFormatDatesNombres();
        }
        return Patch20230209AddColumnFormatDatesNombres.instance;
    }

    private static instance: Patch20230209AddColumnFormatDatesNombres = null;

    get uid(): string {
        return 'Patch20230209AddColumnFormatDatesNombres';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        try {
            await db.query("ALTER TABLE IF EXISTS admin.module_format_dates_nombres ADD COLUMN " + ModuleFormatDatesNombres.PARAM_NAME_date_format_fullyear + " text NOT NULL DEFAULT 'YYYY'::text;");
        } catch (error) {
            ConsoleHandler.log('Ignore this error if new project: ' + error);
        }
    }
}