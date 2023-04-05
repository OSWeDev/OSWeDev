import NumRange from '../../../../shared/modules/DataRender/vos/NumRange';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
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

        StatsServerController.register_stat('DataSources.' + node.var_data.var_id + '.load_node_data.nb',
            1, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);
        StatsServerController.register_stat('DataSourceControllerNumRangeIndexedBase.' + node.var_data.var_id + '.load_node_data.nb',
            1, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);

        if (typeof node.datasources[this.name] !== 'undefined') {
            return;
        }

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

                StatsServerController.register_stat('DataSources.' + node.var_data.var_id + '.get_data.nb',
                    1, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);
                StatsServerController.register_stat('DataSourceControllerNumRangeIndexedBase.' + node.var_data.var_id + '.get_data.nb',
                    1, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);

                let data = await this.get_data(node.var_data);

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
    }

    /**
     * Dans ce cas la fonction qui load les datas doit aussi faire le lien entre le int qui vient du numrange et chaque valeur
     * @param param
     */
    public abstract get_data(param: VarDataBaseVO): Promise<{ [i: number]: any }>;
}