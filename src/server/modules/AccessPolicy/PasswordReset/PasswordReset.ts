import * as moment from 'moment';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';

export default class PasswordReset {

    public static getInstance() {
        if (!PasswordReset.instance) {
            PasswordReset.instance = new PasswordReset();
        }
        return PasswordReset.instance;
    }

    private static instance: PasswordReset = null;

    private constructor() {
    }

    public async resetPwd(email: string, challenge: string, new_pwd1: string): Promise<boolean> {

        let user: UserVO = await ModuleDAO.getInstance().selectOne<UserVO>(UserVO.API_TYPE_ID, " WHERE t.email = $1", [email]);

        if (!user) {
            return false;
        }

        if (user.recovery_challenge != challenge) {
            return false;
        }

        if (moment(user.recovery_expiration).isBefore(moment())) {
            return false;
        }

        try {

            if (!ModuleAccessPolicy.getInstance().passwordIsValidProposition(new_pwd1)) {
                return false;
            }
        } catch (error) {
            return false;
        }

        await ModuleAccessPolicy.getInstance().changePwd(user, new_pwd1);
        return true;
    }
}