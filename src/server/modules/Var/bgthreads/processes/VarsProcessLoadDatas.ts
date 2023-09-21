import VarDAGNode from '../../../../../shared/modules/Var/graph/VarDAGNode';
import VarDataBaseVO from '../../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import PixelVarDataController from '../../PixelVarDataController';
import VarsServerController from '../../VarsServerController';
import DataSourceControllerBase from '../../datasource/DataSourceControllerBase';
import DataSourcesController from '../../datasource/DataSourcesController';
import VarsProcessBase from './VarsProcessBase';

export default class VarsProcessLoadDatas extends VarsProcessBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!VarsProcessLoadDatas.instance) {
            VarsProcessLoadDatas.instance = new VarsProcessLoadDatas();
        }
        return VarsProcessLoadDatas.instance;
    }

    private static instance: VarsProcessLoadDatas = null;

    private constructor() {
        super('VarsProcessLoadDatas', VarDAGNode.TAG_2_DEPLOYED, VarDAGNode.TAG_3_DATA_LOADING, VarDAGNode.TAG_3_DATA_LOADED, 10, false, ConfigurationService.node_configuration.MAX_VarsProcessLoadDatas);
    }

    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }): Promise<boolean> {
        return false;
    }
    protected worker_sync(node: VarDAGNode): boolean {
        return false;
    }

    protected async worker_async(node: VarDAGNode): Promise<boolean> {

        let controller = VarsServerController.getVarControllerById(node.var_data.var_id);

        let dss: DataSourceControllerBase[] = controller.getDataSourcesDependencies();

        if ((!dss) || (!dss.length)) {
            return true;
        }

        // TODO FIXME JNE DELETE when proven unuseful ==>
        // On ne doit surtout pas charger des datas sources sur des vars de type pixel mais qui n'en sont pas (card > 1)
        if (controller.varConf.pixel_activated) {
            let prod_cardinaux = PixelVarDataController.getInstance().get_pixel_card(node.var_data);

            if (prod_cardinaux != 1) {
                return true;
            }
        }
        // <==


        await DataSourcesController.load_node_datas(dss, node);

        if (ConfigurationService.node_configuration.DEBUG_VARS) {
            ConsoleHandler.log('loaded_node_datas:index:' + node.var_data.index + ":value:" + node.var_data.value + ":value_ts:" + node.var_data.value_ts + ":type:" + VarDataBaseVO.VALUE_TYPE_LABELS[node.var_data.value_type]);
        }

        return true;
    }
}