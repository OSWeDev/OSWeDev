import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import DataSourceControllerBase from './DataSourceControllerBase';
import DataSourcesController from './DataSourcesController';

export default abstract class DataSourceControllerSimpleCacheBase extends DataSourceControllerBase {

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
     * @param ds_cache
     */
    public async load_node_data(node: VarDAGNode, ds_cache: { [ds_data_index: string]: any }) {
        if (typeof node.datasources[this.name] !== 'undefined') {
            return;
        }

        if (typeof ds_cache['c'] === 'undefined') {
            let data = await this.get_data(node.var_data, ds_cache);
            ds_cache['c'] = ((typeof data === 'undefined') ? null : data);
        }
        node.datasources[this.name] = ds_cache['c'];
    }
}