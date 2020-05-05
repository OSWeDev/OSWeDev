import IDistantVOBase from '../../IDistantVOBase';

export default class FileVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "file";

    public id: number;
    public _type: string = FileVO.API_TYPE_ID;

    public path: string;
    public is_secured: boolean;
    public file_access_policy_name: string;
}