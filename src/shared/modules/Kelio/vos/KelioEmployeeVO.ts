import IDistantVOBase from '../../IDistantVOBase';

export default class KelioEmployeeVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "kelio_employee";

    public id: number;
    public _type: string = KelioEmployeeVO.API_TYPE_ID;

    public archived_employee: boolean;
    public employee_first_name: string;
    public employee_identification_number: string;
    public employee_surname: string;
    public period_start_date: number;
    public period_end_date: number;
}