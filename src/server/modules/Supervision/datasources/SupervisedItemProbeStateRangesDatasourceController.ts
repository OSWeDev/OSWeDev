import ContextQueryVO, { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import SupervisionController from "../../../../shared/modules/Supervision/SupervisionController";
import ISupervisedItem from "../../../../shared/modules/Supervision/interfaces/ISupervisedItem";
import SupervisionProbeStateDataRangesVO from "../../../../shared/modules/Supervision/vars/vos/SupervisionProbeStateDataRangesVO";
import SupervisedProbeVO from "../../../../shared/modules/Supervision/vos/SupervisedProbeVO";
import { field_names } from "../../../../shared/tools/ObjectHandler";
import PromisePipeline from "../../../../shared/tools/PromisePipeline/PromisePipeline";
import RangeHandler from "../../../../shared/tools/RangeHandler";
import ConfigurationService from "../../../env/ConfigurationService";
import DataSourceControllerMatroidIndexedBase from "../../Var/datasource/DataSourceControllerMatroidIndexedBase";

export default class SupervisedItemProbeStateRangesDatasourceController extends DataSourceControllerMatroidIndexedBase {

    protected static instance: SupervisedItemProbeStateRangesDatasourceController = null;

    public static getInstance(): SupervisedItemProbeStateRangesDatasourceController {
        if (!SupervisedItemProbeStateRangesDatasourceController.instance) {
            SupervisedItemProbeStateRangesDatasourceController.instance = new SupervisedItemProbeStateRangesDatasourceController(
                'SupervisedItemProbeStateRangesDatasourceController',
                Object.keys(SupervisionController.getInstance().registered_controllers),
                { 'fr-fr': 'item de supervision par sonde et état' });
        }
        return SupervisedItemProbeStateRangesDatasourceController.instance;
    }

    public async get_data(param: SupervisionProbeStateDataRangesVO): Promise<{ [probe_id: number]: { [state: number]: ISupervisedItem[] } }> {
        const res: { [probe_id: number]: { [state: number]: ISupervisedItem[] } } = {};

        if (!param || !param.probe_id_ranges || !param.probe_id_ranges.length || !param.state_id_ranges || !param.state_id_ranges.length) {
            return res;
        }

        const probe_q: ContextQueryVO = query(SupervisedProbeVO.API_TYPE_ID);

        // pre-traitement de probe_id_ranges
        if (RangeHandler.getCardinalFromArray(param.probe_id_ranges) < 1000) {
            probe_q.filter_by_ids(param.probe_id_ranges);
        }

        const sondes: SupervisedProbeVO[] = await probe_q.select_vos<SupervisedProbeVO>();

        if (!sondes || !sondes.length) {
            return {};
        }

        const limit = ConfigurationService.node_configuration.max_pool / 2; // server
        const promise_pipeline = new PromisePipeline(limit);

        for (const si in sondes) {
            const sonde: SupervisedProbeVO = sondes[si];
            res[sonde.id] = {};

            await promise_pipeline.push(async () => {
                const items: ISupervisedItem[] = await query(sonde.sup_item_api_type_id)
                    .filter_by_num_x_ranges(field_names<ISupervisedItem>().state, param.state_id_ranges)
                    .select_vos<ISupervisedItem>();

                for (const ii in items) {
                    const item: ISupervisedItem = items[ii];
                    if (!res[sonde.id][item.state]) {
                        res[sonde.id][item.state] = [];
                    }
                    res[sonde.id][item.state].push(item);
                }
            });
        }

        await promise_pipeline.end();

        return res;
    }
}