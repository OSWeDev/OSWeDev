import Dates from "../FormatDatesNombres/Dates/Dates";
import ISessionObject from "./interfaces/ISessionObject";

export default class ExpressSessionController {

    // istanbul ignore next: nothing to test
    public static getInstance(): ExpressSessionController {
        if (!ExpressSessionController.instance) {
            ExpressSessionController.instance = new ExpressSessionController();
        }
        return ExpressSessionController.instance;
    }

    /**
     * @author node-connect-pg-simple
     * Figure out when a session should expire
     *
     * @param {SessionObject} sess – the session object to store
     * @returns {number} the unix timestamp, in seconds
     */
    public static getExpireTime(sess: ISessionObject, ttl: number = null): number {
        let expire;

        if (sess && sess.cookie && sess.cookie['expires']) {
            const expireDate = new Date(sess.cookie['expires']);
            expire = Math.ceil(expireDate.valueOf() / 1000);
        } else {
            expire = Math.ceil(Dates.now() + (ttl || 86400));
        }

        return expire;
    }


    private static instance: ExpressSessionController = null;

    private constructor() { }
}