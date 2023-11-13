
import Dates from '../../FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../IDistantVOBase';
import GPTMultiModalMessagePartVO from './GPTMultiModalMessagePartVO';

export default class GPTMultiModalMessageVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_multimodalmsg";

    public static createNew(
        role_type: number,
        user_id: number,
        image_url: string = null,
        content: string = null): GPTMultiModalMessageVO {

        let res: GPTMultiModalMessageVO = new GPTMultiModalMessageVO();

        res.role_type = role_type;
        res.user_id = user_id;

        if (!!image_url) {
            res.add_image_url(image_url);
        }

        if (!!content) {
            res.add_text(content);
        }

        res.date = Dates.now();

        return res;
    }

    public id: number;
    public _type: string = GPTMultiModalMessageVO.API_TYPE_ID;

    public role_type: number;
    public user_id: number;
    public content: GPTMultiModalMessagePartVO[];

    public date: number;

    public add_image_url(image_url: string) {
        if (!this.content) {
            this.content = [];
        }

        this.content.push(GPTMultiModalMessagePartVO.createNew(GPTMultiModalMessagePartVO.CONTENT_TYPE_IMAGE_URL, image_url));
    }

    public add_text(text: string) {
        if (!this.content) {
            this.content = [];
        }

        this.content.push(GPTMultiModalMessagePartVO.createNew(GPTMultiModalMessagePartVO.CONTENT_TYPE_TEXT, text));
    }
}