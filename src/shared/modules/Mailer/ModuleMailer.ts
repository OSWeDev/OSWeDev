import Module from '../Module';
import ModuleTableField from '../ModuleTableField';
import ModuleTable from '../ModuleTable';
import ModuleParamChange from '../ModuleParamChange';
import * as moment from 'moment';
import { Duration } from 'moment';
import IDistantVOBase from '../IDistantVOBase';
import ModulesManager from '../ModulesManager';
import ModuleAjaxCache from '../AjaxCache/ModuleAjaxCache';
import { isArray } from 'util';
import ModuleDAO from '../DAO/ModuleDAO';
import ModuleDataExport from '../DataExport/ModuleDataExport';
import DateHandler from '../../tools/DateHandler';

export default class ModuleMailer extends Module {

    public static PARAM_NAME_HOST = 'host';
    public static PARAM_NAME_PORT = 'port';
    public static PARAM_NAME_SECURE = 'secure';
    public static PARAM_NAME_AUTH_USER = 'auth_user';
    public static PARAM_NAME_AUTH_PASS = 'auth_pass';
    public static PARAM_NAME_FROM = 'from_address';
    public static PARAM_NAME_SUBJECT_PREFIX = 'subject_prefix';
    public static PARAM_NAME_SUBJECT_SUFFIX = 'subject_suffix';

    public static getInstance(): ModuleMailer {
        if (!ModuleMailer.instance) {
            ModuleMailer.instance = new ModuleMailer();
        }
        return ModuleMailer.instance;
    }

    private static instance: ModuleMailer = null;

    private constructor() {

        super("mailer", "MAILER");
        this.initialize();
    }

    protected initialize() {
        this.fields = [
            new ModuleTableField(ModuleMailer.PARAM_NAME_HOST, ModuleTableField.FIELD_TYPE_string, 'host', true, true, '127.0.0.1'),
            new ModuleTableField(ModuleMailer.PARAM_NAME_PORT, ModuleTableField.FIELD_TYPE_int, 'port', true, true, 25),
            new ModuleTableField(ModuleMailer.PARAM_NAME_SECURE, ModuleTableField.FIELD_TYPE_boolean, 'secure', true, true, false),
            new ModuleTableField(ModuleMailer.PARAM_NAME_AUTH_USER, ModuleTableField.FIELD_TYPE_string, 'auth_user'),
            new ModuleTableField(ModuleMailer.PARAM_NAME_AUTH_PASS, ModuleTableField.FIELD_TYPE_string, 'auth_pass'),
            new ModuleTableField(ModuleMailer.PARAM_NAME_FROM, ModuleTableField.FIELD_TYPE_string, 'from_address', true, true, 'noreply@wedev.fr'),
            new ModuleTableField(ModuleMailer.PARAM_NAME_SUBJECT_PREFIX, ModuleTableField.FIELD_TYPE_string, 'subject_prefix', false, true, '[WEDEV] '),
            new ModuleTableField(ModuleMailer.PARAM_NAME_SUBJECT_SUFFIX, ModuleTableField.FIELD_TYPE_string, 'subject_suffix'),
        ];
        this.datatables = [];
    }
}