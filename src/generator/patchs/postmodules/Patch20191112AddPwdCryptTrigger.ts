import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20191112AddPwdCryptTrigger implements IGeneratorWorker {

    public static getInstance(): Patch20191112AddPwdCryptTrigger {
        if (!Patch20191112AddPwdCryptTrigger.instance) {
            Patch20191112AddPwdCryptTrigger.instance = new Patch20191112AddPwdCryptTrigger();
        }
        return Patch20191112AddPwdCryptTrigger.instance;
    }

    private static instance: Patch20191112AddPwdCryptTrigger = null;

    get uid(): string {
        return 'Patch20191112AddPwdCryptTrigger';
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