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

    /**
     * Permet de changer le param du node pour élargir la plage de données à charger
     */
    public target_segment_type: number = null;
    /**
     * Champ à modifier du node pour élargir la plage de données à charger
     */
    public field_target_segment_type: string = null;
    /**
     * Fonction qui permet de récupérer les datas à partir du cache si on a un target_segment_type et field_target_segment_type
     */
    public function_target_segment_type: (var_data: VarDataBaseVO, ds_res: any) => any = null;

    public abstract zero_is_max_range: boolean;

    /**
     * Fonction qui permet de récupérer les datas à partir du cache
     */
    public get_data_from_cache(var_data: VarDataBaseVO, ds_res: any, index_value: number): any {
        // Si j'ai un target segment type et field, je retourne le résultat de la fonction
        if ((this.target_segment_type !== null) && (!!this.field_target_segment_type)) {
            if (!this.function_target_segment_type) {
                throw new Error('get_data_from_cache: missing function_target_segment_type in ' + this.name);
            }

            const res = this.function_target_segment_type(var_data, ds_res);

            return (res && (index_value !== null)) ? res[index_value] : res;
        }

        return (index_value != null) ? ds_res[index_value] : ds_res;
    }

    /**
     * Fonction de base qui permet de récupérer les datas à partir du cache si on a un target_segment_type et field_target_segment_type
     * Il faut que le format des datas soit un objet avec des dates en clé {[i: number]: {[date: number]: any}}
     */
    public default_function_target_segment_type(var_data: VarDataBaseVO, ds_res: any): any {
        // Si j'ai un target segment type et field, je fais le traitement de base
        if (!!this.field_target_segment_type) {
            const res: any = {};

            if (!var_data || !ds_res) {
                return res;
            }

            for (const i in ds_res) {
                if (!ds_res[i]) {
                    continue;
                }

                if (!res[i]) {
                    res[i] = {};
                }

                RangeHandler.foreach_ranges_sync(var_data[this.field_target_segment_type], (date: number) => {
                    res[i][date] = ds_res[i][date];
                });
            }

            return res;
        }

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

        let var_data_for_calc: VarDataBaseVO = node.var_data;

        // On vérifie qu'on a bien les données nécessaires pour le traitement
        if (
            (this.target_segment_type !== null) && (!this.field_target_segment_type) ||
            (this.target_segment_type == null) && (this.field_target_segment_type)
        ) {
            throw new Error('load_node_data: missing target_segment_type or field_target_segment_type in ' + this.name);
        }

        // Si j'ai un target segment type, je dois le récupérer et l'appliquer sur le var data pour le reste du traitement
        if ((this.target_segment_type !== null) && (!!this.field_target_segment_type)) {
            var_data_for_calc = VarDataBaseVO.cloneFromVarId(var_data_for_calc, var_data_for_calc.var_id, true);

            if (!!var_data_for_calc[this.field_target_segment_type]) {
                var_data_for_calc[this.field_target_segment_type] = RangeHandler.get_ranges_according_to_segment_type(var_data_for_calc[this.field_target_segment_type], this.target_segment_type);
            }
        }

        const data_indexs: { [i: number]: { index: string, ts_ranges: TSRange[] } } = this.get_data_index(var_data_for_calc);

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
                    await (new Promise((resolve, reject) => {
                        CurrentBatchDSCacheHolder.promises_waiting_for_semaphore[this.name][data_index.index][node.var_data.index] = resolve;
                    }));
                    continue;
                }
                CurrentBatchDSCacheHolder.semaphore_batch_ds_cache[this.name][data_index.index] = true;

                StatsController.register_stat_COMPTEUR('DataSources', this.name, 'get_data');
                const time_in = Dates.now_ms();

                const datas = await this.get_data(var_data_for_calc);

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
                                CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index.index],
                                null
                            );
                        } else {
                            CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name][data_index.index][index].datasources[this.name][i] = this.get_data_from_cache(
                                CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name][data_index.index][index].var_data,
                                { [i]: CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index.index] },
                                parseInt(i)
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
                        CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index.index],
                        null
                    );
                } else {
                    node.datasources[this.name][i] = this.get_data_from_cache(
                        node.var_data,
                        { [i]: CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index.index] },
                        parseInt(i)
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