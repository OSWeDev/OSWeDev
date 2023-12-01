import IDistantVOBase from "../../../../../src/shared/modules/IDistantVOBase";

export default class FakeDistantVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "fake_distantvo";

    public id: number;
    public _type: string = FakeDistantVO.API_TYPE_ID;

    public date: number;

    public value: number;
}