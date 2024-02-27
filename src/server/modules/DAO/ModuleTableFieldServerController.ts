import { isArray } from "lodash";
import moment from "moment";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleTableController from "../../../shared/modules/DAO/ModuleTableController";
import ModuleTableFieldVO from "../../../shared/modules/DAO/vos/ModuleTableFieldVO";
import ModuleTableVO from "../../../shared/modules/DAO/vos/ModuleTableVO";
import HourRange from "../../../shared/modules/DataRender/vos/HourRange";
import HourSegment from "../../../shared/modules/DataRender/vos/HourSegment";
import NumRange from "../../../shared/modules/DataRender/vos/NumRange";
import NumSegment from "../../../shared/modules/DataRender/vos/NumSegment";
import TSRange from "../../../shared/modules/DataRender/vos/TSRange";
import TimeSegment from "../../../shared/modules/DataRender/vos/TimeSegment";
import GeoPointVO from "../../../shared/modules/GeoPoint/vos/GeoPointVO";
import VOsTypesManager from "../../../shared/modules/VO/manager/VOsTypesManager";
import ConversionHandler from "../../../shared/tools/ConversionHandler";
import DateHandler from "../../../shared/tools/DateHandler";
import MatroidIndexHandler from "../../../shared/tools/MatroidIndexHandler";
import ObjectHandler, { field_names } from "../../../shared/tools/ObjectHandler";
import PromisePipeline from "../../../shared/tools/PromisePipeline/PromisePipeline";
import RangeHandler from "../../../shared/tools/RangeHandler";
import ConfigurationService from "../../env/ConfigurationService";
import IDistantVOBase from "../IDistantVOBase";
import ModuleDAOServer from "./ModuleDAOServer";

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

        let field_id = field_alias ? field_alias : field.field_id;
        let field_value = src_vo[field_id.toLowerCase()] ? src_vo[field_id.toLowerCase()] : src_vo[field_id];

        if ((typeof field_value == 'undefined') || (field_value === null)) {
            return;
        }

        switch (field.field_type) {

            case ModuleTableFieldVO.FIELD_TYPE_string_array:
            case ModuleTableFieldVO.FIELD_TYPE_html_array:
                if (Array.isArray(field_value)) {
                    dest_vo[field_id] = field_value;
                } else {
                    dest_vo[field_id] = (field_value.length > 2) ? field_value.substr(1, field_value.length - 2).split(',') : field_value;
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
                dest_vo[field_id] = ConversionHandler.forceNumber(field_value);
                break;

            case ModuleTableFieldVO.FIELD_TYPE_float_array:
                dest_vo[field_id] = field_value.map(Number);
                break;

            case ModuleTableFieldVO.FIELD_TYPE_int_array:
                dest_vo[field_id] = field_value.map(Number);
                break;

            case ModuleTableFieldVO.FIELD_TYPE_numrange:
                let field_index_n = src_vo[field_id.toLowerCase() + '_ndx'] ? src_vo[field_id.toLowerCase() + '_ndx'] : src_vo[field_id + '_ndx'];
                // TODO FIXME DELETE RETROCOMPATIBILITE TEMPORAIRE
                // KEEP dest_vo[field_id] = MatroidIndexHandler.from_normalized_range(field_index_n, NumRange.RANGE_TYPE);
                if (field_index_n != null) {
                    dest_vo[field_id] = MatroidIndexHandler.from_normalized_range(field_index_n, NumRange.RANGE_TYPE);
                } else {
                    dest_vo[field_id] = RangeHandler.parseRangeBDD(NumRange.RANGE_TYPE, field_value, NumSegment.TYPE_INT);
                }
                break;
            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                let field_index_t = src_vo[field_id.toLowerCase() + '_ndx'] ? src_vo[field_id.toLowerCase() + '_ndx'] : src_vo[field_id + '_ndx'];
                // TODO FIXME DELETE RETROCOMPATIBILITE TEMPORAIRE
                // KEEP dest_vo[field_id] = MatroidIndexHandler.from_normalized_range(field_index_t, TSRange.RANGE_TYPE);
                if (field_index_t != null) {
                    dest_vo[field_id] = MatroidIndexHandler.from_normalized_range(field_index_t, TSRange.RANGE_TYPE);
                } else {
                    dest_vo[field_id] = RangeHandler.parseRangeBDD(TSRange.RANGE_TYPE, field_value, (field.segmentation_type ? field.segmentation_type : TimeSegment.TYPE_SECOND));
                }
                break;
            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
                let field_index_h = src_vo[field_id.toLowerCase() + '_ndx'] ? src_vo[field_id.toLowerCase() + '_ndx'] : src_vo[field_id + '_ndx'];
                // TODO FIXME DELETE RETROCOMPATIBILITE TEMPORAIRE
                // KEEP dest_vo[field_id] = MatroidIndexHandler.from_normalized_range(field_index_h, HourRange.RANGE_TYPE);
                if (field_index_h != null) {
                    dest_vo[field_id] = MatroidIndexHandler.from_normalized_range(field_index_h, HourRange.RANGE_TYPE);
                } else {
                    dest_vo[field_id] = RangeHandler.parseRangeBDD(HourRange.RANGE_TYPE, field_value, HourSegment.TYPE_SECOND);
                }
                break;


            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                let field_index_ns = src_vo[field_id.toLowerCase() + '_ndx'] ? src_vo[field_id.toLowerCase() + '_ndx'] : src_vo[field_id + '_ndx'];
                // TODO FIXME DELETE RETROCOMPATIBILITE TEMPORAIRE
                // KEEP dest_vo[field_id] = MatroidIndexHandler.from_normalized_range(field_index_h, HourRange.RANGE_TYPE);
                if (field_index_ns != null) {
                    dest_vo[field_id] = MatroidIndexHandler.from_normalized_ranges(field_index_ns, NumRange.RANGE_TYPE);
                } else {
                    dest_vo[field_id] = RangeHandler.translate_from_bdd(NumRange.RANGE_TYPE, field_value, NumSegment.TYPE_INT);
                }
                break;
            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                let field_index_ts = src_vo[field_id.toLowerCase() + '_ndx'] ? src_vo[field_id.toLowerCase() + '_ndx'] : src_vo[field_id + '_ndx'];
                // TODO FIXME DELETE RETROCOMPATIBILITE TEMPORAIRE
                // KEEP dest_vo[field_id] = MatroidIndexHandler.from_normalized_range(field_index_h, HourRange.RANGE_TYPE);
                if (field_index_ts != null) {
                    dest_vo[field_id] = MatroidIndexHandler.from_normalized_ranges(field_index_ts, TSRange.RANGE_TYPE);
                } else {
                    dest_vo[field_id] = RangeHandler.translate_from_bdd(TSRange.RANGE_TYPE, field_value, field.segmentation_type);
                }
                break;
            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                let field_index_hs = src_vo[field_id.toLowerCase() + '_ndx'] ? src_vo[field_id.toLowerCase() + '_ndx'] : src_vo[field_id + '_ndx'];
                // TODO FIXME DELETE RETROCOMPATIBILITE TEMPORAIRE
                // KEEP dest_vo[field_id] = MatroidIndexHandler.from_normalized_range(field_index_h, HourRange.RANGE_TYPE);
                if (field_index_hs != null) {
                    dest_vo[field_id] = MatroidIndexHandler.from_normalized_ranges(field_index_hs, HourRange.RANGE_TYPE);
                } else {
                    dest_vo[field_id] = RangeHandler.translate_from_bdd(HourRange.RANGE_TYPE, field_value, field.segmentation_type);
                }
                break;

            case ModuleTableFieldVO.FIELD_TYPE_day:
            case ModuleTableFieldVO.FIELD_TYPE_date:
            case ModuleTableFieldVO.FIELD_TYPE_month:
                dest_vo[field_id] = DateHandler.getInstance().formatDayForIndex(moment(field_value).utc(true).unix());
                break;

            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                if (!((field_value === null) || (typeof field_value === 'undefined'))) {
                    dest_vo[field_id] = field_value.map((ts: string) => ConversionHandler.forceNumber(ts));
                }
                break;

            case ModuleTableFieldVO.FIELD_TYPE_geopoint:
                if (field_value) {
                    dest_vo[field_id] = GeoPointVO.clone(field_value);
                }
                break;

            case ModuleTableFieldVO.FIELD_TYPE_email:
                if (field_value && field_value.trim) {
                    dest_vo[field_id] = field_value.trim();
                }
                break;

            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
                let trans_ = ObjectHandler.try_get_json(field_value);

                if (!!trans_) {

                    /**
                     * Prise en compte des tableaux. dans ce cas chaque élément du tableau est instancié
                     */
                    if (isArray(trans_)) {
                        trans_ = ModuleTableVO.defaultforceNumerics(trans_);
                    } else {

                        /**
                         * Si on est sur un object, pas tableau et pas typé, on boucle sur les champs pour les traduire aussi (puisque potentiellement des objects typés)
                         */
                        let elt_type = trans_ ? trans_._type : null;

                        let field_table = elt_type ? VOsTypesManager.moduleTables_by_voType[elt_type] : null;
                        if (!field_table) {
                            let new_obj = new Object();
                            for (let i in trans_) {
                                let transi_ = trans_[i];
                                new_obj[i] = ModuleTableVO.defaultforceNumeric(ObjectHandler.try_get_json(transi_));
                            }
                            trans_ = new_obj;
                        } else {
                            trans_ = Object.assign(field_table.voConstructor(), ModuleTableVO.defaultforceNumeric(trans_));
                        }
                    }
                }
                dest_vo[field_id] = trans_;
                break;

            default:
                dest_vo[field_id] = field_value;
                break;
        }
    }

    /**
     * Sur le générateur :
     *      - On tente de récupérer la version en base, on la met à jour et sinon on la crée.
     *      puis on met à jour dans le cache de l'application
     *      - On supprime aussi les tables qui sont pas dans la def actuelle
     * Dans cette fonction on ne pense qu'à mettre à jour la base pour le ModuleTableVO, pas la table du vo_type en elle-même
     */
    public static async push_ModuleTableVO_conf_to_db() {
        let promise_pipeline = new PromisePipeline(ConfigurationService.node_configuration.MAX_POOL / 2, 'ModuleTableController.push_ModuleTableVOs_to_db');

        for (let vo_type in VOsTypesManager.moduleTables_by_voType) {
            let table = VOsTypesManager.moduleTables_by_voType[vo_type];
            if (!table) {
                throw new Error('ModuleTableController.push_ModuleTableVOs_to_db: no table for vo_type ' + vo_type);
            }

            await promise_pipeline.push(async () => {
                let db_table = await query(ModuleTableVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<ModuleTableVO>().vo_type, vo_type)
                    .select_vo<ModuleTableVO>();

                if (!db_table) {
                    db_table = table;
                }

                db_table = Object.assign(db_table, table);

                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(db_table);
            });
        }

        await promise_pipeline.push(async () => {
            let db_tables = await query(ModuleTableVO.API_TYPE_ID).filter_by_text_has_none(field_names<ModuleTableVO>().vo_type, Object.keys(VOsTypesManager.moduleTables_by_voType)).select_vos<ModuleTableVO>();
            await ModuleDAOServer.getInstance().deleteVOs_as_server(db_tables);
        });

        await promise_pipeline.end();
    }
}