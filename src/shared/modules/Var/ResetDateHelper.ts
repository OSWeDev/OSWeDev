import TimeSegment from "../DataRender/vos/TimeSegment";
import Dates from "../FormatDatesNombres/Dates/Dates";



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
    public getClosestPreviousResetDate(date: number, inclusive: boolean, has_yearly_reset: boolean, yearly_reset_day_in_month: number, yearly_reset_month: number): number {

        if (!has_yearly_reset) {
            return null;
        }

        // Si on a une zone de balance, on doit vérifier qu'on est après la balance et dans ce cas on accepte la date de reset.
        // Sinon, on par de la date de reset Y-1
        let date_reset: number = Dates.startOf(date, TimeSegment.TYPE_DAY);
        date_reset = Dates.month(date_reset, yearly_reset_month);
        date_reset = Dates.date(date_reset, yearly_reset_day_in_month);

        if ((inclusive && Dates.isAfter(date_reset, date, TimeSegment.TYPE_DAY)) || ((!inclusive) && Dates.isSameOrAfter(date_reset, date, TimeSegment.TYPE_DAY))) {
            date_reset = Dates.add(date_reset, -1, TimeSegment.TYPE_YEAR);
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
    public getClosestNextResetDate(date: number, has_yearly_reset: boolean, yearly_reset_day_in_month: number, yearly_reset_month: number): number {

        if (!has_yearly_reset) {
            return null;
        }

        let date_reset: number = date;
        date_reset = Dates.month(date_reset, yearly_reset_month);
        date_reset = Dates.date(date_reset, yearly_reset_day_in_month);

        if (Dates.isBefore(date_reset, date, TimeSegment.TYPE_DAY)) {
            date_reset = Dates.add(date_reset, 1, TimeSegment.TYPE_YEAR);
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
    public isResetDate(date: number, has_yearly_reset: boolean, yearly_reset_day_in_month: number, yearly_reset_month: number): boolean {

        if ((!has_yearly_reset) || (!date)) {
            return false;
        }

        return (Dates.month(date) == yearly_reset_month) && (Dates.date(date) == yearly_reset_day_in_month);
    }
}