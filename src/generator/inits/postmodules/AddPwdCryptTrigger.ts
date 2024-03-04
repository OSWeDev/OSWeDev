/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class AddPwdCryptTrigger implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): AddPwdCryptTrigger {
        if (!AddPwdCryptTrigger.instance) {
            AddPwdCryptTrigger.instance = new AddPwdCryptTrigger();
        }
        return AddPwdCryptTrigger.instance;
    }

    private static instance: AddPwdCryptTrigger = null;

    get uid(): string {
        return 'AddPwdCryptTrigger';
    }

    private constructor() { }

    /**
     * Objectif : A passer en premier pour forcer le trigger de crypt pwd si pas encore créé
     */
    public async work(db: IDatabase<any>) {

        try {
            await db.query(
                "CREATE OR REPLACE FUNCTION ref.encrypt_pass()\n" +
                "  RETURNS trigger AS\n" +
                "$BODY$\n" +
                "BEGIN\n" +
                "  IF tg_op = 'INSERT' OR new.password <> old.password\n" +
                "  THEN\n" +
                "    new.password = crypt(new.password, gen_salt('bf'));\n" +
                "  END IF;\n" +
                "  RETURN new;\n" +
                "END\n" +
                "$BODY$\n" +
                "  LANGUAGE plpgsql VOLATILE\n" +
                "  COST 100;\n");

            await db.query("CREATE TRIGGER encrypt_pass" +
                "  BEFORE INSERT OR UPDATE" +
                "  ON ref.user" +
                " FOR EACH ROW" +
                "  EXECUTE PROCEDURE ref.encrypt_pass();");

        } catch (error) {
            console.error(error);
        }
    }
}