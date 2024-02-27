import { cloneDeep } from "lodash";
import { query } from "../ContextFilter/vos/ContextQueryVO";
import IDistantVOBase from "../IDistantVOBase";
import DefaultTranslationVO from "../Translation/vos/DefaultTranslationVO";
import VOsTypesManager from "../VO/manager/VOsTypesManager";
import ModuleTableCompositeUniqueKeyController from "./ModuleTableCompositeUniqueKeyController";
import ModuleTableFieldVO from "./vos/ModuleTableFieldVO";
import ModuleTableVO from "./vos/ModuleTableVO";

export default class ModuleTableController {

    // Caches pour optis

    public static unique_fields_by_vo_type: { [vo_type: string]: ModuleTableFieldVO[][] } = {};
    public static field_name_to_api_map: { [vo_type: string]: { [field_name: string]: string } } = {};
    public static readonly_fields_by_ids: { [vo_type: string]: { [field_name: string]: boolean } } = {};

    public static create_new(
        tmp_module: Module,
        tmp_vo_type: string,
        voConstructor: () => T,
        tmp_fields: ModuleTableFieldVO[],
        default_label_field: ModuleTableFieldVO,
        label: string | DefaultTranslationVO = null
    ) {

        let res: ModuleTableVO = new ModuleTableVO();
    }

    /**
     * Permet de récupérer un clone dont les fields sont trasférable via l'api (en gros ça passe par un json.stringify).
     * Cela autorise l'usage en VO de fields dont les types sont incompatibles nativement avec json.stringify (moment par exemple qui sur un parse reste une string)
     * @param e Le VO dont on veut une version api
     * @param translate_field_id Si on veut traduire les field_id en api_field_id (false pour l'usage du update_vos que la context query)
     * @param translate_plain_obj_inside_fields_ids Si on veut traduire les plain obj à l'intérieur des fields (a priori true tout le temps, même dans le cas des context query)
     */
    public static default_get_api_version<T extends IDistantVOBase>(e: T, translate_field_id: boolean = true, translate_plain_obj_inside_fields_ids: boolean = true): any {
        if (!e) {
            return null;
        }

        let table = VOsTypesManager.moduleTables_by_voType[e._type];
        if ((!e._type) || !table) {
            return cloneDeep(e);
        }

        let res = {};
        if (!fields) {
            return cloneDeep(e);
        }

        res['_type'] = e._type;
        res['id'] = e.id;

        // C'est aussi ici qu'on peut décider de renommer les fields__ en fonction de l'ordre dans la def de moduletable
        //  pour réduire au max l'objet envoyé, et l'offusquer un peu
        let fieldIdToAPIMap: { [field_id: string]: string } = table.getFieldIdToAPIMap();

        /**
         * Cas des matroids, on ignore les champs du matroid dans ce cas, on recréera le matroid de l'autre côté via l'index
         *  et par contre on crée un field fictif _api_only_index avec l'index dedans
         */
        let ignore_fields: { [field_id: string]: boolean } = {};
        if (table.isMatroidTable) {
            let ignore_fields_ = MatroidController.getMatroidFields(table.vo_type);
            for (let i in ignore_fields_) {
                let ignore_field_ = ignore_fields_[i];
                ignore_fields[ignore_field_.field_id] = true;
            }
            res['_api_only_index'] = (e as any as VarDataBaseVO).index;
        }

        for (let i in fields) {
            let field = fields[i];

            if (field.is_readonly) {
                continue;
            }

            if (ignore_fields[field.field_id]) {
                continue;
            }

            let new_id = translate_field_id ? fieldIdToAPIMap[field.field_id] : field.field_id;
            res[new_id] = table.default_get_field_api_version(e[field.field_id], field, translate_plain_obj_inside_fields_ids);
        }

        return res;
    }

    /**
     * On obtient enfin un vo instancié correctement depuis la classe cible. Donc on pourra théoriquement utiliser
     * des méthodes sur les vos et de l'héritage de vo normalement ... théoriquement
     */
    public static default_from_api_version<T extends IDistantVOBase>(e: any): T {
        if (e == null) {
            return null;
        }

        let table = VOsTypesManager.moduleTables_by_voType[e._type];
        if ((!e._type) || !table) {
            return cloneDeep(e);
        }

        let res: T = table.getNewVO();
        let fields = VOsTypesManager.moduleTablesFields_by_voType_and_field_name[e._type];

        if ((!fields) || (!res)) {
            return cloneDeep(e);
        }

        res['_type'] = e._type;
        res['id'] = e.id;

        // C'est aussi ici qu'on peut décider de renommer les fields__ en fonction de l'ordre dans la def de moduletable
        //  pour réduire au max l'objet envoyé, et l'offusquer un peu
        let fieldIdToAPIMap: { [field_id: string]: string } = table.getFieldIdToAPIMap();

        /**
         * Cas des matroids, on recrée le matroid de l'autre côté via l'index dans _api_only_index
         */
        let ignore_fields: { [field_id: string]: boolean } = {};
        if (table.isMatroidTable && !!e['_api_only_index']) {
            let a: T = MatroidIndexHandler.from_normalized_vardata(e['_api_only_index']) as any as T;
            a._type = res._type;
            a.id = res.id;
            res = a;
            let ignore_fields_ = MatroidController.getMatroidFields(table.vo_type);
            for (let i in ignore_fields_) {
                let ignore_field_ = ignore_fields_[i];
                ignore_fields[ignore_field_.field_id] = true;
            }
        }

        for (let i in fields) {
            let field = fields[i];

            if (field.is_readonly) {
                continue;
            }

            if (ignore_fields[field.field_id]) {
                continue;
            }

            let old_id = fieldIdToAPIMap[field.field_id];
            res[field.field_id] = table.default_field_from_api_version(e[old_id], field);
        }

        /// Dans TOUS les cas, le field is_server est forcé à FALSE quand on vient du client
        if (!!res[reflect<IIsServerField>().is_server]) {
            res[reflect<IIsServerField>().is_server] = false;
        }

        return res;
    }

    /**
     * On init le cache des clés uniques, en réunissant les fields uniques (clé unique simple)
     *  et les index uniques (clé unique composite)
     */
    public static init_unique_fields_by_voType() {

        ModuleTableController.unique_fields_by_vo_type = {};

        for (let vo_type in VOsTypesManager.moduleTables_by_voType) {
            let table = VOsTypesManager.moduleTables_by_voType[vo_type];
            if (!table) {
                continue;
            }

            let table_fields_by_name = VOsTypesManager.moduleTablesFields_by_voType_and_field_name[vo_type];

            // On commence par les clés uniques composites
            if (ModuleTableCompositeUniqueKeyController.composite_unique_keys_by_vo_type_and_index[vo_type]) {
                let composite_unique_keys = ModuleTableCompositeUniqueKeyController.composite_unique_keys_by_vo_type_and_index[vo_type];
                for (let index in composite_unique_keys) {
                    let unique_field = composite_unique_keys[index];
                    if (!ModuleTableController.unique_fields_by_vo_type[vo_type]) {
                        ModuleTableController.unique_fields_by_vo_type[vo_type] = [];
                    }

                    ModuleTableController.unique_fields_by_vo_type[vo_type].push(unique_field.field_names.map((field_name) => {
                        return table_fields_by_name[field_name];
                    }));
                }
            }

            // Puis les clés uniques simples
            for (let i in table_fields_by_name) {
                let field = table_fields_by_name[i];
                if (field.is_unique) {

                    if (!ModuleTableController.unique_fields_by_vo_type[vo_type]) {
                        ModuleTableController.unique_fields_by_vo_type[vo_type] = [];
                    }

                    ModuleTableController.unique_fields_by_vo_type[vo_type].push([field]);
                }
            }
        }
    }

    /**
     * On récupère la version en base. Elle a été modifiée juste avant si on est sur le générateur
     */
    public static async load_ModuleTableVOs_from_db() {

        let db_tables = await query(ModuleTableVO.API_TYPE_ID).select_vos<ModuleTableVO>();

        for (let i in db_tables) {
            let db_table = db_tables[i];
            VOsTypesManager.moduleTables_by_voType[db_table.vo_type] = db_table;
        }
    }

    public static init_field_name_to_api_map() {

        ModuleTableController.field_name_to_api_map = {};

        for (let vo_type in VOsTypesManager.moduleTablesFields_by_voType_and_field_name) {
            let fields = VOsTypesManager.moduleTablesFields_by_voType_and_field_name[vo_type];

            let n = 0;
            let sortedFields = Object.values(fields).sort((a, b) => a.id - b.id);

            if ((!sortedFields) || (!sortedFields.length)) {
                continue;
            }

            ModuleTableController.field_name_to_api_map[vo_type] = {};

            for (let field_name in sortedFields) {
                let field = sortedFields[field_name];

                ModuleTableController.field_name_to_api_map[vo_type][field.field_name] = ModuleTableController.OFFUSC_IDs[n];
            }
        }
    }

    public static init_readonly_fields_by_ids() {

        ModuleTableController.readonly_fields_by_ids = {};

        for (let vo_type in VOsTypesManager.moduleTablesFields_by_voType_and_field_name) {
            let fields = VOsTypesManager.moduleTablesFields_by_voType_and_field_name[vo_type];

            if (!fields) {
                continue;
            }

            for (let i in fields) {
                let field = fields[i];

                if (field.is_readonly) {

                    if (!ModuleTableController.readonly_fields_by_ids[vo_type]) {
                        ModuleTableController.readonly_fields_by_ids[vo_type] = {};
                    }
                    ModuleTableController.readonly_fields_by_ids[vo_type][field.field_name] = true;
                }
            }
        }
    }

    private static OFFUSC_IDs = [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
        'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
        'w', 'x', 'y', 'z',
        'a0', 'b0', 'c0', 'd0', 'e0', 'f0', 'g0', 'h0', 'i0', 'j0', 'k0',
        'l0', 'm0', 'n0', 'o0', 'p0', 'q0', 'r0', 's0', 't0', 'u0', 'v0',
        'w0', 'x0', 'y0', 'z0',
        'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1', 'i1', 'j1', 'k1',
        'l1', 'm1', 'n1', 'o1', 'p1', 'q1', 'r1', 's1', 't1', 'u1', 'v1',
        'w1', 'x1', 'y1', 'z1',
        'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2', 'i2', 'j2', 'k2',
        'l2', 'm2', 'n2', 'o2', 'p2', 'q2', 'r2', 's2', 't2', 'u2', 'v2',
        'w2', 'x2', 'y2', 'z2',
        'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3', 'i3', 'j3', 'k3',
        'l3', 'm3', 'n3', 'o3', 'p3', 'q3', 'r3', 's3', 't3', 'u3', 'v3',
        'w3', 'x3', 'y3', 'z3',
        'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4', 'i4', 'j4', 'k4',
        'l4', 'm4', 'n4', 'o4', 'p4', 'q4', 'r4', 's4', 't4', 'u4', 'v4',
        'w4', 'x4', 'y4', 'z4',
        'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5', 'i5', 'j5', 'k5',
        'l5', 'm5', 'n5', 'o5', 'p5', 'q5', 'r5', 's5', 't5', 'u5', 'v5',
        'w5', 'x5', 'y5', 'z5',
        'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6', 'i6', 'j6', 'k6',
        'l6', 'm6', 'n6', 'o6', 'p6', 'q6', 'r6', 's6', 't6', 'u6', 'v6',
        'w6', 'x6', 'y6', 'z6',
        'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7', 'i7', 'j7', 'k7',
        'l7', 'm7', 'n7', 'o7', 'p7', 'q7', 'r7', 's7', 't7', 'u7', 'v7',
        'w7', 'x7', 'y7', 'z7',
        'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8', 'i8', 'j8', 'k8',
        'l8', 'm8', 'n8', 'o8', 'p8', 'q8', 'r8', 's8', 't8', 'u8', 'v8',
        'w8', 'x8', 'y8', 'z8',
        'a9', 'b9', 'c9', 'd9', 'e9', 'f9', 'g9', 'h9', 'i9', 'j9', 'k9',
        'l9', 'm9', 'n9', 'o9', 'p9', 'q9', 'r9', 's9', 't9', 'u9', 'v9',
        'w9', 'x9', 'y9', 'z9',
        'a_', 'b_', 'c_', 'd_', 'e_', 'f_', 'g_', 'h_', 'i_', 'j_', 'k_',
        'l_', 'm_', 'n_', 'o_', 'p_', 'q_', 'r_', 's_', 't_', 'u_', 'v_',
        'w_', 'x_', 'y_', 'z_',
    ];
}