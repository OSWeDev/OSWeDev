
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';
import INamedVO from '../../../interfaces/INamedVO';

export default class ImageFormatVO implements IVersionedVO, INamedVO {
    public static API_TYPE_ID: string = "imgfrmt";

    public static HALIGN_NAMES: string[] = ['imgfrmt.HALIGN_LEFT', 'imgfrmt.HALIGN_CENTER', 'imgfrmt.HALIGN_RIGHT'];
    public static HALIGN_LEFT: number = 0;
    public static HALIGN_CENTER: number = 1;
    public static HALIGN_RIGHT: number = 2;

    public static VALIGN_NAMES: string[] = ['imgfrmt.VALIGN_TOP', 'imgfrmt.VALIGN_CENTER', 'imgfrmt.VALIGN_BOTTOM'];
    public static VALIGN_TOP: number = 0;
    public static VALIGN_CENTER: number = 1;
    public static VALIGN_BOTTOM: number = 2;

    public id: number;
    public _type: string = ImageFormatVO.API_TYPE_ID;

    public name: string;

    public remplir_larg: boolean;
    public remplir_haut: boolean;
    public align_larg: number;
    public align_haut: number;
    public quality: number;

    public height: number;
    public width: number;
    public add_size_rename_name: boolean;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}