import VOsTypesHandler from "../../VO/handler/VOsTypesHandler";
import VOsTypesManager from "../../VO/manager/VOsTypesManager";
import VOFieldRefVO from "../vos/VOFieldRefVO";

/**
 * VO Field Ref VO Type Handler
 *  - vo field ref type manager
 */
export default class VOFieldRefVOTypeHandler {

    public static is_type_boolean(vo_field_ref: VOFieldRefVO): boolean {

        if ((!vo_field_ref) || (!vo_field_ref.api_type_id) || (!vo_field_ref.field_id)) {
            return false;
        }

        let field = VOsTypesManager.moduleTables_by_voType[vo_field_ref.api_type_id].get_field_by_id(vo_field_ref.field_id);

        return VOsTypesHandler.is_type_boolean(field);
    }

    public static is_type_enum(vo_field_ref: VOFieldRefVO): boolean {

        if ((!vo_field_ref) || (!vo_field_ref.api_type_id) || (!vo_field_ref.field_id)) {
            return false;
        }

        let field = VOsTypesManager.moduleTables_by_voType[vo_field_ref.api_type_id].get_field_by_id(vo_field_ref.field_id);

        return VOsTypesHandler.is_type_enum(field);
    }

    public static is_type_date(vo_field_ref: VOFieldRefVO): boolean {

        if ((!vo_field_ref) || (!vo_field_ref.api_type_id) || (!vo_field_ref.field_id)) {
            return false;
        }

        let field = VOsTypesManager.moduleTables_by_voType[vo_field_ref.api_type_id].get_field_by_id(vo_field_ref.field_id);

        return VOsTypesHandler.is_type_date(field);
    }

    public static is_type_string(vo_field_ref: VOFieldRefVO): boolean {

        if ((!vo_field_ref) || (!vo_field_ref.api_type_id) || (!vo_field_ref.field_id)) {
            return false;
        }

        let field = VOsTypesManager.moduleTables_by_voType[vo_field_ref.api_type_id].get_field_by_id(vo_field_ref.field_id);

        return VOsTypesHandler.is_type_string(field);
    }

    public static is_type_number(vo_field_ref: VOFieldRefVO): boolean {

        if ((!vo_field_ref) || (!vo_field_ref.api_type_id) || (!vo_field_ref.field_id)) {
            return false;
        }

        let field = VOsTypesManager.moduleTables_by_voType[vo_field_ref.api_type_id].get_field_by_id(vo_field_ref.field_id);

        if (!field) {

            /**
             * Cas spécifique du field_id == 'id' qu'on voudrait pouvoir filtrer comme un number
             */
            return vo_field_ref.field_id == 'id';
        }

        return VOsTypesHandler.is_type_number(field);
    }
}