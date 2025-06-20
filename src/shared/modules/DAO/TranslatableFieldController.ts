import Dates from "../FormatDatesNombres/Dates/Dates";
import ModuleTableFieldVO from "./vos/ModuleTableFieldVO";

export default class TranslatableFieldController {

    /**
     * Pour rendre unique, on doit être informé dès le démarrage du main/bgthread/client_tab de cet identifiant
     */
    public static thread_name: string = null;

    private static current_auto_inc_uid: number = 0;

    /**
     * On génère un code automatiquement, unique, en respectant ces règles :
     *  - Commence par vo_type + '.' + field_name + '.' + timestamp_ms (précis avec virgule) + '.' + auto_inc_uid (auto_inc_uid est localement unique dans une instance de thread ou de client_tab)
     *
     *  - Côté serveur :
     *      - on ajoute 'main' ou le numéro du bgthread
     *  - Côté client :
     *      - on ajoute le client_tab
     *
     * @param field
     */
    public static get_new_translatable_field_auto_gen_code_text(field: ModuleTableFieldVO): string {

        return field.module_table_vo_type + '.' + field.field_name + '.' + Dates.now_ms() + '.' + TranslatableFieldController.getNextAutoIncUid() + '.' + TranslatableFieldController.thread_name;
    }

    private static getNextAutoIncUid(): number {
        return TranslatableFieldController.current_auto_inc_uid++;
    }


}