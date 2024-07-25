import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleTableFieldController from '../../../../shared/modules/DAO/ModuleTableFieldController';
import VarConfVO from '../../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ContextFieldPathServerController from '../../ContextFilter/ContextFieldPathServerController';
import DataSourceControllerMatroidIndexedBase from '../datasource/DataSourceControllerMatroidIndexedBase';
import VarsServerController from '../VarsServerController';

export default class AutoVarDatasourceController extends DataSourceControllerMatroidIndexedBase {

    protected static instances: { [varconf_id: number]: AutoVarDatasourceController } = {};

    public static getInstance(varconf: VarConfVO): AutoVarDatasourceController {
        if (!AutoVarDatasourceController.instances[varconf.id]) {

            const api_type_ids: { [type: string]: boolean } = {};
            api_type_ids[varconf.auto_vofieldref_api_type_id] = true;

            for (const i in varconf.auto_param_context_api_type_ids) {
                const api_type_id = varconf.auto_param_context_api_type_ids[i];
                const path = ContextFieldPathServerController.get_path_between_types(
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

                for (const j in path) {
                    const path_elt = path[j];
                    api_type_ids[path_elt.field.module_table_vo_type] = true;
                    if (!!path_elt.field.foreign_ref_vo_type) {
                        api_type_ids[path_elt.field.foreign_ref_vo_type] = true;
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

    public async get_data(param: VarDataBaseVO): Promise<number> {

        const varconf: VarConfVO = VarsServerController.getVarConfById(param.var_id);

        try {

            const q = query(varconf.auto_vofieldref_api_type_id)
                .field(varconf.auto_vofieldref_field_name, 'ds_result', varconf.auto_vofieldref_api_type_id, varconf.aggregator, varconf.auto_vofieldref_modifier);

            const target_field = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[varconf.auto_vofieldref_api_type_id][varconf.auto_vofieldref_field_name];

            // /**
            //  * On filtre sur les fields du param
            //  */
            // const matroid_fields = MatroidController.getMatroidFields(param);

            // for (const i in matroid_fields) {
            //     const matroid_field: MatroidBase = matroid_fields[i];

            //     /**
            //      * A ce stade on doit faire la diff entre les fields qu'on peut filter directement et les fields qui nécessitent une correspondance (tsranges typiquement)
            //      * TODO FIXME : Donc tous les champs qui ne sont pas des liaisons explicites vers un type existants doivent passer par une table de correspondance dans la conf de la var
            //      */
            //     if (matroid_field.)
            //         switch (target_field.field_type) {

            //             case ModuleTableFieldVO.FIELD_TYPE_amount:
            //             case ModuleTableFieldVO.FIELD_TYPE_enum:
            //             case ModuleTableFieldVO.FIELD_TYPE_file_ref:
            //             case ModuleTableFieldVO.FIELD_TYPE_float:
            //             case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
            //             case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
            //             case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
            //             case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
            //             case ModuleTableFieldVO.FIELD_TYPE_image_ref:
            //             case ModuleTableFieldVO.FIELD_TYPE_int:
            //             case ModuleTableFieldVO.FIELD_TYPE_prct:
            //             case ModuleTableFieldVO.FIELD_TYPE_tstz:

            //                 if (!context_filter.param_text) {
            //                     throw new Error('Not Implemented');
            //                 }

            //                 // On checke le format de la regexp
            //                 try {
            //                     const test_format = new RegExp(context_filter.param_text);
            //                 } catch (error) {
            //                     context_query.log(true);
            //                     throw new Error('Invalid regexp format:' + context_filter.param_text + ':' + JSON.stringify(error));
            //                 }

            //                 if (context_filter.text_ignore_case) {
            //                     where_conditions.push(field_name + "::text ~* " + pgPromise.as.format('$1', [context_filter.param_text]));
            //                 } else {
            //                     where_conditions.push(field_name + "::text ~ " + pgPromise.as.format('$1', [context_filter.param_text]));
            //                 }

            //                 break;

            //             case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
            //             case ModuleTableFieldVO.FIELD_TYPE_int_array:
            //             case ModuleTableFieldVO.FIELD_TYPE_float_array:
            //             case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
            //                 throw new Error('Not Implemented');

            //             case ModuleTableFieldVO.FIELD_TYPE_numrange:
            //             case ModuleTableFieldVO.FIELD_TYPE_tsrange:
            //                 throw new Error('Not Implemented');

            //             case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
            //             case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
            //             case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
            //                 q.filter_by_num_x_ranges(.field_name, matroid_field.value);
            //                 throw new Error('Not Implemented');

            //             case ModuleTableFieldVO.FIELD_TYPE_password:
            //                 throw new Error('Not Implemented');

            //             case ModuleTableFieldVO.FIELD_TYPE_string:
            //             case ModuleTableFieldVO.FIELD_TYPE_color:
            //             case ModuleTableFieldVO.FIELD_TYPE_html:
            //             case ModuleTableFieldVO.FIELD_TYPE_file_field:
            //             case ModuleTableFieldVO.FIELD_TYPE_textarea:
            //             case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
            //             case ModuleTableFieldVO.FIELD_TYPE_email:

            //                 break;

            //             case ModuleTableFieldVO.FIELD_TYPE_string_array:
            //             case ModuleTableFieldVO.FIELD_TYPE_html_array:


            //                 break;

            //             default:
            //                 throw new Error('Not Implemented');
            //         }

            //     q.filter
            //     q.where(matroid_field.field_name, matroid_field.value);
            // }

            /**
             * On ajoute les paramètres contextuels
             */
            for (const i in varconf.auto_param_context_api_type_ids) {
                const api_type_id = varconf.auto_param_context_api_type_ids[i];
                q.using(api_type_id);
            }

            q.discarded_field_paths = varconf.auto_param_context_discarded_field_paths;
            q.use_technical_field_versioning = varconf.auto_param_context_use_technical_field_versioning;

            const query_res = await q
                .select_one();
            if ((!query_res) || (!query_res.ds_result)) {
                return null;
            }

            return query_res.ds_result;
        } catch (error) {
            ConsoleHandler.error('Error in AutoVarDatasourceController.get_data for varconf.id: ' + varconf.id + ' with param: ' + JSON.stringify(param) + ' error: ' + error);
        }
    }
}