import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import StatsTypeVO from '../../../../shared/modules/Stats/vos/StatsTypeVO';
import StatVO from '../../../../shared/modules/Stats/vos/StatVO';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
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

        StatsController.register_stat('DataSources', this.name, 'load_node_data_IN', StatsTypeVO.TYPE_COMPTEUR,
            1, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);
        let time_load_node_data_in = Dates.now_ms();

        if (typeof node.datasources[this.name] !== 'undefined') {
            return;
        }

        if (!VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name]) {
            VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name] = {};
        }

        let data_index: string = this.get_data_index(node.var_data) as string;
        if (typeof VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name][data_index] === 'undefined') {

            StatsController.register_stat('DataSources', this.name, 'get_data', StatsTypeVO.TYPE_COMPTEUR,
                1, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);
            let time_in = Dates.now_ms();
            let data = await this.get_data(node.var_data);
            let time_out = Dates.now_ms();
            // Attention ici les chargement sont très parrallèlisés et on peut avoir des stats qui se chevauchent donc une somme des temps très nettement > au temps total réel
            StatsController.register_stats('DataSources', this.name, 'get_data', StatsTypeVO.TYPE_DUREE,
                time_out - time_in, [StatVO.AGGREGATOR_SUM, StatVO.AGGREGATOR_MIN, StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN], TimeSegment.TYPE_MINUTE);

            VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name][data_index] = ((typeof data === 'undefined') ? null : data);
        }
        node.datasources[this.name] = VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name][data_index];

        let time_load_node_data_out = Dates.now_ms();
        // Attention ici les chargement sont très parrallèlisés et on peut avoir des stats qui se chevauchent donc une somme des temps très nettement > au temps total réel
        StatsController.register_stats('DataSources', this.name, 'load_node_data', StatsTypeVO.TYPE_DUREE,
            time_load_node_data_out - time_load_node_data_in, [StatVO.AGGREGATOR_SUM, StatVO.AGGREGATOR_MIN, StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN], TimeSegment.TYPE_MINUTE);
    }
}