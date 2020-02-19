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

    // /**
    //  * FIXME TODO ASAP VARS TU
    //  * Renvoie un TSRange qui couvre de la date de reset ou de cumul à la date cible pour une var de type matroid
    //  *  en se basant sur les params de la var pour connaitre la date de reset
    //  * @param target La date de fin de la zone à laquelle on fait référence
    //  */
    // public get_TSRange_for_compteur(var_id: number, target: Moment, cumul_name: string = null): TSRange {

    //     // On sépare le cas des vars qui utilisent les ranges
    //     let controller = VarsController.getInstance().getVarControllerById(var_id);

    //     if ((!controller) || (!controller.varConf) || (!controller.varConf.var_data_vo_type)) {
    //         return null;
    //     }

    //     let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[controller.varConf.var_data_vo_type];
    //     if (!moduletable) {
    //         return null;
    //     }

    //     if (!moduletable.isMatroidTable) {
    //         return null;
    //     }

    //     let end_date = moment(target);
    //     let start_date = null;

    //     // Très arbitraire mais on considère que si une var a un reset, on doit considérer depuis la date du dernier reset
    //     // donc on peut pas importer de date fixe pour ce type de var avec ce système mais a priori ça correspond bien à l'usage
    //     if (!!cumul_name) {

    //         switch (cumul_name) {
    //             case VarsCumulsController.CUMUL_YEAR_NAME:
    //                 start_date = moment(target).startOf("year");
    //                 break;
    //             case VarsCumulsController.CUMUL_MONTH_NAME:
    //                 start_date = moment(target).startOf("month");
    //                 break;
    //             case VarsCumulsController.CUMUL_WEEK_NAME:
    //                 start_date = moment(target).startOf("isoWeek");
    //                 break;
    //         }
    //     } else {

    //         // Cas des compteurs et autres systèmes utilisant des reset annuels (FIXME il faudrait standardiser ce comportement avec un objet fixe, là c'est un peu au pif...)
    //         if ((!!controller.varConf) && (!!controller.varConf.has_yearly_reset)) {
    //             start_date = CumulativVarController.getInstance().getClosestPreviousCompteurResetDate(
    //                 end_date, controller.varConf.has_yearly_reset, controller.varConf.yearly_reset_day_in_month, controller.varConf.yearly_reset_month);
    //         } else {
    //             start_date = moment(end_date);
    //         }
    //     }

    //     return TSRangeHandler.getInstance().createNew(start_date, end_date, true, true);
    // }
}