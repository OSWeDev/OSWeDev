import RoleVO from "../../AccessPolicy/vos/RoleVO";
import AbstractVO from "../../VO/abstract/AbstractVO";

export default class CMSCrudButtonsWidgetOptionsVO extends AbstractVO {

    public show_add: boolean;
    public show_update: boolean;
    public show_delete: boolean;

    public show_manual_vo_type: boolean; // si pas en mode template, et /ou si en mode template mais envie de créer autre chose permet de définir la pable cible
    public manual_vo_type: string; // ref modultable

    public show_add_edit_fk: boolean; // ???

    // à globaliser, les rôles pouvant afficher le widget
    public role_access: RoleVO[];

    public static createNew(
        show_add: boolean,
        show_update: boolean,
        show_delete: boolean,
        show_manual_vo_type: boolean,
        manual_vo_type: string,
        show_add_edit_fk: boolean,
        role_access: RoleVO[],
    ): CMSCrudButtonsWidgetOptionsVO {
        const res = new CMSCrudButtonsWidgetOptionsVO();

        res.show_add = show_add;
        res.show_update = show_update;
        res.show_delete = show_delete;
        res.show_manual_vo_type = show_manual_vo_type;
        res.manual_vo_type = manual_vo_type;
        res.show_add_edit_fk = show_add_edit_fk;
        res.role_access = role_access;

        return res;
    }
}