import INamedVO from '../../../interfaces/INamedVO';

export default class FileFormatVO implements INamedVO {
    public static API_TYPE_ID: string = "file_f";

    public id: number;
    public _type: string = FileFormatVO.API_TYPE_ID;

    public name: string;

    public width: number;
    public height: number;
}