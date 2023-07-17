import VarDAGNode from '../../../../../shared/modules/Var/graph/VarDAGNode';
import VarDataBaseVO from '../../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import VarsServerCallBackSubsController from '../../VarsServerCallBackSubsController';
import VarsTabsSubsController from '../../VarsTabsSubsController';
import NotifVardatasParam from '../../notifs/NotifVardatasParam';
import VarsProcessBase from './VarsProcessBase';

export default class VarsProcessNotifyEnd extends VarsProcessBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!VarsProcessNotifyEnd.instance) {
            VarsProcessNotifyEnd.instance = new VarsProcessNotifyEnd();
        }
        return VarsProcessNotifyEnd.instance;
    }

    private static instance: VarsProcessNotifyEnd = null;

    private constructor() {
        super('VarsProcessNotifyEnd', VarDAGNode.TAG_4_COMPUTED, VarDAGNode.TAG_5_NOTIFYING_END, VarDAGNode.TAG_5_NOTIFIED_END, 10, true);
    }

    protected worker_sync(node: VarDAGNode): boolean {
        return false;
    }
    protected async worker_async(node: VarDAGNode): Promise<boolean> {
        return false;
    }

    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }): Promise<boolean> {

        let notifVardatasParams: NotifVardatasParam[] = [];
        let vardatas: VarDataBaseVO[] = [];
        let DEBUG_VARS = ConfigurationService.node_configuration.DEBUG_VARS;

        for (let i in nodes) {
            let node = nodes[i];

            notifVardatasParams.push(new NotifVardatasParam([node.var_data]));
            vardatas.push(node.var_data);

            if (DEBUG_VARS) {
                ConsoleHandler.log('VarsProcessNotifyEnd: ' + node.var_data.index + ' ' + node.var_data.value);
            }
        }

        if (!ConfigurationService.IS_UNIT_TEST_MODE) {
            await VarsTabsSubsController.notify_vardatas(notifVardatasParams);
            await VarsServerCallBackSubsController.notify_vardatas(vardatas);
        }
        return true;
    }
}