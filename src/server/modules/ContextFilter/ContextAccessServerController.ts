import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import ContextQueryFieldVO from '../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import ContextQueryVO from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FieldPathWrapper from '../../../shared/modules/ContextFilter/vos/FieldPathWrapper';
import DAOController from '../../../shared/modules/DAO/DAOController';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleTableController from '../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldController from '../../../shared/modules/DAO/ModuleTableFieldController';
import StackContext from '../../StackContext';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';

export default class ContextAccessServerController {

    public static check_access_to_api_type_ids_fields(
        context_query: ContextQueryVO,
        base_api_type_id: string,
        fields: ContextQueryFieldVO[],
        access_type: string): boolean {

        if (context_query.is_server || !StackContext.get('IS_CLIENT')) {
            return true;
        }

        const uid: number = StackContext.get('UID');
        let roles;
        if (!uid) {
            roles = AccessPolicyServerController.getUsersRoles(false, null);
        } else {
            roles = AccessPolicyServerController.getUsersRoles(true, uid);
        }

        if (fields && fields.length) {
            for (const i in fields) {
                const field = fields[i];

                if (!ContextAccessServerController.check_access_to_field(field.api_type_id, field.field_name, access_type, roles)) {
                    return false;
                }
            }
        } else {
            const table_fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[base_api_type_id];
            for (const i in table_fields) {
                const table_field = table_fields[i];

                if (!ContextAccessServerController.check_access_to_field(base_api_type_id, table_field.field_name, access_type, roles)) {
                    return false;
                }
            }
        }

        return true;
    }

    public static check_access_to_fields(
        context_query: ContextQueryVO,
        fields: FieldPathWrapper[],
        access_type: string): boolean {

        if (context_query.is_server || !StackContext.get('IS_CLIENT')) {
            return true;
        }

        const uid: number = StackContext.get('UID');
        let roles;
        if (!uid) {
            roles = AccessPolicyServerController.getUsersRoles(false, null);
        } else {
            roles = AccessPolicyServerController.getUsersRoles(true, uid);
        }

        for (const i in fields) {
            const api_type_id = fields[i].field.module_table_vo_type;
            const field_id = fields[i].field.field_id;

            if (!ContextAccessServerController.check_access_to_field(api_type_id, field_id, access_type, roles)) {
                return false;
            }
        }

        return true;
    }

    public static check_access_to_field_retrieve_roles(
        context_query: ContextQueryVO,
        api_type_id: string,
        field_id: string,
        access_type: string): boolean {

        if (context_query.is_server || !StackContext.get('IS_CLIENT')) {
            return true;
        }

        const uid: number = StackContext.get('UID');
        let roles;
        if (!uid) {
            roles = AccessPolicyServerController.getUsersRoles(false, null);
        } else {
            roles = AccessPolicyServerController.getUsersRoles(true, uid);
        }
        if (!ContextAccessServerController.check_access_to_field(api_type_id, field_id, access_type, roles)) {
            return false;
        }

        return true;
    }

    public static check_access_to_field(
        api_type_id: string,
        field_id: string,
        access_type: string,
        roles): boolean {

        /**
         * Si le field_id est le label du type ou id, on peut transformer un droit de type READ en LIST
         */
        const table = ModuleTableController.module_tables_by_vo_type[api_type_id];

        /**
         * Si on ne retrouve pas la table, on est sur un champ calculé, on ne peut pas vérifier les droits
         */
        if (!table) {
            return true;
        }

        let tmp_access_type = access_type;
        if ((access_type == ModuleDAO.DAO_ACCESS_TYPE_READ) && ((field_id == 'id') || (table.default_label_field && table.default_label_field.field_id && (field_id == table.default_label_field.field_id)))) {
            tmp_access_type = ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS;
        }

        const target_policy: AccessPolicyVO = AccessPolicyServerController.get_registered_policy(
            DAOController.getAccessPolicyName(tmp_access_type, api_type_id)
        );

        if (!AccessPolicyServerController.checkAccessTo(target_policy, roles)) {
            return false;
        }

        return true;
    }
}