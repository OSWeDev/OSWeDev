import ModuleAccessPolicy from "../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import RoleVO from "../../../shared/modules/AccessPolicy/vos/RoleVO";
import UserVO from "../../../shared/modules/AccessPolicy/vos/UserVO";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import TimeSegment from "../../../shared/modules/DataRender/vos/TimeSegment";
import Dates from "../../../shared/modules/FormatDatesNombres/Dates/Dates";
import ModuleParams from "../../../shared/modules/Params/ModuleParams";
import ParamVO from "../../../shared/modules/Params/vos/ParamVO";
import StatsController from "../../../shared/modules/Stats/StatsController";
import LangVO from "../../../shared/modules/Translation/vos/LangVO";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import MatroidIndexHandler from "../../../shared/tools/MatroidIndexHandler";
import { field_names } from "../../../shared/tools/ObjectHandler";
import ConfigurationService from "../../env/ConfigurationService";
import ModuleAccessPolicyServer from "../AccessPolicy/ModuleAccessPolicyServer";
import ModuleDAOServer from "../DAO/ModuleDAOServer";


/**
 * Fonctionnement : Pour s'inscrire aux hooks de after_all, after_each, before_all, before_each de PlauWright, il faut :
 * - Créer un controller qui extends PlayWrightServerController avec dans le constructeur :
 *    - super();
 * - Pour s'inscrire au hook after_all, général à tous les tests :
 *     - Dans le controller, créer une méthode async after_all() {}
 * - Pour s'inscrire au hook before_each, spécifique à un test :
 *     - Dans le controller, créer une méthode async before_each_[test_title]() {}
 *       où test_title est le titre du test (défini dans le fichier de test en replace ([^a-bA-B0-9]) par _)
 *  - Pour s'inscrire au hook after_each, spécifique à un test :
 *     - Dans le controller, créer une méthode async after_each_[test_title]() {}
 *       où test_title est le titre du test (défini dans le fichier de test en replace ([^a-bA-B0-9]) par _)
 * - Pour s'inscrire au hook before_all, général à tous les tests :
 *     - Dans le controller, créer une méthode async before_all() {}
 */
export default abstract class PlayWrightServerController {

    public static PARAM_NAME_TEST_USER_NAME: string = "PlayWrightServerController.TEST_USER_NAME";
    public static PARAM_NAME_TEST_USER_EMAIL: string = "PlayWrightServerController.TEST_USER_EMAIL";
    public static PARAM_NAME_TEST_USER_FIRSTNAME: string = "PlayWrightServerController.TEST_USER_FIRSTNAME";
    public static PARAM_NAME_TEST_USER_LASTNAME: string = "PlayWrightServerController.TEST_USER_LASTNAME";
    public static PARAM_NAME_TEST_USER_PHONE: string = "PlayWrightServerController.TEST_USER_PHONE";

    public static test_title_to_method_name(test_title: string): string {
        return test_title.replace(/[^a-bA-B0-9]/g, '_');
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): PlayWrightServerController {
        return PlayWrightServerController.instance;
    }

    protected static instance: PlayWrightServerController = null;

    protected constructor() { }

    public async setup_and_login(): Promise<string> {
        await this.login();
        return await this.setup();
    }

    public abstract setup(): Promise<string>;
    // public abstract global_setup(): Promise<void>;
    // public abstract global_teardown(): Promise<void>;
    public abstract after_all(): Promise<void>;
    public abstract before_all(): Promise<void>;

    public async after_each(test_title: string): Promise<void> {
        test_title = PlayWrightServerController.test_title_to_method_name(test_title);
        if (!!this['after_each_' + test_title]) {
            return await this['after_each_' + test_title]();
        }
    }
    public async before_each(test_title: string): Promise<void> {
        test_title = PlayWrightServerController.test_title_to_method_name(test_title);
        if (!!this['before_each_' + test_title]) {
            return await this['before_each_' + test_title]();
        }
    }

    /**
     * On login le user de test, et si il existe pas on le crée
     *  idem pour les infos du compte, on les génère aléatoirement si elles n'existent pas et on stocke
     */
    protected async login() {

        /**
         * On bloque en prod dans tous les cas pour le moment pour raison de sécurité
         */
        if (ConfigurationService.node_configuration.IS_MAIN_PROD_ENV) {
            StatsController.register_stat_COMPTEUR('PlayWrightServerController', 'login', 'IS_MAIN_PROD_ENV');
            throw new Error('PlayWrightServerController: login should not be called in prod');
        }

        let test_user_name: string = await ModuleParams.getInstance().getParamValueAsString(PlayWrightServerController.PARAM_NAME_TEST_USER_NAME);
        let test_user_email: string = await ModuleParams.getInstance().getParamValueAsString(PlayWrightServerController.PARAM_NAME_TEST_USER_EMAIL);
        let test_user_firstname: string = await ModuleParams.getInstance().getParamValueAsString(PlayWrightServerController.PARAM_NAME_TEST_USER_FIRSTNAME);
        let test_user_lastname: string = await ModuleParams.getInstance().getParamValueAsString(PlayWrightServerController.PARAM_NAME_TEST_USER_LASTNAME);
        let test_user_password: string = MatroidIndexHandler.base_10_num_to_base_76_txt(10000 + Math.round(Math.random() * 100000000000)) + MatroidIndexHandler.base_10_num_to_base_76_txt(10000 + Math.round(Math.random() * 100000000000)) + MatroidIndexHandler.base_10_num_to_base_76_txt(10000 + Math.round(Math.random() * 100000000000));
        let test_user_phone: string = await ModuleParams.getInstance().getParamValueAsString(PlayWrightServerController.PARAM_NAME_TEST_USER_PHONE);

        if (!test_user_email) {
            ConsoleHandler.log('PlayWrightServerController: test_user_email not found, generating random user');
            test_user_email = 'playwright_test_user_email' + Math.round(Math.random() * 1000000) + '@wedev.fr';

            test_user_name = 'playwright_test_user_name' + Math.round(Math.random() * 1000000);
            let test_user_name_param = new ParamVO();
            test_user_name_param.name = PlayWrightServerController.PARAM_NAME_TEST_USER_NAME;
            test_user_name_param.value = test_user_name;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(test_user_name_param);

            let test_user_email_param = new ParamVO();
            test_user_email_param.name = PlayWrightServerController.PARAM_NAME_TEST_USER_EMAIL;
            test_user_email_param.value = test_user_email;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(test_user_email_param);
            // si on a pas l'email, on a probablement pas le reste non plus

            test_user_firstname = 'playwright_test_user_firstname' + Math.round(Math.random() * 1000000);
            test_user_lastname = 'playwright_test_user_lastname' + Math.round(Math.random() * 1000000);
            test_user_phone = 'playwright_test_user_phone' + Math.round(Math.random() * 1000000);

            let test_user_firstname_param = new ParamVO();
            test_user_firstname_param.name = PlayWrightServerController.PARAM_NAME_TEST_USER_FIRSTNAME;
            test_user_firstname_param.value = test_user_firstname;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(test_user_firstname_param);

            let test_user_lastname_param = new ParamVO();
            test_user_lastname_param.name = PlayWrightServerController.PARAM_NAME_TEST_USER_LASTNAME;
            test_user_lastname_param.value = test_user_lastname;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(test_user_lastname_param);

            let test_user_phone_param = new ParamVO();
            test_user_phone_param.name = PlayWrightServerController.PARAM_NAME_TEST_USER_PHONE;
            test_user_phone_param.value = test_user_phone;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(test_user_phone_param);
        }

        ConsoleHandler.log('PlayWrightServerController: test_user_name: ' + test_user_name);
        ConsoleHandler.log('PlayWrightServerController: test_user_email: ' + test_user_email);
        ConsoleHandler.log('PlayWrightServerController: test_user_firstname: ' + test_user_firstname);
        ConsoleHandler.log('PlayWrightServerController: test_user_lastname: ' + test_user_lastname);
        ConsoleHandler.log('PlayWrightServerController: test_user_phone: ' + test_user_phone);

        let test_user = await query(UserVO.API_TYPE_ID).filter_by_text_eq(field_names<UserVO>().email, test_user_email).exec_as_server().select_vo<UserVO>();

        if (!test_user || !test_user.id) {
            ConsoleHandler.log('PlayWrightServerController: test_user not found, creating it');
            test_user = new UserVO();
            test_user.name = test_user_name;
            test_user.email = test_user_email;
            test_user.firstname = test_user_firstname;
            test_user.lastname = test_user_lastname;
            test_user.phone = test_user_phone;
            test_user.password = test_user_password;
            test_user.password_change_date = Dates.add(Dates.now(), 100, TimeSegment.TYPE_YEAR);

            let lang: LangVO = await query(LangVO.API_TYPE_ID).filter_by_text_eq(field_names<LangVO>().code_lang, 'fr-fr').exec_as_server().select_one();

            test_user.invalidated = false;
            test_user.lang_id = lang.id;

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(test_user);

            // On ajoute le rôle admin
            let rôle_admin = await query(RoleVO.API_TYPE_ID).filter_by_text_eq(field_names<RoleVO>().translatable_name, ModuleAccessPolicy.ROLE_ADMIN).exec_as_server().select_vo<RoleVO>();
            if (!rôle_admin || !rôle_admin.id) {
                throw new Error('PlayWrightServerController: rôle admin should exist');
            }
            ConsoleHandler.log('PlayWrightServerController: adding rôle admin to test_user');
            await ModuleAccessPolicyServer.getInstance().addRoleToUser(test_user.id, rôle_admin.id, true);
        } else {
            ConsoleHandler.log('PlayWrightServerController: test_user found, updating its password');

            // dans tous les cas on reset le mot de passe à chaque session
            await query(UserVO.API_TYPE_ID).filter_by_id(test_user.id).exec_as_server().update_vos<UserVO>({
                [field_names<UserVO>().password]: test_user_password
            });
        }

        if (!test_user.id) {
            throw new Error('PlayWrightServerController: test_user.id should not be null');
        }

        ConsoleHandler.log('PlayWrightServerController: logging in test_user.id: ' + test_user.id);
        await ModuleAccessPolicyServer.getInstance().login(test_user.id);
    }
}