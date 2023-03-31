import { Cancelable, isArray, throttle, ThrottleSettings } from 'lodash';

export default class ThrottleHelper {

    public static getInstance(): ThrottleHelper {
        if (!ThrottleHelper.instance) {
            ThrottleHelper.instance = new ThrottleHelper();
        }

        return ThrottleHelper.instance;
    }

    private static instance: ThrottleHelper = null;

    protected UID: number = 0;
    protected throttles: { [throttle_id: number]: ((...args: any) => any) & Cancelable } = {};
    protected throttles_mappable_args: { [throttle_id: number]: { [map_elt_id: string]: any } } = {};
    protected throttles_stackable_args: { [throttle_id: number]: any[] } = {};
    protected throttles_semaphore: { [throttle_id: number]: boolean } = {};

    private constructor() { }

    public declare_throttle_without_args(
        func: () => any,
        wait_ms: number,
        options?: ThrottleSettings) {

        let UID = this.UID++;
        let self = this;
        this.throttles[UID] = throttle(() => {
            self.throttles_semaphore[UID] = false;
            func();
        }, wait_ms, options);

        return () => ThrottleHelper.getInstance().throttle_without_args(UID);
    }


    public declare_throttle_with_mappable_args(
        func: (mappable_args: { [map_elt_id: string]: any }) => any,
        wait_ms: number,
        options?: ThrottleSettings) {

        let UID = this.UID++;
        let self = this;
        this.throttles[UID] = throttle(() => {

            let params = self.throttles_mappable_args[UID];
            self.throttles_mappable_args[UID] = {};
            self.throttles_semaphore[UID] = false;
            func(params);
        }, wait_ms, options);

        return (mappable_args: { [map_elt_id: string]: any }) => ThrottleHelper.getInstance().throttle_with_mappable_args(UID, mappable_args);
    }

    public declare_throttle_with_stackable_args(
        func: (stackable_args: any[]) => any,
        wait_ms: number,
        options?: ThrottleSettings
    ) {

        let UID = this.UID++;
        this.throttles[UID] = throttle(() => {

            let params = this.throttles_stackable_args[UID];
            this.throttles_stackable_args[UID] = [];

            return func(params);

        }, wait_ms, options);

        return (stackable_args: any | any[]) => {
            let stack = stackable_args ? (isArray(stackable_args) ? stackable_args : [stackable_args]) : [];
            return ThrottleHelper.getInstance().throttle_with_stackable_args(UID, stack);
        };
    }

    private throttle_without_args(throttle_id: number) {
        if (!this.throttles[throttle_id]) {
            return;
        }

        if (!this.throttles_semaphore[throttle_id]) {
            this.throttles_semaphore[throttle_id] = true;
            this.throttles[throttle_id]();
        }
    }

    private throttle_with_mappable_args(throttle_id: number, mappable_args: { [map_elt_id: string]: any }) {
        if (!this.throttles[throttle_id]) {
            return;
        }

        if (!this.throttles_mappable_args[throttle_id]) {
            this.throttles_mappable_args[throttle_id] = mappable_args;
        } else {
            this.throttles_mappable_args[throttle_id] = Object.assign(this.throttles_mappable_args[throttle_id], mappable_args);
        }

        if (!this.throttles_semaphore[throttle_id]) {
            this.throttles_semaphore[throttle_id] = true;
            this.throttles[throttle_id]();
        }
    }

    private throttle_with_stackable_args(throttle_id: number, stackable_args: any[]) {
        if (!this.throttles[throttle_id]) {
            return;
        }

        if (!this.throttles_stackable_args[throttle_id]) {
            this.throttles_stackable_args[throttle_id] = stackable_args;
        } else {
            this.throttles_stackable_args[throttle_id] = this.throttles_stackable_args[throttle_id].concat(stackable_args);
        }

        return this.throttles[throttle_id]();
    }
}