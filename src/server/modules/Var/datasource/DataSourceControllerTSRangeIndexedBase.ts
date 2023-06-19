
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../../shared/modules/DataRender/vos/TSRange';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import StatsTypeVO from '../../../../shared/modules/Stats/vos/StatsTypeVO';
import StatVO from '../../../../shared/modules/Stats/vos/StatVO';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import VarsdatasComputerBGThread from '../bgthreads/VarsdatasComputerBGThread';
import DataSourceControllerBase from './DataSourceControllerBase';

export default abstract class DataSourceControllerTSRangeIndexedBase extends DataSourceControllerBase {

    /**
     * On utilise une clé unique (au sein d'un datasource) pour identifier la data liée à un var data
     *  et on fournit une fonction simple pour traduire le var_data en clé unique de manière à gérer le cache
     *  de façon centralisée. Par défaut on utilise l'index mais très important d'optimiser cette fonction sur chaque DS
     *  typiquement si on charge toujours la même data indépendemment du var_data....
     */
    public abstract get_data_index(var_data: VarDataBaseVO): TSRange[];

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

        let data_index: TSRange[] = this.get_data_index(node.var_data) as TSRange[];

        if ((!data_index) || (!data_index.length)) {
            node.datasources[this.name] = null;
            return;
        }

        node.datasources[this.name] = {};
        if (!VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name]) {
            VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name] = {};
        }

        await RangeHandler.foreach_ranges(data_index, async (date: number) => {

            let ms_i = date;
            if (typeof VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name][ms_i] === 'undefined') {

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
                    if (typeof VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name][j] === 'undefined') {
                        VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name][j] = ((typeof e === 'undefined') ? null : e);
                    }
                }
            }

            if (VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name][ms_i]) {
                node.datasources[this.name][ms_i] = VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name][ms_i];
            }
        });

        let time_load_node_data_out = Dates.now_ms();
        // Attention ici les chargement sont très parrallèlisés et on peut avoir des stats qui se chevauchent donc une somme des temps très nettement > au temps total réel
        StatsController.register_stat_DUREE('DataSources', this.name, 'load_node_data', time_load_node_data_out - time_load_node_data_in);
    }

    /**
     * Dans ce cas la fonction qui load les datas doit aussi faire le lien entre le int qui vient du TSRange -valueOf- et chaque valeur
     * @param param
     */
    public abstract get_data(param: VarDataBaseVO): Promise<{ [ms_i: number]: any }>;
}