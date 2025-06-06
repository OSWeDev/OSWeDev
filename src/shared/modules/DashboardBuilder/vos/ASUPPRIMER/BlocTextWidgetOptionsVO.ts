import AbstractVO from "../../VO/abstract/AbstractVO";

export default class BlocTextWidgetOptionsVO extends AbstractVO {

    public bloc_text: string;

    public static createNew(
        bloc_text: string
    ): BlocTextWidgetOptionsVO {
        const res = new BlocTextWidgetOptionsVO();

        res.bloc_text = bloc_text;

        return res;
    }

}