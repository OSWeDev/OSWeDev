import VOsTypesHandler from "../../VO/handler/VOsTypesHandler";
import VOsTypesManager from "../../VO/manager/VOsTypesManager";
import VOFieldRefVO from "../vos/VOFieldRefVO";

/**
 * VO Field Ref VO Handler
 *  - Manage or handle all kind of checking on the VOFieldRefVO Model
 */
export default class VOFieldRefVOHandler {

    public static is_type_boolean(vo_field_ref: VOFieldRefVO): boolean {
        const field = VOsTypesManager.get_field_from_vo_field_ref(vo_field_ref);

        if (!field) {
            return false;
        }

        return VOsTypesHandler.is_type_boolean(field);
    }

    public static is_type_enum(vo_field_ref: VOFieldRefVO): boolean {
        const field = VOsTypesManager.get_field_from_vo_field_ref(vo_field_ref);

        if (!field) {
            return false;
        }

        return VOsTypesHandler.is_type_enum(field);
    }

    public static is_type_date(vo_field_ref: VOFieldRefVO): boolean {
        const field = VOsTypesManager.get_field_from_vo_field_ref(vo_field_ref);

        if (!field) {
            return false;
        }

        return VOsTypesHandler.is_type_date(field);
    }

    public static is_type_string(vo_field_ref: VOFieldRefVO): boolean {
        const field = VOsTypesManager.get_field_from_vo_field_ref(vo_field_ref);

        if (!field) {
            return false;
        }

        return VOsTypesHandler.is_type_string(field);
    }

    public static is_type_number(vo_field_ref: VOFieldRefVO): boolean {
        const field = VOsTypesManager.get_field_from_vo_field_ref(vo_field_ref);

        if (!field) {

            /**
             * Cas spécifique du field_id == 'id' qu'on voudrait pouvoir filtrer comme un number
             */
            return vo_field_ref?.field_id == 'id';
        }

        return VOsTypesHandler.is_type_number(field);
    }
}