export default interface IAjaxCacheController {
    invalidateCachesFromApiTypesInvolved(api_types_involved: string[]);
}