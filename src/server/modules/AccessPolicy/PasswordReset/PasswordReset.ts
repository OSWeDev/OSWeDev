import AccessPolicyController from '../../../../shared/modules/AccessPolicy/AccessPolicyController';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleTableController from '../../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldController from '../../../../shared/modules/DAO/ModuleTableFieldController';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import NotificationVO from '../../../../shared/modules/PushData/vos/NotificationVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import DAOServerController from '../../DAO/DAOServerController';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import PushDataServerController from '../../PushData/PushDataServerController';

export default class PasswordReset {

    // istanbul ignore next: nothing to test : getInstance
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

        const user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecovery(email);

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        return await this.resetPwdUser(user, challenge, new_pwd1);
    }

    public async resetPwdUID(uid: number, challenge: string, new_pwd1: string): Promise<boolean> {

        const user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecoveryUID(uid);

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        return await this.resetPwdUser(user, challenge, new_pwd1);
    }


    public async checkCode(email: string, challenge: string): Promise<boolean> {

        const user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecovery(email);

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        return await this.checkCodeUser(user, challenge);
    }

    public async checkCodeUID(uid: number, challenge: string): Promise<boolean> {

        const user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecoveryUID(uid);

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        return await this.checkCodeUser(user, challenge);
    }

    public async checkCodeUser(user: UserVO, challenge: string): Promise<boolean> {

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        if (user.recovery_challenge != challenge) {
            return false;
        }

        if (user.recovery_expiration < Dates.now()) {
            return false;
        }

        return true;
    }

    public async resetPwdUser(user: UserVO, challenge: string, new_pwd1: string): Promise<boolean> {

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        if (user.recovery_challenge != challenge) {
            return false;
        }

        if (user.recovery_expiration < Dates.now()) {
            return false;
        }

        try {

            const msg = ModuleTableFieldController.validate_field_value(
                ModuleTableController.module_tables_by_vo_type[UserVO.API_TYPE_ID].getFieldFromId(field_names<UserVO>().password),
                new_pwd1);
            if (!((!msg) || (msg == ""))) {

                return false;
            }
        } catch (error) {
            ConsoleHandler.error(error);
            return false;
        }

        if (DAOServerController.GLOBAL_UPDATE_BLOCKER) {
            // On est en readonly partout, donc on informe sur impossibilité de se connecter
            await PushDataServerController.notifySession(
                'error.global_update_blocker.activated.___LABEL___',
                NotificationVO.SIMPLE_ERROR
            );
            return false;
        }

        AccessPolicyController.getInstance().prepareForInsertOrUpdateAfterPwdChange(user, new_pwd1);
        await query(UserVO.API_TYPE_ID).filter_by_id(user.id).exec_as_server().update_vos<UserVO>(
            ModuleTableController.translate_vos_to_api(user, false)
        );

        return true;
    }
}