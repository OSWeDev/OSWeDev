import TextHandler from "../../tools/TextHandler";
import IDistantVOBase from "../IDistantVOBase";
import URLAliasCRUDConfVO from "./vos/URLAliasCRUDConfVO";
import URLAliasVO from "./vos/URLAliasVO";

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

    public static get_vo_alias_url_for_read(url_alias_conf: URLAliasCRUDConfVO, vo: IDistantVOBase): URLAliasVO {
        if ((!url_alias_conf) || (!url_alias_conf.url_alias_template_read)) {
            return null;
        }
        const alias_read = new URLAliasVO();
        alias_read.alias_url = CRUDURLController.compile_url_from_template_for_vo(url_alias_conf.url_alias_template_read, vo);
        alias_read.initial_url = CRUDURLController.get_crud_read_url(vo._type, vo.id);
        alias_read.url_alias_conf_id = url_alias_conf.id;
        alias_read.vo_id = vo.id; // On met l'id du vo pour le read
        return alias_read;
    }

    public static get_vo_alias_url_for_update(url_alias_conf: URLAliasCRUDConfVO, vo: IDistantVOBase): URLAliasVO {
        if ((!url_alias_conf) || (!url_alias_conf.url_alias_template_update)) {
            return null;
        }
        const alias_update = new URLAliasVO();
        alias_update.alias_url = CRUDURLController.compile_url_from_template_for_vo(url_alias_conf.url_alias_template_update, vo);
        alias_update.initial_url = CRUDURLController.get_crud_update_url(vo._type, vo.id);
        alias_update.url_alias_conf_id = url_alias_conf.id;
        alias_update.vo_id = vo.id; // On met l'id du vo pour le update
        return alias_update;
    }

    public static compile_url_from_template_for_vo(template: string, vo: IDistantVOBase): string {
        return template.replace(/:([a-zA-Z_]+)/g, (match, field_name) => {
            return (vo[field_name] != null) ? CRUDURLController.transliterate_field_value_to_url(vo[field_name]) : "_";
        });
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