import IDistantVOBase from '../../IDistantVOBase';

export default class APISimpleVOParamVO {

    public static async translateCheckAccessParams(vo: IDistantVOBase): Promise<APISimpleVOParamVO> {

        return new APISimpleVOParamVO(vo);
    }

    public constructor(
        public vo: IDistantVOBase) { }
}