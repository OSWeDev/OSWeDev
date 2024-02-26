import ModuleAnimationImportQR from "../../../../../shared/modules/Animation/import/QR/ModuleAnimationImportQR";
import AnimationImportQRVO from "../../../../../shared/modules/Animation/import/QR/vos/AnimationImportQRVO";
import AnimationModuleVO from "../../../../../shared/modules/Animation/vos/AnimationModuleVO";
import AnimationQRVO from "../../../../../shared/modules/Animation/vos/AnimationQRVO";
import { query } from "../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleDataImport from "../../../../../shared/modules/DataImport/ModuleDataImport";
import DataImportFormatVO from "../../../../../shared/modules/DataImport/vos/DataImportFormatVO";
import DataImportHistoricVO from "../../../../../shared/modules/DataImport/vos/DataImportHistoricVO";
import DataImportLogVO from "../../../../../shared/modules/DataImport/vos/DataImportLogVO";
import FileVO from "../../../../../shared/modules/File/vos/FileVO";
import ConsoleHandler from "../../../../../shared/tools/ConsoleHandler";
import ModuleDAOServer from "../../../DAO/ModuleDAOServer";
import DataImportModuleBase from "../../../DataImport/DataImportModuleBase/DataImportModuleBase";
import ImportLogger from "../../../DataImport/logger/ImportLogger";
import ModuleAnimationImportQRDefaultFormats from "./ModuleAnimationImportQRDefaultFormat";



export default class ModuleAnimationImportQRServer extends DataImportModuleBase<AnimationImportQRVO> {

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleAnimationImportQRServer {
        if (!ModuleAnimationImportQRServer.instance) {
            ModuleAnimationImportQRServer.instance = new ModuleAnimationImportQRServer();
        }
        return ModuleAnimationImportQRServer.instance;
    }

    private static instance: ModuleAnimationImportQRServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleAnimationImportQR.getInstance().name);
    }

    // /**
    //  * On définit les droits d'accès du module
    //  */
    // // istanbul ignore next: cannot test registerAccessPolicies
    // public async registerAccessPolicies(): Promise<void> {
    //     let group: AccessPolicyGroupVO = AccessPolicyServerController.get_registered_policy_group(ModuleAnimation.POLICY_GROUP);

    //     let access: AccessPolicyVO = new AccessPolicyVO();
    //     access.group_id = group.id;
    //     access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    //     access.translatable_name = ModuleAnimationImportQR.POLICY_BO_ACCESS;
    //     access = await ModuleAccessPolicyServer.getInstance().registerPolicy(access, DefaultTranslationVO.create_new({
    //         'fr-fr': 'Importer les modules animation'
    //     }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    //     let access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
    //     access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
    //     access_dependency.src_pol_id = access.id;
    //     access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAnimation.POLICY_BO_OTHERS_ACCESS).id;
    //     access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(access_dependency);
    // }

    public get_merged_api_type_ids(): string[] {
        return [AnimationQRVO.API_TYPE_ID];
    }

    public async validate_formatted_data(qr_datas: AnimationImportQRVO[]): Promise<AnimationImportQRVO[]> {

        let modules_db: AnimationModuleVO[] = await query(AnimationModuleVO.API_TYPE_ID).select_vos<AnimationModuleVO>();
        let qr_db: AnimationQRVO[] = await query(AnimationQRVO.API_TYPE_ID).select_vos<AnimationQRVO>();

        for (let qr_data of qr_datas) {

            if (this.alreadyPresent(qr_data, qr_db, modules_db)) {
                qr_data.importation_state = ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED;
                qr_data.not_validated_msg = `Already present in database`;
                continue;
            }

            let associated_module: AnimationModuleVO = modules_db.find((module) => module.id_import == qr_data.module_id_import);

            if (!associated_module) {
                qr_data.importation_state = ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED;
                qr_data.not_validated_msg = `No module corresponding to module_id ${qr_data.module_id_import}`;
                continue;
            }
        }

        return qr_datas;
    }

    public async hook_merge_imported_datas_in_database(QRDatas: AnimationImportQRVO[], historic: DataImportHistoricVO, format: DataImportFormatVO): Promise<boolean> {

        let res: boolean = true;
        try {

            res = res && await this.merge_imported_datas(QRDatas);

        } catch (error) {
            ConsoleHandler.error(error);
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

        let modules: AnimationModuleVO[] = await query(AnimationModuleVO.API_TYPE_ID).select_vos<AnimationModuleVO>();

        let QRsInDB: AnimationQRVO[] = await query(AnimationQRVO.API_TYPE_ID).select_vos<AnimationQRVO>();
        let filesInDB: FileVO[] = await query(FileVO.API_TYPE_ID).select_vos<FileVO>();

        let succeeded = true;
        for (let i in QRDatas) {
            let QRData: AnimationImportQRVO = QRDatas[i];

            if (!this.alreadyPresent(QRData, QRsInDB, modules)) {
                let QR = this.createQRBase(QRData, modules);
                let queryRes = await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(QR);

                if (!queryRes) {
                    succeeded = false;
                    console.log("Import error for: ");
                    console.log(`${QRData.name} with ${QRData.module_id_import} as module_id_import`);
                }
            }

        }

        return succeeded;
    }

    /**
     * searches on weight and module associated
     * @param QRData imported data
     * @param QRs Q&A in db
     * @param modules modules in db
     * @returns true if present in database
     */
    private alreadyPresent(QRData: AnimationImportQRVO, QRs: AnimationQRVO[], modules: AnimationModuleVO[]): boolean {
        let QR_data_weight = this.restoreData(QRData.weight);
        let QR_data_module_id_import = this.restoreData(QRData.module_id_import);
        let QR_data_associated_module = modules.find((module) => module.id_import == QR_data_module_id_import);

        if (QR_data_associated_module) {
            let QR_data_associated_module_id = QR_data_associated_module.id;

            //if there is a Q&A that has same weight and module as the one imported
            let alreadyPresentQR = QRs.find((QR: AnimationQRVO) => QR.weight == QR_data_weight && QR.module_id == QR_data_associated_module_id);

            if (alreadyPresentQR) {
                return true;
            }
        }

        return false;
    }

    private createQRBase(QRData: AnimationImportQRVO, modules: AnimationModuleVO[]): AnimationQRVO {
        let QR: AnimationQRVO = new AnimationQRVO();

        QR.description = this.restoreData(QRData.description);
        QR.reponses = QRData.reponses;
        QR.explicatif = this.restoreData(QRData.explicatif);
        QR.external_video = this.restoreData(QRData.external_video);
        QR.name = this.restoreData(QRData.name);
        QR.weight = this.restoreData(QRData.weight);

        let QR_module = this.restoreData(QRData.module_id_import);
        let associated_module = modules.find((module) => module.id_import == QR_module);
        if (associated_module) {
            QR.module_id = associated_module.id;
        }

        return QR;
    }

    private restoreData(QRDtataValue: string): any {
        let value: any;
        try {
            value = JSON.parse(QRDtataValue);
        } catch (error) {
            value = QRDtataValue;
        }
        return value;
    }

}