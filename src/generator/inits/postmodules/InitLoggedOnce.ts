import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import UserLogVO from '../../../shared/modules/AccessPolicy/vos/UserLogVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import IGeneratorWorker from '../../IGeneratorWorker';


export default class InitLoggedOnce implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): InitLoggedOnce {
        if (!InitLoggedOnce.instance) {
            InitLoggedOnce.instance = new InitLoggedOnce();
        }
        return InitLoggedOnce.instance;
    }

    private static instance: InitLoggedOnce = null;

    get uid(): string {
        return 'InitLoggedOnce';
    }

    private constructor() { }

    // istanbul ignore next: nothing to test : work
    public async work() {
        const users: UserVO[] = await query(UserVO.API_TYPE_ID).select_vos();
        const update_users: UserVO[] = [];

        for (const i in users) {
            const user = users[i];

            const logs: UserLogVO[] = await query(UserLogVO.API_TYPE_ID).filter_by_num_eq('user_id', user.id).select_vos();
            for (const j in logs) {
                const log = logs[j];

                if (log.impersonated) {
                    continue;
                }
                user.logged_once = true;
                update_users.push(user);
                break;
            }
        }

        await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(update_users);
    }
}