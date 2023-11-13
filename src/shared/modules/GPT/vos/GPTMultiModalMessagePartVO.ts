
import IDistantVOBase from '../../IDistantVOBase';
import GPTMultiModalMessagePartURLVO from './GPTMultiModalMessagePartURLVO';

export default class GPTMultiModalMessagePartVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_multimodalmsgpart";

    public static CONTENT_TYPE_TEXT: string = "text";
    public static CONTENT_TYPE_IMAGE_URL: string = 'image_url';

    public static createNew(
        type: string,
        content: string): GPTMultiModalMessagePartVO {

        let res: GPTMultiModalMessagePartVO = new GPTMultiModalMessagePartVO();

        res.type = type;

        switch (type) {
            case GPTMultiModalMessagePartVO.CONTENT_TYPE_TEXT:
                res.text = content;
                break;
            case GPTMultiModalMessagePartVO.CONTENT_TYPE_IMAGE_URL:
                res.image_url = GPTMultiModalMessagePartURLVO.createNew(content);
                break;
        }

        return res;
    }

    public id: number;
    public _type: string = GPTMultiModalMessagePartVO.API_TYPE_ID;


    public type: string;
    public text: string;
    public image_url: GPTMultiModalMessagePartURLVO;
}