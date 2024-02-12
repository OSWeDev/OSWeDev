import { isArray, isObject } from "lodash";
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

    public abstract get_data_index(var_data: VarDataBaseVO): { [i: number]: { index: string, ts_ranges: TSRange[] } };

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

        let data_indexs: { [i: number]: { index: string, ts_ranges: TSRange[] } } = this.get_data_index(node.var_data);

        if ((!data_indexs)) {
            node.datasources[this.name] = null;
            return;
        }

        node.datasources[this.name] = {};

        if (!CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name]) {
            CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name] = {};
        }

        for (let i in data_indexs) {
            let data_index: { index: string, ts_ranges: TSRange[] } = data_indexs[i];

            let is_max_range: boolean = ((this.zero_is_max_range) && (parseInt(i) == DataSourceControllerCustomIndexedBase.max_range_index_value)) ? true : false;

            if (typeof CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index.index] === 'undefined') {

                StatsController.register_stat_COMPTEUR('DataSources', this.name, 'get_data');
                let time_in = Dates.now_ms();

                let data = await this.get_data(node.var_data);

                let time_out = Dates.now_ms();
                // Attention ici les chargement sont très parrallèlisés et on peut avoir des stats qui se chevauchent donc une somme des temps très nettement > au temps total réel
                StatsController.register_stat_DUREE('DataSources', this.name, 'get_data', time_out - time_in);

                // Si on est sur maxrange, on stock le résultat sur l'index pour sortir toutes les datas ensuite
                if (is_max_range) {
                    CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index.index] = data;
                }

                let ts_ranges_index: string = RangeHandler.getIndexRanges(data_index.ts_ranges);

                for (let j in data) {
                    let e = data[j];

                    let fake_index: string = j + '_' + ts_ranges_index;

                    /**
                     * On ne change pas les datas qu'on avait déjà
                     */
                    if (typeof CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][fake_index] === 'undefined') {
                        CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][fake_index] = ((typeof e === 'undefined') ? null : e);
                    }
                }
            }

            // Si on est sur un maxrange, on sort toutes les datas du cache sauf max range
            if (is_max_range) {
                node.datasources[this.name] = CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index.index];
                continue;
            }

            if (CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index.index]) {
                node.datasources[this.name][i] = CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index.index];
            }
        }

        let time_load_node_data_out = Dates.now_ms();
        // Attention ici les chargement sont très parrallèlisés et on peut avoir des stats qui se chevauchent donc une somme des temps très nettement > au temps total réel
        StatsController.register_stat_DUREE('DataSources', this.name, 'load_node_data', time_load_node_data_out - time_load_node_data_in);
    }
}