import { isArray } from "lodash";
import ConsoleHandler from "../../tools/ConsoleHandler";
import ConversionHandler from "../../tools/ConversionHandler";
import MatroidIndexHandler from "../../tools/MatroidIndexHandler";
import ObjectHandler, { field_names, reflect } from "../../tools/ObjectHandler";
import RangeHandler from "../../tools/RangeHandler";
import { query } from "../ContextFilter/vos/ContextQueryVO";
import ExportedJSONForeignKeyRefVO from "../DataExport/vos/ExportedJSONForeignKeyRefVO";
import HourRange from "../DataRender/vos/HourRange";
import NumRange from "../DataRender/vos/NumRange";
import TSRange from "../DataRender/vos/TSRange";
import IIsServerField from "../IIsServerField";
import StatsController from "../Stats/StatsController";
import TableFieldTypesManager from "../TableFieldTypes/TableFieldTypesManager";
import DefaultTranslationVO from "../Translation/vos/DefaultTranslationVO";
import LangVO from "../Translation/vos/LangVO";
import TranslatableTextVO from "../Translation/vos/TranslatableTextVO";
import TranslationVO from "../Translation/vos/TranslationVO";
import VOsTypesManager from "../VO/manager/VOsTypesManager";
import ModuleDAO from "./ModuleDAO";
import ModuleTableController from "./ModuleTableController";
import TranslatableFieldController from "./TranslatableFieldController";
import ModuleTableFieldVO from "./vos/ModuleTableFieldVO";

export default class ModuleTableFieldController {

    public static default_field_translation_by_vo_type_and_field_name: { [vo_type: string]: { [field_name: string]: DefaultTranslationVO } } = {};

    /**
     * Les fields des tables par type de vo et nom de field
     */
    public static module_table_fields_by_vo_type_and_field_name: { [voType: string]: { [field_name: string]: ModuleTableFieldVO } } = {};
    /**
     * Les fields des tables par id de vo et id de field
     */
    public static module_table_fields_by_vo_id_and_field_id: { [vo_id: number]: { [field_id: number]: ModuleTableFieldVO } } = {};
    public static module_table_fields_by_field_id: { [field_id: number]: ModuleTableFieldVO } = {};


    public static create_new<T>(
        vo_type: string,
        field_name: string,                    //titre de la colonne en base
        field_type: string,                  //type de donnée dans la colonne
        field_label: string | DefaultTranslationVO,   //titre de la colonne a afficher
        field_required: boolean = false,     //si champ obligatoire
        has_default: boolean = false,        //si valeur par defaut
        field_default: T = null              //valeur par defaut
    ): ModuleTableFieldVO {
        const res: ModuleTableFieldVO = new ModuleTableFieldVO();

        res.module_table_vo_type = vo_type;
        res.field_name = field_name;
        res.field_type = field_type;
        res.field_required = field_required;
        res.has_default = has_default;

        if (has_default) {
            res.field_default_value = {
                value: typeof field_default == 'undefined' ? null : field_default,
            };
        }

        // Check de cohérence : le field_name doit être unique et en minuscules
        if (ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo_type] &&
            ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo_type][field_name]) {
            ConsoleHandler.error('create_new: field_name doit être unique: ' + field_name);
            throw new Error('create_new: field_name doit être unique: ' + field_name);
        }

        if (field_name != field_name.toLowerCase()) {
            ConsoleHandler.error('create_new: field_name doit être en minuscules: ' + field_name);
            // TODO FIXME : remettre le THROW en place quand on n'aura plus de données ultra critiques qui sont incompatibles avec ce test .....
            // throw new Error('create_new: field_name doit être en minuscules: ' + field_name);
        }

        if (!ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo_type]) {
            ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo_type] = {};
        }
        ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo_type][field_name] = res;

        res.cascade_on_delete = field_required;

        if (!field_label) {
            field_label = DefaultTranslationVO.create_new({ [DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION]: res.field_name });
        }

        if (typeof field_label === "string") {
            field_label = DefaultTranslationVO.create_new({ [DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION]: field_label });
        } else {
            if ((!field_label.default_translations) || (!field_label.default_translations[DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION])) {
                field_label.default_translations[DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION] = res.field_name;
            }
        }

        if (!ModuleTableFieldController.default_field_translation_by_vo_type_and_field_name[vo_type]) {
            ModuleTableFieldController.default_field_translation_by_vo_type_and_field_name[vo_type] = {};
        }
        ModuleTableFieldController.default_field_translation_by_vo_type_and_field_name[vo_type][field_name] = field_label;

        // Si le champs est de type translatable_string, on force la génération de code automatique :
        if (field_type == ModuleTableFieldVO.FIELD_TYPE_translatable_string) {
            res.set_field_default_dynamic_value('dao', 'get_new_translatable_field_auto_gen_code_text'); // En dur pour éviter une liaison/import au module
        }

        return res;
    }

    public static validate_field_value(field: ModuleTableFieldVO, data: unknown): string {
        switch (field.field_type) {
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                if (data == null || data == "") {
                    return null;
                }
                if ((data as string).toLowerCase().indexOf("h") < 0) {
                    return ModuleTableFieldVO.VALIDATION_CODE_TEXT_need_h;
                }
                return null;

            case ModuleTableFieldVO.FIELD_TYPE_password:
                return ModuleTableFieldController.passwordIsValidProposition(data as string);

            case ModuleTableFieldVO.FIELD_TYPE_image_field:
            case ModuleTableFieldVO.FIELD_TYPE_image_ref:
            case ModuleTableFieldVO.FIELD_TYPE_file_field:
            case ModuleTableFieldVO.FIELD_TYPE_file_ref:
            case ModuleTableFieldVO.FIELD_TYPE_html:
            case ModuleTableFieldVO.FIELD_TYPE_html_array:
            case ModuleTableFieldVO.FIELD_TYPE_int:
            case ModuleTableFieldVO.FIELD_TYPE_enum:
            case ModuleTableFieldVO.FIELD_TYPE_amount:
            case ModuleTableFieldVO.FIELD_TYPE_boolean:
            case ModuleTableFieldVO.FIELD_TYPE_date:
            case ModuleTableFieldVO.FIELD_TYPE_daterange:
            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_numrange:
            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_tstz:
            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
            case ModuleTableFieldVO.FIELD_TYPE_day:
            case ModuleTableFieldVO.FIELD_TYPE_month:
            case ModuleTableFieldVO.FIELD_TYPE_float:
            case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
            case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
            case ModuleTableFieldVO.FIELD_TYPE_geopoint:
            case ModuleTableFieldVO.FIELD_TYPE_int_array:
            case ModuleTableFieldVO.FIELD_TYPE_float_array:
            case ModuleTableFieldVO.FIELD_TYPE_prct:
            case ModuleTableFieldVO.FIELD_TYPE_email:
            case ModuleTableFieldVO.FIELD_TYPE_string:
            case ModuleTableFieldVO.FIELD_TYPE_color:
            case ModuleTableFieldVO.FIELD_TYPE_color_array:
            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
            case ModuleTableFieldVO.FIELD_TYPE_textarea:
            case ModuleTableFieldVO.FIELD_TYPE_translatable_string:
            case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
            case ModuleTableFieldVO.FIELD_TYPE_string_array:
            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
            case ModuleTableFieldVO.FIELD_TYPE_hour:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_timewithouttimezone:
                return null;

            default:
                for (const i in TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers) {
                    const tableFieldTypeController = TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers[i];

                    if (field.field_type == tableFieldTypeController.name) {
                        return tableFieldTypeController.defaultValidator(data, field);
                    }
                }
        }
    }

    //#region API translation methods
    public static translate_field_from_api(e: unknown, field: ModuleTableFieldVO): unknown {
        if ((!field) || field.is_readonly) {
            throw new Error('Should not ask for readonly fields');
        }

        /// Dans TOUS les cas, le field is_server est forcé à FALSE quand on vient du client
        if (field.field_name == reflect<IIsServerField>().is_server) {
            return false;
        }

        /**
         * Si le champ est secure_boolean_switch_only_server_side, on bloque au niveau des APIs à false, et on log si ya une tentative d'envoi d'un true depuis le client
         */
        if (field.secure_boolean_switch_only_server_side) {
            if (e) {
                StatsController.register_stat_COMPTEUR(StatsController.GROUP_NAME_ERROR_ALERTS, "translate_from_api.secure_boolean_switch_only_server_side", field.module_table_vo_type + '.' + field.field_name);
            }
            return false;
        }

        switch (field.field_type) {

            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                return RangeHandler.translate_from_api(NumRange.RANGE_TYPE, e as string);

            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                return RangeHandler.translate_from_api(TSRange.RANGE_TYPE, e as string);

            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                return RangeHandler.translate_from_api(HourRange.RANGE_TYPE, e as string);

            case ModuleTableFieldVO.FIELD_TYPE_numrange:
                return MatroidIndexHandler.from_normalized_range(e as string, NumRange.RANGE_TYPE);

            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
                return MatroidIndexHandler.from_normalized_range(e as string, HourRange.RANGE_TYPE);

            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                return MatroidIndexHandler.from_normalized_range(e as string, TSRange.RANGE_TYPE);

            case ModuleTableFieldVO.FIELD_TYPE_hour:
            case ModuleTableFieldVO.FIELD_TYPE_tstz:
                return ConversionHandler.forceNumber(e as string | number);

            case ModuleTableFieldVO.FIELD_TYPE_int_array:
            case ModuleTableFieldVO.FIELD_TYPE_float_array: {
                if (Array.isArray(e)) {
                    return e;
                }

                if (!e) {
                    return null;
                }

                if (e == '{}') {
                    return [];
                }

                const res: Array<number | string> = ((e as string).length > 2) ? (e as string).substring(1, (e as string).length - 1).split(',') : null;

                if (res && res.length) {
                    for (const i in res) {
                        res[i] = ConversionHandler.forceNumber(res[i]);
                    }
                    return res;
                }

                return e;
            }
            case ModuleTableFieldVO.FIELD_TYPE_string_array:
            case ModuleTableFieldVO.FIELD_TYPE_html_array:
                if (Array.isArray(e)) {
                    return e;
                }

                if (!e) {
                    return null;
                }

                if (e == '{}') {
                    return [];
                }

                return ((e as string).length > 2) ? (e as string).substring(1, (e as string).length - 1).split(',') : e;

            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj: {

                if (e == null) {
                    return null;
                }

                if (e == '{}') {
                    return {};
                }

                if (!ObjectHandler.try_is_json(e)) {
                    return e;
                }

                let trans_ = ObjectHandler.try_get_json(e);
                if (trans_) {

                    /**
                     * Prise en compte des tableaux. dans ce cas chaque élément du tableau est instancié
                     */
                    if (isArray(trans_)) {
                        const new_array = [];
                        for (const i in trans_) {
                            const transi = trans_[i];

                            if (!ObjectHandler.try_is_json(transi)) {
                                new_array.push(transi);
                            } else {
                                new_array.push(ModuleTableController.translate_vos_from_api(ObjectHandler.try_get_json(transi)));
                            }
                        }
                        trans_ = new_array;
                    } else {

                        /**
                         * Si on est sur un object, pas tableau et pas typé, on boucle sur les champs pour les traduire aussi (puisque potentiellement des objects typés)
                         */
                        const elt_type = trans_ ? trans_._type : null;

                        const field_table = elt_type ? ModuleTableController.module_tables_by_vo_type[elt_type] : null;
                        if (!field_table) {
                            const new_obj = new Object();
                            for (const i in trans_) {
                                const transi = trans_[i];

                                if (!ObjectHandler.try_is_json(transi)) {
                                    new_obj[i] = transi;
                                } else {
                                    new_obj[i] = ModuleTableController.translate_vos_from_api(ObjectHandler.try_get_json(transi));
                                }
                            }
                            trans_ = new_obj;
                        } else {
                            const translated_vos_from_api = ModuleTableController.translate_vos_from_api(trans_);

                            // Si on a déjà un vo typé, on le garde - cas des varsdatas où on doit surtout pas utiliser un Object.assign derrière
                            if (translated_vos_from_api && translated_vos_from_api._type) {
                                trans_ = translated_vos_from_api;
                            } else {
                                trans_ = Object.assign(new ModuleTableController.vo_constructor_by_vo_type[elt_type](), translated_vos_from_api);
                                // TEST AB FAIT PEU OU PAS D'INTERET trans_ = Object.create(ModuleTableController.vo_constructor_proto_by_vo_type[elt_type], Object.getOwnPropertyDescriptors(translated_vos_from_api));
                            }
                        }
                    }
                }
                return trans_;
            }
            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:

                if (!e) {
                    return null;
                }

                if (e == '{}') {
                    return [];
                }

                return (e as string[]).map((ts: string) => ConversionHandler.forceNumber(ts));

            default:
                return e;
        }
    }

    public static translate_field_to_api(e: any, field: ModuleTableFieldVO, translate_field_id: boolean = true): any {
        if ((!field) || (field.is_readonly)) {
            throw new Error('Should not ask for readonly fields');
        }

        /**
         * Si le champ est secure_boolean_switch_only_server_side, on bloque au niveau des APIs à false, et on log si ya une tentative d'envoi d'un true depuis le client
         */
        if (field.secure_boolean_switch_only_server_side) {
            if (e) {
                StatsController.register_stat_COMPTEUR(StatsController.GROUP_NAME_ERROR_ALERTS, "translate_to_api.secure_boolean_switch_only_server_side", field.module_table_vo_type + '.' + field.field_name);
            }
            return false;
        }

        switch (field.field_type) {


            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                return RangeHandler.translate_to_api(e);

            case ModuleTableFieldVO.FIELD_TYPE_numrange:
            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
                return RangeHandler.translate_range_to_api(e);

            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:

                if (e && e._type) {

                    const trans_plain_vo_obj = e ? ModuleTableController.translate_vos_to_api(e, translate_field_id) : null;
                    return trans_plain_vo_obj ? JSON.stringify(trans_plain_vo_obj) : null;

                } else if ((!!e) && isArray(e)) {

                    /**
                     * Gestion des tableaux de plain_vo_obj
                     */
                    const trans_array = [];
                    for (const i in e) {
                        const e_ = e[i];

                        if ((typeof e_ === 'string') && ((!e_) || (e_.indexOf('{') < 0))) {
                            trans_array.push(e_);
                        } else {
                            trans_array.push(ModuleTableFieldController.translate_field_to_api(e_, field, translate_field_id));
                        }
                    }
                    return JSON.stringify(trans_array);

                } else if (e) {
                    return (typeof e == 'object') ? JSON.stringify(e) : e;
                } else {
                    return null;
                }

            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
            case ModuleTableFieldVO.FIELD_TYPE_tstz:
            default:
                return e;
        }
    }
    //#endregion


    //#region EXPORTED JSON translation methods
    public static async translate_field_from_exported_json(e: unknown, field: ModuleTableFieldVO, table_de_correspondance_des_ids: { [vo_type: string]: { [vo_id_source: number]: number } }): Promise<unknown> {
        if ((!field) || field.is_readonly) {
            throw new Error('Should not ask for readonly fields');
        }

        /// Dans TOUS les cas, le field is_server est forcé à FALSE quand on vient du client
        if (field.field_name == reflect<IIsServerField>().is_server) {
            return false;
        }

        /**
         * Si le champ est secure_boolean_switch_only_server_side, on bloque au niveau des APIs à false, et on log si ya une tentative d'envoi d'un true depuis le client
         */
        if (field.secure_boolean_switch_only_server_side) {
            if (e) {
                StatsController.register_stat_COMPTEUR(StatsController.GROUP_NAME_ERROR_ALERTS, "translate_field_from_exported_json.secure_boolean_switch_only_server_side", field.module_table_vo_type + '.' + field.field_name);
            }
            return false;
        }

        switch (field.field_type) {

            case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
            case ModuleTableFieldVO.FIELD_TYPE_file_ref:
            case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                // Pour les foreign key, on a donc traduit en passant par un ExportedJSONForeignKeyRefVO qu'on a plug dans ce champs à la place de l'id attendu initialement.
                // à ce stade, on veut identifier dans la base actuelle le bon vo, et en particulier son id, pour le remettre dans le champs.
                // en premier lieu, si c'est un vo_id directement, on le replug et c'est terminé.
                // puis si c'est un vo complet, on le traduit from exported_json, on le crée en base et on plug l'id fraichement créé
                // et si c'est un lien par un champs d'unicité, on select_vo par ce champ d'unicité, et on plug l'id du vo trouvé : si on trouve pas ou plusieurs : throw
                if (!e) {
                    return null;
                }

                const exported_json_foreign_key_ref: ExportedJSONForeignKeyRefVO = e as ExportedJSONForeignKeyRefVO;

                switch (exported_json_foreign_key_ref.ref_type) {
                    case ExportedJSONForeignKeyRefVO.REF_TYPE_ID:
                        // On a un id direct, on le replug et c'est terminé.
                        if (exported_json_foreign_key_ref.vo_id) {
                            return exported_json_foreign_key_ref.vo_id;
                        } else {
                            throw new Error('translate_field_from_exported_json: REF_TYPE_ID but no vo_id');
                        }
                        break;

                    case ExportedJSONForeignKeyRefVO.REF_TYPE_FULL_VO:
                        // On a un vo complet, on le traduit from exported_json, on le crée en base et on plug l'id fraichement créé
                        if (exported_json_foreign_key_ref.vo_exported_json) {
                            const translated_vo = await ModuleTableController.translate_vos_from_exported_json(exported_json_foreign_key_ref.vo_exported_json, table_de_correspondance_des_ids);
                            if (!translated_vo) {
                                throw new Error('translate_field_from_exported_json: REF_TYPE_FULL_VO but no translated_vo');
                            }

                            await ModuleDAO.getInstance().insertOrUpdateVO(translated_vo);
                            if (!translated_vo.id) {
                                throw new Error('translate_field_from_exported_json: REF_TYPE_FULL_VO but no translated_vo or id');
                            }
                            return translated_vo.id;
                        } else {
                            throw new Error('translate_field_from_exported_json: REF_TYPE_FULL_VO but no vo_exported_json');
                        }
                        break;

                    case ExportedJSONForeignKeyRefVO.REF_TYPE_UNIQUE_FIELD_TYPE_STRING:
                        // On a un champ d'unicité de type string, on select_vo par ce champ d'unicité, et on plug l'id du vo trouvé : si on trouve pas ou plusieurs : throw
                        if (exported_json_foreign_key_ref.unique_field_value_string) {
                            const translated_vo = await query(field.foreign_ref_vo_type)
                                .filter_by_text_eq(exported_json_foreign_key_ref.unique_field_name, exported_json_foreign_key_ref.unique_field_value_string)
                                .select_vo();
                            if (!translated_vo) {
                                throw new Error('translate_field_from_exported_json: REF_TYPE_UNIQUE_FIELD_TYPE_STRING but no translated_vo found');
                            }
                            return translated_vo.id;
                        } else {
                            throw new Error('translate_field_from_exported_json: REF_TYPE_UNIQUE_FIELD_TYPE_STRING but no unique_field_value_string');
                        }
                        break;

                    case ExportedJSONForeignKeyRefVO.REF_TYPE_UNIQUE_FIELD_TYPE_NUMBER:
                        // On a un champ d'unicité de type number, on select_vo par ce champ d'unicité, et on plug l'id du vo trouvé : si on trouve pas ou plusieurs : throw
                        if (exported_json_foreign_key_ref.unique_field_value_number) {
                            const translated_vo = await query(field.foreign_ref_vo_type)
                                .filter_by_num_eq(exported_json_foreign_key_ref.unique_field_name, exported_json_foreign_key_ref.unique_field_value_number)
                                .select_vo();
                            if (!translated_vo) {
                                throw new Error('translate_field_from_exported_json: REF_TYPE_UNIQUE_FIELD_TYPE_NUMBER but no translated_vo found');
                            }
                            return translated_vo.id;
                        } else {
                            throw new Error('translate_field_from_exported_json: REF_TYPE_UNIQUE_FIELD_TYPE_NUMBER but no unique_field_value_number');
                        }
                        break;

                    case ExportedJSONForeignKeyRefVO.REF_TYPE_EXPORTED_VO_REF:
                        // On a une ref simple vers un vo exporté, on doit reprendre le nouvel id dans la map de correspondance
                        if (exported_json_foreign_key_ref.source_vo_id && table_de_correspondance_des_ids[exported_json_foreign_key_ref.source_vo_id]) {
                            return table_de_correspondance_des_ids[exported_json_foreign_key_ref.source_vo_id];
                        } else {
                            throw new Error('translate_field_from_exported_json: REF_TYPE_EXPORTED_VO_REF but no source_vo_id or no table_de_correspondance_des_ids for source_vo_id: ' + exported_json_foreign_key_ref.source_vo_id);
                        }
                        break;

                    default:
                        throw new Error('translate_field_from_exported_json: Not implemented for ref_type: ' + ExportedJSONForeignKeyRefVO.REF_TYPE_LABELS[exported_json_foreign_key_ref.ref_type]);
                }

                break;


            case ModuleTableFieldVO.FIELD_TYPE_translatable_string:
                // Si on a exporté un translatable_string, on a une map de code_lang => traduction, et on doit générer un nouveau code pour le champs, et créer les trads pour ce code
                const translations: { [code_lang: string]: string } = e as { [code_lang: string]: string };
                const new_code: string = TranslatableFieldController.get_new_translatable_field_auto_gen_code_text(field);

                if (!translations) { // On peut ne pas avoir de trad, on renvoie quand même le code généré
                    return new_code;
                }

                // On génère les traductions pour le code généré
                const new_translatable_code: TranslatableTextVO = new TranslatableTextVO();
                new_translatable_code.code_text = new_code;
                await ModuleDAO.getInstance().insertOrUpdateVO(new_translatable_code);
                if (!new_translatable_code.id) {
                    throw new Error('translate_field_from_exported_json: Translatable string field has no id after insertOrUpdateVO');
                }

                for (const code_lang in translations) {
                    const translation: string = translations[code_lang];

                    if (translation == null) {
                        throw new Error('translate_field_from_exported_json: Translatable string field has a null translation for code_lang: ' + code_lang); // probablement pas normal ce cas, à la limite on a '' et ça c'est normal
                    }

                    const lang = await query(LangVO.API_TYPE_ID)
                        .filter_by_text_eq(field_names<LangVO>().code_lang, code_lang)
                        .select_vo();
                    if (lang == null) {
                        throw new Error('translate_field_from_exported_json: Translatable string field has no lang for code_lang: ' + code_lang);
                    }

                    const new_translation: TranslationVO = new TranslationVO();
                    new_translation.text_id = new_translatable_code.id;
                    new_translation.lang_id = lang.id;
                    new_translation.translated = translation;
                    await ModuleDAO.getInstance().insertOrUpdateVO(new_translation);

                    if (!new_translation.id) {
                        throw new Error('translate_field_from_exported_json: Translatable string field has no id after insertOrUpdateVO for translation: ' + translation);
                    }
                }

                return new_code;

            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                throw new Error('translate_field_from_exported_json: Not implemented field_type: ' + field.field_type);

            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                return RangeHandler.translate_from_api(NumRange.RANGE_TYPE, e as string);

            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                return RangeHandler.translate_from_api(TSRange.RANGE_TYPE, e as string);

            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                return RangeHandler.translate_from_api(HourRange.RANGE_TYPE, e as string);

            case ModuleTableFieldVO.FIELD_TYPE_numrange:
                return MatroidIndexHandler.from_normalized_range(e as string, NumRange.RANGE_TYPE);

            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
                return MatroidIndexHandler.from_normalized_range(e as string, HourRange.RANGE_TYPE);

            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                return MatroidIndexHandler.from_normalized_range(e as string, TSRange.RANGE_TYPE);

            case ModuleTableFieldVO.FIELD_TYPE_hour:
            case ModuleTableFieldVO.FIELD_TYPE_tstz:
                return ConversionHandler.forceNumber(e as string | number);

            case ModuleTableFieldVO.FIELD_TYPE_int_array:
            case ModuleTableFieldVO.FIELD_TYPE_float_array: {
                if (Array.isArray(e)) {
                    return e;
                }

                if (!e) {
                    return null;
                }

                if (e == '{}') {
                    return [];
                }

                const res: Array<number | string> = ((e as string).length > 2) ? (e as string).substring(1, (e as string).length - 1).split(',') : null;

                if (res && res.length) {
                    for (const i in res) {
                        res[i] = ConversionHandler.forceNumber(res[i]);
                    }
                    return res;
                }

                return e;
            }
            case ModuleTableFieldVO.FIELD_TYPE_string_array:
            case ModuleTableFieldVO.FIELD_TYPE_html_array:
                if (Array.isArray(e)) {
                    return e;
                }

                if (!e) {
                    return null;
                }

                if (e == '{}') {
                    return [];
                }

                return ((e as string).length > 2) ? (e as string).substring(1, (e as string).length - 1).split(',') : e;

            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj: {

                if (e == null) {
                    return null;
                }

                if (e == '{}') {
                    return {};
                }

                if (!ObjectHandler.try_is_json(e)) {
                    return e;
                }

                let trans_ = ObjectHandler.try_get_json(e);
                if (trans_) {

                    /**
                     * Prise en compte des tableaux. dans ce cas chaque élément du tableau est instancié
                     */
                    if (isArray(trans_)) {
                        const new_array = [];
                        for (const i in trans_) {
                            const transi = trans_[i];

                            if (!ObjectHandler.try_is_json(transi)) {
                                new_array.push(transi);
                            } else {
                                new_array.push(await ModuleTableController.translate_vos_from_exported_json(ObjectHandler.try_get_json(transi), table_de_correspondance_des_ids));
                            }
                        }
                        trans_ = new_array;
                    } else {

                        /**
                         * Si on est sur un object, pas tableau et pas typé, on boucle sur les champs pour les traduire aussi (puisque potentiellement des objects typés)
                         */
                        const elt_type = trans_ ? trans_._type : null;

                        const field_table = elt_type ? ModuleTableController.module_tables_by_vo_type[elt_type] : null;
                        if (!field_table) {
                            const new_obj = new Object();
                            for (const i in trans_) {
                                const transi = trans_[i];

                                if (!ObjectHandler.try_is_json(transi)) {
                                    new_obj[i] = transi;
                                } else {
                                    new_obj[i] = await ModuleTableController.translate_vos_from_exported_json(ObjectHandler.try_get_json(transi), table_de_correspondance_des_ids);
                                }
                            }
                            trans_ = new_obj;
                        } else {
                            const translated_vos_from_exported_json = await ModuleTableController.translate_vos_from_exported_json(trans_, table_de_correspondance_des_ids);

                            // Si on a déjà un vo typé, on le garde - cas des varsdatas où on doit surtout pas utiliser un Object.assign derrière
                            if (translated_vos_from_exported_json && translated_vos_from_exported_json._type) {
                                trans_ = translated_vos_from_exported_json;
                            } else {
                                trans_ = Object.assign(new ModuleTableController.vo_constructor_by_vo_type[elt_type](), translated_vos_from_exported_json);
                                // TEST AB FAIT PEU OU PAS D'INTERET trans_ = Object.create(ModuleTableController.vo_constructor_proto_by_vo_type[elt_type], Object.getOwnPropertyDescriptors(translated_vos_from_exported_json));
                            }
                        }
                    }
                }
                return trans_;
            }
            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:

                if (!e) {
                    return null;
                }

                if (e == '{}') {
                    return [];
                }

                return (e as string[]).map((ts: string) => ConversionHandler.forceNumber(ts));

            default:
                return e;
        }
    }

    public static async translate_field_to_exported_json(
        e: any,
        field: ModuleTableFieldVO,
        unique_fields_to_use: { [vo_type: string]: { [field_name: string]: ModuleTableFieldVO } },
        ref_fields_to_follow: { [vo_type: string]: { [field_name: string]: ModuleTableFieldVO } },
        exported_vos_ids_by_api_type_id: { [api_type_id: string]: { [id: number]: boolean } },
    ): Promise<any> {
        if ((!field) || (field.is_readonly)) {
            throw new Error('Should not ask for readonly fields');
        }

        /**
         * Si le champ est secure_boolean_switch_only_server_side, on bloque au niveau des APIs à false, et on log si ya une tentative d'envoi d'un true depuis le client
         */
        if (field.secure_boolean_switch_only_server_side) {
            if (e) {
                StatsController.register_stat_COMPTEUR(StatsController.GROUP_NAME_ERROR_ALERTS, "translate_field_to_exported_json.secure_boolean_switch_only_server_side", field.module_table_vo_type + '.' + field.field_name);
            }
            return false;
        }

        switch (field.field_type) {

            case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
            case ModuleTableFieldVO.FIELD_TYPE_file_ref:
            case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                // Suivant la conf, on crée la liaison qui va bien
                if (!e) {
                    return null;
                }

                // Si le vo fait partie de l'export, on fait juste une liaison avec cet id source et on recollera les morceaux plus tard
                if (exported_vos_ids_by_api_type_id[field.foreign_ref_vo_type] &&
                    exported_vos_ids_by_api_type_id[field.foreign_ref_vo_type][e]) {
                    const ref_field_to_json = new ExportedJSONForeignKeyRefVO();
                    ref_field_to_json.source_vo_id = e; // On garde l'id du vo source pour le suivi des références
                    ref_field_to_json.ref_type = ExportedJSONForeignKeyRefVO.REF_TYPE_EXPORTED_VO_REF; // On indique qu'on a un exported vo ref
                    return ref_field_to_json;
                }

                // On check déjà si on doit suivre le chemin et renvoyer tout le VO
                if ((!!ref_fields_to_follow) && (!!ref_fields_to_follow[field.module_table_vo_type]) && (!!ref_fields_to_follow[field.module_table_vo_type][field.field_name])) {

                    // On doit suivre le champ de référence, on va donc traduire le vo complet en exported_json
                    const vo = await query(field.foreign_ref_vo_type)
                        .filter_by_id(e)
                        .select_vo();

                    if (!vo) {
                        throw new Error('translate_field_to_exported_json: foreign_key field has no vo for id: ' + e);
                    }

                    const translated_vo = await ModuleTableController.translate_vos_to_exported_json(vo, unique_fields_to_use, ref_fields_to_follow, exported_vos_ids_by_api_type_id);
                    if (!translated_vo) {
                        throw new Error('translate_field_to_exported_json: foreign_key field has no translated_vo');
                    }

                    const ref_field_to_json = new ExportedJSONForeignKeyRefVO();
                    ref_field_to_json.ref_type = ExportedJSONForeignKeyRefVO.REF_TYPE_FULL_VO;
                    ref_field_to_json.source_vo_id = vo.id; // On garde l'id du vo source pour le suivi des références
                    ref_field_to_json.vo_exported_json = translated_vo;

                    return ref_field_to_json;
                }

                // Sinon, on checke si on doit renvoyer un champs unique du vo à a la place de l'id
                if ((!!unique_fields_to_use) && (!!unique_fields_to_use[field.module_table_vo_type]) && (!!unique_fields_to_use[field.module_table_vo_type][field.field_name])) {

                    // Auquel cas on charge aussi le vo
                    const vo = await query(field.foreign_ref_vo_type)
                        .filter_by_id(e)
                        .select_vo();

                    if (!vo) {
                        throw new Error('translate_field_to_exported_json: foreign_key field has no vo for id: ' + e);
                    }

                    if (!vo[field.field_name]) {
                        throw new Error('translate_field_to_exported_json: foreign_key field has no translated_vo');
                    }

                    const ref_field_to_json = new ExportedJSONForeignKeyRefVO();
                    ref_field_to_json.source_vo_id = vo.id; // On garde l'id du vo source pour le suivi des références

                    switch (field.field_type) {
                        case ModuleTableFieldVO.FIELD_TYPE_string:
                            ref_field_to_json.ref_type = ExportedJSONForeignKeyRefVO.REF_TYPE_UNIQUE_FIELD_TYPE_STRING;
                            ref_field_to_json.unique_field_value_string = vo[field.field_name];
                            break;
                        case ModuleTableFieldVO.FIELD_TYPE_int:
                            ref_field_to_json.ref_type = ExportedJSONForeignKeyRefVO.REF_TYPE_UNIQUE_FIELD_TYPE_NUMBER;
                            ref_field_to_json.unique_field_value_number = vo[field.field_name];
                            break;
                        default:
                            throw new Error('translate_field_to_exported_json: Not implemented field_type for unique field: ' + field.field_type);
                    }

                    return ref_field_to_json;
                }

                // Sinon, on doit juste renvoyer l'id du vo
                const ref_field_to_json = new ExportedJSONForeignKeyRefVO();
                ref_field_to_json.source_vo_id = e; // On garde l'id du vo source pour le suivi des références
                ref_field_to_json.ref_type = ExportedJSONForeignKeyRefVO.REF_TYPE_ID;
                ref_field_to_json.vo_id = e; // On renvoie l'id du vo directement
                return ref_field_to_json;

            case ModuleTableFieldVO.FIELD_TYPE_translatable_string:
                // On va chercher les trads correspondantes au code qui est dans le champs
                //  et on les intègre dans le champs directement sous forme de map code_lang: translation
                if (!e) {
                    throw new Error('translate_field_to_exported_json: Translatable string field has no value');
                }

                const translations: TranslationVO[] = await query(TranslationVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, e)
                    .select_vos<TranslationVO>();

                if (!translations || translations.length == 0) {
                    // Pas un souci
                    return null;
                }

                const langs: LangVO[] = await query(LangVO.API_TYPE_ID)
                    .set_max_age_ms(60 * 1000)
                    .select_vos<LangVO>();
                const langs_by_id: { [lang_id: string]: LangVO } = VOsTypesManager.vosArray_to_vosByIds(langs);
                const res: { [code_lang: string]: string } = {};

                for (const i in translations) {
                    const translation = translations[i];

                    if (!translation.lang_id) {
                        throw new Error('translate_field_to_exported_json: Translatable string field has no lang_id for translation: ' + translation.translated);
                    }

                    const code_lang = langs_by_id[translation.lang_id]?.code_lang;

                    if (!code_lang) {
                        throw new Error('translate_field_to_exported_json: Translatable string field has no code_lang for lang_id: ' + translation.lang_id);
                    }

                    res[code_lang] = translation.translated;
                }

                return res;


            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                throw new Error('translate_field_to_exported_json: Not implemented field_type: ' + field.field_type);


            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                return RangeHandler.translate_to_api(e);

            case ModuleTableFieldVO.FIELD_TYPE_numrange:
            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
                return RangeHandler.translate_range_to_api(e);

            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:

                if (e && e._type) {

                    const trans_plain_vo_obj = e ? await ModuleTableController.translate_vos_to_exported_json(e, unique_fields_to_use, ref_fields_to_follow, exported_vos_ids_by_api_type_id) : null;
                    return trans_plain_vo_obj ? JSON.stringify(trans_plain_vo_obj) : null;

                } else if ((!!e) && isArray(e)) {

                    /**
                     * Gestion des tableaux de plain_vo_obj
                     */
                    const trans_array = [];
                    for (const i in e) {
                        const e_ = e[i];

                        if ((typeof e_ === 'string') && ((!e_) || (e_.indexOf('{') < 0))) {
                            trans_array.push(e_);
                        } else {
                            trans_array.push(await ModuleTableFieldController.translate_field_to_exported_json(e_, field, unique_fields_to_use, ref_fields_to_follow, exported_vos_ids_by_api_type_id));
                        }
                    }
                    return JSON.stringify(trans_array);

                } else if (e) {
                    return (typeof e == 'object') ? JSON.stringify(e) : e;
                } else {
                    return null;
                }

            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
            case ModuleTableFieldVO.FIELD_TYPE_tstz:
            default:
                return e;
        }
    }
    //#endregion

    private static passwordIsValidProposition(pwd_proposition: string): string {
        if (!pwd_proposition) {
            return ModuleTableFieldVO.VALIDATION_CODE_TEXT_required;
        }

        if (pwd_proposition.length < 8) {
            return ModuleTableFieldVO.VALIDATION_CODE_TEXT_length_min_8;
        }

        // Doit contenir un chiffre
        if (!/[0-9]/.test(pwd_proposition)) {
            return ModuleTableFieldVO.VALIDATION_CODE_TEXT_need_number;
        }

        // Doit contenir une minuscule
        if (!/[a-z]/.test(pwd_proposition)) {
            return ModuleTableFieldVO.VALIDATION_CODE_TEXT_need_lowercase;
        }

        // Doit contenir une majuscule
        if (!/[A-Z]/.test(pwd_proposition)) {
            return ModuleTableFieldVO.VALIDATION_CODE_TEXT_need_uppercase;
        }

        return null;
    }
}