import AbstractVO from "../../VO/abstract/AbstractVO";

/**
 * FileVO
 * - Log FileVO definition
 */
export default class FileVO extends AbstractVO {

    public static API_TYPE_ID: string = "app_log_file";

    public _type: string = FileVO.API_TYPE_ID;

    public id: number;
    public filename: string;
    public path: string;
    public size: number;        // size in bytes
    public created_at: number;
    public updated_at: number;
}