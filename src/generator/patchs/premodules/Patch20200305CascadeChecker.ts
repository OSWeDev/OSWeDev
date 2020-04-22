import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';

/* istanbul ignore next: no unit tests on patchs */
export default class Patch20200305CascadeChecker implements IGeneratorWorker {

    public static getInstance(): Patch20200305CascadeChecker {
        if (!Patch20200305CascadeChecker.instance) {
            Patch20200305CascadeChecker.instance = new Patch20200305CascadeChecker();
        }
        return Patch20200305CascadeChecker.instance;
    }

    private static instance: Patch20200305CascadeChecker = null;

    get uid(): string {
        return 'Patch20200305CascadeChecker';
    }

    private constructor() { }

    /**
     * On check tous les foreign keys et on compare le param cascade en bdd au param issu du code
     */
    public async work(db: IDatabase<any>) {

        ConsoleHandler.getInstance().error('Impossible d\'automatiser cette action extrêmement importante : Comparer pour chaque clé étrangère dans le code la conf de CASCADE du code VS la conf dans la base actuelle avant que la génération ne modifie toute la BDD et écrase les CASCADE et recrée celles supprimées peut-être à raison. Pour passer ce patch il est nécessaire de mettre volontairement son nom dans la table des workers en base.');
        let res = await db.query("select DIStINCT kcu.table_schema || '.' || kcu.table_name || '.' || tco.constraint_name full_constraint_name, " +
            "kcu.table_schema || '.' || kcu.table_name, " +
            "rc.delete_rule delete_rule, " +
            "kcu.ordinal_position as position, " +
            "kcu.column_name as key_column " +
            "from information_schema.table_constraints tco " +
            "join information_schema.key_column_usage kcu " +
            "on kcu.constraint_name = tco.constraint_name " +
            "and kcu.constraint_schema = tco.constraint_schema " +
            "join information_schema.referential_constraints rc " +
            "on rc.constraint_name = tco.constraint_name " +
            "and rc.constraint_schema = tco.constraint_schema " +
            "where tco.constraint_type = 'FOREIGN KEY' " +
            "order by kcu.table_schema || '.' || kcu.table_name ASC; ");
        ConsoleHandler.getInstance().log(JSON.stringify(res));
        throw new Error('Impossible d\'automatiser cette action extrêmement importante : Comparer pour chaque clé étrangère dans le code la conf de CASCADE du code VS la conf dans la base actuelle avant que la génération ne modifie toute la BDD et écrase les CASCADE et recrée celles supprimées peut-être à raison. Pour passer ce patch il est nécessaire de mettre volontairement son nom dans la table des workers en base.');
    }
}