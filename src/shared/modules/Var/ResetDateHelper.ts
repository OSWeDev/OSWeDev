import * as moment from 'moment';
import { Moment } from 'moment';

export default class ResetDateHelper {

    public static getInstance() {
        if (!ResetDateHelper.instance) {
            ResetDateHelper.instance = new ResetDateHelper();
        }

        return ResetDateHelper.instance;
    }

    private static instance: ResetDateHelper = null;

    private constructor() { }

    /**
     * Renvoie la date de reset du compteur la plus proche possible, dans le passé (<=), de la date passée en paramètre
     * @param date La date à partir de laquelle on cherche la date de reset la plus proche
     * @param inclusive True indique que si la date passée en paramètre est une date de reset, on la renvoie directement, sinon on renvoie la date précédente (dont A-1)
     * @param has_yearly_reset false indique qu'on a rien à faire ici ...
     * @param yearly_reset_day_in_month 1-31
     * @param yearly_reset_month 0-11
     */
    public getClosestPreviousResetDate(date: Moment, inclusive: boolean, has_yearly_reset: boolean, yearly_reset_day_in_month: number, yearly_reset_month: number): Moment {

        if (!has_yearly_reset) {
            return null;
        }

        // Si on a une zone de balance, on doit vérifier qu'on est après la balance et dans ce cas on accepte la date de reset.
        // Sinon, on par de la date de reset Y-1
        let date_reset: Moment = moment(date).startOf('day').utc(true);
        date_reset.month(yearly_reset_month);
        date_reset.date(yearly_reset_day_in_month);

        if ((inclusive && date_reset.isAfter(date, 'day')) || ((!inclusive) && date_reset.isSameOrAfter(date, 'day'))) {
            date_reset.add(-1, 'year');
        }
        return date_reset;
    }

    /**
     * Renvoie la date de reset du compteur la plus proche possible, dans le futur (>=), de la date passée en paramètre
     * @param date La date à partir de laquelle on cherche la date de reset la plus proche
     * @param has_yearly_reset false indique qu'on a rien à faire ici ...
     * @param yearly_reset_day_in_month 1-31
     * @param yearly_reset_month 0-11
     */
    public getClosestNextResetDate(date: Moment, has_yearly_reset: boolean, yearly_reset_day_in_month: number, yearly_reset_month: number): Moment {

        if (!has_yearly_reset) {
            return null;
        }

        let date_reset: Moment = moment(date).utc(true);
        date_reset.month(yearly_reset_month);
        date_reset.date(yearly_reset_day_in_month);

        if (date_reset.isBefore(date, 'day')) {
            date_reset.add(1, 'year');
        }
        return date_reset;
    }

    /**
     * @returns true if reset date
     * @param date La date à tester
     * @param has_yearly_reset false indique qu'on a rien à faire ici ...
     * @param yearly_reset_day_in_month 1-31
     * @param yearly_reset_month 0-11
     */
    public isResetDate(date: Moment, has_yearly_reset: boolean, yearly_reset_day_in_month: number, yearly_reset_month: number): boolean {

        if ((!has_yearly_reset) || (!date)) {
            return false;
        }

        return (date.month() == yearly_reset_month) && (date.date() == yearly_reset_day_in_month);
    }
}