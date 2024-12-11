import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
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
     * Seule méthode à implémenter pour les DataSourceControllerBatchLoadBase
     * @param nodes_by_index
     * @param pipeline
     */
    public abstract load_nodes_data_using_pipeline(nodes_by_index: { [index: string]: VarDAGNode }, pipeline: PromisePipeline): Promise<void>;
}