import { isArray } from "lodash";
import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import NumRange from "../../DataRender/vos/NumRange";
import ContextFilterVO from "./ContextFilterVO";
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
     */
    public limit: number;

    /**
     * Pour décaler le curseur dans le cas d'un select
     *  0 => on renvoie dès le premier résultat
     *  10 => on renvoie à partir du 11ème résultat (on ignore les 10 premiers)
     * Pas d'offset sans limit (cf postgresql LIMIT)
     */
    public offset: number;

    /**
     * Pour ajouter un ordre à la requête : null pour garder l'ordre par défaut
     */
    public sort_by: SortByVO;

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
     */
    public is_access_hook_def: boolean;

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
     * Ajouter un field attendu en résultat de la requête par le field_id, et optionnellement un alias spécifique
     *  on utilise base_api_type_id de la requete si on en fournit pas un explicitement ici
     *  Si on veut un vo complet il ne faut pas demander les fields
     * @param field_id l'id du field à ajouter.
     */
    public field(field_id: string, alias: string = field_id, api_type_id: string = null): ContextQueryVO {

        let field = new ContextQueryFieldVO(api_type_id ? api_type_id : this.base_api_type_id, field_id, alias);

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
     * Sucre syntaxique pour une filtre numeric equals sans ranges
     * @param field_id le field qu'on veut filtrer
     * @param num la valeur qu'on veut filtrer
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_num_eq(field_id: string, num: number, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([ContextFilterVO.num_eq(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id, num)]);
    }

    /**
     * Sucre syntaxique pour une filtre numeric intersects ranges
     * @param field_id le field qu'on veut filtrer
     * @param ranges les valeurs qu'on veut filtrer
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_num_x_ranges(field_id: string, ranges: NumRange[], API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([ContextFilterVO.num_x_ranges(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, field_id, ranges)]);
    }

    /**
     * Filter sur le champs id, avec un id numérique simple
     * @param id la valeur de l'id qu'on veut filtrer
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_id(id: number, API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([ContextFilterVO.by_id(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, id)]);
    }

    /**
     * Filter sur le champs id, avec un numranges à intersecter
     * @param id_ranges les ids qu'on filtre
     * @param API_TYPE_ID Optionnel. Le type sur lequel on veut filtrer. Par défaut base_api_type_id
     */
    public filter_by_ids(id_ranges: NumRange[], API_TYPE_ID: string = null): ContextQueryVO {
        return this.add_filters([ContextFilterVO.by_ids(API_TYPE_ID ? API_TYPE_ID : this.base_api_type_id, id_ranges)]);
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
        this.limit = limit;
        this.offset = offset;

        return this;
    }

    /**
     * Fixer la fonction de sort
     * @param sort
     */
    public set_sort(sort: SortByVO): ContextQueryVO {

        this.sort_by = sort;

        return this;
    }

    /**
     * Ignorer les context access hooks => à utiliser si l'on est en train de déclarer un context access hook pour
     *  éviter une récursivité du hook
     */
    public ignore_access_hooks(): ContextQueryVO {

        this.is_access_hook_def = true;

        return this;
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
            let filter = filters[i];

            if (!!filter.left_hook) {
                this.update_active_api_type_ids_from_filters([filter.left_hook]);
            }
            if (!!filter.right_hook) {
                this.update_active_api_type_ids_from_filters([filter.right_hook]);
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
    res.limit = 0;
    res.offset = 0;
    res.fields = null;
    res.filters = null;
    res.is_access_hook_def = false;
    res.query_tables_prefix = null;
    res.sort_by = null;
    return res;
};
