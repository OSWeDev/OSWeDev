import { isArray } from "lodash";
import ParameterizedQueryWrapper from "../../../../server/modules/ContextFilter/vos/ParameterizedQueryWrapper";
import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import NumRange from "../../DataRender/vos/NumRange";
import TimeSegment from "../../DataRender/vos/TimeSegment";
import TSRange from "../../DataRender/vos/TSRange";
import VarConfVO from "../../Var/vos/VarConfVO";
import ModuleContextFilter from "../ModuleContextFilter";
import ContextFilterVO, { filter } from "./ContextFilterVO";
import ContextQueryFieldVO from "./ContextQueryFieldVO";
import SortByVO from "./SortByVO";

/**
 * Encapsuler la définition d'une requête ou d'une sous-requête (qu'on liera à la requête principale par un filtre)
 */
export default class ContextQueryVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "context_query";

    public id: number;
    public _type: string = ContextQueryVO.API_TYPE_ID;

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
     * Pas fan de cette solution : le but est d'identifier qu'on est en train de définir un accesshook
     *  pour éviter de tourner en boucle sur l'ajout de conditions where sur le base_type_id.
     *  si on identifie pas ce cas correctement on définit le access hook en renvoyer un contextquery,
     *  qui par définition va déclencher l'appel au contexte accesshook et ajouter une condition sur subquery... en boucle
     *  donc quand on définit un access_hook on met ce paramètre à true dans le contextquery pour éviter ce problème
     * @depracated il faut supprimer cette option, ou parvenir à bloquer l'usage via api. On doit pouvoir différencier une requête
     *  access_hook_def d'une classique, mais pas d'une manière qu'on puisse utiliser côté client...
     */
    public is_access_hook_def: boolean;

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

    public discard_field_path(vo_type: string, field_id: string): ContextQueryVO {
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

    public set_request_id(request_id: number): ContextQueryVO {
        this.request_id = request_id;
        return this;
    }

    /**
     * Ajouter un field attendu en résultat de la requête par le field_id, et optionnellement un alias spécifique
     *  on utilise base_api_type_id de la requete si on en fournit pas un explicitement ici
     *  Si on veut un vo complet il ne faut pas demander les fields
     * @param field_id l'id du field à ajouter.
     */
    public field(field_id: string, alias: string = field_id, api_type_id: string = null, aggregator: number = VarConfVO.NO_AGGREGATOR): ContextQueryVO {

        let field = new ContextQueryFieldVO(api_type_id ? api_type_id : this.base_api_type_id, field_id, alias, aggregator);

        if (!this.fields) {
            this.fields = [];
        }
        this.fields.push(field);
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
     * Sucre syntaxique pour une filtre numeric equals ALL
     * @param field_id le field qu'on veut filtrer
     * @param num la valeur qu'on veut filtrer
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_num_eq(field_id: string, num: number | NumRange | NumRange[] | number[], API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_num_eq(num)]);
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
     * @param ranges les valeurs qu'on veut filtrer
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_date_eq(field_id: string, date: number | TSRange | TSRange[], API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_date_eq(date)]);
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
    public filter_by_ids(id_ranges: NumRange[], API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id).by_ids(id_ranges)]);
    }

    /**
     * Filtrer par text contenu dans la valeur du champ
     * @param field_id le field qu'on veut filtrer
     * @param included le texte qu'on veut voir apparaître dans la valeur du champs
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_text_including(field_id: string, included: string | string[], API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_text_including(included)]);
    }

    /**
     * Filtrer par text égal ANY
     * @param field_id le field qu'on veut filtrer
     * @param text le texte que l'on doit retrouver à l'identique en base
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_text_has(field_id: string, text: string | string[], API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_text_has(text)]);
    }

    /**
     * Filtrer par text strictement égal
     * @param field_id le field qu'on veut filtrer
     * @param text le texte que l'on doit retrouver à l'identique en base
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_text_eq(field_id: string, text: string | string[], API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_text_eq(text)]);
    }

    /**
     * Filtrer par text en début de la valeur du champ
     * @param field_id le field qu'on veut filtrer
     * @param included le texte qu'on veut voir apparaître au début de la valeur du champs
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_text_starting_with(field_id: string, starts_with: string | string[], API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_text_starting_with(starts_with)]);
    }

    /**
     * Filtrer en fonction d'un sub en not exists
     * @param query la sous requête qui doit renvoyer aucune ligne pour être valide
     */
    public filter_by_not_exists(query_: ContextQueryVO): ContextQueryVO {
        return this.add_filters([filter().by_not_exists(query_)]);
    }

    /**
     * Filter by ID not in (subquery)
     * @param query la sous requête qui doit renvoyer les ids comme unique field
     */
    public filter_by_id_not_in(query_: ContextQueryVO, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id).by_id_not_in(query_)]);
    }

    /**
     * Filtrer un champ number par un sous-requête : field not in (subquery)
     * @param query la sous requête qui doit renvoyer les nums acceptés en un unique field
     */
    public filter_by_num_not_in(field_id: string, query_: ContextQueryVO, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_num_not_in(query_)]);
    }

    /**
     * Filter by ID in (subquery)
     * @param query la sous requête qui doit renvoyer les ids comme unique field
     */
    public filter_by_id_in(query_: ContextQueryVO, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id).by_id_in(query_)]);
    }

    /**
     * Filtrer un champ number par un sous-requête : field in (subquery)
     * @param query la sous requête qui doit renvoyer les nums acceptés en un unique field
     */
    public filter_by_num_in(field_id: string, query_: ContextQueryVO, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([filter(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id).by_num_in(query_)]);
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
        } else {
            this.sort_by = [sort];
        }

        return this;
    }

    /**
     * Fixer la fonction de sort
     * @param sorts
     */
    public set_sorts(sorts: SortByVO[]): ContextQueryVO {

        this.sort_by = sorts;

        return this;
    }

    /**
     * Ignorer les context access hooks => à utiliser si l'on est en train de déclarer un context access hook pour
     *  éviter une récursivité du hook
     * @depracated il faut supprimer cette option, ou parvenir à bloquer l'usage via api. On doit pouvoir différencier une requête
     *  access_hook_def d'une classique, mais pas d'une manière qu'on puisse utiliser côté client...
     */
    public ignore_access_hooks(): ContextQueryVO {

        this.is_access_hook_def = true;

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
        this.fields = null;
        return await ModuleContextFilter.getInstance().select_vos(this);
    }

    /**
     * Faire la requête en mode select_vo
     *  Si on avait défini des fields on les supprime puisqu'ils deviennent invalides
     * @returns le vo issu de la requête => Throws si on a + de 1 résultat
     */
    public async select_vo<T extends IDistantVOBase>(): Promise<T> {
        this.fields = null;
        let res: T[] = await ModuleContextFilter.getInstance().select_vos(this);
        console.log(res);
        if (res && (res.length > 1)) {
            throw new Error('Multiple results on select_vo is not allowed');
        }
        return res ? res[0] : null;
    }

    /**
     * Faire la requête simplement et récupérer le résultat brut
     */
    public async select_all(): Promise<any[]> {
        return await ModuleContextFilter.getInstance().select(this);
    }

    /**
     * Faire la requête simplement et récupérer le résultat brut
     */
    public async select_one(): Promise<any> {
        let res = await ModuleContextFilter.getInstance().select(this);
        if (res && (res.length > 1)) {
            throw new Error('Multiple results on select_one is not allowed');
        }
        return res ? res[0] : null;
    }

    /**
     * Faire la requête en mode select_datatable_rows mais ligne unique
     * @returns la ligne de datatable issue de la requête
     */
    public async select_datatable_row(): Promise<any> {
        let res = await ModuleContextFilter.getInstance().select_datatable_rows(this);
        if (res && (res.length > 1)) {
            throw new Error('Multiple results on select_datatable_row is not allowed');
        }
        return res ? res[0] : null;
    }

    /**
     * Faire la requête en mode select_datatable_rows
     * @returns les lignes de datatable issues de la requête
     */
    public async select_datatable_rows(): Promise<any[]> {
        return await ModuleContextFilter.getInstance().select_datatable_rows(this);
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

            if (!!filter_.left_hook) {
                this.update_active_api_type_ids_from_filters([filter_.left_hook]);
            }
            if (!!filter_.right_hook) {
                this.update_active_api_type_ids_from_filters([filter_.right_hook]);
            }
        }

        let api_type_ids = filters.map((f) => f.vo_type);
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
    return res;
};
