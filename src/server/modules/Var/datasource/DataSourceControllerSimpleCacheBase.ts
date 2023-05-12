import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsTypeVO from '../../../../shared/modules/Stats/vos/StatsTypeVO';
import StatVO from '../../../../shared/modules/Stats/vos/StatVO';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarsController from '../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import StatsServerController from '../../Stats/StatsServerController';
import VarsdatasComputerBGThread from '../bgthreads/VarsdatasComputerBGThread';
import DataSourceControllerBase from './DataSourceControllerBase';

export default abstract class DataSourceControllerSimpleCacheBase extends DataSourceControllerBase {

    private nodes_waiting_for_semaphore: { [var_data_index: string]: VarDAGNode } = {};
    private promises_waiting_for_semaphore: { [var_data_index: string]: any } = {};

    /**
     * On utilise une clé unique (au sein d'un datasource) pour identifier la data liée à un var data
     *  et on fournit une fonction simple pour traduire le var_data en clé unique de manière à gérer le cache
     *  de façon centralisée. Par défaut on utilise l'index mais très important d'optimiser cette fonction sur chaque DS
     *  typiquement si on charge toujours la même data indépendemment du var_data....
     */
    public get_data_index(var_data: VarDataBaseVO): any {
        return null;
    }

    /**
     * Par défaut on décrit une gestion de type index de matroid
     *  Mais pour des datasources qui utilise un range plutôt pour décrire les datas à utiliser ou à charger, on utilise d'autres stratégies
     * @param node
     */
    public async load_node_data(node: VarDAGNode) {

        if (typeof node.datasources[this.name] !== 'undefined') {
            return;
        }

        StatsServerController.register_stat('DataSources', this.name, 'load_node_data_IN', StatsTypeVO.TYPE_COMPTEUR,
            1, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);
        let time_load_node_data_in = Dates.now_ms();

        if (!VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name]) {
            VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name] = {};
        }

        if (typeof VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name]['c'] === 'undefined') {

            this.nodes_waiting_for_semaphore[node.var_data.index] = node;

            /**
             * On ajoute un sémaphore pour éviter de faire 10 fois la requête sur un batch
             */
            if (VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name]['semaphore'] === true) {
                return new Promise((resolve, reject) => {
                    this.promises_waiting_for_semaphore[node.var_data.index] = resolve;
                });
            }
            VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name]['semaphore'] = true;

            StatsServerController.register_stat('DataSources', this.name, 'get_data', StatsTypeVO.TYPE_COMPTEUR,
                1, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);

            let time_in = Dates.now_ms();
            let data = await this.get_data(node.var_data);
            let time_out = Dates.now_ms();
            // Attention ici les chargement sont très parrallèlisés et on peut avoir des stats qui se chevauchent donc une somme des temps très nettement > au temps total réel
            StatsServerController.register_stats('DataSources', this.name, 'get_data', StatsTypeVO.TYPE_DUREE,
                time_out - time_in, [StatVO.AGGREGATOR_SUM, StatVO.AGGREGATOR_MIN, StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN], TimeSegment.TYPE_MINUTE);

            VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name]['c'] = ((typeof data === 'undefined') ? null : data);

            for (let i in this.nodes_waiting_for_semaphore) {
                this.nodes_waiting_for_semaphore[i].datasources[this.name] = VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name]['c'];

                let cb = this.promises_waiting_for_semaphore[i];
                if (!!cb) {
                    await cb();
                }
            }

            let time_load_node_data_out = Dates.now_ms();
            // Attention ici les chargement sont très parrallèlisés et on peut avoir des stats qui se chevauchent donc une somme des temps très nettement > au temps total réel
            StatsServerController.register_stats('DataSources', this.name, 'load_node_data_LOADED', StatsTypeVO.TYPE_DUREE,
                time_load_node_data_out - time_load_node_data_in, [StatVO.AGGREGATOR_SUM, StatVO.AGGREGATOR_MIN, StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN], TimeSegment.TYPE_MINUTE);

            return;
        }

        node.datasources[this.name] = VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name]['c'];

        StatsServerController.register_stat('DataSources', this.name, 'load_node_data_FROM_CACHE', StatsTypeVO.TYPE_COMPTEUR,
            1, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);
    }
}