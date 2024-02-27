import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import RangeHandler from '../../tools/RangeHandler';
import { query } from '../ContextFilter/vos/ContextQueryVO';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import ModuleTableCompositeUniqueKeyVO from "./vos/ModuleTableCompositeUniqueKeyVO";
import ModuleTableFieldVO from "./vos/ModuleTableFieldVO";

export default class ModuleTableCompositeUniqueKeyController {

    public static composite_unique_keys_by_vo_type_and_index: { [vo_type: string]: { [index: string]: ModuleTableCompositeUniqueKeyVO } } = {};
    public static composite_unique_key_by_index: { [index: string]: ModuleTableCompositeUniqueKeyVO } = {};

    /**
     * On stocke la déclaration de la clé composite unique. Les liens seront fait dans un second temps
     *  quand toutes les tables et les champs sont déclarées et importées en DB et donc ont un field_id
     * @param vo_type
     * @param fields
     */
    public static add_composite_unique_key_to_vo_type(vo_type: string, fields: ModuleTableFieldVO[]) {
        if ((!fields) || (!fields.length)) {
            return;
        }

        if (!vo_type) {
            return;
        }

        const composite_unique_key: ModuleTableCompositeUniqueKeyVO = new ModuleTableCompositeUniqueKeyVO();
        composite_unique_key.vo_type = vo_type;
        composite_unique_key.field_names = fields.map((f) => f.field_name);

        if (!ModuleTableCompositeUniqueKeyController.composite_unique_keys_by_vo_type_and_index[vo_type]) {
            ModuleTableCompositeUniqueKeyController.composite_unique_keys_by_vo_type_and_index[vo_type] = {};
        }

        ModuleTableCompositeUniqueKeyController.composite_unique_keys_by_vo_type_and_index[vo_type][composite_unique_key.index] = composite_unique_key;
        ModuleTableCompositeUniqueKeyController.composite_unique_key_by_index[composite_unique_key.index] = composite_unique_key;
    }

    /**
     * On résoud les liens pour init les ids en rapport avec les names de la déclaration initiale
     */
    public static solve_linked_ids_composite_unique_keys() {
        for (const vo_type in ModuleTableCompositeUniqueKeyController.composite_unique_keys_by_vo_type_and_index) {
            const composite_unique_key = ModuleTableCompositeUniqueKeyController.composite_unique_keys_by_vo_type_and_index[vo_type];

            const table = ModuleTableController.module_tables_by_vo_type[vo_type];

            for (const i in composite_unique_key) {
                const unique_field = composite_unique_key[i];

                unique_field.table_id = table.id;
                unique_field.field_id_num_ranges = RangeHandler.get_ids_ranges_from_list(unique_field.field_names.map((field_name) => {
                    return ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo_type][field_name].id;
                }));
            }
        }
    }

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

    public static get_normalized_index(composite_unique_key: ModuleTableCompositeUniqueKeyVO): string {
        return composite_unique_key.vo_type + '___' + composite_unique_key.field_names.join('_');
    }
}