/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DashboardPageWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';

export default class Patch20250331RemoveValueTables implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250331RemoveValueTables {
        if (!Patch20250331RemoveValueTables.instance) {
            Patch20250331RemoveValueTables.instance = new Patch20250331RemoveValueTables();
        }
        return Patch20250331RemoveValueTables.instance;
    }

    private static instance: Patch20250331RemoveValueTables = null;

    get uid(): string {
        return 'Patch20250331RemoveValueTables';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        try {

            // On doit tout remplacer par des datatables
            const datatable_widget: DashboardWidgetVO = await query(DashboardWidgetVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<DashboardWidgetVO>().name, 'datatable').exec_as_server().select_vo<DashboardWidgetVO>();
            const valuetable_widget: DashboardWidgetVO = await query(DashboardWidgetVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<DashboardWidgetVO>().name, 'valuetable').exec_as_server().select_vo<DashboardWidgetVO>();

            if (!datatable_widget || !valuetable_widget) {
                ConsoleHandler.warn('No datatable or valuetable widget found');
                return;
            }

            await query(DashboardPageWidgetVO.API_TYPE_ID)
                .filter_by_id(valuetable_widget.id, DashboardWidgetVO.API_TYPE_ID)
                .exec_as_server()
                .update_vos<DashboardPageWidgetVO>({
                    [field_names<DashboardPageWidgetVO>().widget_id]: datatable_widget.id,
                });

            await query(DashboardWidgetVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<DashboardWidgetVO>().name, 'valuetable').exec_as_server().delete_vos();
        } catch (error) {
            ConsoleHandler.error('Error in Patch20250331RemoveValueTables: ', error);
            throw error;
        }
    }
}