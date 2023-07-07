import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import VarConfVO from '../../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import ContextFieldPathServerController from '../../ContextFilter/ContextFieldPathServerController';
import DataSourceControllerMatroidIndexedBase from '../datasource/DataSourceControllerMatroidIndexedBase';
import VarsServerController from '../VarsServerController';

export default class AutoVarDatasourceController extends DataSourceControllerMatroidIndexedBase {

    public static getInstance(varconf: VarConfVO): AutoVarDatasourceController {
        if (!AutoVarDatasourceController.instances[varconf.id]) {

            let api_type_ids: { [type: string]: boolean } = {};
            api_type_ids[varconf.auto_vofieldref_api_type_id] = true;

            for (let i in varconf.auto_param_context_api_type_ids) {
                let api_type_id = varconf.auto_param_context_api_type_ids[i];
                let path = ContextFieldPathServerController.getInstance().get_path_between_types(
                    varconf.auto_param_context_discarded_field_paths,
                    varconf.auto_param_context_use_technical_field_versioning,
                    varconf.auto_param_context_api_type_ids,
                    Object.keys(api_type_ids),
                    api_type_id
                );

                api_type_ids[api_type_id] = true;

                if (!path) {
                    continue;
                }

                for (let j in path) {
                    let path_elt = path[j];
                    api_type_ids[path_elt.field.module_table.vo_type] = true;
                    if (path_elt.field.manyToOne_target_moduletable) {
                        api_type_ids[path_elt.field.manyToOne_target_moduletable.vo_type] = true;
                    }
                }
            }

            AutoVarDatasourceController.instances[varconf.id] = new AutoVarDatasourceController(
                'AutoVarDatasourceController_' + varconf.id,
                /**
                 * TODO FIXME : en fait c'est faux, c'est ça et les api_type_id sur la route
                 *  entre le auto_vofieldref_api_type_id et les fields param
                 * Donc en fait on a beaucoup plus que ça en vo qui impacte le calcul potentiellement
                 * Ensuite on doit vérifier l'impact via la modif du champ (soit de param soit de vofieldref de la var)
                 *  ou la modif d'un champ de chemin entre un field du param et le vofieldref targetté
                 */
                Object.keys(api_type_ids)
            );
        }
        return AutoVarDatasourceController.instances[varconf.id];
    }

    protected static instances: { [varconf_id: number]: AutoVarDatasourceController } = {};

    public async get_data(param: VarDataBaseVO): Promise<number> {

        let varconf: VarConfVO = VarsServerController.getVarConfById(param.var_id);

        let query_res = await query(varconf.auto_vofieldref_api_type_id)
            .field(varconf.auto_vofieldref_field_id, 'ds_result', varconf.auto_vofieldref_api_type_id, varconf.aggregator, varconf.auto_vofieldref_modifier)
            .select_one();
        if ((!query_res) || (!query_res.ds_result)) {
            return null;
        }

        return query_res.ds_result;
    }
}