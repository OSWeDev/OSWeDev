export default class EvolizAPIRateLimitRequestWrapper {

    public constructor(
        public request_sender: () => Promise<any>,
        public request_resolver: (value?: any) => void | PromiseLike<void>,
        public request_rejecter: (reason?: any) => void | PromiseLike<void>
    ) { }
}