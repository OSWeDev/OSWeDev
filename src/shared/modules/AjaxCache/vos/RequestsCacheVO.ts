import RequestResponseCacheVO from './RequestResponseCacheVO';

export default class RequestsCacheVO {
    public requestResponseCaches: { [url: string]: RequestResponseCacheVO } = {};
}