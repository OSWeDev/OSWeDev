import ConsoleHandler from '../../../tools/ConsoleHandler';
import EnvHandler from '../../../tools/EnvHandler';
import ObjectHandler from '../../../tools/ObjectHandler';
import SemaphoreHandler from '../../../tools/SemaphoreHandler';
import MatroidController from '../../Matroid/MatroidController';
import VarDataBaseVO from '../vos/VarDataBaseVO';
import VarDAG from './VarDAG';
import VarDAGNodeDep from './VarDAGNodeDep';
import DAGNodeBase from './dagbase/DAGNodeBase';

export default class VarDAGNode extends DAGNodeBase {

    public static TAG_CLIENT: string = 'CLIENT';
    public static TAG_SERVER: string = 'SERVER';

    public static TAG_TO_DEPLOY: string = 'TO_DEPLOY';
    public static TAG_DEPLOYING: string = 'DEPLOYING';
    public static TAG_TO_DATA_LOAD: string = 'TO_DATA_LOAD';
    public static TAG_DATA_LOADING: string = 'DATA_LOADING';
    public static TAG_TO_COMPUTE: string = 'TO_COMPUTE';
    public static TAG_COMPUTING: string = 'COMPUTING';
    public static TAG_TO_NOTIFY: string = 'TO_NOTIFY';
    public static TAG_NOTIFYING: string = 'NOTIFYING';
    public static TAG_TO_UPDATE_IN_DB: string = 'TO_UPDATE_IN_DB';
    public static TAG_UPDATING_IN_DB: string = 'UPDATING_IN_DB';
    public static TAG_DELETING: string = 'TO_DELETING';

    /**
     * Factory de noeuds en fonction du nom. Permet d'assurer l'unicité des params dans l'arbre
     *  La value du noeud est celle du var_data passé en param, et donc si undefined le noeud est non calculé
     *  Le nom du noeud est l'index du var_data
     * @param is_batch_var par défaut false, il faut mettre true uniquement pour indiquer que c'est une var demandée par soit le serveur soit le client. et normalement
     *  c'est géré dans OSWedev
     * @returns {VarDAGNode}
     */
    public static async getInstance(var_dag: VarDAG, var_data: VarDataBaseVO, is_batch_var: boolean, already_tried_load_cache_complet: boolean = false): Promise<VarDAGNode> {

        return await SemaphoreHandler.semaphore("VarDAGNode.getInstance", async () => {

            if (!!var_dag.nodes[var_data.index]) {
                let res = var_dag.nodes[var_data.index];

                // Le but est de savoir si on était un batch var ne serait-ce qu'une fois parmi les demandes de calcul de cette var
                if (is_batch_var && !res.is_batch_var) {

                    if (EnvHandler.DEBUG_VARS) {
                        ConsoleHandler.warn('Pour ma culture G: on demande un noeud dans l\'arbre qui existe déjà :' +
                            var_data.index + ': et qui n\'était pas un batch var, mais qui le devient');
                    }
                }

                if (is_batch_var) {
                    res.is_batch_var = true;
                }

                // on a donc déjà checké en base de données si on pouvait trouver la var
                res.already_tried_load_cache_complet = res.is_batch_var || already_tried_load_cache_complet;

                return res;
            }

            /**
             * On check qu'on essaie pas d'ajoute une var avec un maxrange quelque part qui casserait tout
             */
            if (!MatroidController.getInstance().check_bases_not_max_ranges(var_data)) {
                ConsoleHandler.error('VarDAGNode.getInstance:!check_bases_not_max_ranges:' + var_data.index);
                return null;
            }

            return (new VarDAGNode(var_dag, var_data/*, is_registered*/, is_batch_var)).linkToDAG();
        });
    }

    /**
     * Tous les noeuds sont déclarés / initialisés comme des noeuds de calcul. C'est uniquement en cas de split (sur un import ou précalcul partiel)
     *  qu'on va switcher sur un mode aggégateur et configurer des aggregated_nodes
     */
    public is_aggregator: boolean = false;

    /**
     * Savoir si le noeud fait partie des questions qu'on tente de résoudre
     */
    public is_batch_var: boolean = false;

    /**
     * CAS A : On a une noeud de calcul - qui utilise la fonction compute du VarController : Les dépendances descendantes :
     *  - undefined indique qu'on a pas chargé les deps ou que l'on est en cas B
     *  - toutes les deps doivent donc être chargées en même temps (c'est le cas dans le fonctionnement actuel des VarsControllers)
     */

    /**
     * CAS B : On a une noeud aggregateur - qui utilise la fonction aggregate du VarController : Les noeuds aggrégés
     */
    public aggregated_datas: { [var_data_index: string]: VarDataBaseVO } = {};

    /**
     * Toutes les données chargées pour ce noeud sont disponibles directement ici, classées par datasource
     */
    public datasources: { [ds_name: string]: any } = {};

    public has_started_deployment: boolean = false;
    public successfully_deployed: boolean = false;

    public already_tried_loading_data_and_deploy: boolean = false;
    public already_tried_load_cache_complet: boolean = false;

    public already_sent_result_to_subs: boolean = false;

    /**
     * L'usage du constructeur est prohibé, il faut utiliser la factory
     */
    private constructor(public var_dag: VarDAG, public var_data: VarDataBaseVO, is_batch_var: boolean) {
        super();

        this.is_batch_var = is_batch_var;
        if (is_batch_var) {
            // on a donc déjà checké en base de données si on pouvait trouver la var
            this.already_tried_load_cache_complet = true;
        }
    }


    /**
     * Pour l'ajout des tags, on veille toujours à vérifier qu'on a pas un tag TO_DELETE, et la possibilité de supprimer le noeud.
     *  Sinon on refuse l'ajout
     * @param tag Le tag à ajouter
     */
    public add_tag(tag: string): boolean {

        if (this.is_deletable) {
            return false;
        }
        this.tags[tag] = true;

        if (!this.var_dag) {
            return true;
        }

        this.var_dag.tags[tag][this.var_data.index] = this;
        return true;
    }

    public remove_tag(tag: string) {

        delete this.tags[tag];

        if (!this.var_dag) {
            return;
        }
        delete this.var_dag.tags[tag][this.var_data.index];
    }

    /**
     * Ajouter une dépendance descendante sur un noeud, et cabler complètement la dep dans les 2 sens
     * @param dep VarDAGNodeDep dont les outgoings et le name sont défini, le reste n'est pas utile à ce stade
     */
    public addOutgoingDep(dep_name: string, outgoing_node: VarDAGNode) {

        /**
         * si la dep est déjà identifiée, ignore
         */
        if (this.outgoing_deps && this.outgoing_deps[dep_name]) {
            return;
        }

        let dep: VarDAGNodeDep = new VarDAGNodeDep(dep_name, outgoing_node);

        dep.incoming_node = this;

        if (!this.outgoing_deps) {
            this.outgoing_deps = {};
        }
        this.outgoing_deps[dep.dep_name] = dep;

        if (!dep.outgoing_node.incoming_deps) {
            dep.outgoing_node.incoming_deps = {};
        }
        dep.outgoing_node.incoming_deps[dep.dep_name] = dep;

        if (!!this.var_dag.roots[dep.outgoing_node.var_data.index]) {
            delete this.var_dag.roots[dep.outgoing_node.var_data.index];
        }

        if (!!this.var_dag.leafs[this.var_data.index]) {
            delete this.var_dag.leafs[this.var_data.index];
        }
    }

    /**
     * Méthode appelée pour supprimer le noeud de l'arbre
     */
    public unlinkFromDAG(): VarDAGNode {

        if (!this.var_dag) {
            return;
        }
        let dag = this.var_dag;

        delete dag.nodes[this.var_data.index];
        dag.nb_nodes--;

        for (let i in this.incoming_deps) {
            let incoming_dep = this.incoming_deps[i];
            delete incoming_dep.incoming_node.outgoing_deps[incoming_dep.dep_name];

            if (!ObjectHandler.hasAtLeastOneAttribute(incoming_dep.incoming_node.outgoing_deps)) {
                dag.leafs[(incoming_dep.incoming_node as VarDAGNode).var_data.index] = incoming_dep.incoming_node as VarDAGNode;
            }
        }

        for (let i in this.outgoing_deps) {
            let outgoing_dep = this.outgoing_deps[i];
            delete outgoing_dep.outgoing_node.incoming_deps[outgoing_dep.dep_name];

            if (!ObjectHandler.hasAtLeastOneAttribute(outgoing_dep.outgoing_node.outgoing_deps)) {
                dag.roots[(outgoing_dep.outgoing_node as VarDAGNode).var_data.index] = outgoing_dep.outgoing_node as VarDAGNode;
            }
        }

        if (!!dag.leafs[this.var_data.index]) {
            delete dag.leafs[this.var_data.index];
        }
        if (!!dag.roots[this.var_data.index]) {
            delete dag.roots[this.var_data.index];
        }

        return this;
    }

    /**
     * Méthode appelée par le constructeur pour lier le noeud à l'arbre
     */
    public linkToDAG(): VarDAGNode {

        this.var_dag.nodes[this.var_data.index] = this;
        this.var_dag.nb_nodes++;

        this.var_dag.leafs[this.var_data.index] = this;
        this.var_dag.roots[this.var_data.index] = this;

        return this;
    }
}
