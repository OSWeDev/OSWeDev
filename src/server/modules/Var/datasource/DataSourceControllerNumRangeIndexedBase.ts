import NumRange from '../../../../shared/modules/DataRender/vos/NumRange';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsTypeVO from '../../../../shared/modules/Stats/vos/StatsTypeVO';
import StatVO from '../../../../shared/modules/Stats/vos/StatVO';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import StatsServerController from '../../Stats/StatsServerController';
import VarsdatasComputerBGThread from '../bgthreads/VarsdatasComputerBGThread';
import DataSourceControllerBase from './DataSourceControllerBase';

export default abstract class DataSourceControllerNumRangeIndexedBase extends DataSourceControllerBase {

    /**
     * On utilise une clé unique (au sein d'un datasource) pour identifier la data liée à un var data
     *  et on fournit une fonction simple pour traduire le var_data en clé unique de manière à gérer le cache
     *  de façon centralisée. Par défaut on utilise l'index mais très important d'optimiser cette fonction sur chaque DS
     *  typiquement si on charge toujours la même data indépendemment du var_data....
     */
    public abstract get_data_index(var_data: VarDataBaseVO): NumRange[];

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

        let data_index: NumRange[] = this.get_data_index(node.var_data) as NumRange[];

        if ((!data_index) || (!data_index.length)) {
            node.datasources[this.name] = null;
            return;
        }

        node.datasources[this.name] = {};
        if (!VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name]) {
            VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name] = {};
        }
        await RangeHandler.foreach_ranges(data_index, async (i: number) => {

            if (typeof VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name][i] === 'undefined') {

                StatsServerController.register_stat('DataSources', this.name, 'get_data', StatsTypeVO.TYPE_COMPTEUR,
                    1, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);
                let time_in = Dates.now_ms();
                let data = await this.get_data(node.var_data);
                let time_out = Dates.now_ms();
                // Attention ici les chargement sont très parrallèlisés et on peut avoir des stats qui se chevauchent donc une somme des temps très nettement > au temps total réel
                StatsServerController.register_stats('DataSources', this.name, 'get_data', StatsTypeVO.TYPE_DUREE,
                    time_out - time_in, [StatVO.AGGREGATOR_SUM, StatVO.AGGREGATOR_MIN, StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN], TimeSegment.TYPE_MINUTE);

                for (let j in data) {
                    let e = data[j];

                    /**
                     * On ne change pas les datas qu'on avait déjà
                     */
                    if (typeof VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name][j] === 'undefined') {
                        VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name][j] = ((typeof e === 'undefined') ? null : e);
                    }
                }
            }

            if (VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name][i]) {
                node.datasources[this.name][i] = VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name][i];
            }
        });

        let time_load_node_data_out = Dates.now_ms();
        // Attention ici les chargement sont très parrallèlisés et on peut avoir des stats qui se chevauchent donc une somme des temps très nettement > au temps total réel
        StatsServerController.register_stats('DataSources', this.name, 'load_node_data', StatsTypeVO.TYPE_DUREE,
            time_load_node_data_out - time_load_node_data_in, [StatVO.AGGREGATOR_SUM, StatVO.AGGREGATOR_MIN, StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN], TimeSegment.TYPE_MINUTE);
    }

    /**
     * Dans ce cas la fonction qui load les datas doit aussi faire le lien entre le int qui vient du numrange et chaque valeur
     * @param param
     */
    public abstract get_data(param: VarDataBaseVO): Promise<{ [i: number]: any }>;
}