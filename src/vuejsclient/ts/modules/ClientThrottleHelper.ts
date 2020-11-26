import { Cancelable, ThrottleSettings } from 'lodash';
import throttle from 'lodash/throttle';

export default class ClientThrottleHelper {

    public static getInstance(): ClientThrottleHelper {
        if (!ClientThrottleHelper.instance) {
            ClientThrottleHelper.instance = new ClientThrottleHelper();
        }

        return ClientThrottleHelper.instance;
    }

    private static instance: ClientThrottleHelper = null;

    protected UID: number = 0;
    protected throttles: { [throttle_id: number]: ((...args: any) => any) & Cancelable } = {};
    protected throttles_mappable_args: { [throttle_id: number]: { [map_elt_id: string]: any } } = {};
    protected throttles_stackable_args: { [throttle_id: number]: any[] } = {};

    private constructor() { }

    public declare_throttle_with_mappable_args(
        func: (mappable_args: { [map_elt_id: string]: any }) => any,
        wait: number,
        options?: ThrottleSettings) {

        let UID = this.UID++;
        this.throttles[UID] = throttle(() => {

            let params = this.throttles_mappable_args[UID];
            this.throttles_mappable_args[UID] = {};
            func(params);
        }, wait, options);

        return (mappable_args: { [map_elt_id: string]: any }) => ClientThrottleHelper.getInstance().throttle_with_mappable_args(UID, mappable_args);
    }

    public declare_throttle_with_stackable_args(
        func: (stackable_args: any[]) => any,
        wait: number,
        options?: ThrottleSettings) {

        let UID = this.UID++;
        this.throttles[UID] = throttle(() => {

            let params = this.throttles_stackable_args[UID];
            this.throttles_stackable_args[UID] = [];
            func(params);
        }, wait, options);

        return (stackable_args: any[]) => {
            ClientThrottleHelper.getInstance().throttle_with_stackable_args(UID, stackable_args);
        };
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

        this.throttles[throttle_id]();
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

        this.throttles[throttle_id]();
    }
}