import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import VarConfVO from '../../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import DataSourceControllerMatroidIndexedBase from '../datasource/DataSourceControllerMatroidIndexedBase';
import VarsServerController from '../VarsServerController';

export default class AutoVarDatasourceController extends DataSourceControllerMatroidIndexedBase {

    public static getInstance(varconf: VarConfVO): AutoVarDatasourceController {
        if (!AutoVarDatasourceController.instances[varconf.id]) {
            AutoVarDatasourceController.instances[varconf.id] = new AutoVarDatasourceController(
                'AutoVarDatasourceController_' + varconf.id,
                [varconf.auto_vofieldref_api_type_id]
            );
        }
        return AutoVarDatasourceController.instances[varconf.id];
    }

    protected static instances: { [varconf_id: number]: AutoVarDatasourceController } = {};

    public async get_data(param: VarDataBaseVO): Promise<number> {

        let varconf: VarConfVO = VarsServerController.getInstance().getVarConfById(param.var_id);

        let query_res = await query(varconf.auto_vofieldref_api_type_id)
            .field(varconf.auto_vofieldref_field_id, 'ds_result', varconf.auto_vofieldref_api_type_id, varconf.aggregator, varconf.auto_vofieldref_modifier)
            .select_one();
        if ((!query_res) || (!query_res.ds_result)) {
            return null;
        }

        return query_res.ds_result;
    }
}