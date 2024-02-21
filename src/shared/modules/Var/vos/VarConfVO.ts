import INamedVO from '../../../interfaces/INamedVO';
import VarConfAutoDepVO from './VarConfAutoDepVO';
import VarConfAutoParamFieldVO from './VarConfAutoParamFieldVO';
import VarPixelFieldConfVO from './VarPixelFieldConfVO';

export default class VarConfVO implements INamedVO {

    /**
     * Les différents types d'opérateurs automatiques :
     *  - unitaires, binaires et ternaires
     */
    public static AUTO_OPERATEUR_UNITAIRE_VOFIELDREF: number = 0;
    public static AUTO_OPERATEUR_UNITAIRE_MOINS: number = 1;
    public static AUTO_OPERATEUR_UNITAIRE_NOT: number = 2;
    public static AUTO_OPERATEUR_UNITAIRE_ABS: number = 3;
    public static AUTO_OPERATEUR_UNITAIRE_ISNULL: number = 4;
    public static AUTO_OPERATEUR_UNITAIRE_ISNOTNULL: number = 5;
    public static AUTO_OPERATEUR_UNITAIRE_FACTORIELLE: number = 6;
    public static AUTO_OPERATEUR_UNITAIRE_LN: number = 7;
    public static AUTO_OPERATEUR_UNITAIRE_RACINE: number = 8;

    public static AUTO_OPERATEUR_UNITAIRE_ANNEE: number = 9;
    /**
     * De 1 à 12
     */
    public static AUTO_OPERATEUR_UNITAIRE_MOIS: number = 10;
    /**
     * Du 1er du mois au 28/31
     */
    public static AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS: number = 11;
    /**
     * De 1 lundi à 7 dimanche (isweekdays)
     */
    public static AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE: number = 12;
    /**
     * De 0 à 23
     */
    public static AUTO_OPERATEUR_UNITAIRE_HEURE: number = 13;
    /**
     * De 0 à 60
     */
    public static AUTO_OPERATEUR_UNITAIRE_MINUTE: number = 14;
    /**
     * De 0 à 60
     */
    public static AUTO_OPERATEUR_UNITAIRE_SECONDE: number = 15;

    public static AUTO_OPERATEUR_UNITAIRE_EN_ANNEES: number = 16;
    public static AUTO_OPERATEUR_UNITAIRE_EN_MOIS: number = 17;
    public static AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES: number = 18;
    public static AUTO_OPERATEUR_UNITAIRE_EN_JOURS: number = 19;
    public static AUTO_OPERATEUR_UNITAIRE_EN_HEURES: number = 20;
    public static AUTO_OPERATEUR_UNITAIRE_EN_MINUTES: number = 21;
    public static AUTO_OPERATEUR_UNITAIRE_EN_SECONDES: number = 22;

    public static AUTO_OPERATEUR_BINAIRE_PLUS: number = 23;
    public static AUTO_OPERATEUR_BINAIRE_MOINS: number = 24;
    public static AUTO_OPERATEUR_BINAIRE_MULT: number = 25;
    public static AUTO_OPERATEUR_BINAIRE_DIV: number = 26;
    public static AUTO_OPERATEUR_BINAIRE_MODULO: number = 27;
    public static AUTO_OPERATEUR_BINAIRE_MAX: number = 28;
    public static AUTO_OPERATEUR_BINAIRE_MIN: number = 29;
    public static AUTO_OPERATEUR_BINAIRE_EGAL: number = 30;
    public static AUTO_OPERATEUR_BINAIRE_INF: number = 31;
    public static AUTO_OPERATEUR_BINAIRE_SUP: number = 32;
    public static AUTO_OPERATEUR_BINAIRE_INFEGAL: number = 33;
    public static AUTO_OPERATEUR_BINAIRE_SUPEGAL: number = 34;
    public static AUTO_OPERATEUR_BINAIRE_DIFFERENT: number = 35;
    public static AUTO_OPERATEUR_BINAIRE_ET: number = 36;
    public static AUTO_OPERATEUR_BINAIRE_OU: number = 37;
    public static AUTO_OPERATEUR_BINAIRE_XOR: number = 38;
    public static AUTO_OPERATEUR_BINAIRE_ROUND: number = 39;
    public static AUTO_OPERATEUR_BINAIRE_CEIL: number = 40;
    public static AUTO_OPERATEUR_BINAIRE_FLOOR: number = 41;
    public static AUTO_OPERATEUR_BINAIRE_EXP: number = 42;
    public static AUTO_OPERATEUR_BINAIRE_LOG: number = 43;

    public static AUTO_OPERATEUR_BINAIRE_STARTOF: number = 44;

    public static AUTO_OPERATEUR_TERNAIRE_SI: number = 45;
    public static AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE: number = 46;

    public static AUTO_OPERATEUR_LABELS: { [id: number]: string } = {
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF]: 'var_conf.auto_operateur.unitaire_vofieldref',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOINS]: 'var_conf.auto_operateur.unitaire_moins',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_NOT]: 'var_conf.auto_operateur.unitaire_not',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_ABS]: 'var_conf.auto_operateur.unitaire_abs',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNULL]: 'var_conf.auto_operateur.unitaire_isnull',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL]: 'var_conf.auto_operateur.unitaire_isnotnull',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_FACTORIELLE]: 'var_conf.auto_operateur.unitaire_factorielle',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_LN]: 'var_conf.auto_operateur.unitaire_ln',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_RACINE]: 'var_conf.auto_operateur.unitaire_racine',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE]: 'var_conf.auto_operateur.unitaire_annee',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS]: 'var_conf.auto_operateur.unitaire_mois',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS]: 'var_conf.auto_operateur.unitaire_jour_du_mois',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE]: 'var_conf.auto_operateur.unitaire_jour_de_la_semaine',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE]: 'var_conf.auto_operateur.unitaire_heure',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE]: 'var_conf.auto_operateur.unitaire_minute',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE]: 'var_conf.auto_operateur.unitaire_seconde',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES]: 'var_conf.auto_operateur.unitaire_en_annees',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS]: 'var_conf.auto_operateur.unitaire_en_mois',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES]: 'var_conf.auto_operateur.unitaire_en_semaines',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS]: 'var_conf.auto_operateur.unitaire_en_jours',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES]: 'var_conf.auto_operateur.unitaire_en_heures',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES]: 'var_conf.auto_operateur.unitaire_en_minutes',
        [VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES]: 'var_conf.auto_operateur.unitaire_en_secondes',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS]: 'var_conf.auto_operateur.binaire_plus',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS]: 'var_conf.auto_operateur.binaire_moins',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT]: 'var_conf.auto_operateur.binaire_mult',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV]: 'var_conf.auto_operateur.binaire_div',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO]: 'var_conf.auto_operateur.binaire_modulo',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX]: 'var_conf.auto_operateur.binaire_max',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN]: 'var_conf.auto_operateur.binaire_min',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL]: 'var_conf.auto_operateur.binaire_egal',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_INF]: 'var_conf.auto_operateur.binaire_inf',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP]: 'var_conf.auto_operateur.binaire_sup',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL]: 'var_conf.auto_operateur.binaire_infegal',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL]: 'var_conf.auto_operateur.binaire_supegal',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT]: 'var_conf.auto_operateur.binaire_different',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_ET]: 'var_conf.auto_operateur.binaire_et',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_OU]: 'var_conf.auto_operateur.binaire_ou',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR]: 'var_conf.auto_operateur.binaire_xor',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND]: 'var_conf.auto_operateur.binaire_round',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL]: 'var_conf.auto_operateur.binaire_ceil',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR]: 'var_conf.auto_operateur.binaire_floor',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP]: 'var_conf.auto_operateur.binaire_exp',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG]: 'var_conf.auto_operateur.binaire_log',
        [VarConfVO.AUTO_OPERATEUR_BINAIRE_STARTOF]: 'var_conf.auto_operateur.bianire_startof',
        [VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI]: 'var_conf.auto_operateur.ternaire_si',
        [VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE]: 'var_conf.auto_operateur.ternaire_ajout_duree',
    };


    public static NO_AGGREGATOR: number = 0;
    public static SUM_AGGREGATOR: number = 1;
    public static TIMES_AGGREGATOR: number = 2;
    public static MAX_AGGREGATOR: number = 3;
    public static MIN_AGGREGATOR: number = 4;
    public static AND_AGGREGATOR: number = 5;
    public static OR_AGGREGATOR: number = 6;
    public static XOR_AGGREGATOR: number = 7;
    public static ARRAY_AGG_AGGREGATOR: number = 8;
    public static IS_NULLABLE_AGGREGATOR: number = 9;
    public static COUNT_AGGREGATOR: number = 10;
    public static ARRAY_AGG_AND_IS_NULLABLE_AGGREGATOR: number = 11;
    public static ARRAY_AGG_AGGREGATOR_DISTINCT: number = 12; // ARRAY AGRÉGATOR DISTINCT qui permet d'aggréger et de ne pas avoir de doublons
    public static ARRAY_AGG_AND_IS_NULLABLE_AGGREGATOR_DISTINCT: number = 13;
    public static AVG_AGGREGATOR: number = 14; // Moyenne : Attention il s'agit d'un aggrégateur non symétrique, on ne peut pas aggréger des sous ensembles, l'aggrégat doit être fait sur l'ensemble des données

    public static AGGREGATOR_LABELS: { [id: number]: string } = {
        [VarConfVO.NO_AGGREGATOR]: 'var_conf.aggregator.no',
        [VarConfVO.SUM_AGGREGATOR]: 'var_conf.aggregator.sum',
        [VarConfVO.TIMES_AGGREGATOR]: 'var_conf.aggregator.times',
        [VarConfVO.MAX_AGGREGATOR]: 'var_conf.aggregator.max',
        [VarConfVO.MIN_AGGREGATOR]: 'var_conf.aggregator.min',
        [VarConfVO.AND_AGGREGATOR]: 'var_conf.aggregator.and',
        [VarConfVO.OR_AGGREGATOR]: 'var_conf.aggregator.or',
        [VarConfVO.XOR_AGGREGATOR]: 'var_conf.aggregator.xor',
        [VarConfVO.ARRAY_AGG_AGGREGATOR]: 'var_conf.aggregator.array_agg',
        [VarConfVO.IS_NULLABLE_AGGREGATOR]: 'var_conf.aggregator.is_nullable',
        [VarConfVO.COUNT_AGGREGATOR]: 'var_conf.aggregator.count_agg',
        [VarConfVO.ARRAY_AGG_AND_IS_NULLABLE_AGGREGATOR]: 'var_conf.aggregator.array_agg_and_is_nullable',
        [VarConfVO.ARRAY_AGG_AGGREGATOR_DISTINCT]: 'var_conf.aggregator.array_agg_distinct',
        [VarConfVO.ARRAY_AGG_AND_IS_NULLABLE_AGGREGATOR_DISTINCT]: 'var_conf.aggregator.array_agg_and_is_nullable_distinct',
        [VarConfVO.AVG_AGGREGATOR]: 'var_conf.aggregator.avg',
    };

    public static API_TYPE_ID: string = "var_conf";

    public id: number;
    public _type: string = VarConfVO.API_TYPE_ID;

    /**
     * Indique si la var utilise la factory ou une déclaration manuelle en TypeScript de la var
     */
    public is_auto: boolean;

    /**
     * L'opérateur auto utilisé
     */
    public auto_operator: number;

    /**
     * Configuration des deps automatiques, dans l'ordre des params de l'opérateur
     */
    public auto_deps: VarConfAutoDepVO[];

    /**
     * En cas d'opérateur de type vofieldref, contient la référence du champs ciblé
     */
    public auto_vofieldref_api_type_id: string;
    public auto_vofieldref_field_id: string;
    public auto_vofieldref_modifier: number;

    /**
     * Les champs de paramétrage de la var
     *  Si le type est un num => numranges
     *  Si le type est une date => tsranges
     */
    public auto_param_fields: VarConfAutoParamFieldVO[];

    /**
     * La description des types pris en compte pour la génération des requêtes et des liens à ignorer
     */
    public auto_param_context_api_type_ids: string[];
    public auto_param_context_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };
    public auto_param_context_use_technical_field_versioning: boolean;

    /**
     * Hide/Show tooltip to explain var to public users (via '?' button)
     */
    public show_help_tooltip: boolean;

    /**
     * Disable computation of this var, denies any computation
     */
    public disable_var: boolean;

    /**
     * On déclare l'agreggation à ce niveau, de manière à pouvoir l'utiliser dans les requêtes
     *  defaults to MainAggregateOperatorsHandlers.SUM_AGGREGATOR
     */
    public aggregator: number;

    /**
     * Possibilité de pixelliser sur une champs (de type id numranges a priori), typiquement un champs de segmentation de la donnée, ce qui permet
     *  de forcer que les calculs se fassent par segment, et on stocke donc le cache par segment. Les autres champs eux sont statiques.
     * Pour les recherches en base, on cherchera ranges 'contenu' sur le segment, et 'strictement égal' sur les autres champs. En gros
     *  on est en train de dire que le calcul a un cout à peu près linéraire suivant le nombre de segments, mais globalement fixe sur les autres dimensions.
     *  Exemple si le segment est la boutique, si on faire sum(CA) sur 10 boutiques, on join 10 tables en fait, et on fait en gros 10 requetes. Par contre si on
     *  fait la sum(CA) sur 1 boutique, et 10 mois, on a 1 requete sur la boutique, juste les dates changent, l'impact en terme de perf est très différent.
     * Quand on va chercher un cache sur x segments, on cherche le count et l'aggrégat en même temps (sum par exemple) et si le count correspond au x
     *  on a dans l'aggrégat la valeur issue du cache et le calcul est terminé. Sinon on demande la liste des id liés au segment, et en fonction on
     *  pixellise en découpant sur le segment les ids qui ne sont pas en cache, et on gère les nouveaux noeuds normalement. On fait un noeud qui regroupe les
     *  ids déjà traités dont la valeur est celle qu'on a déjà chargée avant.
     */
    public pixel_activated: boolean;

    /**
     * Les champs de pixellisation
     */
    public pixel_fields: VarPixelFieldConfVO[];

    /**
     * Lié à la logique de pixellisation, on force le stockage permanent des pixels en mémoire, on invalide mais on supprime plus ces pixels
     */
    public pixel_never_delete: boolean;

    /**
     * Ce paramètre permet d'indiquer qu'on doit mettre en cache uniquement les vars subs client ou server, et pas leurs deps
     *  (sauf à ce qu'elles soient également subs client ou server). Ne s'applique pas aux pixels qui sont toujours sauvegardés
     * @default true
     */
    public cache_only_exact_sub: boolean;

    /**
     * OPTIMISATION qui permet d'éviter complètement les questions de résolution des imports
     *  Par défaut on considère qu'on a aucun import sur les variables, et si jamais on doit en avoir on active cette option explicitement
     *  dans le constructeur de la Var
     */
    public optimization__has_no_imports: boolean;

    /**
     * OPTIMISATION qui indique qu'une var ne peut avoir que des imports indépendants, et donc sur lesquels il est inutile
     *  de vérifier lors du chargement des imports qu'ils ne s'intersectent pas (par définition ils n'intersectent pas, donc on prend tous les imports)
     */
    public optimization__has_only_atomic_imports: boolean;

    /**
     * @param id Pour les tests unitaires en priorité, on a juste à set l'id pour éviter de chercher en bdd
     */
    public constructor(
        public name: string,
        public var_data_vo_type: string,
        public segment_types: { [matroid_field_id: string]: number } = null,
        id: number = null) {

        if (id) {
            this.id = id;
        }

        this.pixel_never_delete = false;
        this.pixel_activated = false;
        this.cache_only_exact_sub = true;
        this.optimization__has_no_imports = true;
        this.optimization__has_only_atomic_imports = false;
    }

    /* istanbul ignore next : nothing to test */
    public disable_optimization__has_no_imports(): VarConfVO {
        this.optimization__has_no_imports = false;
        return this;
    }

    /* istanbul ignore next : nothing to test */
    public enable_optimization__has_only_atomic_imports(): VarConfVO {
        this.optimization__has_only_atomic_imports = true;
        return this;
    }

    /* istanbul ignore next : nothing to test */
    public set_pixel_activated(pixel_activated: boolean): VarConfVO {
        this.pixel_activated = pixel_activated;
        return this;
    }

    /* istanbul ignore next : nothing to test */
    public set_pixel_fields(pixel_fields: VarPixelFieldConfVO[]): VarConfVO {
        this.pixel_fields = pixel_fields;
        return this;
    }

    /* istanbul ignore next : nothing to test */
    public set_pixel_never_delete(pixel_never_delete: boolean): VarConfVO {
        this.pixel_never_delete = pixel_never_delete;
        return this;
    }

    /* istanbul ignore next : nothing to test */
    public set_aggregator(aggregator: number): VarConfVO {
        this.aggregator = aggregator;
        return this;
    }
}