import DefaultTranslationManager from '../../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../../shared/modules/Translation/vos/DefaultTranslation';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import DataSourceControllerBase from './DataSourceControllerBase';
import VarsController from '../../../../shared/modules/Var/VarsController';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { createWriteStream } from 'fs';
import ConfigurationService from '../../../env/ConfigurationService';

export default class DataSourcesController {

    public static getInstance(): DataSourcesController {
        if (!DataSourcesController.instance) {
            DataSourcesController.instance = new DataSourcesController();
        }
        return DataSourcesController.instance;
    }

    /**
     * Local thread cache -----
     */

    private static instance: DataSourcesController = null;

    public registeredDataSourcesController: { [name: string]: DataSourceControllerBase } = {};
    public registeredDataSourcesControllerByVoTypeDep: { [vo_type: string]: DataSourceControllerBase[] } = {};
    /**
     * ----- Local thread cache
     */

    private constructor() { }

    /**
     * TODO FIXME : Si on demande les datas une à une c'est très long, si on demande tout en bloc ça plante en dev... donc
     *  on fait des packs
     */
    public async load_node_datas(dss: DataSourceControllerBase[], node: VarDAGNode, ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }): Promise<void> {

        let promises = [];
        for (let i in dss) {
            let ds = dss[i];

            if (!ds_cache[ds.name]) {
                ds_cache[ds.name] = {};
            }

            // TODO FIXME promises.length
            if (promises.length >= 50) {
                await Promise.all(promises);
                promises = [];
            }

            // TODO FIXME ne pas livrer !!!
            if (ConfigurationService.getInstance().getNodeConfiguration().ISDEV) {

                var logger = createWriteStream('log.txt', {
                    flags: 'a' // 'a' means appending (old data will be preserved)
                });

                logger.write(node.var_data.index + ':' + ds.name + ':' + (ds_cache[ds.name] ? 'has_cache' : 'no_cache') + '\n'); // append string to your file
                logger.close();
            }

            promises.push(ds.load_node_data(node, ds_cache[ds.name]));
        }
        await Promise.all(promises);
    }

    public registerDataSource(
        dataSourcesController: DataSourceControllerBase) {

        if (!!this.registeredDataSourcesController[dataSourcesController.name]) {
            return;
        }

        this.registeredDataSourcesController[dataSourcesController.name] = dataSourcesController;
        for (let i in dataSourcesController.vo_api_type_ids) {
            let vo_type_dep: string = dataSourcesController.vo_api_type_ids[i];

            if (!this.registeredDataSourcesControllerByVoTypeDep[vo_type_dep]) {
                this.registeredDataSourcesControllerByVoTypeDep[vo_type_dep] = [];
            }
            this.registeredDataSourcesControllerByVoTypeDep[vo_type_dep].push(dataSourcesController);
        }

        this.register_ds_default_translations(dataSourcesController);
    }

    private register_ds_default_translations(ds: DataSourceControllerBase) {
        if (!!ds.ds_name_default_translations) {
            DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
                ds.ds_name_default_translations,
                VarsController.getInstance().get_translatable_ds_name(ds.name)));
        }
    }
}