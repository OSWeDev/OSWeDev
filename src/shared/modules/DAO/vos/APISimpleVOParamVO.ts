import ModuleAPI from '../../API/ModuleAPI';
import IDistantVOBase from '../../IDistantVOBase';

export default class APISimpleVOParamVO {

    public static async translateCheckAccessParams(vo: IDistantVOBase): Promise<APISimpleVOParamVO> {

        return new APISimpleVOParamVO(vo);
    }

    public constructor(
        public vo: IDistantVOBase) {
        // this.vo = APIController.getInstance().try_translate_vo_to_api(vo);
    }
}