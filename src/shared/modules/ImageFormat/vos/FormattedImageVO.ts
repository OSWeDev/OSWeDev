import { Moment } from 'moment';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class FormattedImageVO implements IVersionedVO {
    public static API_TYPE_ID: string = "frmttdimg";

    public static HALIGN_NAMES: string[] = ['imgfrmt.HALIGN_LEFT', 'imgfrmt.HALIGN_CENTER', 'imgfrmt.HALIGN_RIGHT'];
    public static HALIGN_LEFT: number = 0;
    public static HALIGN_CENTER: number = 1;
    public static HALIGN_RIGHT: number = 2;

    public static VALIGN_NAMES: string[] = ['imgfrmt.VALIGN_TOP', 'imgfrmt.VALIGN_CENTER', 'imgfrmt.VALIGN_BOTTOM'];
    public static VALIGN_TOP: number = 0;
    public static VALIGN_CENTER: number = 1;
    public static VALIGN_BOTTOM: number = 2;

    public id: number;
    public _type: string = FormattedImageVO.API_TYPE_ID;

    public file_id: number;
    public formatted_src: string;

    public image_format_id: number;
    public image_src: string;
    public image_height: number;
    public image_width: number;

    public remplir_larg: boolean;
    public remplir_haut: boolean;
    public align_larg: number;
    public align_haut: number;
    public quality: number;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: Moment;
    public version_edit_author_id: number;
    public version_edit_timestamp: Moment;
}