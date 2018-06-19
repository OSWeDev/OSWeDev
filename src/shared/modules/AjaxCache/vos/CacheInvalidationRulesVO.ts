import CacheInvalidationRegexpRuleVO from './CacheInvalidationRegexpRuleVO';

export default class CacheInvalidationRulesVO {

    // On met en place cette option pour les requêtes très complexes qu'on veut supprimer à terme
    public static ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED: string[] = null;

    public regexpRules: { [regexp_source: string]: CacheInvalidationRegexpRuleVO } = {};
}