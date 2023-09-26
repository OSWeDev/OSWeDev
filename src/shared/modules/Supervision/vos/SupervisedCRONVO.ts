import ISupervisedItem from "../interfaces/ISupervisedItem";

export default class SupervisedCRONVO implements ISupervisedItem {
    public static API_TYPE_ID: string = "sup_cron";
    public static SUPERVISED_ITEM_BASENAME = "CRON - ";

    public id: number;
    public _type: string = SupervisedCRONVO.API_TYPE_ID;

    public name: string;

    public planification_uid: string;
    public worker_uid: string;

    public last_update: number;
    public last_value: number;
    public creation_date: number;
    public first_update: number;
    public state: number;
    public state_before_pause: number;
    public category_id: number;
    public invalid: boolean;
}