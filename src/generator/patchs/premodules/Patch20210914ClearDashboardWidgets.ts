/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20210914ClearDashboardWidgets implements IGeneratorWorker {

    public static getInstance(): Patch20210914ClearDashboardWidgets {
        if (!Patch20210914ClearDashboardWidgets.instance) {
            Patch20210914ClearDashboardWidgets.instance = new Patch20210914ClearDashboardWidgets();
        }
        return Patch20210914ClearDashboardWidgets.instance;
    }

    private static instance: Patch20210914ClearDashboardWidgets = null;

    get uid(): string {
        return 'Patch20210914ClearDashboardWidgets';
    }

    private constructor() { }

    /**
     * Objectif : Passer les colonnes de date de DataImportHistoricVO en tstz :
     * segment_date_index
     */
    public async work(db: IDatabase<any>) {
        try {
            await db.query('DELETE FROM ref.module_dashboardbuilder_dashboard_widget;');
        } catch (error) {
            ConsoleHandler.log('Ignore this error if new project or never used dashboardbuilder: ' + error);
        }
    }
}