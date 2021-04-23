import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";

export default class AnonymizationFieldConfVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "anonym_field_conf";

    public static TYPE_ANONYMIZER_LABELS: string[] = [
        'anonym_conf.anonymizer.city',
        'anonym_conf.anonymizer.firstname',
        'anonym_conf.anonymizer.lastname',
        'anonym_conf.anonymizer.fullname',
        'anonym_conf.anonymizer.phone',
        'anonym_conf.anonymizer.email',
        'anonym_conf.anonymizer.postal',
        'anonym_conf.anonymizer.address'
    ];
    public static TYPE_ANONYMIZER_CITY: number = 0;
    public static TYPE_ANONYMIZER_FIRSTNAME: number = 1;
    public static TYPE_ANONYMIZER_LASTNAME: number = 2;
    public static TYPE_ANONYMIZER_FULLNAME: number = 3;
    public static TYPE_ANONYMIZER_PHONE: number = 4;
    public static TYPE_ANONYMIZER_EMAIL: number = 5;
    public static TYPE_ANONYMIZER_POSTAL: number = 6;
    public static TYPE_ANONYMIZER_ADDRESS: number = 7;

    public id: number;
    public _type: string = AnonymizationFieldConfVO.API_TYPE_ID;

    public vo_type: string;
    public field_id: string;
    public anonymizer_type: number;
}