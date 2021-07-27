
import IDistantVOBase from '../../IDistantVOBase';
import DefaultTranslation from '../../Translation/vos/DefaultTranslation';

export default class MenuElementVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "menu_elt";

    public static create_new(
        access_policy_name: string,
        app_name: string,
        name: string,
        fa_class: string,
        weight: number,
        target: string,
        target_is_routename: boolean = true,
        menu_parent_id: number = null,
        hidden: boolean = false
    ): MenuElementVO {

        let res = new MenuElementVO();

        res.access_policy_name = access_policy_name;
        res.app_name = app_name;
        res.name = name;
        res.fa_class = fa_class;
        res.weight = weight;
        res.target = target;
        res.target_is_routename = target_is_routename;
        res.menu_parent_id = menu_parent_id;
        res.hidden = hidden;
        return res;
    }

    public id: number;
    public _type: string = MenuElementVO.API_TYPE_ID;

    public app_name: string;

    public name: string;
    public weight: number;

    public fa_class: string;

    public target: string;
    public target_route_params: string;
    public target_is_routename: boolean;

    public menu_parent_id: number;
    public access_policy_name: string;

    public hidden: boolean;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: Moment;
    public version_edit_author_id: number;
    public version_edit_timestamp: Moment;

    get translatable_title(): string {
        return "menu.menuelements." + this.app_name + '.' + this.name + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }
}