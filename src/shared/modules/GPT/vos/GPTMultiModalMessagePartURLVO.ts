
import IDistantVOBase from '../../IDistantVOBase';

export default class GPTMultiModalMessagePartURLVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_multimodalmsgparturl";

    public static createNew(
        url: string): GPTMultiModalMessagePartURLVO {

        let res: GPTMultiModalMessagePartURLVO = new GPTMultiModalMessagePartURLVO();

        res.url = url;

        return res;
    }

    public id: number;
    public _type: string = GPTMultiModalMessagePartURLVO.API_TYPE_ID;


    public url: string;
}