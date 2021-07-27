import DateHandler from '../../tools/DateHandler';
import Dates from '../FormatDatesNombres/Dates/Dates';
import UserVO from './vos/UserVO';


export default class AccessPolicyController {

    public static getInstance(): AccessPolicyController {
        if (!AccessPolicyController.instance) {
            AccessPolicyController.instance = new AccessPolicyController();
        }
        return AccessPolicyController.instance;
    }

    private static instance: AccessPolicyController = null;

    private constructor() { }

    public prepareForInsertOrUpdateAfterPwdChange(user: UserVO, new_pwd1: string): void {

        user.password = new_pwd1;
        user.password_change_date = Dates.now();
        user.invalidated = false;
        user.recovery_expiration = null;
        user.recovery_challenge = null;
        user.reminded_pwd_1 = false;
        user.reminded_pwd_2 = false;
    }
}