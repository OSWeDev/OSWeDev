import IDistantVOBase from '../../IDistantVOBase';
import ConversionHandler from '../../../tools/ConversionHandler';

export default class CronWorkerPlanification implements IDistantVOBase {
    public static API_TYPE_ID: string = "cronworkplan";

    public static TYPE_RECURRENCE_AUCUNE: number = 0;
    public static TYPE_RECURRENCE_ANNEES: number = 10;
    public static TYPE_RECURRENCE_MOIS: number = 20;
    public static TYPE_RECURRENCE_SEMAINES: number = 30;
    public static TYPE_RECURRENCE_JOURS: number = 40;
    public static TYPE_RECURRENCE_HEURES: number = 50;
    public static TYPE_RECURRENCE_MINUTES: number = 60;

    // Pour forcer les numériques à court terme
    public static forceNumeric(e: CronWorkerPlanification): CronWorkerPlanification {
        if (!e) {
            return null;
        }

        e.type_recurrence = ConversionHandler.forceNumber(e.type_recurrence);
        e.intervale_recurrence = ConversionHandler.forceNumber(e.intervale_recurrence);
        e.id = ConversionHandler.forceNumber(e.id);

        e._type = CronWorkerPlanification.API_TYPE_ID;

        return e;
    }

    public static forceNumerics(es: CronWorkerPlanification[]): CronWorkerPlanification[] {
        for (let i in es) {
            es[i] = CronWorkerPlanification.forceNumeric(es[i]);
        }
        return es;
    }

    public id: number;
    public _type: string = CronWorkerPlanification.API_TYPE_ID;

    public planification_uid: string;
    public worker_uid: string;
    public date_heure_planifiee: string;
    public type_recurrence: number;
    public intervale_recurrence: number;
}