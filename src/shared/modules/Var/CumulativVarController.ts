import * as moment from 'moment';
import { Moment } from 'moment';

export default class CumulativVarController {

    public static getInstance() {
        if (!CumulativVarController.instance) {
            CumulativVarController.instance = new CumulativVarController();
        }

        return CumulativVarController.instance;
    }

    private static instance: CumulativVarController = null;

    private constructor() { }

    /**
     * FIXME TODO ASAP VARS TU
     * Renvoie la date de reset du compteur la plus proche possible, dans le passé (<=), de la date passée en paramètre
     */
    public getClosestPreviousCompteurResetDate(date: Moment, inclusive: boolean, has_yearly_reset: boolean, yearly_reset_day_in_month: number, yearly_reset_month: number): Moment {

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
     * FIXME TODO ASAP VARS TU
     * Renvoie la date de reset du compteur la plus proche possible, dans le futur (>=), de la date passée en paramètre
     */
    public getClosestNextCompteurResetDate(date: Moment, has_yearly_reset: boolean, yearly_reset_day_in_month: number, yearly_reset_month: number): Moment {

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
     * FIXME TODO ASAP VARS TU
     * @returns true if reset date
     */
    public isResetDate(date: Moment, has_yearly_reset: boolean, yearly_reset_day_in_month: number, yearly_reset_month: number): boolean {

        if ((!has_yearly_reset) || (!date)) {
            return false;
        }

        return (date.month() == yearly_reset_month) && (date.date() == yearly_reset_day_in_month);
    }
}