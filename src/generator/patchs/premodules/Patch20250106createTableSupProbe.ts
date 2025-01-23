/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250106createTableSupProbe implements IGeneratorWorker {

    private static instance: Patch20250106createTableSupProbe = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250106createTableSupProbe';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250106createTableSupProbe {
        if (!Patch20250106createTableSupProbe.instance) {
            Patch20250106createTableSupProbe.instance = new Patch20250106createTableSupProbe();
        }
        return Patch20250106createTableSupProbe.instance;
    }

    public async work(db: IDatabase<any>) {
        try {
            const res_Supervision = await db.query("SELECT * FROM admin.modules WHERE name IN ('supervision') AND actif IS TRUE ;");

            if ((!res_Supervision?.length)) {
                return;
            }
        } catch (error) {
            console.error(error);
            return;
        }


        try {
            await db.query(
                ' CREATE SEQUENCE IF NOT EXISTS ref.module_supervision_supervision_probe_id_seq' +
                '  INCREMENT 1' +
                '  MINVALUE 1' +
                '  MAXVALUE 9223372036854775807' +
                '  START 1' +
                '  CACHE 1;');
        } catch (error) {
            console.error(this.uid + ' Pb CREATE SEQUENCE module_supervision_supervision_probe_id_seq');
            console.error(error);
        }

        try {
            await db.query(
                " CREATE TABLE IF NOT EXISTS ref.module_supervision_supervision_probe" +
                " (" +
                "     id bigint NOT NULL DEFAULT nextval('ref.module_supervision_supervision_probe_id_seq':: regclass)," +
                "     sup_item_api_type_id text, " +
                "     notify boolean NOT NULL DEFAULT false," +
                "     category_id bigint," +
                "     weight bigint," +
                "     CONSTRAINT module_supervision_supervision_probe_pkey PRIMARY KEY(id)," +
                "     CONSTRAINT module_supervision_supervision_probe_sup_item_api_type_id_key UNIQUE(sup_item_api_type_id)," +
                "     CONSTRAINT category_id_fkey FOREIGN KEY(category_id)" +
                "     REFERENCES ref.module_supervision_supervision_cat(id) MATCH SIMPLE" +
                "     ON UPDATE NO ACTION" +
                "     ON DELETE SET DEFAULT" +
                " )"
            );
        } catch (error) {
            console.error(this.uid + ' Pb CREATE TABLE module_supervision_supervision_probe');
            console.error(error);
        }
    }
}