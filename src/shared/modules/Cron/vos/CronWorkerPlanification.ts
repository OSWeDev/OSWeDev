import IDistantVOBase from '../../IDistantVOBase';

export default class CronWorkerPlanification implements IDistantVOBase {
    public static API_TYPE_ID: string = "cronworkplan";

    public static TYPE_RECURRENCE_AUCUNE: number = 0;
    public static TYPE_RECURRENCE_ANNEES: number = 10;
    public static TYPE_RECURRENCE_MOIS: number = 20;
    public static TYPE_RECURRENCE_SEMAINES: number = 30;
    public static TYPE_RECURRENCE_JOURS: number = 40;
    public static TYPE_RECURRENCE_HEURES: number = 50;
    public static TYPE_RECURRENCE_MINUTES: number = 60;

    public id: number;
    public _type: string = CronWorkerPlanification.API_TYPE_ID;

    public planification_uid: string;
    public worker_uid: string;
    public date_heure_planifiee: string;
    public type_recurrence: number;
    public intervale_recurrence: number;
}