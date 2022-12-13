import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ExportHistoricVO from '../../../shared/modules/DataExport/vos/ExportHistoricVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../env/ConfigurationService';
import EnvParam from '../../env/EnvParam';
import StackContext from '../../StackContext';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleMailerServer from '../Mailer/ModuleMailerServer';
import default_mail_html_template from './default_export_mail_html_template.html';
import IExportableDatas from './interfaces/IExportableDatas';
import IExportHandler from './interfaces/IExportHandler';
import ModuleDataExportServer from './ModuleDataExportServer';
import default_mail_html_template_error from './default_export_mail_html_template_error.html';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';

export default abstract class ExportHandlerBase implements IExportHandler {

    public static CODE_TEXT_MAIL_SUBJECT_DEFAULT: string = 'export.default_mail.subject';
    public static CODE_TEXT_MAIL_SUBJECT_DEFAULT_ERROR: string = 'export.default_mail_error.subject';

    protected constructor() { }

    public abstract prepare_datas(exhi: ExportHistoricVO): Promise<IExportableDatas>;

    /**
     * Par défaut on exporte au format XLSX avec la fonction exportDataToXLSX
     * @param exhi
     * @param datas
     */
    public async export(exhi: ExportHistoricVO, datas: IExportableDatas): Promise<boolean> {

        try {
            if (!datas.datas) {
                throw new Error('Pas de datas à exporter pour l\'export :' + exhi.id + ':' + exhi.export_type_id + ':');
            }

            let file: FileVO = await ModuleDataExportServer.getInstance().exportDataToXLSXFile(
                datas.filename, datas.datas, datas.ordered_column_list, datas.column_labels, datas.api_type_id,
                exhi.export_is_secured, exhi.export_file_access_policy_name
            );
            exhi.exported_file_id = file.id;
        } catch (error) {
            ConsoleHandler.error(error);
            return false;
        }

        return true;
    }

    /**
     * Par défaut on utilise le compte utilisateur fourni pour définir la langue, et on envoi par mail avec un template simple
     *  et un lien de téléchargement du fichier si le fichier existe
     */
    public async send(exhi: ExportHistoricVO): Promise<boolean> {

        try {

            if (!exhi.export_to_uid) {
                ConsoleHandler.error('Impossible d\'envoyer par défaut sans choix de langue - Not implemented');
                return false;
            }

            let envParam: EnvParam = ConfigurationService.node_configuration;

            let user_id: number = ModuleAccessPolicyServer.getInstance().getLoggedUserId();
            let user: UserVO = null;
            if (user_id == exhi.export_to_uid) {
                user = await ModuleAccessPolicyServer.getInstance().getSelfUser();
            } else {
                user = await query(UserVO.API_TYPE_ID).filter_by_id(exhi.export_to_uid).select_vo<UserVO>();
                if (!user) {
                    ConsoleHandler.error('Failed loading user');
                    return false;
                }
            }

            let subject: TranslatableTextVO;
            let content: string;
            let mail_param: {} = {};

            if (!!exhi.exported_file_id) {
                let exported_file: FileVO = !!exhi.exported_file_id ? await query(FileVO.API_TYPE_ID).filter_by_id(exhi.exported_file_id).select_vo<FileVO>() : null;
                subject = await ModuleTranslation.getInstance().getTranslatableText(ExportHandlerBase.CODE_TEXT_MAIL_SUBJECT_DEFAULT);
                content = default_mail_html_template;

                mail_param = {
                    EXPORT_TYPE_ID: exhi.export_type_id,
                    FILE_URL: envParam.BASE_URL + exported_file.path.replace(/^[.][/]/, '/')
                };

            } else {
                subject = await ModuleTranslation.getInstance().getTranslatableText(ExportHandlerBase.CODE_TEXT_MAIL_SUBJECT_DEFAULT_ERROR);
                content = default_mail_html_template_error;

                mail_param = {
                    EXPORT_TYPE_ID: exhi.export_type_id
                };
            }

            let translated_mail_subject: string = await ModuleMailerServer.getInstance().prepareHTML(
                (await ModuleTranslation.getInstance().getTranslation(user.lang_id, subject.id)).translated, user.lang_id, mail_param);

            let prepared_html: string = await ModuleMailerServer.getInstance().prepareHTML(content, user.lang_id, mail_param);

            await ModuleMailerServer.getInstance().sendMail({
                to: user.email,
                subject: translated_mail_subject,
                html: prepared_html
            });

            for (let i in exhi.export_to_mails) {
                await ModuleMailerServer.getInstance().sendMail({
                    to: exhi.export_to_mails[i],
                    subject: translated_mail_subject,
                    html: prepared_html
                });
            }
        } catch (error) {
            ConsoleHandler.error(error);
            return false;
        }

        return true;
    }
}