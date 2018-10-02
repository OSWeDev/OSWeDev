import FileVO from '../../File/vos/FileVO';

export default class ImageVO extends FileVO {
    public static API_TYPE_ID: string = "image";

    public _type: string = ImageVO.API_TYPE_ID;
}