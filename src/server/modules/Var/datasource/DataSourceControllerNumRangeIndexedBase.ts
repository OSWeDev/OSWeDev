import NumRange from '../../../../shared/modules/DataRender/vos/NumRange';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import RangeHandler from '../../../../shared/tools/RangeHandler';
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
     * @param ds_cache
     */
    public async load_node_data(node: VarDAGNode, ds_cache: { [ds_data_index: string]: any }) {
        if (typeof node.datasources[this.name] !== 'undefined') {
            return;
        }

        let data_index: NumRange[] = this.get_data_index(node.var_data) as NumRange[];

        if ((!data_index) || (!data_index.length)) {
            node.datasources[this.name] = null;
            return;
        }

        node.datasources[this.name] = {};
        await RangeHandler.getInstance().foreach_ranges(data_index, async (i: number) => {

            if (typeof ds_cache[i] === 'undefined') {
                let data = await this.get_data(node.var_data, ds_cache);

                for (let j in data) {
                    let e = data[j];

                    /**
                     * On ne change pas les datas qu'on avait déjà
                     */
                    if (typeof ds_cache[j] === 'undefined') {
                        ds_cache[j] = ((typeof e === 'undefined') ? null : e);
                    }
                }
            }
            node.datasources[this.name][i] = ds_cache[i];
        });
    }

    /**
     * Dans ce cas la fonction qui load les datas doit aussi faire le lien entre le int qui vient du numrange et chaque valeur
     * @param param
     */
    public abstract async get_data(param: VarDataBaseVO, ds_cache: { [ds_data_index: string]: any }): Promise<{ [i: number]: any }>;
}