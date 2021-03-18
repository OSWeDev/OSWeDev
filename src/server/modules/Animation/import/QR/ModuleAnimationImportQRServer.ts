import ModuleAnimationImportQR from "../../../../../shared/modules/Animation/import/QR/ModuleAnimationImportQR";
import AnimationImportQRVO from "../../../../../shared/modules/Animation/import/QR/vos/AnimationImportQRVO";
import AnimationModuleVO from "../../../../../shared/modules/Animation/vos/AnimationModuleVO";
import AnimationQRVO from "../../../../../shared/modules/Animation/vos/AnimationQRVO";
import ModuleDAO from "../../../../../shared/modules/DAO/ModuleDAO";
import DataImportFormatVO from "../../../../../shared/modules/DataImport/vos/DataImportFormatVO";
import DataImportHistoricVO from "../../../../../shared/modules/DataImport/vos/DataImportHistoricVO";
import DataImportLogVO from "../../../../../shared/modules/DataImport/vos/DataImportLogVO";
import FileVO from "../../../../../shared/modules/File/vos/FileVO";
import ConsoleHandler from "../../../../../shared/tools/ConsoleHandler";
import DataImportModuleBase from "../../../DataImport/DataImportModuleBase/DataImportModuleBase";
import ImportLogger from "../../../DataImport/logger/ImportLogger";
import ModuleAnimationImportQRDefaultFormats from "./ModuleAnimationImportQRDefaultFormat";



export default class ModuleAnimationImportQRServer extends DataImportModuleBase<AnimationImportQRVO> {

    public static getInstance(): ModuleAnimationImportQRServer {
        if (!ModuleAnimationImportQRServer.instance) {
            ModuleAnimationImportQRServer.instance = new ModuleAnimationImportQRServer();
        }
        return ModuleAnimationImportQRServer.instance;
    }

    private static instance: ModuleAnimationImportQRServer = null;

    private constructor() {
        super(ModuleAnimationImportQR.getInstance().name);
    }

    // /**
    //  * On définit les droits d'accès du module
    //  */
    // public async registerAccessPolicies(): Promise<void> {
    //     let group: AccessPolicyGroupVO = AccessPolicyServerController.getInstance().get_registered_policy_group(ModuleAnimation.POLICY_GROUP);

    //     let access: AccessPolicyVO = new AccessPolicyVO();
    //     access.group_id = group.id;
    //     access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    //     access.translatable_name = ModuleAnimationImportQR.POLICY_BO_ACCESS;
    //     access = await ModuleAccessPolicyServer.getInstance().registerPolicy(access, new DefaultTranslation({
    //         fr: 'Importer les modules animation'
    //     }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    //     let access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
    //     access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
    //     access_dependency.src_pol_id = access.id;
    //     access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAnimation.POLICY_BO_OTHERS_ACCESS).id;
    //     access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(access_dependency);
    // }

    public get_merged_api_type_ids(): string[] {
        return [AnimationQRVO.API_TYPE_ID];
    }

    public async hook_merge_imported_datas_in_database(QRDatas: AnimationImportQRVO[], historic: DataImportHistoricVO): Promise<boolean> {

        let format: DataImportFormatVO = await ModuleDAO.getInstance().getVoById<DataImportFormatVO>(DataImportFormatVO.API_TYPE_ID, historic.data_import_format_id);

        let res: boolean = true;
        try {

            res = res && await this.merge_imported_datas(QRDatas);

        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            await ImportLogger.getInstance().log(historic, format, "Erreur de posttraitement : " + error, DataImportLogVO.LOG_LEVEL_FATAL);
            res = false;
        }
        return res;
    }

    public async registerImport(): Promise<void> {
        await ModuleAnimationImportQRDefaultFormats.getInstance().AnimationImportQRDefaultFormatLabels();
    }

    private async merge_imported_datas(QRDatas: AnimationImportQRVO[]): Promise<boolean> {

        if (!QRDatas || !QRDatas.length) {
            return false;
        }

        let modules: AnimationModuleVO[] = await ModuleDAO.getInstance().getVos(AnimationModuleVO.API_TYPE_ID);
        let QRsInDB: AnimationQRVO[] = await ModuleDAO.getInstance().getVos(AnimationQRVO.API_TYPE_ID);
        let filesInDB: FileVO[] = await ModuleDAO.getInstance().getVos(FileVO.API_TYPE_ID);

        let succeeded = true;
        for (let i in QRDatas) {
            let QRData: AnimationImportQRVO = QRDatas[i];

            if (!this.alreadyPresent(QRData, QRsInDB)) {
                let QR = this.createQRBase(QRData, modules);
                QR = this.verificationFiles(QR, filesInDB);
                let queryRes = await ModuleDAO.getInstance().insertOrUpdateVO(QR);

                if (!queryRes) {
                    succeeded = false;
                }
            }

        }

        return succeeded;
    }
    private verificationFiles(QR: AnimationQRVO, filesInDB: FileVO[]): AnimationQRVO {
        if (QR.question_file_id) {
            let question_file = filesInDB.find((file) => QR.question_file_id == file.id);
            if (!question_file) {
                QR.question_file_id = null;
            }
        }

        if (QR.reponse_file_id) {
            let reponse_file = filesInDB.find((file) => QR.reponse_file_id == file.id);
            if (!reponse_file) {
                QR.reponse_file_id = null;
            }
        }

        return QR;
    }

    private alreadyPresent(QRData: AnimationImportQRVO, QRs: AnimationQRVO[]): boolean {
        let QRName = this.tryParse(QRData.name);
        let alreadyPresentQR = QRs.find((QR: AnimationQRVO) => QR.name == QRName);
        if (alreadyPresentQR) {
            return true;
        }
        return false;
    }

    private createQRBase(QRData: AnimationImportQRVO, modules: AnimationModuleVO[]): AnimationQRVO {
        let QR: AnimationQRVO = new AnimationQRVO();

        QR.description = this.tryParse(QRData.description);
        QR.reponses = this.tryParse(QRData.reponses);
        QR.explicatif = this.tryParse(QRData.explicatif);
        QR.external_video = this.tryParse(QRData.external_video);
        QR.name = this.tryParse(QRData.name);
        QR.weight = this.tryParse(QRData.weight);
        QR.question_file_id = this.tryParse(QRData.question_file_id);
        QR.reponse_file_id = this.tryParse(QRData.reponse_file_id);

        let QR_module = this.tryParse(QRData.module_id_import);
        let associated_module = modules.find((module) => module.id_import == QR_module);
        if (associated_module) {
            QR.module_id = associated_module.id;
        }

        return QR;
    }

    private tryParse(QRDtataValue: string): any {
        let value: any;
        try {
            value = JSON.parse(QRDtataValue);
        } catch (error) {
            value = null;
        }
        return value;
    }

}