import TextHandler from "../../tools/TextHandler";

export default class CRUDURLController {
    public static CRUD_CREATE_BASE_URL_TEMPLATE: string = "/manage/:vo_type/new";
    public static CRUD_READ_BASE_URL_TEMPLATE: string = "/manage/:vo_type/view/:vo_id";
    public static CRUD_UPDATE_BASE_URL_TEMPLATE: string = "/manage/:vo_type/edit/:vo_id";

    public static get_crud_create_url(vo_type: string): string {
        return CRUDURLController.CRUD_CREATE_BASE_URL_TEMPLATE.replace(':vo_type', vo_type);
    }

    public static get_crud_read_url(vo_type: string, vo_id: number): string {
        return CRUDURLController.CRUD_READ_BASE_URL_TEMPLATE.replace(':vo_type', vo_type).replace(':vo_id', vo_id.toString());
    }

    public static get_crud_update_url(vo_type: string, vo_id: number): string {
        return CRUDURLController.CRUD_UPDATE_BASE_URL_TEMPLATE.replace(':vo_type', vo_type).replace(':vo_id', vo_id.toString());
    }


    public static transliterate_field_value_to_url(field_value: any): string {
        if (field_value === null || field_value === undefined) {
            return '_';
        }

        // On transforme le field_value en string et on enlève les caractères spéciaux
        field_value = TextHandler.getInstance().sanityze(field_value.toString().toLowerCase());
        return field_value
            .replace(/[^a-z0-9]+/g, '-') // Remplace les caractères non alphanumériques par des tirets
            .replace(/^-|-$/g, ''); // Enlève les tirets en début et fin de chaîne
    }
}