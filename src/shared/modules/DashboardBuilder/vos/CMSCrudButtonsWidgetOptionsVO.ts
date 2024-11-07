import AbstractVO from "../../VO/abstract/AbstractVO";

export default class CMSCrudButtonsWidgetOptionsVO extends AbstractVO {

    public show_add: boolean;
    public show_update: boolean;
    public show_delete: boolean;

    public static createNew(
        show_add: boolean,
        show_update: boolean,
        show_delete: boolean,
    ): CMSCrudButtonsWidgetOptionsVO {
        const res = new CMSCrudButtonsWidgetOptionsVO();

        res.show_add = show_add;
        res.show_update = show_update;
        res.show_delete = show_delete;

        return res;
    }
}