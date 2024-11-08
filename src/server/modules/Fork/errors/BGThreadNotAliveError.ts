export default class BGThreadNotAliveError extends Error {
    public static ERROR_TYPE: string = 'BG_THREAD_NOT_ALIVE';
    public _type: string = BGThreadNotAliveError.ERROR_TYPE;

    public constructor(e: Error | string, bgthread_name: string) {
        super(BGThreadNotAliveError.ERROR_TYPE + ':bgthread_name:' + bgthread_name + ':error:' + e);
    }
}