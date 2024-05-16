/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240206InitNullFieldsFromWidgets implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240206InitNullFieldsFromWidgets {
        if (!Patch20240206InitNullFieldsFromWidgets.instance) {
            Patch20240206InitNullFieldsFromWidgets.instance = new Patch20240206InitNullFieldsFromWidgets();
        }
        return Patch20240206InitNullFieldsFromWidgets.instance;
    }

    private static instance: Patch20240206InitNullFieldsFromWidgets = null;

    get uid(): string {
        return 'Patch20240206InitNullFieldsFromWidgets';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        try {
            await db.query("update ref.module_dashboardbuilder_dashboard_widget set is_filter = false where is_filter is null;");
        } catch (error) {
            console.error(error);
        }

        try {
            await db.query("update ref.module_dashboardbuilder_dashboard_widget set is_validation_filters = false where is_validation_filters is null;");
        } catch (error) {
            console.error(error);
        }
    }
}