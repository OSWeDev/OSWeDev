import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../../../shared/modules/Stats/StatsController';
import VarDataBaseVO from '../../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../../../shared/tools/PromisePipeline/PromisePipeline';
import { all_promises } from '../../../../../shared/tools/PromiseTools';
import ConfigurationService from '../../../../env/ConfigurationService';
import VarDAGNode from '../../../../modules/Var/vos/VarDAGNode';
import VarsDeployDepsHandler from '../../VarsDeployDepsHandler';
import VarsServerController from '../../VarsServerController';
import VarsProcessBase from './VarsProcessBase';
import VarsProcessLoadDatas from './VarsProcessLoadDatas';

export default class VarsProcessDeployDeps extends VarsProcessBase {


    private static instance: VarsProcessDeployDeps = null;

    private constructor() {
        super(
            'VarsProcessDeployDeps',
            VarDAGNode.TAG_1_NOTIFIED_START,
            VarDAGNode.TAG_2_DEPLOYING,
            VarDAGNode.TAG_2_DEPLOYED,
            // 2,
            true,
            ConfigurationService.node_configuration.max_varsprocessdeploydeps,
        );
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!VarsProcessDeployDeps.instance) {
            VarsProcessDeployDeps.instance = new VarsProcessDeployDeps();
        }
        return VarsProcessDeployDeps.instance;
    }

    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }, nodes_to_unlock: VarDAGNode[]): Promise<boolean> {

        const nodes_to_handle: { [node_name: string]: VarDAGNode } = {};
        const nodes_deps_to_deploy: { [node_name: string]: { [dep_id: string]: VarDataBaseVO } } = {};
        const nodes_to_deploy: { [node_name: string]: VarDAGNode } = {};
        const promise_pipeline = new PromisePipeline(this.MAX_Workers, 'VarsProcessDeployDeps:worker_async_batch');

        if (ConfigurationService.node_configuration.debug_vars) {
            ConsoleHandler.log('VarsProcessDeployDeps:START');
        }

        for (const node_name in nodes) {
            const node = nodes[node_name];

            /**
             * Première étape, charger les imports et découper les pixels
             */
            if (ConfigurationService.node_configuration.debug_vars) {
                ConsoleHandler.log('VarsProcessDeployDeps:START NODE: ' + node.var_data.index + ' ' + node.var_data.value);
            }

            /**
             * Si on a une value valide, c'est qu'on a pas besoin de déployer les deps
             */
            if (VarsServerController.has_valid_value(node.var_data)) {
                if (ConfigurationService.node_configuration.debug_vars) {
                    ConsoleHandler.log('VarsProcessDeployDeps:END NODE - has_valid_value: ' + node.var_data.index + ' ' + node.var_data.value);
                }
                continue;
            }

            // Petit contrôle de cohérence suite pb en prod
            if ((!node.var_data.index) || (node.var_data.index.indexOf('||') > -1) || (node.var_data.index.indexOf('null') > -1)) {

                ConsoleHandler.error('VarsProcessDeployDeps.worker_async: node.var_data.index null or contains null: ' + node.var_data.index + ' - On crée une fausse valeur pour éviter de bloquer le système');
                node.var_data.value_ts = Dates.now();
                node.var_data.value = 0;
                node.var_data.value_type = VarDataBaseVO.VALUE_TYPE_DENIED;
                continue;
            }

            // On charge les caches pour ces noeuds
            //  et on récupère les nouveaux vars_datas à insérer dans l'arbre
            await promise_pipeline.push(async () => {
                const node_does_not_need_deployment: boolean = await VarsDeployDepsHandler.load_caches_and_imports_on_var_to_deploy(node, false, nodes_to_unlock);

                if (node_does_not_need_deployment) {
                    if (ConfigurationService.node_configuration.debug_vars) {
                        ConsoleHandler.log('VarsProcessDeployDeps:END NODE:node_does_not_need_deployment: ' + node.var_data.index + ' ' + node.var_data.value);
                    }

                    return;
                }

                const time_in = Dates.now_ms();
                StatsController.register_stat_COMPTEUR('VarsDeployDepsHandler', 'get_node_deps', 'IN');

                if (node.is_aggregator) {
                    const aggregated_deps: { [dep_id: string]: VarDataBaseVO } = {};
                    let index = 0;

                    const promises = [];
                    for (const aggregated_data_index in node.aggregated_datas) {
                        const data = node.aggregated_datas[aggregated_data_index];
                        aggregated_deps['AGG_' + (index++)] = data;

                        promises.push((async () => {
                            nodes_to_unlock.push(await VarDAGNode.getInstance(node.var_dag, data, true/*, true*/));
                        })());
                    }
                    await all_promises(promises);

                    StatsController.register_stat_COMPTEUR('VarsDeployDepsHandler', 'get_node_deps', 'OUT_is_aggregator');
                    StatsController.register_stat_DUREE('VarsDeployDepsHandler', 'get_node_deps', 'OUT_is_aggregator', Dates.now_ms() - time_in);

                    nodes_deps_to_deploy[node_name] = aggregated_deps;
                    nodes_to_deploy[node_name] = node;
                    return;
                }

                nodes_to_handle[node_name] = node;
            });
        }

        await promise_pipeline.end();

        // On a maintenant les nodes à traiter en déploiement

        if (!ObjectHandler.hasAtLeastOneAttribute(nodes_to_handle)) {
            if (ConfigurationService.node_configuration.debug_vars) {
                ConsoleHandler.log('VarsProcessDeployDeps:END: nothing to deploy');
            }

            return true;
        }

        if (ConfigurationService.node_configuration.debug_vars) {
            ConsoleHandler.log('VarsProcessDeployDeps:Load Datas PreDeps:IN');
        }
        // On charge les datas (predeps) de tous les nodes pas aggrégés, puis on demande leurs deps
        await VarsProcessLoadDatas.load_nodes_datas(nodes_to_handle, true);

        for (const node_name in nodes_to_handle) {
            const node = nodes_to_handle[node_name];
            const controller = VarsServerController.getVarControllerById(node.var_data.var_id);
            const deps_of_node = controller.getParamDependencies(node);

            if (deps_of_node) {
                nodes_deps_to_deploy[node_name] = deps_of_node;
                nodes_to_deploy[node_name] = node;
            }
        }

        if (ConfigurationService.node_configuration.debug_vars) {
            ConsoleHandler.log('VarsProcessDeployDeps:Load Datas PreDeps:OUT');
        }

        for (const node_name in nodes_deps_to_deploy) {
            const node = nodes_to_deploy[node_name];
            const deps = nodes_deps_to_deploy[node_name];

            if (ConfigurationService.node_configuration.debug_vars) {
                ConsoleHandler.log('VarsProcessDeployDeps:handle_deploy_deps:IN:' + node.var_data.index);
            }
            await promise_pipeline.push(async () => {
                await VarsDeployDepsHandler.handle_deploy_deps(node, deps, nodes_to_unlock);
            });
            if (ConfigurationService.node_configuration.debug_vars) {
                ConsoleHandler.log('VarsProcessDeployDeps:handle_deploy_deps:OUT:' + node.var_data.index);
            }
        }

        if (ConfigurationService.node_configuration.debug_vars) {
            ConsoleHandler.log('VarsProcessDeployDeps:END');
        }

        await promise_pipeline.end();

        return true;
    }

    protected worker_sync(node: VarDAGNode, nodes_to_unlock: VarDAGNode[]): boolean {

        throw new Error('not implemented');
        // return false;
    }

    protected async worker_async(node: VarDAGNode, nodes_to_unlock: VarDAGNode[]): Promise<boolean> {

        throw new Error('not implemented');
        // if (ConfigurationService.node_configuration.debug_vars) {
        //     ConsoleHandler.log('VarsProcessDeployDeps:START: ' + node.var_data.index + ' ' + node.var_data.value);
        // }

        // /**
        //  * Si on a une value valide, c'est qu'on a pas besoin de déployer les deps
        //  */
        // if (VarsServerController.has_valid_value(node.var_data)) {
        //     if (ConfigurationService.node_configuration.debug_vars) {
        //         ConsoleHandler.log('VarsProcessDeployDeps:END - has_valid_value: ' + node.var_data.index + ' ' + node.var_data.value);
        //     }
        //     return true;
        // }

        // // Petit contrôle de cohérence suite pb en prod
        // if ((!node.var_data.index) || (node.var_data.index.indexOf('null') > -1)) {

        //     ConsoleHandler.error('VarsProcessDeployDeps.worker_async: node.var_data.index null or contains null: ' + node.var_data.index + ' - On crée une fausse valeur pour éviter de bloquer le système');
        //     node.var_data.value_ts = Dates.now();
        //     node.var_data.value = 0;
        //     node.var_data.value_type = VarDataBaseVO.VALUE_TYPE_DENIED;
        //     return true;
        // }

        // // On charge les caches pour ces noeuds
        // //  et on récupère les nouveaux vars_datas à insérer dans l'arbre
        // await VarsDeployDepsHandler.load_caches_and_imports_on_var_to_deploy(node);

        // if (ConfigurationService.node_configuration.debug_vars) {
        //     ConsoleHandler.log('VarsProcessDeployDeps:END: ' + node.var_data.index + ' ' + node.var_data.value);
        // }

        // return true;
    }
}