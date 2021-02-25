import * as moment from 'moment';
import { IDatabase } from 'pg-promise';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import IGeneratorWorker from '../../IGeneratorWorker';


export default class Patch20210225AjoutDateCreationCompteUtilisateur implements IGeneratorWorker {

    public static getInstance(): Patch20210225AjoutDateCreationCompteUtilisateur {
        if (!Patch20210225AjoutDateCreationCompteUtilisateur.instance) {
            Patch20210225AjoutDateCreationCompteUtilisateur.instance = new Patch20210225AjoutDateCreationCompteUtilisateur();
        }
        return Patch20210225AjoutDateCreationCompteUtilisateur.instance;
    }

    private static instance: Patch20210225AjoutDateCreationCompteUtilisateur = null;

    get uid(): string {
        return 'Patch20210225AjoutDateCreationCompteUtilisateur';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        let users: UserVO[] = await ModuleDAO.getInstance().getVos<UserVO>(UserVO.API_TYPE_ID);

        for (let i in users) {
            if (users[i].creation_date) {
                continue;
            }

            users[i].creation_date = moment('1900-01-01').utc(true);
        }

        await ModuleDAO.getInstance().insertOrUpdateVOs(users);
    }
}