import AbstractVO from "../../VO/abstract/AbstractVO";

export default class CMSImageWidgetOptionsVO extends AbstractVO {

    public file_id: number;
    public radius: number;

    public static createNew(
        file_id: number,
        radius: number,
    ): CMSImageWidgetOptionsVO {
        const res = new CMSImageWidgetOptionsVO();

        res.file_id = file_id;
        res.radius = radius;

        return res;
    }
}