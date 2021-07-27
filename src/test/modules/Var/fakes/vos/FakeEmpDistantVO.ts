
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';

export default class FakeEmpDistantVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "fake_empdistantvo";

    public id: number;
    public _type: string = FakeEmpDistantVO.API_TYPE_ID;

    public date: number;

    public employee_id: number;
    public value: number;
}