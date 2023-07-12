import VarDAGNode from '../../../../../shared/modules/Var/graph/VarDAGNode';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import VarsDeployDepsHandler from '../../VarsDeployDepsHandler';
import VarsServerController from '../../VarsServerController';
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
        super('VarsProcessDeployDeps', VarDAGNode.TAG_1_NOTIFIED_START, VarDAGNode.TAG_2_DEPLOYING, VarDAGNode.TAG_2_DEPLOYED, 10, false, ConfigurationService.node_configuration.MAX_VarsProcessDeployDeps);
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
        await VarsDeployDepsHandler.load_caches_and_imports_on_var_to_deploy(node);

        if (ConfigurationService.node_configuration.DEBUG_VARS) {
            ConsoleHandler.log('VarsProcessDeployDeps:END: ' + node.var_data.index + ' ' + node.var_data.value);
        }

        return true;
    }
}