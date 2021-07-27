export default class CacheInvalidationRegexpRuleVO {
    public constructor(public regexp: RegExp, public max_duration: number) { }
}