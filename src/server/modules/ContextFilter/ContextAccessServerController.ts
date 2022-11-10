import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import ContextQueryFieldVO from '../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import StackContext from '../../StackContext';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import FieldPathWrapper from './vos/FieldPathWrapper';

export default class ContextAccessServerController {

    public static getInstance() {
        if (!ContextAccessServerController.instance) {
            ContextAccessServerController.instance = new ContextAccessServerController();
        }
        return ContextAccessServerController.instance;
    }

    private static instance: ContextAccessServerController = null;

    private constructor() { }

    public async configure() {
    }

    public check_access_to_api_type_ids_field_ids(
        base_api_type_id: string,
        fields: ContextQueryFieldVO[],
        access_type: string): boolean {

        if (!StackContext.getInstance().get('IS_CLIENT')) {
            return true;
        }

        let uid: number = StackContext.getInstance().get('UID');
        let roles;
        if (!uid) {
            roles = AccessPolicyServerController.getInstance().getUsersRoles(false, null);
        } else {
            roles = AccessPolicyServerController.getInstance().getUsersRoles(true, uid);
        }

        if (fields && fields.length) {
            for (let i in fields) {
                let field = fields[i];

                if (!this.check_access_to_field(field.api_type_id, field.field_id, access_type, roles)) {
                    return false;
                }
            }
        } else {
            let table = VOsTypesManager.getInstance().moduleTables_by_voType[base_api_type_id];
            let table_fields = table.get_fields();
            for (let i in table_fields) {
                let table_field = table_fields[i];

                if (!this.check_access_to_field(base_api_type_id, table_field.field_id, access_type, roles)) {
                    return false;
                }
            }
        }

        return true;
    }

    public check_access_to_fields(
        fields: FieldPathWrapper[],
        access_type: string): boolean {

        if (!StackContext.getInstance().get('IS_CLIENT')) {
            return true;
        }

        let uid: number = StackContext.getInstance().get('UID');
        let roles;
        if (!uid) {
            roles = AccessPolicyServerController.getInstance().getUsersRoles(false, null);
        } else {
            roles = AccessPolicyServerController.getInstance().getUsersRoles(true, uid);
        }

        for (let i in fields) {
            let api_type_id = fields[i].field.module_table.vo_type;
            let field_id = fields[i].field.field_id;

            if (!this.check_access_to_field(api_type_id, field_id, access_type, roles)) {
                return false;
            }
        }

        return true;
    }

    public check_access_to_field_retrieve_roles(
        api_type_id: string,
        field_id: string,
        access_type: string): boolean {

        if (!StackContext.getInstance().get('IS_CLIENT')) {
            return true;
        }

        let uid: number = StackContext.getInstance().get('UID');
        let roles;
        if (!uid) {
            roles = AccessPolicyServerController.getInstance().getUsersRoles(false, null);
        } else {
            roles = AccessPolicyServerController.getInstance().getUsersRoles(true, uid);
        }
        if (!this.check_access_to_field(api_type_id, field_id, access_type, roles)) {
            return false;
        }

        return true;
    }

    public check_access_to_field(
        api_type_id: string,
        field_id: string,
        access_type: string,
        roles): boolean {

        /**
         * Si le field_id est le label du type ou id, on peut transformer un droit de type READ en LIST
         */
        let table = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];
        let tmp_access_type = access_type;
        if ((access_type == ModuleDAO.DAO_ACCESS_TYPE_READ) && ((field_id == 'id') || (table.default_label_field && table.default_label_field.field_id && (field_id == table.default_label_field.field_id)))) {
            tmp_access_type = ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS;
        }

        let target_policy: AccessPolicyVO = AccessPolicyServerController.getInstance().get_registered_policy(
            ModuleDAO.getInstance().getAccessPolicyName(tmp_access_type, api_type_id)
        );

        if (!AccessPolicyServerController.getInstance().checkAccessTo(target_policy, roles)) {
            return false;
        }

        return true;
    }
}