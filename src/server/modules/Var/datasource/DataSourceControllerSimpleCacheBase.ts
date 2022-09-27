import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarsdatasComputerBGThread from '../bgthreads/VarsdatasComputerBGThread';
import DataSourceControllerBase from './DataSourceControllerBase';

export default abstract class DataSourceControllerSimpleCacheBase extends DataSourceControllerBase {

    private nodes_waiting_for_semaphore: { [var_data_index: string]: VarDAGNode } = {};

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
     */
    public async load_node_data(node: VarDAGNode) {
        if (typeof node.datasources[this.name] !== 'undefined') {
            return;
        }

        if (typeof VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name]['c'] === 'undefined') {

            this.nodes_waiting_for_semaphore[node.var_data.index] = node;

            /**
             * On ajoute un sémaphore pour éviter de faire 10 fois la requête sur un batch
             */
            if (VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name]['semaphore'] === true) {
                return;
            }
            VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name]['semaphore'] = true;

            let data = await this.get_data(node.var_data);
            VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name]['c'] = ((typeof data === 'undefined') ? null : data);

            for (let i in this.nodes_waiting_for_semaphore) {
                this.nodes_waiting_for_semaphore[i].datasources[this.name] = VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name]['c'];
            }

            return;
        }

        node.datasources[this.name] = VarsdatasComputerBGThread.getInstance().current_batch_ds_cache[this.name]['c'];
    }
}