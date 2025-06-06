import NumRange from "../../DataRender/vos/NumRange";
import AbstractVO from "../../VO/abstract/AbstractVO";

export default class CMSLikeButtonWidgetOptionsVO extends AbstractVO {

    public color: string;

    //user_list_id_ranges! (pas renommer osef)
    public user_list: NumRange[];

    public radius: number;

    public static createNew(
        color: string,
        user_list: NumRange[],
        radius: number
    ): CMSLikeButtonWidgetOptionsVO {
        const res = new CMSLikeButtonWidgetOptionsVO();

        res.color = color;
        res.user_list = user_list;
        res.radius = radius;

        return res;
    }
}