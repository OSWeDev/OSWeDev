/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import VarsDatasVoUpdateHandler from '../../../server/modules/Var/VarsDatasVoUpdateHandler';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import IGeneratorWorker from '../../IGeneratorWorker';
import ModuleDashboardBuilder from '../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DashboardWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import { field_names } from '../../../shared/tools/ObjectHandler';

export default class Patch20240612DbbAdvancedDateFilterChangeIsFilter implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240612DbbAdvancedDateFilterChangeIsFilter {
        if (!Patch20240612DbbAdvancedDateFilterChangeIsFilter.instance) {
            Patch20240612DbbAdvancedDateFilterChangeIsFilter.instance = new Patch20240612DbbAdvancedDateFilterChangeIsFilter();
        }
        return Patch20240612DbbAdvancedDateFilterChangeIsFilter.instance;
    }

    private static instance: Patch20240612DbbAdvancedDateFilterChangeIsFilter = null;

    get uid(): string {
        return 'Patch20240612DbbAdvancedDateFilterChangeIsFilter';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        if (!ModuleDashboardBuilder.getInstance().actif) {
            return;
        }

        await query(DashboardWidgetVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<DashboardWidgetVO>().name, DashboardWidgetVO.WIDGET_NAME_advanceddatefilter)
            .update_vos<DashboardWidgetVO>({
                is_filter: true
            });
    }
}