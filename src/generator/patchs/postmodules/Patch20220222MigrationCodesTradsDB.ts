/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ContextFilterHandler from '../../../shared/modules/ContextFilter/ContextFilterHandler';
import ModuleContextFilter from '../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DashboardBuilderController from '../../../shared/modules/DashboardBuilder/DashboardBuilderController';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20220222MigrationCodesTradsDB implements IGeneratorWorker {

    public static getInstance(): Patch20220222MigrationCodesTradsDB {
        if (!Patch20220222MigrationCodesTradsDB.instance) {
            Patch20220222MigrationCodesTradsDB.instance = new Patch20220222MigrationCodesTradsDB();
        }
        return Patch20220222MigrationCodesTradsDB.instance;
    }

    private static instance: Patch20220222MigrationCodesTradsDB = null;

    get uid(): string {
        return 'Patch20220222MigrationCodesTradsDB';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        let filter = new ContextFilterVO();
        filter.field_id = 'code_text';
        filter.filter_type = ContextFilterVO.TYPE_TEXT_STARTSWITH_ANY;
        filter.vo_type = TranslatableTextVO.API_TYPE_ID;
        filter.param_textarray = [
            DashboardBuilderController.TableColumnDesc_NAME_CODE_PREFIX,
            DashboardBuilderController.VOFIELDREF_NAME_CODE_PREFIX
        ];
        let page_widget_trads: TranslatableTextVO[] = await ModuleContextFilter.getInstance().query_vos_from_active_filters(
            TranslatableTextVO.API_TYPE_ID,
            ContextFilterHandler.getInstance().get_active_field_filters([filter]),
            [TranslatableTextVO.API_TYPE_ID],
            null,
            null,
            null
        );

        await ModuleDAO.getInstance().deleteVOs(page_widget_trads);

        // let lang = await ModuleTranslation.getInstance().getLang('fr-fr');

        // let page_widgets: DashboardPageWidgetVO[] = await ModuleDAO.getInstance().getVos<DashboardPageWidgetVO>(DashboardPageWidgetVO.API_TYPE_ID);
        // for (let i in page_widgets) {
        //     let page_widget = page_widgets[i];

        //     json_options
        //     let options =
        //     if (!!this.page_widget.json_options) {
        //         options = JSON.parse(this.page_widget.json_options) as BulkOpsWidgetOptions;
        //         options = options ? new BulkOpsWidgetOptions(options.page_widget_id, options.api_type_id, options.limit) : null;
        //     }
        // }
    }
}