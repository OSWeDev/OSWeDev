
import INamedVO from '../../../interfaces/INamedVO';
import IWeightedItem from '../../../tools/interfaces/IWeightedItem';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class DocumentVO implements IVersionedVO, INamedVO, IWeightedItem {
    public static API_TYPE_ID: string = "document";

    public static DOCUMENT_TYPE_LABELS: string[] = [
        'DOCUMENT.DOCUMENT_TYPE.YOUTUBE',
        'DOCUMENT.DOCUMENT_TYPE.PDF',
        'DOCUMENT.DOCUMENT_TYPE.PPT',
        'DOCUMENT.DOCUMENT_TYPE.XLS',
        'DOCUMENT.DOCUMENT_TYPE.DOC',
        'DOCUMENT.DOCUMENT_TYPE.OTHER'];
    public static DOCUMENT_TYPE_YOUTUBE: number = 0;
    public static DOCUMENT_TYPE_PDF: number = 1;
    public static DOCUMENT_TYPE_PPT: number = 2;
    public static DOCUMENT_TYPE_XLS: number = 3;
    public static DOCUMENT_TYPE_DOC: number = 4;
    public static DOCUMENT_TYPE_OTHER: number = 5;

    public static DOCUMENT_IMPORTANCE_LABELS: string[] = [
        'DOCUMENT.DOCUMENT_IMPORTANCE.XS',
        'DOCUMENT.DOCUMENT_IMPORTANCE.S',
        'DOCUMENT.DOCUMENT_IMPORTANCE.M',
        'DOCUMENT.DOCUMENT_IMPORTANCE.L',
        'DOCUMENT.DOCUMENT_IMPORTANCE.XL',
        'DOCUMENT.DOCUMENT_IMPORTANCE.XXL'];
    public static DOCUMENT_IMPORTANCE_XS: number = 0;
    public static DOCUMENT_IMPORTANCE_S: number = 1;
    public static DOCUMENT_IMPORTANCE_M: number = 2;
    public static DOCUMENT_IMPORTANCE_L: number = 3;
    public static DOCUMENT_IMPORTANCE_XL: number = 4;
    public static DOCUMENT_IMPORTANCE_XXL: number = 5;

    public id: number;
    public _type: string = DocumentVO.API_TYPE_ID;

    public name: string;
    public weight: number;
    public description: string;

    public type: number;
    public importance: number;

    public file_id: number;
    public document_url: string;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: Moment;
    public version_edit_author_id: number;
    public version_edit_timestamp: Moment;

    public show_icon: boolean;
}