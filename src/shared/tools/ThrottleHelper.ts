import { Cancelable, isArray, throttle, ThrottleSettings } from 'lodash';

export default class ThrottleHelper {

    public static declare_throttle_without_args(
        func: () => void | Promise<void>,
        wait_ms: number,
        options?: ThrottleSettings) {

        let UID = ThrottleHelper.UID++;
        ThrottleHelper.throttles[UID] = throttle(async () => {
            ThrottleHelper.throttles_semaphore[UID] = false;
            await func();
        }, wait_ms, options);

        return () => ThrottleHelper.throttle_without_args(UID);
    }


    public static declare_throttle_with_mappable_args(
        func: (mappable_args: { [map_elt_id: string]: any }) => void | Promise<void>,
        wait_ms: number,
        options?: ThrottleSettings) {

        let UID = ThrottleHelper.UID++;
        ThrottleHelper.throttles[UID] = throttle(async () => {

            let params = ThrottleHelper.throttles_mappable_args[UID];
            ThrottleHelper.throttles_mappable_args[UID] = {};
            ThrottleHelper.throttles_semaphore[UID] = false;
            await func(params);
        }, wait_ms, options);

        return (mappable_args: { [map_elt_id: string]: any }) => ThrottleHelper.throttle_with_mappable_args(UID, mappable_args);
    }

    public static declare_throttle_with_stackable_args(
        func: (stackable_args: any[]) => void | Promise<void>,
        wait_ms: number,
        options?: ThrottleSettings
    ) {

        let UID = ThrottleHelper.UID++;
        ThrottleHelper.throttles[UID] = throttle(async () => {

            let params = ThrottleHelper.throttles_stackable_args[UID];
            ThrottleHelper.throttles_stackable_args[UID] = [];

            await func(params);
        }, wait_ms, options);

        return (stackable_args?: any | any[]) => {
            let stack = stackable_args ? (isArray(stackable_args) ? stackable_args : [stackable_args]) : [];
            return ThrottleHelper.throttle_with_stackable_args(UID, stack);
        };
    }

    protected static UID: number = 0;
    protected static throttles: { [throttle_id: number]: ((...args: any) => any) & Cancelable } = {};
    protected static throttles_mappable_args: { [throttle_id: number]: { [map_elt_id: string]: any } } = {};
    protected static throttles_stackable_args: { [throttle_id: number]: any[] } = {};
    protected static throttles_semaphore: { [throttle_id: number]: boolean } = {};

    private static throttle_without_args(throttle_id: number) {
        if (!ThrottleHelper.throttles[throttle_id]) {
            return;
        }

        if (!ThrottleHelper.throttles_semaphore[throttle_id]) {
            ThrottleHelper.throttles_semaphore[throttle_id] = true;
            ThrottleHelper.throttles[throttle_id]();
        }
    }

    private static throttle_with_mappable_args(throttle_id: number, mappable_args: { [map_elt_id: string]: any }) {
        if (!ThrottleHelper.throttles[throttle_id]) {
            return;
        }

        if (!ThrottleHelper.throttles_mappable_args[throttle_id]) {
            ThrottleHelper.throttles_mappable_args[throttle_id] = mappable_args;
        } else {
            ThrottleHelper.throttles_mappable_args[throttle_id] = Object.assign(ThrottleHelper.throttles_mappable_args[throttle_id], mappable_args);
        }

        if (!ThrottleHelper.throttles_semaphore[throttle_id]) {
            ThrottleHelper.throttles_semaphore[throttle_id] = true;
            ThrottleHelper.throttles[throttle_id]();
        }
    }

    private static throttle_with_stackable_args(throttle_id: number, stackable_args: any[]) {
        if (!ThrottleHelper.throttles[throttle_id]) {
            return;
        }

        if (!ThrottleHelper.throttles_stackable_args[throttle_id]) {
            ThrottleHelper.throttles_stackable_args[throttle_id] = stackable_args;
        } else {
            ThrottleHelper.throttles_stackable_args[throttle_id] = ThrottleHelper.throttles_stackable_args[throttle_id].concat(stackable_args);
        }

        return ThrottleHelper.throttles[throttle_id]();
    }
}