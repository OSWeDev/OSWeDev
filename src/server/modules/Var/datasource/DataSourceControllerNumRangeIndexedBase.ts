import NumRange from '../../../../shared/modules/DataRender/vos/NumRange';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import CurrentBatchDSCacheHolder from '../CurrentBatchDSCacheHolder';
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

        StatsController.register_stat_COMPTEUR('DataSources', this.name, 'load_node_data_IN');
        let time_load_node_data_in = Dates.now_ms();

        let data_index: NumRange[] = this.get_data_index(node.var_data) as NumRange[];

        if ((!data_index) || (!data_index.length)) {
            node.datasources[this.name] = null;
            return;
        }

        node.datasources[this.name] = {};
        if (!CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name]) {
            CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name] = {};
        }
        await RangeHandler.foreach_ranges(data_index, async (i: number) => {

            if (typeof CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][i] === 'undefined') {

                StatsController.register_stat_COMPTEUR('DataSources', this.name, 'get_data');
                let time_in = Dates.now_ms();
                let data = await this.get_data(node.var_data);
                let time_out = Dates.now_ms();
                // Attention ici les chargement sont très parrallèlisés et on peut avoir des stats qui se chevauchent donc une somme des temps très nettement > au temps total réel
                StatsController.register_stat_DUREE('DataSources', this.name, 'get_data', time_out - time_in);

                for (let j in data) {
                    let e = data[j];

                    /**
                     * On ne change pas les datas qu'on avait déjà
                     */
                    if (typeof CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][j] === 'undefined') {
                        CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][j] = ((typeof e === 'undefined') ? null : e);
                    }
                }
            }

            if (CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][i]) {
                node.datasources[this.name][i] = CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][i];
            }
        });

        let time_load_node_data_out = Dates.now_ms();
        // Attention ici les chargement sont très parrallèlisés et on peut avoir des stats qui se chevauchent donc une somme des temps très nettement > au temps total réel
        StatsController.register_stat_DUREE('DataSources', this.name, 'load_node_data', time_load_node_data_out - time_load_node_data_in);
    }

    /**
     * Dans ce cas la fonction qui load les datas doit aussi faire le lien entre le int qui vient du numrange et chaque valeur
     * @param param
     */
    public abstract get_data(param: VarDataBaseVO): Promise<{ [i: number]: any }>;
}