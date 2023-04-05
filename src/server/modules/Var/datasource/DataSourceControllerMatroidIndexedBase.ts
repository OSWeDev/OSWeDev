import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import StatVO from '../../../../shared/modules/Stats/vos/StatVO';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import StatsServerController from '../../Stats/StatsServerController';
import VarsdatasComputerBGThread from '../bgthreads/VarsdatasComputerBGThread';
import DataSourceControllerBase from './DataSourceControllerBase';

export default abstract class DataSourceControllerMatroidIndexedBase extends DataSourceControllerBase {

    /**
     * On utilise une clé unique (au sein d'un datasource) pour identifier la data liée à un var data
     *  et on fournit une fonction simple pour traduire le var_data en clé unique de manière à gérer le cache
     *  de façon centralisée. Par défaut on utilise l'index mais très important d'optimiser cette fonction sur chaque DS
     *  typiquement si on charge toujours la même data indépendemment du var_data....
     */
    public get_data_index(var_data: VarDataBaseVO): any {
        return var_data.index;
    }

    /**
     * Par défaut on décrit une gestion de type index de matroid
     *  Mais pour des datasources qui utilise un range plutôt pour décrire les datas à utiliser ou à charger, on utilise d'autres stratégies
     * @param node
     */
    public async load_node_data(node: VarDAGNode) {

        StatsServerController.register_stat('DataSources.' + node.var_data.var_id + '.load_node_data.nb',
            1, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);
        StatsServerController.register_stat('DataSourceControllerMatroidIndexedBase.' + node.var_data.var_id + '.load_node_data.nb',
            1, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);

        if (typeof node.datasources[this.name] !== 'undefined') {
            return;
        }

        if (!VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name]) {
            VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name] = {};
        }

        let data_index: string = this.get_data_index(node.var_data) as string;
        if (typeof VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name][data_index] === 'undefined') {

            StatsServerController.register_stat('DataSources.' + node.var_data.var_id + '.get_data.nb',
                1, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);
            StatsServerController.register_stat('DataSourceControllerMatroidIndexedBase.' + node.var_data.var_id + '.get_data.nb',
                1, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);

            let data = await this.get_data(node.var_data);
            VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name][data_index] = ((typeof data === 'undefined') ? null : data);
        }
        node.datasources[this.name] = VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name][data_index];
    }
}