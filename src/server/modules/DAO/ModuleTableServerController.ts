import { cloneDeep, isArray } from "lodash";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleTableController from "../../../shared/modules/DAO/ModuleTableController";
import ModuleTableFieldController from "../../../shared/modules/DAO/ModuleTableFieldController";
import ModuleTableFieldVO from "../../../shared/modules/DAO/vos/ModuleTableFieldVO";
import ModuleTableVO from "../../../shared/modules/DAO/vos/ModuleTableVO";
import IRange from "../../../shared/modules/DataRender/interfaces/IRange";
import IDistantVOBase from "../../../shared/modules/IDistantVOBase";
import ConversionHandler from "../../../shared/tools/ConversionHandler";
import GeoPointHandler from "../../../shared/tools/GeoPointHandler";
import MatroidIndexHandler from "../../../shared/tools/MatroidIndexHandler";
import { field_names } from "../../../shared/tools/ObjectHandler";
import PromisePipeline from "../../../shared/tools/PromisePipeline/PromisePipeline";
import RangeHandler from "../../../shared/tools/RangeHandler";
import ConfigurationService from "../../env/ConfigurationService";
import ModuleDAOServer from "./ModuleDAOServer";
import ModuleTableFieldServerController from "./ModuleTableFieldServerController";

export default class ModuleTableServerController {

    public static translate_vos_from_db<T extends IDistantVOBase, U extends T | T[]>(e: U): U {

        if (e == null) {
            return null;
        }

        if (isArray(e)) {
            for (const i in e) {
                e[i] = ModuleTableServerController.translate_vos_from_db(e[i]);
            }
            return e;
        }

        if (!e._type) {
            return e;
        }

        const moduleTable = ModuleTableController.module_tables_by_vo_type[e._type];

        if (!moduleTable) {
            return e;
        }

        const readonly_fields_by_ids = ModuleTableController.readonly_fields_by_ids[moduleTable.vo_type];
        for (const field_name in readonly_fields_by_ids) {
            delete e[field_name];
        }

        const res: T = Object.assign(new ModuleTableController.vo_constructor_by_vo_type[moduleTable.vo_type](), e as T);
        res.id = ConversionHandler.forceNumber(e.id);

        const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[e._type];
        if (!fields) {
            return res as any; // Le typage de Typescript ne comprend pas que si !isArray(e) alors e est de type T et non de type T | T[]
        }
        for (const i in fields) {
            const field = fields[i];

            ModuleTableFieldServerController.translate_field_from_db(field, e, res);
        }

        return res as any; // Le typage de Typescript ne comprend pas que si !isArray(e) alors e est de type T et non de type T | T[]
    }

    /**
     * Permet de récupérer un clone dont les fields sont insérables en bdd.
     * Cela autorise l'usage en VO de fields dont les types sont incompatibles nativement avec le format de la BDD
     * @param e Le VO dont on veut une version insérable en BDD
     * @param inside_plain_vo_obj  pour indiquer si on est dans un plain_vo ou sur des champs directement stockés en BDD. ça change a minima le format des string[] qui en base est pas ["",""] mais {"",""}
     */
    public static translate_vos_to_db<T extends IDistantVOBase, U extends T | T[]>(e: U, inside_plain_vo_obj: boolean = false): U {
        if (!e) {
            return null;
        }

        if (isArray(e)) {
            for (const i in e) {
                e[i] = ModuleTableServerController.translate_vos_to_db(e[i], inside_plain_vo_obj);
            }
            return e;
        }

        const res = cloneDeep(e);
        const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[e._type];
        if (!fields) {
            return res;
        }

        for (const i in fields) {
            const field = fields[i];

            switch (field.field_type) {

                case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    res[field.field_name + '_ndx'] = MatroidIndexHandler.get_normalized_ranges(res[field.field_name] as IRange[]);
                    res[field.field_name] = RangeHandler.translate_to_bdd(res[field.field_name]);
                    break;

                case ModuleTableFieldVO.FIELD_TYPE_numrange:
                case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                case ModuleTableFieldVO.FIELD_TYPE_hourrange:
                    res[field.field_name + '_ndx'] = MatroidIndexHandler.get_normalized_range(res[field.field_name] as IRange);
                    res[field.field_name] = RangeHandler.translate_range_to_bdd(res[field.field_name]);
                    break;

                case ModuleTableFieldVO.FIELD_TYPE_geopoint:
                    if (res[field.field_name]) {
                        res[field.field_name] = GeoPointHandler.getInstance().format(res[field.field_name]);
                    }
                    break;

                case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
                    if (e[field.field_name] && e[field.field_name]._type) {
                        const trans_ = e[field.field_name] ? ModuleTableServerController.translate_vos_to_db(e[field.field_name], true) : null;
                        res[field.field_name] = trans_ ? JSON.stringify(trans_) : null;
                    } else if (e[field.field_name]) {
                        res[field.field_name] = JSON.stringify(e[field.field_name]);
                    } else {
                        res[field.field_name] = null;
                    }
                    break;

                case ModuleTableFieldVO.FIELD_TYPE_email:
                    if (res[field.field_name] && res[field.field_name].trim) {
                        res[field.field_name] = res[field.field_name].trim();
                    }
                    break;

                case ModuleTableFieldVO.FIELD_TYPE_float_array:
                case ModuleTableFieldVO.FIELD_TYPE_int_array:
                case ModuleTableFieldVO.FIELD_TYPE_string_array:
                    // ATTENTION - INTERDITION DE METTRE UNE VIRGULE DANS UN CHAMP DE TYPE ARRAY SINON CA FAIT X VALEURS
                    if (res[field.field_name]) {
                        const values: any[] = [];

                        for (const j in res[field.field_name]) {
                            if (res[field.field_name][j]) {
                                values.push(res[field.field_name][j]);
                            }
                        }

                        if (!values || !values.length) {
                            res[field.field_name] = null;
                        } else {
                            res[field.field_name] = inside_plain_vo_obj ? '[' + values.join(',') + ']' : '{' + values.join(',') + '}';
                        }
                    }

                    break;

                default:
            }
        }

        return res;
    }

    /**
     * Sur le générateur :
     *      - On tente de récupérer la version en base, on la met à jour et sinon on la crée.
     *      puis on met à jour dans le cache de l'application
     *      - On supprime aussi les tables qui sont pas dans la def actuelle
     * Dans cette fonction on ne pense qu'à mettre à jour la base pour le ModuleTableVO, pas la table du vo_type en elle-même
     */
    public static async push_ModuleTableVO_conf_to_db() {
        const promise_pipeline = new PromisePipeline(ConfigurationService.node_configuration.MAX_POOL / 2, 'ModuleTableController.push_ModuleTableVOs_to_db');

        for (const vo_type in ModuleTableController.module_tables_by_vo_type) {
            const table = ModuleTableController.module_tables_by_vo_type[vo_type];
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
            const db_tables = await query(ModuleTableVO.API_TYPE_ID).filter_by_text_has_none(field_names<ModuleTableVO>().vo_type, Object.keys(ModuleTableController.module_tables_by_vo_type)).select_vos<ModuleTableVO>();
            await ModuleDAOServer.getInstance().deleteVOs_as_server(db_tables);
        });

        await promise_pipeline.end();
    }
}