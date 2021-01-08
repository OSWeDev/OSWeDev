import UserLogVO from '../../../shared/modules/AccessPolicy/vos/UserLogVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import IGeneratorWorker from '../../IGeneratorWorker';


export default class Patch20210107InitLoggedOnce implements IGeneratorWorker {

    public static getInstance(): Patch20210107InitLoggedOnce {
        if (!Patch20210107InitLoggedOnce.instance) {
            Patch20210107InitLoggedOnce.instance = new Patch20210107InitLoggedOnce();
        }
        return Patch20210107InitLoggedOnce.instance;
    }

    private static instance: Patch20210107InitLoggedOnce = null;

    get uid(): string {
        return 'Patch20210107InitLoggedOnce';
    }

    private constructor() { }

    public async work() {
        let users: UserVO[] = await ModuleDAO.getInstance().getVos<UserVO>(UserVO.API_TYPE_ID);
        let update_users: UserVO[] = [];

        for (let i in users) {
            let user = users[i];

            let logs = await ModuleDAO.getInstance().getVosByRefFieldIds<UserLogVO>(UserLogVO.API_TYPE_ID, 'user_id', [user.id]);
            for (let j in logs) {
                let log = logs[j];

                if (log.impersonated) {
                    continue;
                }
                user.logged_once = true;
                update_users.push(user);
                break;
            }
        }

        await ModuleDAO.getInstance().insertOrUpdateVOs(update_users);
    }
}