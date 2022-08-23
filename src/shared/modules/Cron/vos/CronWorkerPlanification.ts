import IDistantVOBase from '../../IDistantVOBase';

export default class CronWorkerPlanification implements IDistantVOBase {
    public static API_TYPE_ID: string = "cronworkplan";

    public static TYPE_RECURRENCE_LABELS: string[] = [
        'cronworkplan.TYPE_RECURRENCE.AUCUNE',
        'cronworkplan.TYPE_RECURRENCE.ANNEES',
        'cronworkplan.TYPE_RECURRENCE.MOIS',
        'cronworkplan.TYPE_RECURRENCE.SEMAINES',
        'cronworkplan.TYPE_RECURRENCE.JOURS',
        'cronworkplan.TYPE_RECURRENCE.HEURES',
        'cronworkplan.TYPE_RECURRENCE.MINUTES'
    ];
    public static TYPE_RECURRENCE_AUCUNE: number = 0;
    public static TYPE_RECURRENCE_ANNEES: number = 1;
    public static TYPE_RECURRENCE_MOIS: number = 2;
    public static TYPE_RECURRENCE_SEMAINES: number = 3;
    public static TYPE_RECURRENCE_JOURS: number = 4;
    public static TYPE_RECURRENCE_HEURES: number = 5;
    public static TYPE_RECURRENCE_MINUTES: number = 6;

    public id: number;
    public _type: string = CronWorkerPlanification.API_TYPE_ID;

    public planification_uid: string;
    public worker_uid: string;
    public date_heure_planifiee: number;
    public type_recurrence: number;
    public intervale_recurrence: number;
}