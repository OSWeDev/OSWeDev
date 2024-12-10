import VarDAGNode from '../../../../modules/Var/vos/VarDAGNode';
import VarDataBaseVO from '../../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import PixelVarDataController from '../../PixelVarDataController';
import VarsServerController from '../../VarsServerController';
import DataSourceControllerBase from '../../datasource/DataSourceControllerBase';
import DataSourcesController from '../../datasource/DataSourcesController';
import VarsProcessBase from './VarsProcessBase';
import PromisePipeline from '../../../../../shared/tools/PromisePipeline/PromisePipeline';
import CurrentBatchDSCacheHolder from '../../CurrentBatchDSCacheHolder';

export default class VarsProcessLoadDatas extends VarsProcessBase {

    private static instance: VarsProcessLoadDatas = null;

    private constructor() {
        super('VarsProcessLoadDatas', VarDAGNode.TAG_2_DEPLOYED, VarDAGNode.TAG_3_DATA_LOADING, VarDAGNode.TAG_3_DATA_LOADED, 2, true, ConfigurationService.node_configuration.max_varsprocessloaddatas);
    }

    public static async load_nodes_datas(nodes: { [node_name: string]: VarDAGNode }, predep: boolean = false): Promise<boolean> {

        /**
         * Le plan c'est :
         *  1- pour chaque datasource lié à ces noeuds, on regroupe tous les noeuds qui dépendent de ce datasource, et on fait une demande globale de chargement au datasource
         *  2- on attend le chargement de tous les datasources
         */

        const nodes_by_datasource: { [datasource_name: string]: { [index: string]: VarDAGNode } } = {};

        for (const i in nodes) {
            const node = nodes[i];

            const controller = VarsServerController.registered_vars_controller_by_var_id[node.var_data.var_id];
            const dss: DataSourceControllerBase[] = predep ? controller.getDataSourcesPredepsDependencies() : controller.getDataSourcesDependencies();

            if ((!dss) || (!dss.length)) {
                continue;
            }

            // TODO FIXME JNE DELETE when proven unuseful ==>
            // On ne doit surtout pas charger des datas sources sur des vars de type pixel mais qui n'en sont pas (card > 1)
            if (controller.varConf.pixel_activated) {
                const prod_cardinaux = PixelVarDataController.getInstance().get_pixel_card(node.var_data);

                if (prod_cardinaux != 1) {
                    continue;
                }
            }
            // <==

            for (const j in dss) {
                const ds = dss[j];

                // Si le datasource a déjà été chargé sur ce noeud, on ne le recharge pas
                if (!!node.datasources[ds.name]) {
                    continue;
                }

                if (!nodes_by_datasource[ds.name]) {
                    nodes_by_datasource[ds.name] = {};
                }
                nodes_by_datasource[ds.name][node.var_data.index] = node;
            }
        }

        const promise_pipeline = new PromisePipeline(
            ConfigurationService.node_configuration.max_varsprocessloaddatas,
            'VarsProcessLoadDatas:worker_async_batch');
        for (const datasource_name in nodes_by_datasource) {
            const datasource = DataSourcesController.registeredDataSourcesController[datasource_name];

            if (!datasource) {
                ConsoleHandler.error('Datasource not found:' + datasource_name);
                continue;
            }

            if (!CurrentBatchDSCacheHolder.current_batch_ds_cache[datasource_name]) {
                CurrentBatchDSCacheHolder.current_batch_ds_cache[datasource_name] = {};
            }

            if (!CurrentBatchDSCacheHolder.semaphore_batch_ds_cache[datasource_name]) {
                CurrentBatchDSCacheHolder.semaphore_batch_ds_cache[datasource_name] = {};
            }

            await datasource.load_nodes_data_using_pipeline(nodes_by_datasource[datasource_name], promise_pipeline);
        }

        await promise_pipeline.end();

        return true;
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!VarsProcessLoadDatas.instance) {
            VarsProcessLoadDatas.instance = new VarsProcessLoadDatas();
        }
        return VarsProcessLoadDatas.instance;
    }

    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }): Promise<boolean> {

        // On charge les datas (pas predeps) de tous les nodes
        return VarsProcessLoadDatas.load_nodes_datas(nodes, false);
    }

    protected worker_sync(node: VarDAGNode): boolean {
        return false;
    }

    protected async worker_async(node: VarDAGNode): Promise<boolean> {

        const controller = VarsServerController.getVarControllerById(node.var_data.var_id);

        const dss: DataSourceControllerBase[] = controller.getDataSourcesDependencies();

        if ((!dss) || (!dss.length)) {
            return true;
        }

        // TODO FIXME JNE DELETE when proven unuseful ==>
        // On ne doit surtout pas charger des datas sources sur des vars de type pixel mais qui n'en sont pas (card > 1)
        if (controller.varConf.pixel_activated) {
            const prod_cardinaux = PixelVarDataController.getInstance().get_pixel_card(node.var_data);

            if (prod_cardinaux != 1) {
                return true;
            }
        }
        // <==


        await DataSourcesController.load_node_datas(dss, node);

        if (ConfigurationService.node_configuration.debug_vars) {
            ConsoleHandler.log('loaded_node_datas:index:' + node.var_data.index + ":value:" + node.var_data.value + ":value_ts:" + node.var_data.value_ts + ":type:" + VarDataBaseVO.VALUE_TYPE_LABELS[node.var_data.value_type]);
        }

        return true;
    }
}