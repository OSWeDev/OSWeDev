import { cloneDeep } from "lodash";
import ConsoleHandler from "../../tools/ConsoleHandler";
import MatroidIndexHandler from "../../tools/MatroidIndexHandler";
import { reflect } from "../../tools/ObjectHandler";
import { query } from "../ContextFilter/vos/ContextQueryVO";
import IDistantVOBase from "../IDistantVOBase";
import IIsServerField from "../IIsServerField";
import MatroidController from "../Matroid/MatroidController";
import DefaultTranslationVO from "../Translation/vos/DefaultTranslationVO";
import VOsTypesManager from "../VO/manager/VOsTypesManager";
import VarDataBaseVO from "../Var/vos/VarDataBaseVO";
import ModuleTableCompositeUniqueKeyController from "./ModuleTableCompositeUniqueKeyController";
import ModuleTableFieldController from "./ModuleTableFieldController";
import ModuleTableFieldVO from "./vos/ModuleTableFieldVO";
import ModuleTableVO from "./vos/ModuleTableVO";

export default class ModuleTableController {

    // Caches pour optis

    /**
     * Les tables par vo_type
     */
    public static module_tables_by_vo_type: { [voType: string]: ModuleTableVO } = {};
    /**
     * Les tables par module_table_vo_id
     */
    public static module_tables_by_vo_id: { [vo_id: number]: ModuleTableVO } = {};

    /**
     * Les champs uniques par vo_type
     */
    public static unique_fields_by_vo_type: { [vo_type: string]: ModuleTableFieldVO[][] } = {};
    /**
     * Les champs traduits en api_field
     */
    public static field_name_to_api_map: { [vo_type: string]: { [field_name: string]: string } } = {};
    /**
     * Les champs readonly par vo_type
     */
    public static readonly_fields_by_ids: { [vo_type: string]: { [field_name: string]: boolean } } = {};

    /**
     * Les fonctions de traduction des labels des tables
     * par défaut, on utilise le label_field
     * mais on peut aussi utiliser une fonction
     */
    public static table_label_function_by_vo_type: { [vo_type: string]: <T extends IDistantVOBase>(vo: T) => string } = {};
    /**
     * Les champs dont dépend la fonction de traduction des labels des tables
     */
    public static table_label_function_field_ids_deps_by_vo_type: { [vo_type: string]: string[] } = {};

    /**
     * Les constructeurs des vos par vo_type
     */
    public static vo_constructor_by_vo_type: { [vo_type: string]: { new(): IDistantVOBase } } = {};
    /**
     * Les vo_types déclarés par module
     */
    public static vo_type_by_module_name: { [module_name: string]: { [vo_type: string]: boolean } } = {};

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

    /**
     *
     * @param module_name Le nom du module qui initialise cette table
     * @param vo_type l'API_TYPE_ID de la table
     * @param voConstructor
     * @param label_field Le nom du champ qui sert de label pour la table. Inutile et à proscrire si on utilise une fonction pour le label
     * @param table_label La trad par défaut pour cette table
     * @returns une nouvelle instance de ModuleTableVO
     */
    public static create_new<T extends IDistantVOBase>(
        module_name: string,
        vo_constructor: { new(): T },
        label_field: ModuleTableFieldVO = null,
        label: string | DefaultTranslationVO = null
    ): ModuleTableVO {

        const res: ModuleTableVO = new ModuleTableVO();
        const vo_type: string = new vo_constructor()._type;

        // Check de cohérence : le vo_type doit être unique et en minuscules
        if (ModuleTableController.module_tables_by_vo_type[vo_type]) {
            ConsoleHandler.error('create_new: vo_type déjà déclaré: ' + vo_type);
            throw new Error('create_new: vo_type déjà déclaré: ' + vo_type);
        }

        if (vo_type != vo_type.toLowerCase()) {
            ConsoleHandler.error('create_new: vo_type doit être en minuscules: ' + vo_type);
            throw new Error('create_new: vo_type doit être en minuscules: ' + vo_type);
        }

        ModuleTableController.vo_constructor_by_vo_type[vo_type] = ModuleTableController.vo_constructor_wrapper(vo_constructor);

        res.default_label_field = label_field;

        res.vo_type = vo_type;
        res.module_name = module_name;
        if (!ModuleTableController.vo_type_by_module_name[module_name]) {
            ModuleTableController.vo_type_by_module_name[module_name] = {};
        }
        ModuleTableController.vo_type_by_module_name[module_name][vo_type] = true;
        if (!ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo_type]) {
            ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo_type] = {};
        }

        if (res.module_name) {
            res.set_bdd_suffix_prefix_table_name(res.module_name, res.vo_type, "module");
        }

        if (!label) {
            label = DefaultTranslationVO.create_new({ [DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION]: res.name });
        }
        if (typeof label === "string") {
            label = DefaultTranslationVO.create_new({ [DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION]: label });
        } else {
            if ((!label.default_translations) || (!label.default_translations[DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION])) {
                label.default_translations[DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION] = res.name;
            }
        }
        res.label = label;

        if (res.module_name) {
            res.set_bdd_ref("ref", res.module_name, res.vo_type, "module");
        }

        if (res.vo_type) {
            VOsTypesManager.registerModuleTable(res);
        }

        return res;
    }

    public static set_label_function(
        vo_type: string,
        table_label_function: (vo: IDistantVOBase) => string,
        table_label_function_field_ids_deps: string[]) {

        // Pas si sûr en fait... si on fait une requete en base on pourra pas appliquer pour le moment la fonction, donc on se rabat sur le default_label_field, du coup c'est pas forcément incohérent de définir les 2
        // // Petit check de cohérence, avec la nouvelle version, si on a un default_label_field, on ne devrait pas avoir de table_label_function
        // if (ModuleTableController.module_tables_by_vo_type[vo_type].default_label_field && table_label_function) {
        //     ConsoleHandler.error('set_label_function: Incohérence entre default_label_field et table_label_function, on ne doit pas avoir les 2 en même temps');
        //     return;
        // }

        ModuleTableController.table_label_function_by_vo_type[vo_type] = table_label_function;
        ModuleTableController.table_label_function_field_ids_deps_by_vo_type[vo_type] = table_label_function_field_ids_deps;
    }

    /**
     * Permet de récupérer un clone dont les fields sont trasférable via l'api (en gros ça passe par un json.stringify).
     * Cela autorise l'usage en VO de fields dont les types sont incompatibles nativement avec json.stringify (moment par exemple qui sur un parse reste une string)
     * @param e Le VO dont on veut une version api
     * @param translate_field_id Si on veut traduire les field_id en api_field_id (false pour l'usage du update_vos que la context query)
     * @param translate_plain_obj_inside_fields_ids Si on veut traduire les plain obj à l'intérieur des fields (a priori true tout le temps, même dans le cas des context query)
     */
    public static translate_vos_to_api<T extends IDistantVOBase>(e: T, translate_field_id: boolean = true, translate_plain_obj_inside_fields_ids: boolean = true): { [e in keyof T]: T[e] } {
        if (!e) {
            return null;
        }

        const table = ModuleTableController.module_tables_by_vo_type[e._type];
        if ((!e._type) || !table) {
            return cloneDeep(e);
        }

        const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[e._type];
        if (!fields) {
            return cloneDeep(e);
        }

        const res: T = {
            _type: e._type,
            id: e.id,
        } as T;

        // C'est aussi ici qu'on peut décider de renommer les fields__ en fonction de l'ordre dans la def de moduletable
        //  pour réduire au max l'objet envoyé, et l'offusquer un peu
        const fieldIdToAPIMap: { [field_id: string]: string } = ModuleTableController.field_name_to_api_map[e._type];

        /**
         * Cas des matroids, on ignore les champs du matroid dans ce cas, on recréera le matroid de l'autre côté via l'index
         *  et par contre on crée un field fictif _api_only_index avec l'index dedans
         */
        const ignore_fields: { [field_id: string]: boolean } = {};
        if (table.isMatroidTable) {
            const ignore_fields_ = MatroidController.getMatroidFields(table.vo_type);
            for (const i in ignore_fields_) {
                const ignore_field_ = ignore_fields_[i];
                ignore_fields[ignore_field_.field_name] = true;
            }
            res['_api_only_index'] = (e as unknown as VarDataBaseVO).index;
        }

        for (const i in fields) {
            const field = fields[i];

            if (field.is_readonly) {
                continue;
            }

            if (ignore_fields[field.field_name]) {
                continue;
            }

            const new_id = translate_field_id ? fieldIdToAPIMap[field.field_name] : field.field_name;
            res[new_id] = ModuleTableFieldController.translate_field_to_api(e[field.field_name], field, translate_plain_obj_inside_fields_ids);
        }

        return res;
    }

    /**
     * On obtient enfin un vo instancié correctement depuis la classe cible. Donc on pourra théoriquement utiliser
     * des méthodes sur les vos et de l'héritage de vo normalement ... théoriquement
     */
    public static translate_vos_from_api<T extends IDistantVOBase>(e: { [f in keyof T]: T[f] }): T {
        if (e == null) {
            return null;
        }

        const table = ModuleTableController.module_tables_by_vo_type[e._type];
        if ((!e._type) || !table) {
            return cloneDeep(e);
        }

        let res: T = new ModuleTableController.vo_constructor_by_vo_type[table.vo_type]() as T;
        const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[e._type];

        if ((!fields) || (!res)) {
            return cloneDeep(e);
        }

        res['_type'] = e._type;
        res['id'] = e.id;

        // C'est aussi ici qu'on peut décider de renommer les fields__ en fonction de l'ordre dans la def de moduletable
        //  pour réduire au max l'objet envoyé, et l'offusquer un peu
        const fieldIdToAPIMap: { [field_name: string]: string } = ModuleTableController.field_name_to_api_map[e._type];

        /**
         * Cas des matroids, on recrée le matroid de l'autre côté via l'index dans _api_only_index
         */
        const ignore_fields: { [field_name: string]: boolean } = {};
        if (table.isMatroidTable && !!e['_api_only_index']) {
            const a: T = MatroidIndexHandler.from_normalized_vardata(e['_api_only_index']) as unknown as T;
            a._type = res._type;
            a.id = res.id;
            res = a;
            const ignore_fields_ = MatroidController.getMatroidFields(table.vo_type);
            for (const i in ignore_fields_) {
                const ignore_field_ = ignore_fields_[i];
                ignore_fields[ignore_field_.field_name] = true;
            }
        }

        for (const i in fields) {
            const field = fields[i];

            if (field.is_readonly) {
                continue;
            }

            if (ignore_fields[field.field_name]) {
                continue;
            }

            const old_id = fieldIdToAPIMap[field.field_name];
            res[field.field_name] = ModuleTableFieldController.translate_field_from_api(e[old_id], field);
        }

        /// Dans TOUS les cas, le field is_server est forcé à FALSE quand on vient du client
        if (res[reflect<IIsServerField>().is_server]) {
            res[reflect<IIsServerField>().is_server] = false;
        }

        return res;
    }

    /**
     * On encapsule pour appliquer les valeurs par défaut définie dans le moduletablefield
     * @param vo_constructor
     */
    public static vo_constructor_wrapper<T extends IDistantVOBase>(
        vo_constructor: { new(): T }
    ): { new(): T } {
        return class implements IDistantVOBase {
            public id: number;
            public _type: string;

            public constructor() {
                let res = new vo_constructor();

                return ModuleTableController.apply_default_fields(res);
            }

        } as { new(): T };
    }

    public static apply_default_fields<T extends IDistantVOBase>(vo: T): T {

        const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo._type];

        for (const i in fields) {
            const field = fields[i];

            if ((typeof vo[field.field_name] == 'undefined') && field.has_default && !!field.field_default_value) {
                vo[field.field_name] = field.field_default_value.value;
            }
        }

        return vo;
    }

    /**
     * On récupère la version en base. Elle a été modifiée juste avant si on est sur le générateur
     */
    public static async load_ModuleTableVOs_from_db() {

        const db_tables = await query(ModuleTableVO.API_TYPE_ID).select_vos<ModuleTableVO>();

        for (const i in db_tables) {
            const db_table = db_tables[i];
            ModuleTableController.module_tables_by_vo_type[db_table.vo_type] = db_table;
        }
    }

    public static initialize() {
        ModuleTableController.init_default_fields_to_moduletable_and_moduletablefield();

        ModuleTableController.init_unique_fields_by_voType();
        ModuleTableController.init_field_name_to_api_map();
        ModuleTableController.init_readonly_fields_by_ids();
        ModuleTableController.init_default_trad_field_label_translatable_code();
    }

    /**
     * On init le cache des clés uniques, en réunissant les fields uniques (clé unique simple)
     *  et les index uniques (clé unique composite)
     */
    private static init_unique_fields_by_voType() {

        ModuleTableController.unique_fields_by_vo_type = {};

        for (const vo_type in ModuleTableController.module_tables_by_vo_type) {
            const table = ModuleTableController.module_tables_by_vo_type[vo_type];
            if (!table) {
                continue;
            }

            const table_fields_by_name = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo_type];

            // On commence par les clés uniques composites
            if (ModuleTableCompositeUniqueKeyController.composite_unique_keys_by_vo_type_and_index[vo_type]) {
                const composite_unique_keys = ModuleTableCompositeUniqueKeyController.composite_unique_keys_by_vo_type_and_index[vo_type];
                for (const index in composite_unique_keys) {
                    const unique_field = composite_unique_keys[index];
                    if (!ModuleTableController.unique_fields_by_vo_type[vo_type]) {
                        ModuleTableController.unique_fields_by_vo_type[vo_type] = [];
                    }

                    ModuleTableController.unique_fields_by_vo_type[vo_type].push(unique_field.field_names.map((field_name) => {
                        return table_fields_by_name[field_name];
                    }));
                }
            }

            // Puis les clés uniques simples
            for (const i in table_fields_by_name) {
                const field = table_fields_by_name[i];
                if (field.is_unique) {

                    if (!ModuleTableController.unique_fields_by_vo_type[vo_type]) {
                        ModuleTableController.unique_fields_by_vo_type[vo_type] = [];
                    }

                    ModuleTableController.unique_fields_by_vo_type[vo_type].push([field]);
                }
            }
        }
    }

    private static init_default_fields_to_moduletable_and_moduletablefield() {

        for (const vo_type in ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name) {
            const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo_type];

            for (const i in fields) {
                const field = fields[i];

                ModuleTableController.apply_default_fields(field);
            }
        }

        for (const i in ModuleTableController.module_tables_by_vo_type) {
            const table = ModuleTableController.module_tables_by_vo_type[i];

            ModuleTableController.apply_default_fields(table);
        }
    }

    private static init_default_trad_field_label_translatable_code() {
        for (const vo_type in ModuleTableFieldController.default_field_translation_by_vo_type_and_field_name) {
            const fields = ModuleTableFieldController.default_field_translation_by_vo_type_and_field_name[vo_type];

            for (const field_name in fields) {
                const default_translation = fields[field_name];
                const field = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo_type][field_name];

                if (!field) {
                    continue;
                }

                if (!default_translation.code_text) {
                    default_translation.code_text = field.field_label_translatable_code;
                }
            }
        }
    }

    private static init_field_name_to_api_map() {

        ModuleTableController.field_name_to_api_map = {};

        for (const vo_type in ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name) {
            const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo_type];

            let n = 0;
            const sortedFields = Object.values(fields).sort((a, b) => a.id - b.id);

            if ((!sortedFields) || (!sortedFields.length)) {
                continue;
            }

            ModuleTableController.field_name_to_api_map[vo_type] = {};

            for (const field_name in sortedFields) {
                const field = sortedFields[field_name];

                ModuleTableController.field_name_to_api_map[vo_type][field.field_name] = ModuleTableController.OFFUSC_IDs[n++];
            }
        }
    }

    private static init_readonly_fields_by_ids() {

        ModuleTableController.readonly_fields_by_ids = {};

        for (const vo_type in ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name) {
            const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo_type];

            if (!fields) {
                continue;
            }

            for (const i in fields) {
                const field = fields[i];

                if (field.is_readonly) {

                    if (!ModuleTableController.readonly_fields_by_ids[vo_type]) {
                        ModuleTableController.readonly_fields_by_ids[vo_type] = {};
                    }
                    ModuleTableController.readonly_fields_by_ids[vo_type][field.field_name] = true;
                }
            }
        }
    }
}