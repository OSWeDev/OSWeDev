import IDistantVOBase from '../../IDistantVOBase';

export default class APISimpleVOsParamVO {

    public static async translateCheckAccessParams(vos: IDistantVOBase[]): Promise<APISimpleVOsParamVO> {
        return new APISimpleVOsParamVO(vos);
    }

    public constructor(
        public vos: IDistantVOBase[]) { }
}