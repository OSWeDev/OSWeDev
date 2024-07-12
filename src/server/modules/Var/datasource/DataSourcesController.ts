import DefaultTranslationManager from '../../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../../shared/modules/Translation/vos/DefaultTranslationVO';
import VarDAGNode from '../../../../server/modules/Var/vos/VarDAGNode';
import VarsController from '../../../../shared/modules/Var/VarsController';
import { all_promises } from '../../../../shared/tools/PromiseTools';
import CurrentBatchDSCacheHolder from '../CurrentBatchDSCacheHolder';
import DataSourceControllerBase from './DataSourceControllerBase';

export default class DataSourcesController {

    /**
     * Local thread cache -----
     */

    public static registeredDataSourcesController: { [name: string]: DataSourceControllerBase } = {};
    public static registeredDataSourcesControllerByVoTypeDep: { [vo_type: string]: DataSourceControllerBase[] } = {};
    /**
     * ----- Local thread cache
     */

    public static async load_node_datas(dss: DataSourceControllerBase[], node: VarDAGNode): Promise<void> {

        const promises = [];
        for (const i in dss) {
            const ds = dss[i];

            if (!CurrentBatchDSCacheHolder.current_batch_ds_cache[ds.name]) {
                CurrentBatchDSCacheHolder.current_batch_ds_cache[ds.name] = {};
            }

            // Si on est sur du perf monitoring on doit faire les appels séparément...
            promises.push(ds.load_node_data(node));
        }

        await all_promises(promises);
    }

    public static registerDataSource(
        dataSourcesController: DataSourceControllerBase) {

        if (DataSourcesController.registeredDataSourcesController[dataSourcesController.name]) {
            return;
        }

        DataSourcesController.registeredDataSourcesController[dataSourcesController.name] = dataSourcesController;
        for (const i in dataSourcesController.vo_api_type_ids) {
            const vo_type_dep: string = dataSourcesController.vo_api_type_ids[i];

            if (!DataSourcesController.registeredDataSourcesControllerByVoTypeDep[vo_type_dep]) {
                DataSourcesController.registeredDataSourcesControllerByVoTypeDep[vo_type_dep] = [];
            }
            DataSourcesController.registeredDataSourcesControllerByVoTypeDep[vo_type_dep].push(dataSourcesController);
        }

        DataSourcesController.register_ds_default_translations(dataSourcesController);
    }

    private static register_ds_default_translations(ds: DataSourceControllerBase) {
        if (ds.ds_name_default_translations) {
            DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
                ds.ds_name_default_translations,
                VarsController.get_translatable_ds_name(ds.name)));
        }
    }
}