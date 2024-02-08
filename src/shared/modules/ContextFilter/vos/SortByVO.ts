import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import AbstractVO from "../../VO/abstract/AbstractVO";

export default class SortByVO extends AbstractVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "sort_by";

    public static MODIFIER_NONE: number = 0;
    public static MODIFIER_LOWER: number = 1;
    public static MODIFIER_UPPER: number = 2;
    public static MODIFIER_LABELS: string[] = [
        'SortByVO.MODIFIER_NONE',
        'SortByVO.MODIFIER_LOWER',
        'SortByVO.MODIFIER_UPPER'
    ];

    public id: number;
    public _type: string = SortByVO.API_TYPE_ID;

    public alias: string;

    public vo_type: string;
    public field_id: string;

    public sort_asc: boolean;

    public modifier: number;

    public constructor(
        vo_type: string = null,
        field_id: string = null,
        sort_asc: boolean = true,
        alias: string = null,
    ) {
        super();

        this.vo_type = vo_type;
        this.field_id = field_id;
        this.sort_asc = sort_asc;
        this.alias = alias;
        this.modifier = SortByVO.MODIFIER_NONE;
    }

    public set_alias(alias: string): SortByVO {
        this.alias = alias;
        return this;
    }

    public set_modifier(modifier: number): SortByVO {
        this.modifier = modifier;
        return this;
    }
}