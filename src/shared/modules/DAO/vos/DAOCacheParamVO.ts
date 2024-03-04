export default class DAOCacheParamVO {
    public constructor(
        public max_age_ms: number,
        public last_update_ms: number,
    ) { }
}