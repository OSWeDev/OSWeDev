import StatsController from '../../../../shared/modules/Stats/StatsController';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import PromisePipeline from '../../../../shared/tools/PromisePipeline/PromisePipeline';
import VarDAGNode from '../../../modules/Var/vos/VarDAGNode';
import DataSourceControllerBase from './DataSourceControllerBase';

export default abstract class DataSourceControllerBatchLoadBase extends DataSourceControllerBase {

    public get_data_from_cache(var_data: VarDataBaseVO, ds_res: any, index_value: number): any {
        throw new Error('This type of DataSourceController should not use this method');
    }

    public get_data_index(var_data: VarDataBaseVO): any {
        throw new Error('This type of DataSourceController should not use this method');
    }

    public async load_node_data(node: VarDAGNode) {
        throw new Error('This type of DataSourceController should not use this method');
    }

    public async get_data(param: VarDataBaseVO): Promise<any> {
        throw new Error('This type of DataSourceController should not use this method');
    }

    /**
     * Stratégie de chargement des données en fonction des var_datas contenu dans les nodes en mode batch
     * Par définition les noeuds ont été testés avant pour vérifier que ce ne sont pas des nodes de type pixel avec un card > 1
     * @param nodes
     */
    public async load_nodes_datas_using_pipeline(nodes_by_index: { [index: string]: VarDAGNode }, pipeline: PromisePipeline): Promise<void> {

        try {
            await this.load_nodes_data_using_pipeline(nodes_by_index, pipeline);
        } catch (error) {
            ConsoleHandler.error('Error loading nodes data for datasource ' + this.name + ' : ' + error);
            for (const i in nodes_by_index) {
                const node = nodes_by_index[i];
                node.var_data.value_type = VarDataBaseVO.VALUE_TYPE_DENIED;
            }
            StatsController.register_stat_COMPTEUR('DataSourceControllerBatchLoadBase', 'load_nodes_data_using_pipeline_error', this.name);
        }
    }


    /**
     * Seule méthode à implémenter pour les DataSourceControllerBatchLoadBase
     * @param nodes_by_index
     * @param pipeline
     */
    public abstract load_nodes_data_using_pipeline(nodes_by_index: { [index: string]: VarDAGNode }, pipeline: PromisePipeline): Promise<void>;
}