import ModuleTableFieldController from '../../../../shared/modules/DAO/ModuleTableFieldController';
import NumRange from '../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../shared/modules/DataRender/vos/NumSegment';
import EventsController from '../../../../shared/modules/Eventify/EventsController';
import EventifyEventInstanceVO from '../../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import { all_promises } from '../../../../shared/tools/PromiseTools';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import VarDAGNode from '../../../modules/Var/vos/VarDAGNode';
import CurrentBatchDSCacheHolder from '../CurrentBatchDSCacheHolder';
import DataSourceControllerBase from './DataSourceControllerBase';

export default abstract class DataSourceControllerNumRangeIndexedBase extends DataSourceControllerBase {

    protected tried_to_deduce_segment_field_name_by_vo_type: { [vo_type: string]: boolean } = {};
    protected segment_field_name_by_vo_type: { [vo_type: string]: string } = {};

    public get_data_from_cache(var_data: VarDataBaseVO, ds_res: any, index_value: number): any {
        return ds_res;
    }

    /**
     * Par défaut on décrit une gestion de type index de matroid
     *  Mais pour des datasources qui utilise un range plutôt pour décrire les datas à utiliser ou à charger, on utilise d'autres stratégies
     * @param node
     */
    public async load_node_data(node: VarDAGNode): Promise<void> {

        if (typeof node.datasources[this.name] !== 'undefined') {
            return;
        }

        StatsController.register_stat_COMPTEUR('DataSources', this.name, 'load_node_data_IN');
        const time_load_node_data_in = Dates.now_ms();

        const data_indexs: NumRange[] = this.get_data_index(node.var_data) as NumRange[];

        if ((!data_indexs) || (!data_indexs.length)) {
            node.datasources[this.name] = null;
            return;
        }

        node.datasources[this.name] = {};
        if (!CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name]) {
            CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name] = {};
        }

        // Autre version, avec des evenements pour essayer de //iser les chargement ici aussi
        // 1 - on liste les data_index nécessaires en séparant ceux pour lesquels on a les datas, et ceux pour lesquels on doit charger les datas
        // 2 - si on doit charger des datas, on regarde les sémaphores, et si les sémaphores sont pris, on stocke les promesses dans un tableau
        // 3 - on lance le chargement des datas dont les sémaphores sont libres et on ajoute les promesses au tableau
        // 4 - on attend que toutes les promesses soient résolues
        // 5 - on met à jour les datas dans le node
        const promises_to_await = [];
        let needs_to_load_datas = false;
        const limit_num_ranges_field_to = [];

        // TODO FIXME : On devrait avoir l'info directement dans le datasource du field qui limite les num_ranges mais on tente de le déduire ici
        if ((!this.segment_field_name_by_vo_type[node.var_data._type]) && (!this.tried_to_deduce_segment_field_name_by_vo_type[node.var_data._type])) {
            this.tried_to_deduce_segment_field_name_by_vo_type[node.var_data._type] = true;

            const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[node.var_data._type];

            for (const i in fields) {
                const field = fields[i];

                if (node.var_data[field.field_name] === data_indexs) {
                    this.segment_field_name_by_vo_type[node.var_data._type] = field.field_name;
                    break;
                }
            }
        }
        const segment_field_name = this.segment_field_name_by_vo_type[node.var_data._type];

        RangeHandler.foreach_ranges_sync(data_indexs, (data_index: number) => {

            if (typeof CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index] !== 'undefined') {
                return;
            }

            if (!CurrentBatchDSCacheHolder.semaphore_event_listener_promise[this.name]) {
                CurrentBatchDSCacheHolder.semaphore_event_listener_promise[this.name] = {};
            }

            if (!CurrentBatchDSCacheHolder.semaphore_event_listener_promise[this.name][data_index]) {
                CurrentBatchDSCacheHolder.semaphore_event_listener_promise[this.name][data_index] = EventsController.await_next_event('DataSourceControllerNumRangeIndexedBase.load_node_data.' + this.name + '.' + data_index);
                needs_to_load_datas = true;

                // Si on a identifié le champs de segmentation, on limite aux données nécessaires
                if (segment_field_name) {
                    limit_num_ranges_field_to.push(RangeHandler.create_single_elt_NumRange(data_index, NumSegment.TYPE_INT));
                }
            }
            promises_to_await.push(CurrentBatchDSCacheHolder.semaphore_event_listener_promise[this.name][data_index]);
        });

        if (needs_to_load_datas) {

            StatsController.register_stat_COMPTEUR('DataSources', this.name, 'get_data');
            const time_in = Dates.now_ms();

            let memorized_num_ranges_field = null;
            // Si on a identifié le champs de segmentation, on limite aux données nécessaires
            if (segment_field_name) {
                memorized_num_ranges_field = node.var_data[segment_field_name];
                node.var_data[segment_field_name] = RangeHandler.getRangesUnion(limit_num_ranges_field_to);
            }

            // On charge les datas et on les met à jour dans le cache + on lance les events liés
            const datas = await this.get_data(node.var_data);

            // On remet les données d'origine
            if (segment_field_name) {
                node.var_data[segment_field_name] = memorized_num_ranges_field;
            }

            const time_out = Dates.now_ms();
            // Attention ici les chargement sont très parrallèlisés et on peut avoir des stats qui se chevauchent donc une somme des temps très nettement > au temps total réel
            StatsController.register_stat_DUREE('DataSources', this.name, 'get_data', time_out - time_in);

            for (const data_index in datas) {
                const e = datas[data_index];

                /**
                 * On ne change pas les datas qu'on avait déjà
                 */
                if (typeof CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index] === 'undefined') {
                    CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index] = ((typeof e === 'undefined') ? null : e);
                    EventsController.emit_event(EventifyEventInstanceVO.new_event('DataSourceControllerNumRangeIndexedBase.load_node_data.' + this.name + '.' + data_index));
                }
            }
        }

        await all_promises(promises_to_await);

        RangeHandler.foreach_ranges_sync(data_indexs, (data_index: number) => {

            if (typeof CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index] === 'undefined') {
                throw new Error('Datasource ' + this.name + ' not loaded for data_index ' + data_index + ' for node ' + node.var_data.index + ' ' + node.var_data.var_id + ': this should not happen');
            }
            node.datasources[this.name][data_index] = CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index];
        });


        // await RangeHandler.foreach_ranges(data_indexs, async (data_index: number) => {

        //     if (typeof CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index] === 'undefined') {
        //         if (!CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name]) {
        //             CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name] = {};
        //         }

        //         if (!CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name][data_index]) {
        //             CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name][data_index] = {};
        //         }
        //         CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name][data_index][node.var_data.index] = node;

        //         if (!CurrentBatchDSCacheHolder.promises_waiting_for_semaphore[this.name]) {
        //             CurrentBatchDSCacheHolder.promises_waiting_for_semaphore[this.name] = {};
        //         }

        //         if (!CurrentBatchDSCacheHolder.promises_waiting_for_semaphore[this.name][data_index]) {
        //             CurrentBatchDSCacheHolder.promises_waiting_for_semaphore[this.name][data_index] = {};
        //         }

        //         /**
        //          * On ajoute un sémaphore pour éviter de faire 10 fois la requête sur un batch
        //          */
        //         if (CurrentBatchDSCacheHolder.semaphore_batch_ds_cache[this.name][data_index] === true) {
        //             return new Promise((resolve, reject) => {
        //                 CurrentBatchDSCacheHolder.promises_waiting_for_semaphore[this.name][data_index][node.var_data.index] = resolve;
        //             });
        //         }
        //         CurrentBatchDSCacheHolder.semaphore_batch_ds_cache[this.name][data_index] = true;

        //         StatsController.register_stat_COMPTEUR('DataSources', this.name, 'get_data');
        //         const time_in = Dates.now_ms();

        //         const datas = await this.get_data(node.var_data);

        //         const time_out = Dates.now_ms();
        //         // Attention ici les chargement sont très parrallèlisés et on peut avoir des stats qui se chevauchent donc une somme des temps très nettement > au temps total réel
        //         StatsController.register_stat_DUREE('DataSources', this.name, 'get_data', time_out - time_in);

        //         for (const j in datas) {
        //             const e = datas[j];

        //             /**
        //              * On ne change pas les datas qu'on avait déjà
        //              */
        //             if (typeof CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][j] === 'undefined') {
        //                 CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][j] = ((typeof e === 'undefined') ? null : e);
        //             }
        //         }

        //         const nodes_waiting_for_semaphore_indexes = Object.keys(CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name][data_index]);

        //         delete CurrentBatchDSCacheHolder.semaphore_batch_ds_cache[this.name][data_index];

        //         for (const j in nodes_waiting_for_semaphore_indexes) {
        //             const index = nodes_waiting_for_semaphore_indexes[j];

        //             if (CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index]) {
        //                 CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name][data_index][index].datasources[this.name][data_index] = this.get_data_from_cache(
        //                     CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name][data_index][index].var_data,
        //                     CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index],
        //                     null
        //                 );
        //             }

        //             delete CurrentBatchDSCacheHolder.nodes_waiting_for_semaphore[this.name][data_index][index];

        //             const cb = CurrentBatchDSCacheHolder.promises_waiting_for_semaphore[this.name][data_index][index];
        //             delete CurrentBatchDSCacheHolder.promises_waiting_for_semaphore[this.name][data_index][index];

        //             if (cb) {
        //                 await cb("DataSourceControllerCustomIndexedBase.promises_waiting_for_semaphore");
        //             }
        //         }
        //         return;
        //     }

        //     if (CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index]) {
        //         node.datasources[this.name][data_index] = this.get_data_from_cache(
        //             node.var_data,
        //             CurrentBatchDSCacheHolder.current_batch_ds_cache[this.name][data_index],
        //             null
        //         );
        //     }
        // });

        const time_load_node_data_out = Dates.now_ms();
        // Attention ici les chargement sont très parrallèlisés et on peut avoir des stats qui se chevauchent donc une somme des temps très nettement > au temps total réel
        StatsController.register_stat_DUREE('DataSources', this.name, 'load_node_data', time_load_node_data_out - time_load_node_data_in);
    }

    /**
     * On utilise une clé unique (au sein d'un datasource) pour identifier la data liée à un var data
     *  et on fournit une fonction simple pour traduire le var_data en clé unique de manière à gérer le cache
     *  de façon centralisée. Par défaut on utilise l'index mais très important d'optimiser cette fonction sur chaque DS
     *  typiquement si on charge toujours la même data indépendemment du var_data....
     */
    public abstract get_data_index(var_data: VarDataBaseVO): NumRange[];

    /**
     * Dans ce cas la fonction qui load les datas doit aussi faire le lien entre le int qui vient du numrange et chaque valeur
     * @param param
     */
    public abstract get_data(param: VarDataBaseVO): Promise<{ [i: number]: any }>;
}