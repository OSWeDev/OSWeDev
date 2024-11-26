import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import VarDataBaseVO from '../../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import VarDAGNode from '../../../../modules/Var/vos/VarDAGNode';
import VarsDeployDepsHandler from '../../VarsDeployDepsHandler';
import VarsServerController from '../../VarsServerController';
import VarsProcessBase from './VarsProcessBase';

export default class VarsProcessDeployDeps extends VarsProcessBase {


    private static instance: VarsProcessDeployDeps = null;

    private constructor() {
        super('VarsProcessDeployDeps', VarDAGNode.TAG_1_NOTIFIED_START, VarDAGNode.TAG_2_DEPLOYING, VarDAGNode.TAG_2_DEPLOYED, 2, false, ConfigurationService.node_configuration.max_varsprocessdeploydeps);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!VarsProcessDeployDeps.instance) {
            VarsProcessDeployDeps.instance = new VarsProcessDeployDeps();
        }
        return VarsProcessDeployDeps.instance;
    }

    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }): Promise<boolean> {
        return false;
    }
    protected worker_sync(node: VarDAGNode): boolean {
        return false;
    }

    protected async worker_async(node: VarDAGNode): Promise<boolean> {

        if (ConfigurationService.node_configuration.debug_vars) {
            ConsoleHandler.log('VarsProcessDeployDeps:START: ' + node.var_data.index + ' ' + node.var_data.value);
        }

        /**
         * Si on a une value valide, c'est qu'on a pas besoin de déployer les deps
         */
        if (VarsServerController.has_valid_value(node.var_data)) {
            if (ConfigurationService.node_configuration.debug_vars) {
                ConsoleHandler.log('VarsProcessDeployDeps:END - has_valid_value: ' + node.var_data.index + ' ' + node.var_data.value);
            }
            return true;
        }

        // Petit contrôle de cohérence suite pb en prod
        if (node.var_data.index && (node.var_data.index.indexOf('::') > -1) || node.var_data.index.indexOf('null') > -1) {

            ConsoleHandler.error('VarsProcessDeployDeps.worker_async: node.var_data.index null or contains null: ' + node.var_data.index + ' - On crée une fausse valeur pour éviter de bloquer le système');
            node.var_data.value_ts = Dates.now();
            node.var_data.value = 0;
            node.var_data.value_type = VarDataBaseVO.VALUE_TYPE_DENIED;
            return true;
        }

        // On charge les caches pour ces noeuds
        //  et on récupère les nouveaux vars_datas à insérer dans l'arbre
        await VarsDeployDepsHandler.load_caches_and_imports_on_var_to_deploy(node);

        if (ConfigurationService.node_configuration.debug_vars) {
            ConsoleHandler.log('VarsProcessDeployDeps:END: ' + node.var_data.index + ' ' + node.var_data.value);
        }

        return true;
    }
}