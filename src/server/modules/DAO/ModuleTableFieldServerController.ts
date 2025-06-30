import { isArray } from "lodash";
import moment from "moment";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleTableController from "../../../shared/modules/DAO/ModuleTableController";
import ModuleTableFieldController from "../../../shared/modules/DAO/ModuleTableFieldController";
import ModuleTableFieldVO from "../../../shared/modules/DAO/vos/ModuleTableFieldVO";
import ModuleTableVO from "../../../shared/modules/DAO/vos/ModuleTableVO";
import HourRange from "../../../shared/modules/DataRender/vos/HourRange";
import HourSegment from "../../../shared/modules/DataRender/vos/HourSegment";
import NumRange from "../../../shared/modules/DataRender/vos/NumRange";
import NumSegment from "../../../shared/modules/DataRender/vos/NumSegment";
import TSRange from "../../../shared/modules/DataRender/vos/TSRange";
import TimeSegment from "../../../shared/modules/DataRender/vos/TimeSegment";
import GeoPointVO from "../../../shared/modules/GeoPoint/vos/GeoPointVO";
import IDistantVOBase from "../../../shared/modules/IDistantVOBase";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import ConversionHandler from "../../../shared/tools/ConversionHandler";
import DateHandler from "../../../shared/tools/DateHandler";
import MatroidIndexHandler from "../../../shared/tools/MatroidIndexHandler";
import ObjectHandler, { field_names } from "../../../shared/tools/ObjectHandler";
import PromisePipeline from "../../../shared/tools/PromisePipeline/PromisePipeline";
import RangeHandler from "../../../shared/tools/RangeHandler";
import ConfigurationService from "../../env/ConfigurationService";
import ModuleDAOServer from "./ModuleDAOServer";
import ModuleTableServerController from "./ModuleTableServerController";

export default class ModuleTableFieldServerController {

    /**
     * Traduire le champs field.field_id de src_vo dans dest_vo. Possibilité de fournir un alias qui sera utilisé pour retrouver le champs dans la source et la destination
     * @param field le descriptif du champs à traduire
     * @param src_vo le vo source
     * @param dest_vo le vo de destination de la traduction (potentiellement le même que src_vo)
     * @param field_alias optionnel. Permet de définir un nom de champs différent du field_id utilisé dans le src_vo et le dest_vo typiquement en résultat d'un contextquery
     */
    public static translate_field_from_db(field: ModuleTableFieldVO, src_vo: any, dest_vo: any, field_alias: string = null) {

        if (field.is_readonly) {
            return;
        }

        const field_name = field_alias ? field_alias : field.field_name;
        const field_value = src_vo[field_name.toLowerCase()] ? src_vo[field_name.toLowerCase()] : src_vo[field_name];

        if ((typeof field_value == 'undefined') || (field_value === null)) {
            return;
        }

        switch (field.field_type) {

            case ModuleTableFieldVO.FIELD_TYPE_string_array:
            case ModuleTableFieldVO.FIELD_TYPE_html_array:
                if (Array.isArray(field_value)) {
                    dest_vo[field_name] = field_value;
                } else {
                    dest_vo[field_name] = (field_value.length > 2) ? field_value.substr(1, field_value.length - 2).split(',') : field_value;
                }
                break;

            case ModuleTableFieldVO.FIELD_TYPE_float:
            case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
            case ModuleTableFieldVO.FIELD_TYPE_amount:
            case ModuleTableFieldVO.FIELD_TYPE_file_ref:
            case ModuleTableFieldVO.FIELD_TYPE_image_ref:
            case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableFieldVO.FIELD_TYPE_int:
            case ModuleTableFieldVO.FIELD_TYPE_enum:
            case ModuleTableFieldVO.FIELD_TYPE_prct:

            case ModuleTableFieldVO.FIELD_TYPE_hour:
            case ModuleTableFieldVO.FIELD_TYPE_tstz:
                dest_vo[field_name] = ConversionHandler.forceNumber(field_value);
                break;

            case ModuleTableFieldVO.FIELD_TYPE_float_array:
                dest_vo[field_name] = field_value.map(Number);
                break;

            case ModuleTableFieldVO.FIELD_TYPE_int_array:
                dest_vo[field_name] = field_value.map(Number);
                break;

            case ModuleTableFieldVO.FIELD_TYPE_numrange:
                const field_index_n = src_vo[field_name.toLowerCase() + '_ndx'] ? src_vo[field_name.toLowerCase() + '_ndx'] : src_vo[field_name + '_ndx'];
                // TODO FIXME DELETE RETROCOMPATIBILITE TEMPORAIRE
                // KEEP dest_vo[field_id] = MatroidIndexHandler.from_normalized_range(field_index_n, NumRange.RANGE_TYPE);
                if (field_index_n != null) {
                    dest_vo[field_name] = MatroidIndexHandler.from_normalized_range(field_index_n, NumRange.RANGE_TYPE);
                } else {
                    dest_vo[field_name] = RangeHandler.parseRangeBDD(NumRange.RANGE_TYPE, field_value, NumSegment.TYPE_INT);
                }
                break;
            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                const field_index_t = src_vo[field_name.toLowerCase() + '_ndx'] ? src_vo[field_name.toLowerCase() + '_ndx'] : src_vo[field_name + '_ndx'];
                // TODO FIXME DELETE RETROCOMPATIBILITE TEMPORAIRE
                // KEEP dest_vo[field_id] = MatroidIndexHandler.from_normalized_range(field_index_t, TSRange.RANGE_TYPE);
                if (field_index_t != null) {
                    dest_vo[field_name] = MatroidIndexHandler.from_normalized_range(field_index_t, TSRange.RANGE_TYPE);
                } else {
                    dest_vo[field_name] = RangeHandler.parseRangeBDD(TSRange.RANGE_TYPE, field_value, (field.segmentation_type ? field.segmentation_type : TimeSegment.TYPE_SECOND));
                }
                break;
            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
                const field_index_h = src_vo[field_name.toLowerCase() + '_ndx'] ? src_vo[field_name.toLowerCase() + '_ndx'] : src_vo[field_name + '_ndx'];
                // TODO FIXME DELETE RETROCOMPATIBILITE TEMPORAIRE
                // KEEP dest_vo[field_id] = MatroidIndexHandler.from_normalized_range(field_index_h, HourRange.RANGE_TYPE);
                if (field_index_h != null) {
                    dest_vo[field_name] = MatroidIndexHandler.from_normalized_range(field_index_h, HourRange.RANGE_TYPE);
                } else {
                    dest_vo[field_name] = RangeHandler.parseRangeBDD(HourRange.RANGE_TYPE, field_value, HourSegment.TYPE_SECOND);
                }
                break;


            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                const field_index_ns = src_vo[field_name.toLowerCase() + '_ndx'] ? src_vo[field_name.toLowerCase() + '_ndx'] : src_vo[field_name + '_ndx'];
                // TODO FIXME DELETE RETROCOMPATIBILITE TEMPORAIRE
                // KEEP dest_vo[field_id] = MatroidIndexHandler.from_normalized_range(field_index_h, HourRange.RANGE_TYPE);
                if (field_index_ns != null) {
                    dest_vo[field_name] = MatroidIndexHandler.from_normalized_ranges(field_index_ns, NumRange.RANGE_TYPE);
                } else {
                    dest_vo[field_name] = RangeHandler.translate_from_bdd(NumRange.RANGE_TYPE, field_value, NumSegment.TYPE_INT);
                }
                break;
            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                const field_index_ts = src_vo[field_name.toLowerCase() + '_ndx'] ? src_vo[field_name.toLowerCase() + '_ndx'] : src_vo[field_name + '_ndx'];
                // TODO FIXME DELETE RETROCOMPATIBILITE TEMPORAIRE
                // KEEP dest_vo[field_id] = MatroidIndexHandler.from_normalized_range(field_index_h, HourRange.RANGE_TYPE);
                if (field_index_ts != null) {
                    dest_vo[field_name] = MatroidIndexHandler.from_normalized_ranges(field_index_ts, TSRange.RANGE_TYPE);
                } else {
                    dest_vo[field_name] = RangeHandler.translate_from_bdd(TSRange.RANGE_TYPE, field_value, field.segmentation_type);
                }
                break;
            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                const field_index_hs = src_vo[field_name.toLowerCase() + '_ndx'] ? src_vo[field_name.toLowerCase() + '_ndx'] : src_vo[field_name + '_ndx'];
                // TODO FIXME DELETE RETROCOMPATIBILITE TEMPORAIRE
                // KEEP dest_vo[field_id] = MatroidIndexHandler.from_normalized_range(field_index_h, HourRange.RANGE_TYPE);
                if (field_index_hs != null) {
                    dest_vo[field_name] = MatroidIndexHandler.from_normalized_ranges(field_index_hs, HourRange.RANGE_TYPE);
                } else {
                    dest_vo[field_name] = RangeHandler.translate_from_bdd(HourRange.RANGE_TYPE, field_value, field.segmentation_type);
                }
                break;

            case ModuleTableFieldVO.FIELD_TYPE_day:
            case ModuleTableFieldVO.FIELD_TYPE_date:
            case ModuleTableFieldVO.FIELD_TYPE_month:
                dest_vo[field_name] = DateHandler.getInstance().formatDayForIndex(moment(field_value).utc(true).unix());
                break;

            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                if (!((field_value === null) || (typeof field_value === 'undefined'))) {
                    dest_vo[field_name] = field_value.map((ts: string) => ConversionHandler.forceNumber(ts));
                }
                break;

            case ModuleTableFieldVO.FIELD_TYPE_geopoint:
                if (field_value) {
                    dest_vo[field_name] = GeoPointVO.clone(field_value);
                }
                break;

            case ModuleTableFieldVO.FIELD_TYPE_email:
                if (field_value && field_value.trim) {
                    dest_vo[field_name] = field_value.trim();
                }
                break;

            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:

                let trans_ = ObjectHandler.try_get_json(field_value);

                if (!trans_) {

                    // Si on est déjà sur un objet, normal que le try_get_json ne fonctionne pas, on utilise l'objet directement
                    if (typeof field_value == 'object') {
                        trans_ = field_value;
                    } else {
                        return field_value;
                    }
                }

                if (trans_) {

                    /**
                     * Prise en compte des tableaux. dans ce cas chaque élément du tableau est instancié
                     */
                    if (isArray(trans_)) {
                        trans_ = ModuleTableServerController.translate_vos_from_db(trans_ as IDistantVOBase[]);
                    } else {

                        /**
                         * Si on est sur un object, pas tableau et pas typé, on boucle sur les champs pour les traduire aussi (puisque potentiellement des objects typés)
                         */
                        const elt_type = trans_ ? trans_._type : null;

                        const field_table = elt_type ? ModuleTableController.module_tables_by_vo_type[elt_type] : null;
                        if (!field_table) {
                            const new_obj = new Object();
                            for (const i in trans_) {
                                const transi_ = trans_[i];

                                if (!ObjectHandler.try_is_json(transi_)) {
                                    new_obj[i] = transi_;
                                } else {
                                    new_obj[i] = ModuleTableServerController.translate_vos_from_db(ObjectHandler.try_get_json(transi_));
                                }
                            }
                            trans_ = new_obj;
                        } else {
                            trans_ = Object.assign(new ModuleTableController.vo_constructor_by_vo_type[elt_type](), ModuleTableServerController.translate_vos_from_db(trans_));
                            // TEST AB FAIT PEU OU PAS D'INTERET trans_ = Object.create(ModuleTableController.vo_constructor_proto_by_vo_type[elt_type], Object.getOwnPropertyDescriptors(ModuleTableServerController.translate_vos_from_db(trans_)));
                        }
                    }
                }
                dest_vo[field_name] = trans_;
                break;

            default:
                dest_vo[field_name] = field_value;
                break;
        }
    }

    /**
     * Sur le générateur :
     *      - On tente de récupérer la version en base, on la met à jour et sinon on la crée.
     *      puis on met à jour dans le cache de l'application
     *      - On supprime aussi les champs qui sont pas dans la def actuelle et qui sont en CODE FIRST
     * Dans cette fonction on ne pense qu'à mettre à jour la base pour le ModuleTableVO, pas la table du vo_type en elle-même
     */
    public static async push_ModuleTableFieldVO_conf_to_db() {
        const promise_pipeline = new PromisePipeline(ConfigurationService.node_configuration.max_pool / 2, 'ModuleTableController.push_ModuleTableFieldVO_conf_to_db');

        for (const vo_type in ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name) {
            const fields_by_name = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo_type];
            if (!fields_by_name) {
                throw new Error('ModuleTableFieldController.push_ModuleTableFieldVO_conf_to_db: no fields for vo_type ' + vo_type);
            }

            const db_table = ModuleTableController.module_tables_by_vo_type[vo_type];
            if ((!db_table) || (!db_table.id)) {
                throw new Error('ModuleTableFieldController.push_ModuleTableFieldVO_conf_to_db: no table found for vo_type ' + vo_type + ' or table has no id');
            }


            for (const field_name in fields_by_name) {
                const field = fields_by_name[field_name];

                await promise_pipeline.push(async () => {
                    let db_field = await query(ModuleTableFieldVO.API_TYPE_ID)
                        .filter_by_text_eq(field_names<ModuleTableVO>().vo_type, vo_type, ModuleTableVO.API_TYPE_ID)
                        .filter_by_text_eq(field_names<ModuleTableFieldVO>().field_name, field_name)
                        .exec_as_server()
                        .select_vo<ModuleTableFieldVO>();

                    let merged_db_field = field;
                    let insert_or_update = false;
                    if (!db_field) {
                        db_field = field;
                        db_field.module_table_id = db_table.id;
                        insert_or_update = true;
                    } else {
                        merged_db_field = Object.assign(db_field, field);
                        merged_db_field.id = db_field.id;
                        insert_or_update = JSON.stringify(merged_db_field) !== JSON.stringify(db_field);
                    }

                    // On check qu'on a des mises à jour à faire sinon on ne fait rien
                    if (insert_or_update) {
                        ConsoleHandler.log('ModuleTableFieldController.push_ModuleTableFieldVO_conf_to_db: updating field ' + field_name + ' for vo_type ' + vo_type);
                        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(merged_db_field);
                    }

                    // On met à jour le cache de l'application
                    ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo_type][field_name] = merged_db_field;

                    if (!ModuleTableFieldController.module_table_fields_by_vo_id_and_field_id[db_table.id]) {
                        ModuleTableFieldController.module_table_fields_by_vo_id_and_field_id[db_table.id] = {};
                    }

                    ModuleTableFieldController.module_table_fields_by_vo_id_and_field_id[db_table.id][merged_db_field.id] = merged_db_field;
                    ModuleTableFieldController.module_table_fields_by_field_id[merged_db_field.id] = merged_db_field;
                });
            }
        }

        // On doit supprimer d'une part les champs qui sont dans des vos CODE FIRST pas référencés => mais ça le VO du moduletable lié a été supprimé et le champs est cascade donc osef
        // On doit supprimer les champs qui sont dans des vos CODE FIRST référencés mais le champs lui ne l'est pas
        // On touche pas aux NOCODE

        for (const vo_type in ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name) {
            const field_ids = Object.keys(ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo_type]);

            await promise_pipeline.push(async () => {
                await query(ModuleTableFieldVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<ModuleTableVO>().vo_type, vo_type, ModuleTableVO.API_TYPE_ID)
                    .filter_by_num_eq(field_names<ModuleTableVO>().definition_type, ModuleTableVO.DEFINITION_TYPE_CODE, ModuleTableVO.API_TYPE_ID)
                    .filter_by_text_has_none(field_names<ModuleTableFieldVO>().field_name, field_ids)
                    .exec_as_server()
                    .delete_vos();
            });
        }

        await promise_pipeline.end();
    }
}