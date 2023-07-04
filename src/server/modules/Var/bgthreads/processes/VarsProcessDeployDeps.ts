import VarsController from '../../../../../shared/modules/Var/VarsController';
import VarDAG from '../../../../../shared/modules/Var/graph/VarDAG';
import VarDAGNode from '../../../../../shared/modules/Var/graph/VarDAGNode';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import VarsServerController from '../../VarsServerController';
import VarsdatasComputerBGThread from '../VarsdatasComputerBGThread';
import VarsProcessBase from './VarsProcessBase';

export default class VarsProcessDeployDeps extends VarsProcessBase {

    public static getInstance() {
        if (!VarsProcessDeployDeps.instance) {
            VarsProcessDeployDeps.instance = new VarsProcessDeployDeps();
        }
        return VarsProcessDeployDeps.instance;
    }

    private static instance: VarsProcessDeployDeps = null;

    private constructor() {
        super('VarsProcessDeployDeps', VarDAGNode.TAG_0_CREATED, VarDAGNode.TAG_2_DEPLOYING, VarDAGNode.TAG_2_DEPLOYED, 10, false, ConfigurationService.node_configuration.MAX_VarsProcessDeployDeps);
    }

    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }): Promise<boolean> {
        return false;
    }
    protected worker_sync(node: VarDAGNode): boolean {
        return false;
    }

    protected async worker_async(node: VarDAGNode): Promise<boolean> {

        if (ConfigurationService.node_configuration.DEBUG_VARS) {
            ConsoleHandler.log('VarsProcessDeployDeps:START: ' + node.var_data.index + ' ' + node.var_data.value);
        }

        /**
         * Si on a une value valide, c'est qu'on a pas besoin de déployer les deps
         */
        if (VarsServerController.has_valid_value(node.var_data)) {
            if (ConfigurationService.node_configuration.DEBUG_VARS) {
                ConsoleHandler.log('VarsProcessDeployDeps:END - has_valid_value: ' + node.var_data.index + ' ' + node.var_data.value);
            }
            return true;
        }

        // On charge les caches pour ces noeuds
        //  et on récupère les nouveaux vars_datas à insérer dans l'arbre
        await this.load_caches_and_imports_on_var_to_deploy(node);

        // On doit ensuite charger les ds pre deps
        await this.deploy_deps_on_vars_to_deploy(vars_to_deploy, var_dag);

        if (ConfigurationService.node_configuration.DEBUG_VARS) {
            ConsoleHandler.log('VarsProcessDeployDeps:END: ' + node.var_data.index + ' ' + node.var_data.value);
        }

        return true;
    }

    /**
     *  - On entame en vérifiant qu'on a testé le cas des imports parcellaires :
     *      - Si on a des imports, on split et on relance le déploiement sur les nouveaux noeuds restants à calculer
     *      - sinon, on continue en déployant normalement les deps de ce noeud
     *  - Pour chaque DEP :
     *      - Si la dep est déjà dans la liste des vars_datas, aucun impact, on continue normalement ce cas est géré au moment de créer les noeuds pour les params
     *      - Si le noeud existe dans l'arbre, on s'assure juste que la liaison existe vers le noeud qui a tenté de générer la dep et on fuit.
     *      - Si le noeud est nouveau on le crée, et on met le lien vers le noeud source de la dep :
     *          - si le var_data possède une data on valide directement le point suivant
     *          - si on a une data précompilée ou importée en cache ou en BDD, on récupère cette data et on la met dans le var_data actuel puis on arrête de propager
     *          - sinon
     *              - on essaie de charger une ou plusieurs donnée(s) intersectant ce param
     *              - si on en trouve, on sélectionne celles qu'on veut prioriser, et on découpe le noeud qu'on transforme en aggrégateur
     *              - sur chaque nouveau noeud sans valeur / y compris si on a pas trouvé d'intersecteurs on deploy_deps
     *                  (et donc pour lesquels on sait qu'on a de valeur ni en base ni en buffer ni dans l'arbre)
     * Pour les noeuds initiaux (les vars_datas en param), on sait qu'on ne peut pas vouloir donner un import complet en résultat, donc inutile de faire cette recherche
     *  par contre un import partiel oui
     *
     * Cas de la pixellisation :
     *  - On ignore la première recherche dans le cache, puisqu'on ne trouvera pas le noeud à l'identique. Il aura été pixellisé
     *  - On cherche les imports et on découpe si besoin
     *  - On déclenche ensuite la pixellisation et la recherche de datas pré-calcs :
     *      - on request count() et sum() [ou fonction d'aggrégat plus généralement] avec filtrage sur la var_id, le champ de segmentation en inclusif, et
     *          les autres champs en excatement égal.
     *      - Si le count est égal au cardinal de la dimension de pixellisation, on a le résultat, on met à jour la var et c'est terminé
     */
    private async load_caches_and_imports_on_var_to_deploy(node: VarDAGNode) {

        // ?? pourquoi on change ça ici => en fait c'est l'équivalent du tag je pense donc surement à supp
        // node.already_tried_loading_data_and_deploy = true;

        let DEBUG_VARS = ConfigurationService.node_configuration.DEBUG_VARS;

        let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);
        let varconf = VarsController.var_conf_by_id[node.var_data.var_id];

        /**
         * Imports
         */
        if ((!VarsServerController.has_valid_value(node.var_data)) && (!controller || !controller.optimization__has_no_imports)) {

            /**
             * On doit essayer de récupérer des données parcellaires
             *  si on a des données parcellaires par définition on doit quand même déployer les deps
             */

            await VarsImportsHandler.getInstance().load_imports_and_split_nodes(node);

            if (VarsServerController.has_valid_value(node.var_data)) {

                node.successfully_deployed = true;
                await this.notify_var_data_post_deploy(node);
                return;
            }
        }

        /**
         * Cas de la pixellisation qu'on sort des autres types de cache
         */
        if (varconf.pixel_activated) {

            await this.handle_pixellisation(node, varconf, var_dag, limit_to_aggregated_datas, DEBUG_VARS);

            if (node.successfully_deployed) {
                return;
            }
        } else {

            /**
             * Cache step C : cache partiel : uniquement si on a pas splitt sur import
             */
            if ((!VarsServerController.has_valid_value(node.var_data)) && (!vars_datas[node.var_data.index]) &&
                (!node.is_aggregator) &&
                (VarsCacheController.getInstance().use_partial_cache(node))) {

                await this.try_load_cache_partiel(node);

                if (VarsServerController.has_valid_value(node.var_data)) {

                    node.successfully_deployed = true;
                    await this.notify_var_data_post_deploy(node);
                    return;
                }
            }
        }

        if (limit_to_aggregated_datas) {

            // Si on a des données aggrégées elles sont déjà ok à renvoyer si on ne veut que savoir les données aggrégées
            node.successfully_deployed = true;
            await this.notify_var_data_post_deploy(node);
            return;
        }

        let deps: { [index: string]: VarDataBaseVO } = await this.get_node_deps(node);

        /**
         * Si dans les deps on a un denied, on refuse le tout
         */
        if (DEBUG_VARS) {
            ConsoleHandler.log('deploy_deps:' + node.var_data.index + ':IN:' + (deps ? Object.keys(deps).length : 0));
        }
        for (let i in deps) {
            let dep = deps[i];

            if (dep.value_type == VarDataBaseVO.VALUE_TYPE_DENIED) {
                node.var_data.value_type = VarDataBaseVO.VALUE_TYPE_DENIED;
                node.var_data.value = 0;
                node.var_data.value_ts = Dates.now();

                node.successfully_deployed = true;
                await this.notify_var_data_post_deploy(node);
                return;
            }

            if (DEBUG_VARS) {
                ConsoleHandler.log('deploy_deps:' + node.var_data.index + ':dep:' + dep.index + ':');
            }
        }
        if (DEBUG_VARS) {
            ConsoleHandler.log('deploy_deps:' + node.var_data.index + ':OUT:');
        }

        /**
         * On notifie d'un calcul en cours que si on a pas la valeur directement dans le cache ou en base de données, ou en import, ou en pixel, ou on a limité à une question sur les aggregated_datas, ou c'est denied
         */
        await VarsTabsSubsController.getInstance().notify_vardatas([new NotifVardatasParam([node.var_data], true)]);
        if (DEBUG_VARS) {
            ConsoleHandler.log('deploy_deps:' + node.var_data.index + ':notify_vardatas:OUT:');
        }

        if (deps) {
            await this.handle_deploy_deps(node, deps, deployed_vars_datas, vars_datas);
        }
        if (DEBUG_VARS) {
            ConsoleHandler.log('deploy_deps:' + node.var_data.index + ':handle_deploy_deps:OUT:');
        }

        node.successfully_deployed = true;
        if (DEBUG_VARS) {
            ConsoleHandler.log('deploy_deps:' + node.var_data.index + ':end_node_deploiement:OUT:');
        }

        await this.notify_var_data_post_deploy(node);
        if (DEBUG_VARS) {
            ConsoleHandler.log('deploy_deps:' + node.var_data.index + ':notify_var_data_post_deploy:OUT:');
        }
    }

    /**
     * On charge d'abord les datas pré deps
     * Ensuite on fait la liste des noeuds à déployer à nouveau (les deps)
     */
    private async deploy_deps_on_vars_to_deploy(
        vars_to_deploy: { [index: string]: VarDataBaseVO },
        var_dag: VarDAG
    ) {

        let max = Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2));
        let promise_pipeline = new PromisePipeline(max);

        for (let i in vars_to_deploy) {
            let var_to_deploy = vars_to_deploy[i];

            if (VarsServerController.has_valid_value(var_to_deploy)) {
                continue;
            }

            let var_dag_node = await VarDAGNode.getInstance(var_dag, var_to_deploy, false);
            if (!var_dag_node) {
                await promise_pipeline.end();
                promise_pipeline = new PromisePipeline(max);
                return;
            }

            await promise_pipeline.push(async () => {
                await this.deploy_deps_on_var_to_deploy(var_dag_node, var_dag);
            });
        }

        await promise_pipeline.end();
    }

}