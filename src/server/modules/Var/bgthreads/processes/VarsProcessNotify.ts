import ModulePushData from '../../../../../shared/modules/PushData/ModulePushData';
import VarDAGNode from '../../../../../shared/modules/Var/graph/VarDAGNode';
import ConfigurationService from '../../../../env/ConfigurationService';
import ModulePushDataServer from '../../../PushData/ModulePushDataServer';
import PushDataServerController from '../../../PushData/PushDataServerController';
import VarsServerCallBackSubsController from '../../VarsServerCallBackSubsController';
import VarsTabsSubsController from '../../VarsTabsSubsController';
import NotifVardatasParam from '../../notifs/NotifVardatasParam';
import VarsProcessBase from './VarsProcessBase';

export default class VarsProcessNotify extends VarsProcessBase {

    public static getInstance() {
        if (!VarsProcessNotify.instance) {
            VarsProcessNotify.instance = new VarsProcessNotify();
        }
        return VarsProcessNotify.instance;
    }

    private static instance: VarsProcessNotify = null;

    private constructor() {
        super('VarsProcessNotify', VarDAGNode.TAG_TO_NOTIFY, 1, true);
    }

    protected worker_sync(node: VarDAGNode): void { }
    protected async worker_async(node: VarDAGNode): Promise<void> { }

    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }): Promise<void> {

        let notifVardatasParams: NotifVardatasParam[] = [];

        for (let i in nodes) {
            let node = nodes[i];

            notifVardatasParams.push(new NotifVardatasParam([node.var_data]));
            await VarsTabsSubsController.getInstance().notify_vardatas(
                [new NotifVardatasParam([var_dag_node.var_data])]);
            await VarsServerCallBackSubsController.getInstance().notify_vardatas([var_dag_node.var_data]);
        }
    }