/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import VarsDatasVoUpdateHandler from '../../../server/modules/Var/VarsDatasVoUpdateHandler';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import IGeneratorWorker from '../../IGeneratorWorker';
import ModuleDashboardBuilder from '../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';

export default class Patch20240917ParamShowCmsPages implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240917ParamShowCmsPages {
        if (!Patch20240917ParamShowCmsPages.instance) {
            Patch20240917ParamShowCmsPages.instance = new Patch20240917ParamShowCmsPages();
        }
        return Patch20240917ParamShowCmsPages.instance;
    }

    private static instance: Patch20240917ParamShowCmsPages = null;

    get uid(): string {
        return 'Patch20240917ParamShowCmsPages';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        await ModuleParams.getInstance().setParamValueAsBoolean(ModuleDashboardBuilder.PARAM_NAME_SHOW_CMS_DASHBOARD_PAGES, false);
    }
}