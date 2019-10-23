import * as moment from 'moment';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import ModulePushData from '../../../../shared/modules/PushData/ModulePushData';
import ModulePushDataServer from '../../PushData/ModulePushDataServer';
import ServerBase from '../../../ServerBase';

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

        let user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecovery(email);

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

            let msg = VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID].getFieldFromId('password').validate(new_pwd1);
            if (!((!msg) || (msg == ""))) {

                return false;
            }
        } catch (error) {
            return false;
        }

        // On doit se comporter comme un server à ce stade
        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        httpContext.set('IS_CLIENT', false);

        ModuleAccessPolicy.getInstance().prepareForInsertOrUpdateAfterPwdChange(user, new_pwd1);
        await ModuleDAO.getInstance().insertOrUpdateVO(user);
        return true;
    }
}