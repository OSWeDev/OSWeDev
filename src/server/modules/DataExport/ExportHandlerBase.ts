import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ExportHistoricVO from '../../../shared/modules/DataExport/vos/ExportHistoricVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../env/ConfigurationService';
import EnvParam from '../../env/EnvParam';
import ModuleMailerServer from '../Mailer/ModuleMailerServer';
import default_mail_html_template from './default_export_mail_html_template.html';
import IExportableDatas from './interfaces/IExportableDatas';
import IExportHandler from './interfaces/IExportHandler';
import ModuleDataExportServer from './ModuleDataExportServer';
import ExportDataToXLSXParamVO from '../../../shared/modules/DataExport/vos/apis/ExportDataToXLSXParamVO';

export default abstract class ExportHandlerBase implements IExportHandler {

    public static CODE_TEXT_MAIL_SUBJECT_DEFAULT: string = 'export.default_mail.subject';

    protected constructor() { }

    public abstract async prepare_datas(exhi: ExportHistoricVO): Promise<IExportableDatas>;

    /**
     * Par défaut on exporte au format XLSX avec la fonction exportDataToXLSX
     * @param exhi
     * @param datas
     */
    public async export(exhi: ExportHistoricVO, datas: IExportableDatas): Promise<boolean> {

        try {

            let file: FileVO = await ModuleDataExportServer.getInstance().exportDataToXLSXFile(new ExportDataToXLSXParamVO(
                datas.filename, datas.datas, datas.ordered_column_list, datas.column_labels, datas.api_type_id,
                exhi.export_is_secured, exhi.export_file_access_policy_name
            ));
            exhi.exported_file_id = file.id;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            return false;
        }

        return true;
    }

    /**
     * Par défaut on utilise le compte utilisateur fourni pour définir la langue, et on envoi par mail avec un template simple
     *  et un lien de téléchargement du fichier.
     */
    public async send(exhi: ExportHistoricVO): Promise<boolean> {

        try {

            if (!exhi.export_to_uid) {
                ConsoleHandler.getInstance().error('Impossible d\'envoyer par défaut sans choix de langue - Not implemented');
                return false;
            }

            let envParam: EnvParam = ConfigurationService.getInstance().getNodeConfiguration();

            if (!exhi.exported_file_id) {
                return false;
            }

            let exported_file: FileVO = await ModuleDAO.getInstance().getVoById<FileVO>(FileVO.API_TYPE_ID, exhi.exported_file_id);
            let default_export_mail_subject: TranslatableTextVO = await ModuleTranslation.getInstance().getTranslatableText(ExportHandlerBase.CODE_TEXT_MAIL_SUBJECT_DEFAULT);

            let user: UserVO = await ModuleDAO.getInstance().getVoById<UserVO>(UserVO.API_TYPE_ID, exhi.export_to_uid);

            let translated_mail_subject: string = await ModuleMailerServer.getInstance().prepareHTML(
                (await ModuleTranslation.getInstance().getTranslation(user.lang_id, default_export_mail_subject.id)).translated,
                user.lang_id, {
                EXPORT_TYPE_ID: exhi.export_type_id,
                FILE_URL: envParam.BASE_URL + exported_file.path.replace(/^[.][/]/, '/')
            });
            let prepared_html: string = await ModuleMailerServer.getInstance().prepareHTML(default_mail_html_template, user.lang_id, {
                EXPORT_TYPE_ID: exhi.export_type_id,
                FILE_URL: envParam.BASE_URL + exported_file.path.replace(/^[.][/]/, '/')
            });

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
            ConsoleHandler.getInstance().error(error);
            return false;
        }

        return true;
    }
}