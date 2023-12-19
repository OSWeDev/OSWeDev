import AbstractVO from "../../VO/abstract/AbstractVO";

/**
 * LogVO
 * - Log VO definition
 */
export default class LogVO extends AbstractVO {

    public static API_TYPE_ID: string = "app_log";

    public static LEVEL_DEBUG: string = "DEBUG";
    public static LEVEL_INFO: string = "INFO";
    public static LEVEL_WARN: string = "WARN";
    public static LEVEL_ERROR: string = "ERROR";
    public static LEVEL_FATAL: string = "FATAL";

    public _type: string = LogVO.API_TYPE_ID;

    public id: number;
    public message: string;
    public level: string;
    public date: number;
    public filename: string;
}