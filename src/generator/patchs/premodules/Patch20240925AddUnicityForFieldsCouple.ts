/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240925AddUnicityForFieldsCouple implements IGeneratorWorker {


    private static instance: Patch20240925AddUnicityForFieldsCouple = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240925AddUnicityForFieldsCouple';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240925AddUnicityForFieldsCouple {
        if (!Patch20240925AddUnicityForFieldsCouple.instance) {
            Patch20240925AddUnicityForFieldsCouple.instance = new Patch20240925AddUnicityForFieldsCouple();
        }
        return Patch20240925AddUnicityForFieldsCouple.instance;
    }

    public async work(db: IDatabase<any>) {
        try {
            await db.query('ALTER TABLE ref.module_dashboardbuilder_dashboard_activeon_viewport ADD CONSTRAINT uniq__couple__fk UNIQUE (dashboard_page_id, dashboard_viewport_id);');
        } catch (error) {
            ConsoleHandler.log('Ignore this error if constraint exists: ' + error);
        }
    }
}