
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

    public static WATERMARK_HORIZONTAL_ALIGN_LEFT: number = 1;
    public static WATERMARK_HORIZONTAL_ALIGN_CENTER: number = 2;
    public static WATERMARK_HORIZONTAL_ALIGN_RIGHT: number = 4;
    public static WATERMARK_HORIZONTAL_ALIGN_LABELS: { [key: number]: string } = {
        [ImageFormatVO.WATERMARK_HORIZONTAL_ALIGN_LEFT]: 'imgfrmt.WATERMARK_HORIZONTAL_ALIGN_LEFT',
        [ImageFormatVO.WATERMARK_HORIZONTAL_ALIGN_CENTER]: 'imgfrmt.WATERMARK_HORIZONTAL_ALIGN_CENTER',
        [ImageFormatVO.WATERMARK_HORIZONTAL_ALIGN_RIGHT]: 'imgfrmt.WATERMARK_HORIZONTAL_ALIGN_RIGHT',
    };

    public static WATERMARK_VERTICAL_ALIGN_TOP: number = 8;
    public static WATERMARK_VERTICAL_ALIGN_MIDDLE: number = 16;
    public static WATERMARK_VERTICAL_ALIGN_BOTTOM: number = 32;
    public static WATERMARK_VERTICAL_ALIGN_LABELS: { [key: number]: string } = {
        [ImageFormatVO.WATERMARK_VERTICAL_ALIGN_TOP]: 'imgfrmt.WATERMARK_VERTICAL_ALIGN_TOP',
        [ImageFormatVO.WATERMARK_VERTICAL_ALIGN_MIDDLE]: 'imgfrmt.WATERMARK_VERTICAL_ALIGN_MIDDLE',
        [ImageFormatVO.WATERMARK_VERTICAL_ALIGN_BOTTOM]: 'imgfrmt.WATERMARK_VERTICAL_ALIGN_BOTTOM',
    };

    public static WATERMARK_FONT_SANS_8_BLACK: number = 8;
    public static WATERMARK_FONT_SANS_10_BLACK: number = 10;
    public static WATERMARK_FONT_SANS_12_BLACK: number = 12;
    public static WATERMARK_FONT_SANS_14_BLACK: number = 14;
    public static WATERMARK_FONT_SANS_16_BLACK: number = 16;
    public static WATERMARK_FONT_SANS_32_BLACK: number = 32;
    public static WATERMARK_FONT_SANS_64_BLACK: number = 64;
    public static WATERMARK_FONT_SANS_128_BLACK: number = 128;
    public static WATERMARK_FONT_LABELS: { [key: number]: string } = {
        [ImageFormatVO.WATERMARK_FONT_SANS_8_BLACK]: 'imgfrmt.WATERMARK_FONT_SANS_8_BLACK',
        [ImageFormatVO.WATERMARK_FONT_SANS_10_BLACK]: 'imgfrmt.WATERMARK_FONT_SANS_10_BLACK',
        [ImageFormatVO.WATERMARK_FONT_SANS_12_BLACK]: 'imgfrmt.WATERMARK_FONT_SANS_12_BLACK',
        [ImageFormatVO.WATERMARK_FONT_SANS_14_BLACK]: 'imgfrmt.WATERMARK_FONT_SANS_14_BLACK',
        [ImageFormatVO.WATERMARK_FONT_SANS_16_BLACK]: 'imgfrmt.WATERMARK_FONT_SANS_16_BLACK',
        [ImageFormatVO.WATERMARK_FONT_SANS_32_BLACK]: 'imgfrmt.WATERMARK_FONT_SANS_32_BLACK',
        [ImageFormatVO.WATERMARK_FONT_SANS_64_BLACK]: 'imgfrmt.WATERMARK_FONT_SANS_64_BLACK',
        [ImageFormatVO.WATERMARK_FONT_SANS_128_BLACK]: 'imgfrmt.WATERMARK_FONT_SANS_128_BLACK',
    };

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

    public watermark_txt: string;
    public watermark_x: number;
    public watermark_y: number;
    public watermark_horizontal_align: number;
    public watermark_vertical_align: number;
    public watermark_font: number;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}