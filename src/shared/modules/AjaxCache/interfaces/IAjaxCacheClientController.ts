export default interface IAjaxCacheController {
    ajaxcache_debouncer: number;

    invalidateCachesFromApiTypesInvolved(api_types_involved: string[]);
}