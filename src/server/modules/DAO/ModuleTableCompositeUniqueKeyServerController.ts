import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleTableCompositeUniqueKeyController from "../../../shared/modules/DAO/ModuleTableCompositeUniqueKeyController";
import ModuleTableCompositeUniqueKeyVO from "../../../shared/modules/DAO/vos/ModuleTableCompositeUniqueKeyVO";
import ModuleDAOServer from "./ModuleDAOServer";

export default class ModuleTableCompositeUniqueKeyServerController {

    /**
     * On tente de récupérer la conf actuellement en base,
     * on la compare à la conf actuelle et on met à jour si besoin
     * On doit bien supprimer les clés en trop en base, ajouter celles qui manquent, et modifier les existantes
     * (cependant on n'a pas de clé primaire donc ça se résume à supprimer ce qui est en trop et ajouter ce qui manque)
     */
    public static async push_composite_unique_keys_to_db(is_generator: boolean = false) {
        const to_deletes: ModuleTableCompositeUniqueKeyVO[] = [];
        const to_inserts: ModuleTableCompositeUniqueKeyVO[] = [];

        const db_composite_unique_keys_by_index: { [index: string]: ModuleTableCompositeUniqueKeyVO } = {};
        let db_composite_unique_keys = await query(ModuleTableCompositeUniqueKeyVO.API_TYPE_ID).select_vos<ModuleTableCompositeUniqueKeyVO>();

        for (const i in db_composite_unique_keys) {
            const db_composite_unique_key = db_composite_unique_keys[i];
            db_composite_unique_keys_by_index[db_composite_unique_key.index] = db_composite_unique_key;

            if (!ModuleTableCompositeUniqueKeyController.composite_unique_key_by_index[db_composite_unique_key.index]) {
                if (!is_generator) {
                    throw new Error('Composite unique key not found in conf: ' + db_composite_unique_key.index);
                }

                to_deletes.push(db_composite_unique_key);
                continue;
            }

            if (!is_generator) {
                ModuleTableCompositeUniqueKeyController.composite_unique_key_by_index[db_composite_unique_key.index] = db_composite_unique_key;

                if (!ModuleTableCompositeUniqueKeyController.composite_unique_keys_by_vo_type_and_index[db_composite_unique_key.vo_type]) {
                    ModuleTableCompositeUniqueKeyController.composite_unique_keys_by_vo_type_and_index[db_composite_unique_key.vo_type] = {};
                }
                ModuleTableCompositeUniqueKeyController.composite_unique_keys_by_vo_type_and_index[db_composite_unique_key.vo_type][db_composite_unique_key.index] = db_composite_unique_key;
            }
        }

        if (!is_generator) {
            return;
        }

        for (const index in ModuleTableCompositeUniqueKeyController.composite_unique_key_by_index) {
            const composite_unique_key = ModuleTableCompositeUniqueKeyController.composite_unique_key_by_index[index];

            if (!db_composite_unique_keys_by_index[index]) {
                if (!is_generator) {
                    throw new Error('Composite unique key not found in db: ' + index);
                }

                to_inserts.push(composite_unique_key);
            }
        }

        if (to_deletes.length) {
            await ModuleDAOServer.getInstance().deleteVOs_as_server(to_deletes);
        }
        if (to_inserts.length) {
            await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(to_inserts);
        }

        db_composite_unique_keys = await query(ModuleTableCompositeUniqueKeyVO.API_TYPE_ID).select_vos<ModuleTableCompositeUniqueKeyVO>();
        /**
         * On recharge la DB pour init les ids des VOs après les différentes modifs
         */
        for (const i in db_composite_unique_keys) {
            const db_composite_unique_key = db_composite_unique_keys[i];
            ModuleTableCompositeUniqueKeyController.composite_unique_key_by_index[db_composite_unique_key.index] = db_composite_unique_key;

            if (!ModuleTableCompositeUniqueKeyController.composite_unique_keys_by_vo_type_and_index[db_composite_unique_key.vo_type]) {
                ModuleTableCompositeUniqueKeyController.composite_unique_keys_by_vo_type_and_index[db_composite_unique_key.vo_type] = {};
            }
            ModuleTableCompositeUniqueKeyController.composite_unique_keys_by_vo_type_and_index[db_composite_unique_key.vo_type][db_composite_unique_key.index] = db_composite_unique_key;
        }
    }
}