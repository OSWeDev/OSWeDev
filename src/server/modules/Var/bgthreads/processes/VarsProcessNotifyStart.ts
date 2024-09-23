import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import VarDAGNode from '../../../../modules/Var/vos/VarDAGNode';
import NotifVardatasParam from '../../notifs/NotifVardatasParam';
import VarsTabsSubsController from '../../VarsTabsSubsController';
import VarsProcessBase from './VarsProcessBase';

export default class VarsProcessNotifyStart extends VarsProcessBase {

    private static instance: VarsProcessNotifyStart = null;

    private constructor() {
        super('VarsProcessNotifyStart', VarDAGNode.TAG_0_CREATED, VarDAGNode.TAG_1_NOTIFYING_START, VarDAGNode.TAG_1_NOTIFIED_START, 2, true);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!VarsProcessNotifyStart.instance) {
            VarsProcessNotifyStart.instance = new VarsProcessNotifyStart();
        }
        return VarsProcessNotifyStart.instance;
    }

    protected worker_sync(node: VarDAGNode): boolean {
        return false;
    }
    protected async worker_async(node: VarDAGNode): Promise<boolean> {
        return false;
    }

    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }): Promise<boolean> {

        const notifVardatasParams: NotifVardatasParam[] = [];
        const DEBUG_VARS = ConfigurationService.node_configuration.debug_vars;

        for (const i in nodes) {
            const node = nodes[i];

            notifVardatasParams.push(new NotifVardatasParam([node.var_data], true));

            if (DEBUG_VARS) {
                ConsoleHandler.log('VarsProcessNotifyStart: ' + node.var_data.index + ' ' + node.var_data.value);
            }
        }

        if (ConfigurationService.IS_UNIT_TEST_MODE) {
            return true;
        }

        // Les notifs arrivent dans le désordre, on désactive pour tester
        await VarsTabsSubsController.notify_vardatas(notifVardatasParams);
        return true;
    }
}