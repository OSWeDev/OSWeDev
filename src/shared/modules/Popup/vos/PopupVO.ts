
import NumRange from '../../DataRender/vos/NumRange';
import TSRange from '../../DataRender/vos/TSRange';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class PopupVO implements IVersionedVO {
    public static API_TYPE_ID: string = "popup";

    public id: number;
    public _type: string = PopupVO.API_TYPE_ID;

    public title: string;
    public message: string;
    public cookie_name: string;
    public btn_txt: string;
    public activated_ts_range: TSRange;
    public only_roles: NumRange[];

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}