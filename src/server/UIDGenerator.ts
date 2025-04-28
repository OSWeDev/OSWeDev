import { isMainThread, threadId } from "worker_threads";
import Dates from "../shared/modules/FormatDatesNombres/Dates/Dates";

/**
 * Global UID generator
 * - This class is used to generate unique identifiers (UIDs) for various purposes. It should be unique across all instances.
 * The date is threre to ensur we don't have time to run twice the app in 1 ms
 * The UID_inc is there to ensure we get a UID on each call, on a given thread
 * The threadId/main info is there to ensure we separate the UIDs between threads
 */
export default class UIDGenerator {

    private static UID_inc: number = 1;

    public static get_new_uid(): string {
        const base_date = Math.round(Dates.now_ms()).toString();
        const UID_suffix = '__' + base_date + '__' + (UIDGenerator.UID_inc++);
        if (isMainThread) {
            return 'main' + UID_suffix;
        } else {
            return threadId + UID_suffix;
        }
    }
}