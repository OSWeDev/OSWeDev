import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import TranslatableTextVO from "../../../shared/modules/Translation/vos/TranslatableTextVO";
import TranslationVO from "../../../shared/modules/Translation/vos/TranslationVO";
import { field_names } from "../../../shared/tools/ObjectHandler";
import IGeneratorWorker from "../../IGeneratorWorker";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";


export default class Patch20250901PatchTradPolicyServer implements IGeneratorWorker {
    private static instance: Patch20250901PatchTradPolicyServer = null;
    private constructor() { }

    get uid(): string {
        return 'Patch20250901PatchTradPolicyServer';
    }


    public static getInstance(): Patch20250901PatchTradPolicyServer {
        if (!Patch20250901PatchTradPolicyServer.instance) {
            Patch20250901PatchTradPolicyServer.instance = new Patch20250901PatchTradPolicyServer();
        }
        return Patch20250901PatchTradPolicyServer.instance;
    }

    public async work(db: IDatabase<unknown>) {
        const trad_recover: TranslationVO = await query(TranslationVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, 'recover.ok.___LABEL___', TranslatableTextVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<TranslationVO>().lang_id, 1)
            .exec_as_server()
            .select_vo<TranslationVO>();
        if (!trad_recover) {
            return;
        }

        trad_recover.translated = 'Si votre adresse e-mail est valide, vous recevrez un e-mail de récupération.';
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(trad_recover);

        const trad_recover_sms: TranslationVO = await query(TranslationVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, 'recover.oksms.___LABEL___', TranslatableTextVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<TranslationVO>().lang_id, 1)
            .exec_as_server()
            .select_vo<TranslationVO>();
        if (!trad_recover_sms) {
            return;
        }

        trad_recover_sms.translated = 'Si votre numéro de téléphone est valide, vous recevrez un SMS de récupération.';
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(trad_recover_sms);

        const trad_login: TranslationVO = await query(TranslationVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, 'login.msg.___LABEL___', TranslatableTextVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<TranslationVO>().lang_id, 1)
            .exec_as_server()
            .select_vo<TranslationVO>();
        if (!trad_login) {
            return;
        }

        trad_login.translated = 'Bienvenue, connectez-vous à {app_title} .';
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(trad_login);

    }
}