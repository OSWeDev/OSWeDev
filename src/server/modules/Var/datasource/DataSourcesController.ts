import DefaultTranslationManager from '../../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../../shared/modules/Translation/vos/DefaultTranslation';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarsController from '../../../../shared/modules/Var/VarsController';
import ConfigurationService from '../../../env/ConfigurationService';
import PerfMonConfController from '../../PerfMon/PerfMonConfController';
import PerfMonServerController from '../../PerfMon/PerfMonServerController';
import VarsdatasComputerBGThread from '../bgthreads/VarsdatasComputerBGThread';
import VarsPerfMonServerController from '../VarsPerfMonServerController';
import DataSourceControllerBase from './DataSourceControllerBase';

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
    public async load_node_datas(dss: DataSourceControllerBase[], node: VarDAGNode): Promise<void> {

        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__DataSourcesController__load_node_datas],
            async () => {

                let promises = [];
                let max = Math.max(1, Math.floor(ConfigurationService.getInstance().node_configuration.MAX_POOL / 3));

                for (let i in dss) {
                    let ds = dss[i];

                    if (!VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[ds.name]) {
                        VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[ds.name] = {};
                    }

                    if (promises.length >= max) {
                        await Promise.all(promises);
                        promises = [];
                    }

                    // Si on est sur du perf monitoring on doit faire les appels séparément...
                    let perfmon = PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__DataSourceControllerBase__load_node_data];
                    if (perfmon.is_active) {
                        await PerfMonServerController.getInstance().monitor_async(
                            perfmon,
                            ds.load_node_data,
                            ds,
                            [node],
                            VarsPerfMonServerController.getInstance().generate_pmlinfos_from_node_and_ds(node, ds)
                        );
                    } else {
                        promises.push(ds.load_node_data(node));
                    }
                }

                if (promises && promises.length) {
                    await Promise.all(promises);
                }
            },
            this,
            null,
            VarsPerfMonServerController.getInstance().generate_pmlinfos_from_node(node)
        );
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