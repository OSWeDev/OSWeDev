import { isArray } from "lodash";
import ConsoleHandler from "../../tools/ConsoleHandler";
import ConversionHandler from "../../tools/ConversionHandler";
import MatroidIndexHandler from "../../tools/MatroidIndexHandler";
import ObjectHandler, { reflect } from "../../tools/ObjectHandler";
import RangeHandler from "../../tools/RangeHandler";
import HourRange from "../DataRender/vos/HourRange";
import NumRange from "../DataRender/vos/NumRange";
import TSRange from "../DataRender/vos/TSRange";
import IIsServerField from "../IIsServerField";
import StatsController from "../Stats/StatsController";
import TableFieldTypesManager from "../TableFieldTypes/TableFieldTypesManager";
import DefaultTranslationVO from "../Translation/vos/DefaultTranslationVO";
import ModuleTableController from "./ModuleTableController";
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
            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
            case ModuleTableFieldVO.FIELD_TYPE_textarea:
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

    public static translate_field_from_api(e: unknown, field: ModuleTableFieldVO): unknown {
        if ((!field) || field.is_readonly) {
            throw new Error('Should no ask for readonly fields');
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

                if (!e || (e == '{}')) {
                    return null;
                }

                const res: Array<number | string> = ((e as string).length > 2) ? (e as string).substring(1, (e as string).length - 2).split(',') : null;

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

                if (!e || (e == '{}')) {
                    return null;
                }

                return ((e as string).length > 2) ? (e as string).substring(1, (e as string).length - 2).split(',') : e;

            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj: {

                if ((e == null) || (e == '{}')) {
                    return null;
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
                            new_array.push(ModuleTableController.translate_vos_from_api(ObjectHandler.try_get_json(transi)));
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
                                new_obj[i] = ModuleTableController.translate_vos_from_api(ObjectHandler.try_get_json(transi));
                            }
                            trans_ = new_obj;
                        } else {
                            const translated_vos_from_api = ModuleTableController.translate_vos_from_api(trans_);

                            // Si on a déjà un vo typé, on le garde - cas des varsdatas où on doit surtout pas utiliser un Object.assign derrière
                            if (translated_vos_from_api && translated_vos_from_api._type) {
                                trans_ = translated_vos_from_api;
                            } else {
                                trans_ = Object.assign(new ModuleTableController.vo_constructor_by_vo_type[elt_type](), translated_vos_from_api);
                            }
                        }
                    }
                }
                return trans_;
            }
            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:

                if (!e || (e == '{}')) {
                    return null;
                }

                if ((e === null) || (typeof e === 'undefined')) {
                    return e;
                } else {
                    return (e as string[]).map((ts: string) => ConversionHandler.forceNumber(ts));
                }

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
                    return JSON.stringify(e);
                } else {
                    return null;
                }

            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
            case ModuleTableFieldVO.FIELD_TYPE_tstz:
            default:
                return e;
        }
    }

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