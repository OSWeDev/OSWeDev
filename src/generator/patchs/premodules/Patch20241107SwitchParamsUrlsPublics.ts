import { IDatabase } from "pg-promise";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20241107SwitchParamsUrlsPublics implements IGeneratorWorker {

    private static instance: Patch20241107SwitchParamsUrlsPublics = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20241107SwitchParamsUrlsPublics';
    }

    public static getInstance(): Patch20241107SwitchParamsUrlsPublics {
        if (!Patch20241107SwitchParamsUrlsPublics.instance) {
            Patch20241107SwitchParamsUrlsPublics.instance = new Patch20241107SwitchParamsUrlsPublics();
        }
        return Patch20241107SwitchParamsUrlsPublics.instance;
    }

    public async work(db: IDatabase<unknown>) {
        db.query("UPDATE ref.module_params_param " +
            "SET value = CASE " +
            "    WHEN value LIKE '\"/client/public/%' THEN replace(value, '\"/client/public/', '\"/public/client/') " +
            "    WHEN value LIKE '\"/login/public/%' THEN replace(value, '\"/login/public/', '\"/public/login/') " +
            "    WHEN value LIKE '\"/admin/public/%' THEN replace(value, '\"/admin/public/', '\"/public/admin/') " +
            "    WHEN value LIKE '\"/vuejsclient/public/%' THEN replace(value, '\"/vuejsclient/public/', '\"/public/vuejsclient/') " +
            "    ELSE value " +
            "END " +
            "WHERE value LIKE '\"/client/public/%' " +
            "   OR value LIKE '\"/login/public/%' " +
            "   OR value LIKE '\"/admin/public/%' " +
            "   OR value LIKE '\"/vuejsclient/public/%'; "
        );
    }
}