import TSRange from "../../../../shared/modules/DataRender/vos/TSRange";
import Dates from "../../../../shared/modules/FormatDatesNombres/Dates/Dates";
import StatsController from "../../../../shared/modules/Stats/StatsController";
import VarDataBaseVO from "../../../../shared/modules/Var/vos/VarDataBaseVO";
import RangeHandler from "../../../../shared/tools/RangeHandler";
import CurrentBatchDSCacheHolder from "../CurrentBatchDSCacheHolder";
import VarDAGNode from "../vos/VarDAGNode";
import DataSourceControllerBase from "./DataSourceControllerBase";

export default abstract class DataSourceControllerCustomIndexedBase extends DataSourceControllerBase {

    public static max_range_index_value: number = 0;

    public abstract zero_is_max_range: boolean;

    public get_data_from_cache(var_data: VarDataBaseVO, ds_res: any): any {
        return ds_res;
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

        StatsController.register_stat_COMPTEUR('DataSources', this.name, 'load_node_data_IN');
        const time_load_node_data_in = Dates.now_ms();

        const data_indexs: { [i: number]: { index: string, ts_ranges: TSRange[] } } = this.get_data_index(node.var_data);

        if ((!data_indexs)) {
            node.datasources[this.name] = null;
            return;
        }

        node.datasources[this.name] = {};

        for (const i in data_indexs) {
            const data_index: { index: string, ts_ranges: TSRange[] } = data_indexs[i];

            const is_max_range: boolean = ((this.zero_is_max_range) && (parseInt(i) == DataSourceControllerCustomIndexedBase.max_range_index_value)) ? true : false;

            if (typeof CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index.index] === 'undefined') {
                if (!CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name]) {
                    CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name] = {};
                }

                if (!CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name][data_index.index]) {
                    CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name][data_index.index] = {};
                }
                CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name][data_index.index][node.var_data.index] = node;

                if (!CurrentBatchDSCacheHolder.promises_waiting_for_semaphore[this.name]) {
                    CurrentBatchDSCacheHolder.promises_waiting_for_semaphore[this.name] = {};
                }

                if (!CurrentBatchDSCacheHolder.promises_waiting_for_semaphore[this.name][data_index.index]) {
                    CurrentBatchDSCacheHolder.promises_waiting_for_semaphore[this.name][data_index.index] = {};
                }

                /**
                 * On ajoute un sémaphore pour éviter de faire 10 fois la requête sur un batch
                 */
                if (CurrentBatchDSCacheHolder.semaphore_batch_ds_cache[this.name][data_index.index] === true) {
                    return new Promise((resolve, reject) => {
                        CurrentBatchDSCacheHolder.promises_waiting_for_semaphore[this.name][data_index.index][node.var_data.index] = resolve;
                    });
                }
                CurrentBatchDSCacheHolder.semaphore_batch_ds_cache[this.name][data_index.index] = true;

                StatsController.register_stat_COMPTEUR('DataSources', this.name, 'get_data');
                const time_in = Dates.now_ms();

                const datas = await this.get_data(node.var_data);

                const time_out = Dates.now_ms();
                // Attention ici les chargement sont très parrallèlisés et on peut avoir des stats qui se chevauchent donc une somme des temps très nettement > au temps total réel
                StatsController.register_stat_DUREE('DataSources', this.name, 'get_data', time_out - time_in);

                // Si on est sur maxrange, on stock le résultat sur l'index pour sortir toutes les datas ensuite
                if (is_max_range) {
                    CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index.index] = datas;
                }

                const ts_ranges_index: string = RangeHandler.getIndexRanges(data_index.ts_ranges);

                for (const j in datas) {
                    const e = datas[j];

                    const fake_index: string = j + '_' + ts_ranges_index;

                    /**
                     * On ne change pas les datas qu'on avait déjà
                     */
                    if (typeof CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][fake_index] === 'undefined') {
                        CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][fake_index] = ((typeof e === 'undefined') ? null : e);
                    }
                }

                const nodes_waiting_for_semaphore_indexes = Object.keys(CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name][data_index.index]);

                delete CurrentBatchDSCacheHolder.semaphore_batch_ds_cache[this.name][data_index.index];

                for (const j in nodes_waiting_for_semaphore_indexes) {
                    const index = nodes_waiting_for_semaphore_indexes[j];

                    if (CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index.index]) {// Si on est sur un maxrange, on sort toutes les datas du cache sauf max range
                        if (is_max_range) {
                            CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name][data_index.index][index].datasources[this.name] = this.get_data_from_cache(
                                CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name][data_index.index][index].var_data,
                                CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index.index]
                            );
                        } else {
                            CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name][data_index.index][index].datasources[this.name][i] = this.get_data_from_cache(
                                CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name][data_index.index][index].var_data,
                                CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index.index]
                            );
                        }
                    }

                    delete CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name][data_index.index][index];

                    const cb = CurrentBatchDSCacheHolder.promises_waiting_for_semaphore[this.name][data_index.index][index];
                    delete CurrentBatchDSCacheHolder.promises_waiting_for_semaphore[this.name][data_index.index][index];

                    if (cb) {
                        await cb("DataSourceControllerCustomIndexedBase.promises_waiting_for_semaphore");
                    }
                }
                continue;
            }

            if (CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index.index]) {
                // Si on est sur un maxrange, on sort toutes les datas du cache sauf max range
                if (is_max_range) {
                    node.datasources[this.name] = this.get_data_from_cache(
                        node.var_data,
                        CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index.index]
                    );
                } else {
                    node.datasources[this.name][i] = this.get_data_from_cache(
                        node.var_data,
                        CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index.index]
                    );
                }
            }
        }

        const time_load_node_data_out = Dates.now_ms();
        // Attention ici les chargement sont très parrallèlisés et on peut avoir des stats qui se chevauchent donc une somme des temps très nettement > au temps total réel
        StatsController.register_stat_DUREE('DataSources', this.name, 'load_node_data', time_load_node_data_out - time_load_node_data_in);
    }

    public abstract get_data_index(var_data: VarDataBaseVO): { [i: number]: { index: string, ts_ranges: TSRange[] } };
}