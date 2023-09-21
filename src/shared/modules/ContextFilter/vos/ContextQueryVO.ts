import { cloneDeep, isArray } from "lodash";
import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import ConsoleHandler from "../../../tools/ConsoleHandler";
import DatatableField from "../../DAO/vos/datatable/DatatableField";
import InsertOrDeleteQueryResult from "../../DAO/vos/InsertOrDeleteQueryResult";
import TableColumnDescVO from "../../DashboardBuilder/vos/TableColumnDescVO";
import DataFilterOption from "../../DataRender/vos/DataFilterOption";
import NumRange from "../../DataRender/vos/NumRange";
import TimeSegment from "../../DataRender/vos/TimeSegment";
import TSRange from "../../DataRender/vos/TSRange";
import IMatroid from "../../Matroid/interfaces/IMatroid";
import MatroidController from "../../Matroid/MatroidController";
import ModuleTableField from "../../ModuleTableField";
import VarConfVO from "../../Var/vos/VarConfVO";
import AbstractVO from "../../VO/abstract/AbstractVO";
import VOsTypesManager from "../../VO/manager/VOsTypesManager";
import ModuleContextFilter from "../ModuleContextFilter";
import ContextFilterVO, { filter } from "./ContextFilterVO";
import ContextQueryFieldVO from "./ContextQueryFieldVO";
import ParameterizedQueryWrapper from "./ParameterizedQueryWrapper";
import SortByVO from "./SortByVO";
import ContextQueryJoinVO from "./ContextQueryJoinVO";
import ContextQueryJoinOnFieldVO from "./ContextQueryJoinOnFieldVO";

/**
 * Encapsuler la définition d'une requête ou d'une sous-requête (qu'on liera à la requête principale par un filtre)
 */
export default class ContextQueryVO extends AbstractVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "context_query";

    public id: number;
    public _type: string = ContextQueryVO.API_TYPE_ID;

    /**
     * Durée de rétention (et donc de faîcheur) max de la requête en cache
     *  - > 0 : cache de la durée indiquée
     * On utilise le cache de la requête pour les requêtes de type select passées par le throttled query
     *  et on active le cache requete par requete avec pour paramètre cette durée de rétention
     *  et si on en voit plusieurs, on garde la valeur de rétention max
     * Si on a dans le cache un résultat plus récent que la durée de rétention, on charge depuis le cache
     *  sinon on relance la requête et on écrase le cache
     * Le cache est vidé régulièremetn par le throttled query qui lance de temps à autres un clean_cache
     *  qui vide le cache suivant les durées de rétention
     */
    public max_age_ms: number;


    /**
     * Indicateur de select count()
     */
    public do_count_results: boolean = false;

    /**
     * Request ID : utilisé quand on est dans un UNION ALL et qu'on veut retrouver son résultat quel que soit l'ordre dans lequel les réponses sont renvoyées par la base de données
     */
    public request_id: number;

    /**
     * La table de départ de la requête
     */
    public base_api_type_id: string;

    /**
     * Sur un type select fields, on a besoin des champs ciblés, dans un ordre défini.
     *  Si on veut juste les vos du base_api_type_id on passe null
     */
    public fields: ContextQueryFieldVO[];

    /**
     * Les filtres à appliquer à la requête
     */
    public filters: ContextFilterVO[];

    /**
     * Les jointures manuelles entre 2 context query
     */
    public joined_context_queries: ContextQueryJoinVO[];

    /**
     * Les types utilisables dans la requete pour faire les jointures
     */
    public active_api_type_ids: string[];

    /**
     * Pour limiter le nombre de résultats sur un select
     *  0 => no limit
     * limit est un nom réservé, renommage en query_limit
     */
    public query_limit: number;

    /**
     * Pour décaler le curseur dans le cas d'un select
     *  0 => on renvoie dès le premier résultat
     *  10 => on renvoie à partir du 11ème résultat (on ignore les 10 premiers)
     * Pas d'offset sans limit (cf postgresql LIMIT)
     * offset est un nom réservé, renommage en query_offset
     */
    public query_offset: number;

    /**
     * Pour ajouter un ordre à la requête : null pour garder l'ordre par défaut
     */
    public sort_by: SortByVO[];

    /**
     * Par défaut vide, mais doit être utilisé pour les sub queries
     *  pour assurer l'unicité des noms des tables au sein de la requête globale
     */
    public query_tables_prefix: string;

    /**
     * On renomme / remplace is_access_hook_def par is_admin => on indique qu'on ignore tout type de
     *  filtrage des types de données et des données (les droits, et les content access hooks)
     * Ce paramètre est forcé à false quand on arrive par l'API, seul le serveur peut décider de le mettre à true
     */
    public is_server: boolean;

    /**
     * @deprecated use is_admin
     */
    get is_access_hook_def(): boolean {
        return this.is_server;
    }

    /**
     * @deprecated use is_admin
     */
    set is_access_hook_def(is_admin: boolean) {
        this.is_server = is_admin;
    }

    /**
     * Pour exclure les champs techniques de type versioning du path autorisé (false pour exclure)
     */
    public use_technical_field_versioning: boolean;

    /**
     * Force DISTINCT results (using GROUP BY instead of SELECT DISTINCT)
     * distinct est un nom réservé, renommage en query_distinct
     */
    public query_distinct: boolean;

    /**
     * Union queries collection
     */
    public union_queries: ContextQueryVO[];

    /**
     * Propose de throttle la requête de type select pour faire des packs (dans la même logique que le requestwrapper)
     */
    public throttle_query_select: boolean = true;

    /**
     * Pour exclure des fields pour réaliser les chemins (par exemple si on veut utiliser le field B et non A qui font référence au
     *  même vo_type, on peut ajouter le field A pour indiquer qu'on refuse ce chemin)
     * Cela ne permet pas d'avoir plusieurs chemins différents pour des types identiques au sein d'une même query, mais
     *  cela permet de contrôler un minimum les chemins à privilégier
     * Une map des field_id par vo_type
     */
    public discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    public set_base_api_type_id(base_api_type_id: string): ContextQueryVO {
        this.base_api_type_id = base_api_type_id;

        return this;
    }

    public join_context_query(
        joined_context_query: ContextQueryVO,
        joined_table_alias: string,
        join_type: number,
        join_on_fields: ContextQueryJoinOnFieldVO[],
    ): ContextQueryVO {

        let context_query_join: ContextQueryJoinVO = ContextQueryJoinVO.createNew(joined_context_query, joined_table_alias, join_on_fields, join_type);
        if (!this.joined_context_queries) {
            this.joined_context_queries = [];
        }

        this.joined_context_queries.push(context_query_join);

        return this;
    }

    public set_query_distinct() {
        this.query_distinct = true;
        return this;
    }

    /**
     * @deprecated use set_discarded_field_path instead
     */
    public discard_field_path(vo_type: string, field_id: string): ContextQueryVO {
        return this.set_discarded_field_path(vo_type, field_id);
    }

    /**
     * @deprecated use set_discarded_field_path instead
     */
    public set_discard_field_path(vo_type: string, field_id: string): ContextQueryVO {
        return this.set_discarded_field_path(vo_type, field_id);
    }

    /**
     * set_discarded_field_path
     *
     * @param {string} vo_type
     * @param {string} field_id
     * @returns {ContextQueryVO}
     */
    public set_discarded_field_path(vo_type: string, field_id: string): ContextQueryVO {

        if (!this.discarded_field_paths) {
            this.discarded_field_paths = {};
        }

        if (!this.discarded_field_paths[vo_type]) {
            this.discarded_field_paths[vo_type] = {};
        }

        this.discarded_field_paths[vo_type][field_id] = true;

        return this;
    }

    /**
     * Autorise l'utilisation des fields techniques de type versioning pour les chemins
     */
    public use_tecpaths_versioning(): ContextQueryVO {
        this.use_technical_field_versioning = true;

        return this;
    }

    /**
     * Ajouter un ou plusieurs active_api_type_ids pour spécifier les chemins acceptables
     * @param API_TYPE_IDs le ou les types à ajouter au active_api_type_ids
     */
    public using(API_TYPE_IDs: string | string[]): ContextQueryVO {

        if (!API_TYPE_IDs) {
            return this;
        }

        let to_add: string[] = [];
        if (isArray(API_TYPE_IDs)) {
            for (let i in API_TYPE_IDs) {
                let API_TYPE_ID = API_TYPE_IDs[i];

                if (!API_TYPE_ID) {
                    continue;
                }

                if (this.active_api_type_ids.indexOf(API_TYPE_ID) < 0) {
                    to_add.push(API_TYPE_ID);
                }
            }
        } else {
            if (this.active_api_type_ids.indexOf(API_TYPE_IDs as string) < 0) {
                to_add.push(API_TYPE_IDs as string);
            }
        }

        if (to_add && to_add.length) {
            this.active_api_type_ids = this.active_api_type_ids.concat(to_add);
        }

        return this;
    }

    /**
     * Create an union of queries
     *
     * @param context_query
     * @returns {ContextQueryVO}
     */
    public union(context_query: ContextQueryVO | ContextQueryVO[]): ContextQueryVO {

        if (!context_query) {
            return this;
        }

        if (!Array.isArray(context_query)) {
            context_query = [context_query];
        }

        // Set union_queries if not exists
        if (!(this.union_queries?.length > 0)) {
            this.union_queries = [];
        }

        this.union_queries = this.union_queries.concat(context_query);

        return this;
    }

    public set_request_id(request_id: number): ContextQueryVO {
        this.request_id = request_id;
        return this;
    }

    /**
     * Ajouter un field attendu en résultat de la requête par le field_id, et optionnellement un alias spécifique
     *  on utilise base_api_type_id de la requete si on en fournit pas un explicitement ici
     *  Si on veut un vo complet il ne faut pas demander les fields
     *
     * @param field_id l'id du field à ajouter.
     */
    public field(
        field_id: string,
        alias: string = null,
        api_type_id: string = null,
        aggregator: number = VarConfVO.NO_AGGREGATOR,
        modifier: number = ContextQueryFieldVO.FIELD_MODIFIER_NONE,
        cast_with: string = null,
    ): ContextQueryVO {
        return this.add_field(field_id, alias, api_type_id, aggregator, modifier, cast_with);
    }

    public remove_field(
        field_id_in_array: number
    ): ContextQueryVO {

        if (!this.fields) {
            return;
        }

        this.fields.splice(field_id_in_array, 1);
        return this;
    }

    /**
     * Ajouter un field attendu en résultat de la requête par le field_id, et optionnellement un alias spécifique
     *  on utilise base_api_type_id de la requete si on en fournit pas un explicitement ici
     *  Si on veut un vo complet il ne faut pas demander les fields
     *
     * @param field_id l'id du field à ajouter.
     */
    public add_field(
        field_id: string,
        alias: string = null,
        api_type_id: string = null,
        aggregator: number = VarConfVO.NO_AGGREGATOR,
        modifier: number = ContextQueryFieldVO.FIELD_MODIFIER_NONE,
        cast_with: string = null,
    ): ContextQueryVO {

        const field = new ContextQueryFieldVO(
            api_type_id ? api_type_id : this.base_api_type_id,
            field_id,
            alias,
            aggregator,
            modifier,
            cast_with,
        );

        if (!this.fields) {
            this.fields = [];
        }

        this.fields.push(field);

        this.update_active_api_type_ids_from_fields([field]);

        return this;
    }

    /**
     * has_field
     *  - Check if the given field_id is in the fields
     */
    public has_field(field_id: string): boolean {
        if (!this.fields) {
            return false;
        }

        return this.fields?.find((f) => f.field_id == field_id) != null;
    }

    /**
     * replace_field
     *  - Replace field from this fields by the given field
     *
     * @param field_id l'id du field à ajouter.
     */
    public replace_field(
        field_id: string,
        alias: string = null,
        api_type_id: string = null,
        aggregator: number = VarConfVO.NO_AGGREGATOR,
        modifier: number = ContextQueryFieldVO.FIELD_MODIFIER_NONE,
        cast_with: string = null,
    ): ContextQueryVO {

        const field = new ContextQueryFieldVO(
            api_type_id ? api_type_id : this.base_api_type_id,
            field_id,
            alias,
            aggregator,
            modifier,
            cast_with,
        );

        if (!this.fields) {
            this.fields = [];
        }

        this.fields = this.fields.map((f) => {
            if (f.field_id == field_id) {
                return field;
            }
            return f;
        });

        this.update_active_api_type_ids_from_fields([field]);

        return this;
    }

    /**
     * Ajouter des fields attendus en résultat de la requête
     *  Si on veut un vo complet il ne faut pas demander les fields
     * @param fields les fields à ajouter.
     */
    public add_fields(fields: ContextQueryFieldVO[]): ContextQueryVO {

        if (!this.fields) {
            this.fields = [];
        }

        this.fields = this.fields.concat(fields);
        this.update_active_api_type_ids_from_fields(fields);

        return this;
    }

    /**
     * Filtre par champs < param date
     * @param field_id le field qu'on veut filtrer
     * @param date timestamp en secondes
     * @param segmentation_type optionnel, par défaut TimeSegment.TYPE_SECOND, normalement (si les segmentations sont gérées correctement en amont) inutile sur un <
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_date_before(field_id: string, date: number, segmentation_type: number = TimeSegment.TYPE_SECOND, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_date_before(date, segmentation_type)]);
    }

    /**
     * Filtre par champs <= param date
     * @param field_id le field qu'on veut filtrer
     * @param date timestamp en secondes
     * @param segmentation_type optionnel, par défaut TimeSegment.TYPE_SECOND
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_date_same_or_before(field_id: string, date: number, segmentation_type: number = TimeSegment.TYPE_SECOND, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_date_same_or_before(date, segmentation_type)]);
    }

    /**
     * Filtre par champs > param date
     * @param field_id le field qu'on veut filtrer
     * @param date timestamp en secondes
     * @param segmentation_type optionnel, par défaut TimeSegment.TYPE_SECOND
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_date_after(field_id: string, date: number, segmentation_type: number = TimeSegment.TYPE_SECOND, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_date_after(date, segmentation_type)]);
    }

    /**
     * Filtre par champs >= param date
     * @param field_id le field qu'on veut filtrer
     * @param date timestamp en secondes
     * @param segmentation_type optionnel, par défaut TimeSegment.TYPE_SECOND
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_date_same_or_after(field_id: string, date: number, segmentation_type: number = TimeSegment.TYPE_SECOND, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_date_same_or_after(date, segmentation_type)]);
    }

    /**
     * Sucre syntaxique pour une filtre numeric equals ANY
     * @param field_id le field qu'on veut filtrer
     * @param alias alias du field qu'on utilise comme valeur (ref d'un field de la requête)
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_num_has_alias(field_id: string, alias: string, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_num_has_alias(alias)]);
    }

    /**
     * Sucre syntaxique pour une filtre numeric equals ANY
     * @param field_id le field qu'on veut filtrer
     * @param num la valeur qu'on veut filtrer
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_num_has(field_id: string, num: number[], API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_num_has(num)]);
    }

    /**
     * Sucre syntaxique pour une filtre numeric equals ALL
     * @param field_id le field qu'on veut filtrer
     * @param alias alias du field qu'on utilise comme valeur (ref d'un field de la requête)
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_num_eq_alias(field_id: string, alias: string, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_num_eq_alias(alias)]);
    }

    /**
     * Sucre syntaxique pour une filtre numeric equals NONE
     * @param field_id le field qu'on veut filtrer
     * @param num la valeur qu'on veut filtrer
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_num_not_eq(field_id: string, num: number, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_num_not_eq(num)]);
    }

    /**
     * Sucre syntaxique pour une filtre numeric equals ALL
     * @param field_id le field qu'on veut filtrer
     * @param num la valeur qu'on veut filtrer
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_num_eq(field_id: string, num: number | NumRange | NumRange[] | number[], API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_num_eq(num)]);
    }

    /**
     * Sucre syntaxique pour une filtre numeric >
     * @param field_id le field qu'on veut filtrer
     * @param num la valeur qu'on veut filtrer
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_num_sup(field_id: string, num: number, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_num_sup(num)]);
    }

    /**
     * Sucre syntaxique pour une filtre numeric >=
     * @param field_id le field qu'on veut filtrer
     * @param num la valeur qu'on veut filtrer
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_num_sup_eq(field_id: string, num: number, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_num_sup_eq(num)]);
    }

    /**
     * Sucre syntaxique pour une filtre numeric <
     * @param field_id le field qu'on veut filtrer
     * @param num la valeur qu'on veut filtrer
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_num_inf(field_id: string, num: number, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_num_inf(num)]);
    }

    /**
     * Sucre syntaxique pour une filtre numeric <=
     * @param field_id le field qu'on veut filtrer
     * @param num la valeur qu'on veut filtrer
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_num_inf_eq(field_id: string, num: number, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_num_inf_eq(num)]);
    }

    /**
     * Sucre syntaxique pour une filtre numeric intersects ranges
     * @param field_id le field qu'on veut filtrer
     * @param ranges les valeurs qu'on veut filtrer
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_num_x_ranges(field_id: string, ranges: NumRange[], API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_num_x_ranges(ranges)]);
    }

    /**
     * Sucre syntaxique pour une filtre numeric included in ranges
     * @param field_id le field qu'on veut filtrer
     * @param ranges les valeurs qu'on veut filtrer
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_num_is_in_ranges(field_id: string, ranges: NumRange[], API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_num_is_in_ranges(ranges)]);
    }

    /**
     * Sucre syntaxique pour une filtre date == ranges
     * @param field_id le field qu'on veut filtrer
     * @param date les valeurs qu'on veut filtrer
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_date_eq(field_id: string, date: number | number[] | TSRange | TSRange[], API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_date_eq(date)]);
    }

    /**
     * Sucre syntaxique pour une filtre date == ranges
     * @param field_id le field qu'on veut filtrer
     * @param alias
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_date_eq_alias(field_id: string, alias: string, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_date_eq_alias(alias)]);
    }

    /**
     * Sucre syntaxique pour une filtre date included in ranges
     * @param field_id le field qu'on veut filtrer
     * @param ranges les valeurs qu'on veut filtrer
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_date_is_in_ranges(field_id: string, ranges: TSRange[], API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_date_is_in_ranges(ranges)]);
    }

    /**
     * Sucre syntaxique pour une filtre date intersects ranges
     * @param field_id le field qu'on veut filtrer
     * @param ranges les valeurs qu'on veut filtrer
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_date_x_ranges(field_id: string, ranges: TSRange[], API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_date_x_ranges(ranges)]);
    }

    /**
     * Filter sur le champs id, avec un id numérique simple
     * @param id la valeur de l'id qu'on veut filtrer
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_id(id: number, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id).by_id(id)]);
    }

    /**
     * Filter sur le champs id, avec un numranges à intersecter
     * @param id_ranges les ids qu'on filtre
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_ids(id_ranges: number[] | NumRange[], API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id).by_ids(id_ranges)]);
    }

    /**
     * Filtrer par text contenu dans la valeur du champ
     * @param field_id le field qu'on veut filtrer
     * @param included le texte qu'on veut voir apparaître dans la valeur du champs
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_text_including(field_id: string, included: string | string[], API_TYPE_ID: string = null, ignore_case: boolean = true): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_text_including(included, ignore_case)]);
    }

    /**
     * Filtrer par text strictement égal
     * @param field_id le field qu'on veut filtrer
     * @param alias
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_text_eq_alias(field_id: string, alias: string, API_TYPE_ID: string = null, ignore_case: boolean = false): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_text_eq_alias(alias, ignore_case)]);
    }

    /**
     * Filtrer par text égal ANY
     * @param field_id le field qu'on veut filtrer
     * @param alias
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_text_has_alias(field_id: string, alias: string, API_TYPE_ID: string = null, ignore_case: boolean = false): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_text_has_alias(alias, ignore_case)]);
    }

    /**
     * Filtrer par text égal ANY
     * @param field_id le field qu'on veut filtrer
     * @param text le texte que l'on doit retrouver à l'identique en base
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_text_has(field_id: string, text: string | string[], API_TYPE_ID: string = null, ignore_case: boolean = false): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_text_has(text, ignore_case)]);
    }

    /**
     * Filtrer par text non inclus
     * @param field_id le field qu'on veut filtrer
     * @param text le texte à filtrer
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_text_has_none(field_id: string, text: string | string[], API_TYPE_ID: string = null, ignore_case: boolean = false): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_text_has_none(text, ignore_case)]);
    }

    /**
     * Filtrer par text strictement égal
     * @param field_id le field qu'on veut filtrer
     * @param text le texte que l'on doit retrouver à l'identique en base
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_text_eq(field_id: string, text: string | string[], API_TYPE_ID: string = null, ignore_case: boolean = false): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_text_eq(text, ignore_case)]);
    }

    /**
     * Filtrer par text différent
     * @param field_id le field qu'on veut filtrer
     * @param text le texte que l'on doit retrouver à l'identique en base
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_text_not_eq(field_id: string, text: string | string[], API_TYPE_ID: string = null, ignore_case: boolean = false): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_text_has_none(text, ignore_case)]);
    }

    /**
     * Filtrer par text en début de la valeur du champ
     * @param field_id le field qu'on veut filtrer
     * @param included le texte qu'on veut voir apparaître au début de la valeur du champs
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_text_starting_with(field_id: string, starts_with: string | string[], API_TYPE_ID: string = null, ignore_case: boolean = true): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_text_starting_with(starts_with, ignore_case)]);
    }

    /**
     * @param matroids les matroids qu'on veut utiliser pour le filtrage. ATTENTION on force un seul type de matroid dans la liste. On cherche une inclusion dans 1 des matroids
     * @param filter_var_id_if_field_exists Ajouter un filtrage sur le var_id si il existe un fields var_id sur le type cible de la recheche et sur le matroid
     * @param API_TYPE_ID
     * @param fields_ids_mapper
     */
    public filter_by_matroids_inclusion(
        matroids: IMatroid[],
        filter_var_id_if_field_exists: boolean = true,
        API_TYPE_ID: string = null,
        fields_ids_mapper: { [matroid_field_id: string]: string } = null): ContextQueryVO {

        let target_API_TYPE_ID = API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id;
        if (!matroids || !matroids.length) {
            // Si on a pas de matroid mais qu'on veut filtrer par inclu dans le matroid on a donc aucun résultat possible
            return this.filter_is_null('id', target_API_TYPE_ID);
        }

        let matroid_api_type_id: string = matroids[0]._type;
        for (let i in matroids) {
            let matroid = matroids[i];
            if (matroid._type != matroid_api_type_id) {
                throw new Error('filter_by_matroids_inclusion: Tous les matroids doivent être du même type : '
                    + matroid_api_type_id + '(index 0) != ' + matroid._type + '(index ' + i + ')');
            }
        }

        let matroid_head_filter: ContextFilterVO = null;
        let target_moduletable = VOsTypesManager.moduleTables_by_voType[target_API_TYPE_ID];
        let var_id_field_id = (fields_ids_mapper && fields_ids_mapper['var_id']) ? fields_ids_mapper['var_id'] : 'var_id';
        let target_has_var_id_field = target_moduletable.get_field_by_id(var_id_field_id);

        let matroid_module_table = VOsTypesManager.moduleTables_by_voType[matroid_api_type_id];
        let matroid_has_var_id_field = matroid_module_table.get_field_by_id('var_id');
        let matroid_fields: Array<ModuleTableField<any>> = MatroidController.getMatroidFields(matroid_api_type_id);

        for (let i in matroids) {
            let matroid: IMatroid = matroids[i];
            let this_matroid_head_filter: ContextFilterVO = null;

            if (filter_var_id_if_field_exists && matroid_has_var_id_field && target_has_var_id_field) {
                this_matroid_head_filter = filter(target_API_TYPE_ID, var_id_field_id).by_num_eq(matroid['var_id']);
            }

            for (let j in matroid_fields) {
                let matroid_field = matroid_fields[j];
                let matroid_field_id = matroid_field.field_id;
                let target_field_id = (fields_ids_mapper && fields_ids_mapper[matroid_field_id]) ? fields_ids_mapper[matroid_field_id] : matroid_field_id;
                let target_moduletable_field = target_moduletable.getFieldFromId(target_field_id);

                let this_filter = null;
                switch (target_moduletable_field.field_type) {
                    case ModuleTableField.FIELD_TYPE_tsrange:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                        this_filter = filter(target_API_TYPE_ID, target_field_id).by_date_is_in_ranges(matroid[matroid_field_id]);
                        break;
                    case ModuleTableField.FIELD_TYPE_numrange:
                    case ModuleTableField.FIELD_TYPE_hourrange:
                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                    case ModuleTableField.FIELD_TYPE_hourrange_array:
                        this_filter = filter(target_API_TYPE_ID, target_field_id).by_num_is_in_ranges(matroid[matroid_field_id]);
                        break;
                    case ModuleTableField.FIELD_TYPE_tstz:
                        this_filter = filter(target_API_TYPE_ID, target_field_id).by_date_x_ranges(matroid[matroid_field_id]);
                        break;
                    default:
                        this_filter = filter(target_API_TYPE_ID, target_field_id).by_num_x_ranges(matroid[matroid_field_id]);
                        break;
                }
                this_matroid_head_filter = this_matroid_head_filter ? this_matroid_head_filter.and(this_filter) : this_filter;
            }

            matroid_head_filter = matroid_head_filter ? matroid_head_filter.or(this_matroid_head_filter) : this_matroid_head_filter;
        }

        return matroid_head_filter ? this.add_filters([matroid_head_filter]) : this;
    }

    /**
     * @param matroids les matroids qu'on veut utiliser pour le filtrage. ATTENTION on force un seul type de matroid dans la liste. On cherche une intersection avec 1 des matroids
     * @param filter_var_id_if_field_exists Ajouter un filtrage sur le var_id si il existe un fields var_id sur le type cible de la recheche et sur le matroid
     * @param API_TYPE_ID
     * @param fields_ids_mapper
     */
    public filter_by_matroids_intersection(
        matroids: IMatroid[],
        filter_var_id_if_field_exists: boolean = true,
        API_TYPE_ID: string = null,
        fields_ids_mapper: { [matroid_field_id: string]: string } = null): ContextQueryVO {

        let target_API_TYPE_ID = API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id;
        if (!matroids || !matroids.length) {
            // Si on a pas de matroid mais qu'on veut filtrer par inclu dans le matroid on a donc aucun résultat possible
            return this.filter_is_null('id', target_API_TYPE_ID);
        }

        let matroid_api_type_id: string = matroids[0]._type;
        for (let i in matroids) {
            let matroid = matroids[i];
            if (matroid._type != matroid_api_type_id) {
                throw new Error('filter_by_matroids_inclusion: Tous les matroids doivent être du même type : '
                    + matroid_api_type_id + '(index 0) != ' + matroid._type + '(index ' + i + ')');
            }
        }

        let matroid_head_filter: ContextFilterVO = null;
        let target_moduletable = VOsTypesManager.moduleTables_by_voType[target_API_TYPE_ID];
        let var_id_field_id = (fields_ids_mapper && fields_ids_mapper['var_id']) ? fields_ids_mapper['var_id'] : 'var_id';
        let target_has_var_id_field = target_moduletable.get_field_by_id(var_id_field_id);

        let matroid_module_table = VOsTypesManager.moduleTables_by_voType[matroid_api_type_id];
        let matroid_has_var_id_field = matroid_module_table.get_field_by_id('var_id');
        let matroid_fields: Array<ModuleTableField<any>> = MatroidController.getMatroidFields(matroid_api_type_id);

        for (let i in matroids) {
            let matroid: IMatroid = matroids[i];
            let this_matroid_head_filter: ContextFilterVO = null;

            if (filter_var_id_if_field_exists && matroid_has_var_id_field && target_has_var_id_field) {
                this_matroid_head_filter = filter(target_API_TYPE_ID, var_id_field_id).by_num_eq(matroid['var_id']);
            }

            for (let j in matroid_fields) {
                let matroid_field = matroid_fields[j];
                let matroid_field_id = matroid_field.field_id;
                let target_field_id = (fields_ids_mapper && fields_ids_mapper[matroid_field_id]) ? fields_ids_mapper[matroid_field_id] : matroid_field_id;

                let this_filter = null;
                switch (matroid_field.field_type) {
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                        this_filter = filter(target_API_TYPE_ID, target_field_id).by_date_x_ranges(matroid[matroid_field_id]);
                        break;
                    default:
                        this_filter = filter(target_API_TYPE_ID, target_field_id).by_num_x_ranges(matroid[matroid_field_id]);
                }
                this_matroid_head_filter = this_matroid_head_filter ? this_matroid_head_filter.and(this_filter) : this_filter;
            }

            matroid_head_filter = matroid_head_filter ? matroid_head_filter.or(this_matroid_head_filter) : this_matroid_head_filter;
        }

        return matroid_head_filter ? this.add_filters([matroid_head_filter]) : this;
    }

    /**
     * Filtrer en fonction d'un sub en exists
     * @param query la sous requête qui doit renvoyer aucune ligne pour être valide
     */
    public filter_by_exists(query_: ContextQueryVO): ContextQueryVO {
        return this.add_filters([filter().by_exists(query_, this)]);
    }

    /**
     * Filtrer en fonction d'un sub en not exists
     * @param query la sous requête qui doit renvoyer aucune ligne pour être valide
     */
    public filter_by_not_exists(query_: ContextQueryVO): ContextQueryVO {
        return this.add_filters([filter().by_not_exists(query_, this)]);
    }

    /**
     * Filter by ID not in (subquery)
     * @param query la sous requête qui doit renvoyer les ids comme unique field
     */
    public filter_by_id_not_in(query_: ContextQueryVO, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id).by_id_not_in(query_, this)]);
    }

    /**
     * Filtrer un champ number par un sous-requête : field not in (subquery)
     * @param query la sous requête qui doit renvoyer les nums acceptés en un unique field
     */
    public filter_by_num_not_in(field_id: string, query_: ContextQueryVO, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_num_not_in(query_, this)]);
    }

    /**
     * Filter by ID in (subquery)
     * @param query la sous requête qui doit renvoyer les ids comme unique field
     */
    public filter_by_id_in(query_: ContextQueryVO, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id).by_id_in(query_, this)]);
    }

    /**
     * Filtrer un champ number par un sous-requête : field in (subquery)
     * @param query la sous requête qui doit renvoyer les nums acceptés en un unique field
     */
    public filter_by_num_in(field_id: string, query_: ContextQueryVO, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_num_in(query_, this)]);
    }

    /**
     * Filter sur champs strictement NULL
     */
    public filter_is_null(field_id: string, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).is_null()]);
    }

    /**
     * Filter sur champs au moins partiellement NULL
     */
    public filter_has_null(field_id: string, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).has_null()]);
    }

    /**
     * Filter sur champs strictement NON NULL
     */
    public filter_is_not_null(field_id: string, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).is_not_null()]);
    }

    /**
     * Filter sur champs strictement NULL ou VIDE
     */
    public filter_is_null_or_empty(field_id: string, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).is_null_or_empty()]);
    }

    /**
     * Filter sur le champs par boolean suivant param
     */
    public filter_boolean_value(field_id: string, boolean_value: boolean, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([
            boolean_value ?
                filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).is_true() :
                filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).is_false()]);
    }

    /**
     * Filter sur le champs par boolean strictement vrai
     */
    public filter_is_true(field_id: string, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).is_true()]);
    }

    /**
     * Filter sur le champs par boolean strictement faux
     */
    public filter_is_false(field_id: string, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).is_false()]);
    }

    /**
     * Filter sur le champs par boolean au moins partiellement vrai
     */
    public filter_has_true(field_id: string, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).has_true()]);
    }

    /**
     * Filter sur le champs par boolean au moins partiellement faux
     */
    public filter_has_false(field_id: string, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).has_false()]);
    }

    /**
     * Ajouter un filtre
     * @param filters les filtres à ajouter
     */
    public add_filters(filters: ContextFilterVO[]): ContextQueryVO {

        if (!this.filters) {
            this.filters = [];
        }

        this.filters = this.filters.concat(filters);

        this.update_active_api_type_ids_from_filters(filters);

        return this;
    }

    /**
     * Fixer la limit et l'offset
     * @param limit 0 => no limit
     * @param offset uniquement si limit > 0
     */
    public set_limit(limit: number, offset: number = 0): ContextQueryVO {

        if ((!limit) && (!!offset)) {
            throw new Error('Cannot set offset with no limit');
        }
        this.query_limit = limit;
        this.query_offset = offset;

        return this;
    }

    /**
     * Fixer la fonction de sort
     * @param sort
     */
    public set_sort(sort: SortByVO): ContextQueryVO {

        if (!sort) {
            this.sort_by = null;
            return this;
        }

        this.sort_by = [sort];

        this.update_active_api_type_ids_from_sorts([sort]);

        return this;
    }

    public clone(): ContextQueryVO {
        return Object.assign(new ContextQueryVO(), cloneDeep(this));
    }

    /**
     * Fixer la fonction de sort
     * @param sorts
     */
    public set_sorts(sorts: SortByVO[]): ContextQueryVO {

        this.sort_by = sorts;
        this.update_active_api_type_ids_from_sorts(sorts);

        return this;
    }

    /**
     * Ignorer les context access hooks => à utiliser si l'on est en train de déclarer un context access hook pour
     *  éviter une récursivité du hook
     * ATTENTION : on ignore aussi tout type de filtrage de droit => on devient ADMIN. Equivalent de l'ancien IS_CLIENT: false
     * @deprecated use query_as_admin
     */
    public ignore_access_hooks(): ContextQueryVO {

        this.is_access_hook_def = true;

        return this;
    }

    /**
     * Ignorer les content access hooks et les droits d'accès aux API_TYPE_IDS => on devient SERVER. Equivalent de l'ancien IS_CLIENT: false
     *  => à utiliser par exemple si l'on est en train de déclarer un context access hook pour éviter une récursivité du hook
     */
    public exec_as_server(is_server = true): ContextQueryVO {

        this.is_server = is_server;

        return this;
    }

    /**
     * Paramétrer le max_age de la query (cf. commentaire max_age_ms pour le fonctionnement du cache)
     * On accepte de charger de la data ancienne issue d'un cache, sans invalidation auto lors d'un update pour le moment
     *  et donc potentiellement fausse vs bdd
     */
    public set_max_age_ms(max_age_ms: number): ContextQueryVO {

        this.max_age_ms = max_age_ms;

        return this;
    }

    /**
     * La query est throttled par défaut, mais on peut demander à unthrottle
     * @param throttle_query_select
     */
    public unthrottle_query_select(): ContextQueryVO {
        this.throttle_query_select = false;
        return this;
    }

    /**
     * Faire la requête en mode select
     */
    public async get_select_query_str<T extends IDistantVOBase>(): Promise<ParameterizedQueryWrapper> {
        return await ModuleContextFilter.getInstance().build_select_query(this);
    }

    /**
     * Faire la requête en mode select_vos
     *  Si on avait défini des fields on les supprime puisqu'ils deviennent invalides
     * @returns les vos issus de la requête
     */
    public async select_vos<T extends IDistantVOBase>(): Promise<T[]> {
        return await ModuleContextFilter.getInstance().select_vos(this);
    }

    /**
     * Faire la requête en mode delete_vos
     * ATTENTION : les access_hooks sont ignorés, il faut passer par un trigger pre-delete pour refuser le delete
     *  ou modifier le comportement comme expliqué sur "context_access_hooks" dans le ModuleDAOServer
     * @returns les vos issus de la requête
     */
    public async delete_vos(): Promise<InsertOrDeleteQueryResult[]> {
        return await ModuleContextFilter.getInstance().delete_vos(this);
    }

    /**
     * Faire la requête en mode update_vos
     * ATTENTION : les access_hooks sont ignorés, il faut passer par un trigger pre-delete pour refuser le delete
     *  ou modifier le comportement comme expliqué sur "context_access_hooks" dans le ModuleDAOServer
     * @param new_api_translated_values les valeurs à mettre à jour => les champs (field_id) doivent être les champs de l'objet et non les champs API, mais par contre la valeur du champs doit être la valeur API
     * @returns les vos issus de la requête
     */
    public async update_vos<T extends IDistantVOBase>(new_api_translated_values: { [update_field_id in keyof T]?: any }): Promise<InsertOrDeleteQueryResult[]> {
        return await ModuleContextFilter.getInstance().update_vos<T>(this, new_api_translated_values);
    }

    /**
     * Faire la requête en mode select_vo
     *  Si on avait défini des fields on les supprime puisqu'ils deviennent invalides
     * @returns le vo issu de la requête => Throws si on a + de 1 résultat
     */
    public async select_vo<T extends IDistantVOBase>(): Promise<T> {
        let res: T[] = await ModuleContextFilter.getInstance().select_vos(this);
        if (res && (res.length > 1)) {
            throw new Error('Multiple results on select_vo is not allowed  : ' + this.base_api_type_id);
        }
        return (res && res.length) ? res[0] : null;
    }

    /**
     * Faire la requête simplement et récupérer le résultat brut
     */
    public async select_all(): Promise<any[]> {
        return await ModuleContextFilter.getInstance().select(this);
    }

    public count_results(): ContextQueryVO {
        this.do_count_results = true;
        return this;
    }

    public log(is_error: boolean = false) {
        let log_func = ConsoleHandler.log;

        if (is_error) {
            log_func = ConsoleHandler.error;
        }

        log_func('ContextQueryVO - base_api_type_id:' + this.base_api_type_id);
        log_func('               - active_api_type_ids: ' + this.active_api_type_ids);

        let fields_num = (this.fields ? this.fields.length : 0);
        if (fields_num) {
            for (let i in this.fields) {
                let field = this.fields[i];
                log_func('               - field:' + i + '/' + fields_num);
                field.log(is_error);
            }
        }

        let filters_num = (this.filters ? this.filters.length : 0);
        if (filters_num) {
            for (let i in this.filters) {
                let filter_ = this.filters[i];
                log_func('               - filter:' + i + '/' + filters_num);
                filter_.log(is_error);
            }
        }
    }

    /**
     * Faire la requête simplement et récupérer le résultat brut
     */
    public async select_one(): Promise<any> {
        let res = await ModuleContextFilter.getInstance().select(this);
        if (res && (res.length > 1)) {
            throw new Error('Multiple results on select_one is not allowed : ' + this.base_api_type_id);
        }
        return (res && res.length) ? res[0] : null;
    }

    /**
     * Faire la requête en mode select_datatable_rows mais ligne unique
     * @returns la ligne de datatable issue de la requête
     */
    public async select_datatable_row(
        columns_by_field_id: { [datatable_field_uid: string]: TableColumnDescVO },
        fields: { [datatable_field_uid: string]: DatatableField<any, any> }): Promise<any> {
        let res = await ModuleContextFilter.getInstance().select_datatable_rows(this, columns_by_field_id, fields);
        if (res && (res.length > 1)) {
            throw new Error('Multiple results on select_datatable_row is not allowed : ' + this.base_api_type_id);
        }
        return (res && res.length) ? res[0] : null;
    }

    /**
     * Faire la requête en mode select_datatable_rows
     * @returns les lignes de datatable issues de la requête
     */
    public async select_datatable_rows(
        columns_by_field_id: { [datatable_field_uid: string]: TableColumnDescVO },
        fields: { [datatable_field_uid: string]: DatatableField<any, any> }
    ): Promise<any[]> {
        return await ModuleContextFilter.getInstance().select_datatable_rows(this, columns_by_field_id, fields);
    }

    /**
     * Faire la requête en mode select_count
     * @returns le count issus de la requête
     */
    public async select_count(): Promise<number> {
        return await ModuleContextFilter.getInstance().select_count(this);
    }

    /**
     * Objectif automatiser la définition des tables à utiliser pour la requête a minima sur les
     *  éléments qui sont explicitement demandés. Reste à ajouter manuellement les tables de liaisons
     *  qui ne sont pas des manytomany (qui sont elles ajoutées automatiquement entre les types actifs)
     * @param fields les champs dont on veut vérifier les api_type_ids
     */
    private update_active_api_type_ids_from_fields(fields: ContextQueryFieldVO[]): ContextQueryVO {

        if (!fields) {
            return this;
        }
        let api_type_ids = fields.map((f) => f.api_type_id);
        return this.using(api_type_ids);
    }

    /**
     * Objectif automatiser la définition des tables à utiliser pour la requête a minima sur les
     *  éléments qui sont explicitement demandés. Reste à ajouter manuellement les tables de liaisons
     *  qui ne sont pas des manytomany (qui sont elles ajoutées automatiquement entre les types actifs)
     * @param filters les filtres dont on veut vérifier les api_type_ids
     */
    private update_active_api_type_ids_from_filters(filters: ContextFilterVO[]): ContextQueryVO {

        if (!filters) {
            return this;
        }

        /**
         * Récursivité sur les filtres qui contiennent des filtres (pas sur les sub_querys)
         */
        for (let i in filters) {
            let filter_ = filters[i];

            if (!!filter_?.left_hook) {
                this.update_active_api_type_ids_from_filters([filter_.left_hook]);
            }
            if (!!filter_?.right_hook) {
                this.update_active_api_type_ids_from_filters([filter_.right_hook]);
            }
        }

        let api_type_ids = filters.map((f) => f.vo_type);
        return this.using(api_type_ids);
    }

    /**
     * Objectif automatiser la définition des tables à utiliser pour la requête a minima sur les
     *  éléments qui sont explicitement demandés. Reste à ajouter manuellement les tables de liaisons
     *  qui ne sont pas des manytomany (qui sont elles ajoutées automatiquement entre les types actifs)
     * @param sorts les sorts dont on veut vérifier les api_type_ids
     */
    private update_active_api_type_ids_from_sorts(sorts: SortByVO[]): ContextQueryVO {

        if (!sorts) {
            return this;
        }

        let api_type_ids = sorts.filter((f) => f && f.vo_type).map((f) => f.vo_type);
        return this.using(api_type_ids);
    }

}

/**
 * Sucre syntaxique utilisant le design pattern Proxy
 *  on initialise une Query sur le type passé en paramètre, avec les confs par défaut
 *  donc limit 0, offset 0, pas de sort_by, un active_api_type_ids qui contient le base_api_type_id
 * @param API_TYPE_ID le type de base de la query
 */
export const query = (API_TYPE_ID: string) => {
    let res = new ContextQueryVO();

    res.base_api_type_id = API_TYPE_ID;
    res.active_api_type_ids = [API_TYPE_ID];
    res.query_limit = 0;
    res.query_offset = 0;
    res.fields = null;
    res.filters = null;
    res.is_access_hook_def = false;
    res.query_tables_prefix = null;
    res.sort_by = null;
    res.use_technical_field_versioning = false;
    res.query_distinct = false;
    res.do_count_results = false;

    return res;
};
