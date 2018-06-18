import * as moment from 'moment';
import { Moment } from 'moment';
import MonthEventVO from '../modules/MonthEvents/vos/MonthEventVO';
import ModuleMonthEvents from '../modules/MonthEvents/ModuleMonthEvents';
import ModuleHolidayController from '../modules/HolidayController/ModuleHolidayController';
import StoreHolidayVO from '../modules/HolidayController/vos/StoreHolidayVO';
import HolidayVO from '../modules/HolidayController/vos/HolidayVO';
import ModuleGestionDesDimanches from '../modules/GestionDesDimanches/ModuleGestionDesDimanches';
import GestionDesDimanchesVO from '../modules/GestionDesDimanches/vos/GestionDesDimanchesVO';
import ModuleConvention from '../modules/Convention/ModuleConvention';
import ConventionStoreContractTypeVO from '../modules/Convention/vos/ConventionStoreContractTypeVO';
import ModuleMoulinetteCalculsProductivite from '../modules/MoulinetteCalculsProductivite/ModuleMoulinetteCalculsProductivite';
import ModuleGestionDesHorairesBoutique from '../modules/GestionDesHorairesBoutique/ModuleGestionDesHorairesBoutique';
import GestionDesHorairesBoutiqueVO from '../modules/GestionDesHorairesBoutique/vos/GestionDesHorairesBoutiqueVO';

export default class DateHandler {
    public static DAY_FOR_INDEX_FORMAT: string = 'YYYY-MM-DD';
    public static DateTime_FOR_BDD_FORMAT: string = 'YYYY-MM-DD HH:mm:ss';

    public static getInstance(): DateHandler {
        if (!DateHandler.instance) {
            DateHandler.instance = new DateHandler();
        }
        return DateHandler.instance;
    }

    private static instance: DateHandler = null;

    private constructor() {
    }

    public formatDateTimeForBDD(date: Moment): string {
        return date.format(DateHandler.DateTime_FOR_BDD_FORMAT);
    }

    public humanizeDurationTo(date: Moment): string {
        if (!date) {
            return "";
        }
        return moment.duration(date.diff(moment())).humanize();
    }

    public formatDayForIndex(date: Moment): string {
        return date.format(DateHandler.DAY_FOR_INDEX_FORMAT);
    }

    public formatDayForVO(date: Moment): string {
        return date.format('YYYY-MM-DD');
    }

    public formatDayForApi(date: Moment): string {
        return date.format('YYYY-MM-DD');
    }

    public getDateFromApiDay(day: string): Moment {
        return moment(day);
    }

    public formatDayForSQL(date: Moment): string {
        return date.format('YYYY-MM-DD');
    }

    public getDateFromSQLDay(day: string): Moment {
        return moment(day);
    }

    public async getNombreJourTravailleesAnneeParMois(storeId: number, year: Moment): Promise<{ [month: number]: number }> {
        let nb_jour_ouvre_annee_par_mois: { [month: number]: number } = {};
        let end_year: Moment = moment(this.formatDayForApi(year.endOf('year')));
        let start_year: Moment = moment(this.formatDayForApi(year.startOf('year')));
        let contract_type: ConventionStoreContractTypeVO = ModuleConvention.getInstance().get_convention_store_contract_type_by_store_id(
            storeId,
            ModuleMoulinetteCalculsProductivite.getInstance().getParamValue(ModuleMoulinetteCalculsProductivite.PARAM_NAME_contract_type_id_used_for_loading_default_convention)
        );
        let jours_ouvres: number[] = [];

        if (contract_type) {
            for (let i = 1; i <= contract_type.jours_travailles_semaine; i++) {
                jours_ouvres.push(i);
            }
        }

        while (start_year.isSameOrBefore(end_year)) {
            let month = start_year.month();

            // On vérifit que c'est dans les jours d'ouverture de la boutique
            if (jours_ouvres.indexOf(start_year.isoWeekday()) == -1) {
                start_year.add(1, 'day');
                continue;
            }

            if (!nb_jour_ouvre_annee_par_mois[month]) {
                nb_jour_ouvre_annee_par_mois[month] = 0;
            }

            nb_jour_ouvre_annee_par_mois[month]++;
            start_year.add(1, 'day');
        }

        return nb_jour_ouvre_annee_par_mois;
    }

    public async getNombreJourOuvertsAnneeParMois(storeId: number, year: Moment): Promise<{ [month: number]: number }> {
        let nb_jour_ouvre_annee_par_mois: { [month: number]: number } = {};
        let end_year: Moment = moment(this.formatDayForApi(year.endOf('year')));
        let start_year: Moment = moment(this.formatDayForApi(year.startOf('year')));
        let jours_ouvres: number[] = [];
        let jours_feries: { [date: string]: { store_holiday: StoreHolidayVO, holiday: HolidayVO } } = await ModuleHolidayController.getInstance().getHolidayOfStoreWithDate(storeId);
        let dimanches_travailles: GestionDesDimanchesVO[] = await ModuleGestionDesDimanches.getInstance().getGestionDesDimanches(storeId);
        let horaires_boutique: GestionDesHorairesBoutiqueVO[] = await ModuleGestionDesHorairesBoutique.getInstance().getHorairesBoutique(storeId);

        if (horaires_boutique) {
            for (let i in horaires_boutique) {
                if (jours_ouvres.indexOf(horaires_boutique[i].jour_de_la_semaine) == -1) {
                    jours_ouvres.push(horaires_boutique[i].jour_de_la_semaine);
                }
            }
        }

        while (start_year.isSameOrBefore(end_year)) {
            let month = start_year.month();

            // On vérifit si c'est un dimanche travaillé
            let dimanche: GestionDesDimanchesVO = dimanches_travailles.find((dt) => {
                return moment(dt.date_dimanche).isSame(start_year);
            });

            if (dimanche && dimanche.ouverture) {
                nb_jour_ouvre_annee_par_mois[month]++;
                start_year.add(1, 'day');
                continue;
            }

            // On vérifit que c'est dans les jours d'ouverture de la boutique
            if (jours_ouvres.indexOf(start_year.isoWeekday()) == -1) {
                start_year.add(1, 'day');
                continue;
            }

            // On vérifit que ce n'est pas un jour férié et qu'il n'est pas travaillé
            if (jours_feries && jours_feries[this.formatDayForIndex(start_year)] && !jours_feries[this.formatDayForIndex(start_year)].store_holiday.worked) {
                start_year.add(1, 'day');
                continue;
            }

            if (!nb_jour_ouvre_annee_par_mois[month]) {
                nb_jour_ouvre_annee_par_mois[month] = 0;
            }

            nb_jour_ouvre_annee_par_mois[month]++;
            start_year.add(1, 'day');
        }

        return nb_jour_ouvre_annee_par_mois;
    }
}