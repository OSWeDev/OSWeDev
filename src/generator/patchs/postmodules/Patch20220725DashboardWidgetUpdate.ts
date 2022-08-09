/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleDashboardBuilder from '../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import DashboardWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20220725DashboardWidgetUpdate implements IGeneratorWorker {

    public static getInstance(): Patch20220725DashboardWidgetUpdate {
        if (!Patch20220725DashboardWidgetUpdate.instance) {
            Patch20220725DashboardWidgetUpdate.instance = new Patch20220725DashboardWidgetUpdate();
        }
        return Patch20220725DashboardWidgetUpdate.instance;
    }

    private static instance: Patch20220725DashboardWidgetUpdate = null;

    get uid(): string {
        return 'Patch20220725DashboardWidgetUpdate';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        if (!ModuleDashboardBuilder.getInstance().actif) {
            return;
        }

        let dws: DashboardWidgetVO[] = await ModuleDAO.getInstance().getVos<DashboardWidgetVO>(DashboardWidgetVO.API_TYPE_ID);

        let dw_names_filter: string[] = [
            'fieldvaluefilter',
            'dowfilter',
            'monthfilter',
            'yearfilter',
            'advanceddatefilter',
        ];

        for (let i in dws) {
            let dw = dws[i];

            if (dw_names_filter.indexOf(dw.name) === -1) {
                continue;
            }

            dw.is_filter = true;

            await ModuleDAO.getInstance().insertOrUpdateVO(dw);
        }
    }
}