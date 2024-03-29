/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240329CeliaToOseliaDBWidget implements IGeneratorWorker {


    private static instance: Patch20240329CeliaToOseliaDBWidget = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240329CeliaToOseliaDBWidget';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240329CeliaToOseliaDBWidget {
        if (!Patch20240329CeliaToOseliaDBWidget.instance) {
            Patch20240329CeliaToOseliaDBWidget.instance = new Patch20240329CeliaToOseliaDBWidget();
        }
        return Patch20240329CeliaToOseliaDBWidget.instance;
    }

    public async work(db: IDatabase<any>) {
        try {
            // widget_component
            await db.query("update ref.module_dashboardbuilder_dashboard_widget set widget_component='Oseliathreadwidgetcomponent' where widget_component='Celiathreadwidgetcomponent';");
            // options_component
            await db.query("update ref.module_dashboardbuilder_dashboard_widget set options_component='Oseliathreadwidgetoptionscomponent' where options_component='Celiathreadwidgetoptionscomponent';");
            // name
            await db.query("update ref.module_dashboardbuilder_dashboard_widget set name='oseliathread' where name='celiathread';");
            // icon_component
            await db.query("update ref.module_dashboardbuilder_dashboard_widget set icon_component='Oseliathreadwidgeticoncomponent' where icon_component='Celiathreadwidgeticoncomponent';");

        } catch (error) {
            ConsoleHandler.log('Ignore this error if constraint exists: ' + error);
        }
    }
}