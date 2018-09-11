import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleDataImport from '../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportColumnVO from '../../../../shared/modules/DataImport/vos/DataImportColumnVO';
import DataImportFormatVO from '../../../../shared/modules/DataImport/vos/DataImportFormatVO';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import DataImportLogVO from '../../../../shared/modules/DataImport/vos/DataImportLogVO';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppController from '../../../VueAppController';
import DataImportComponent from './component/DataImportComponent';

export default class DataImportAdminVueModule extends VueModuleBase {

    public static DEFAULT_IMPORT_MENU_BRANCH: MenuBranch = new MenuBranch(
        "DataImportAdminVueModule",
        MenuElementBase.PRIORITY_HIGH,
        "fa-upload",
        []
    );

    public static getInstance(): DataImportAdminVueModule {
        if (!DataImportAdminVueModule.instance) {
            DataImportAdminVueModule.instance = new DataImportAdminVueModule();
        }

        return DataImportAdminVueModule.instance;
    }

    private static instance: DataImportAdminVueModule = null;

    private constructor() {

        super(ModuleDataImport.getInstance().name);
    }

    public initialize() {

        // TODO FIXME On donne accès à toutes les personnes qui ont accès aux imports
        // TODO FIXME Au fait la gestion des droits, c'est pas comme ça que ça marche :) on devrait avoir des
        //  droits dans ce genre d'endroits, et vérifier si le droit est actif pour ce compte, et pas partir des rôles
        //  qui auraient hypothétiquement accès à cet élément... A changer ASAP
        if (!
            (
                VueAppController.getInstance().hasRole(ModuleAccessPolicy.ROLE_SUPER_ADMIN) && (
                    (
                        (typeof VueAppController.getInstance().data_user.super_admin === "undefined") &&
                        (typeof VueAppController.getInstance().data_user.admin_central === "undefined") &&
                        (typeof VueAppController.getInstance().data_user.admin === "undefined")
                    ) || (
                        VueAppController.getInstance().data_user.super_admin || VueAppController.getInstance().data_user.admin_central
                    )
                ))) {
            return;
        }

        let importsMenuBranch: MenuBranch = DataImportAdminVueModule.DEFAULT_IMPORT_MENU_BRANCH;

        CRUDComponentManager.getInstance().registerCRUD(
            DataImportHistoricVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("DataImportHistoricVO", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-history"),
                importsMenuBranch),
            this.routes);
        CRUDComponentManager.getInstance().registerCRUD(
            DataImportLogVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("DataImportLogVO", MenuElementBase.PRIORITY_HIGH, "fa-info-circle"),
                importsMenuBranch),
            this.routes);
        CRUDComponentManager.getInstance().registerCRUD(
            DataImportFormatVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("DataImportFormatVO", MenuElementBase.PRIORITY_LOW, "fa-cogs"),
                importsMenuBranch),
            this.routes);
        CRUDComponentManager.getInstance().registerCRUD(
            DataImportColumnVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("DataImportColumnVO", MenuElementBase.PRIORITY_ULTRALOW, "fa-cogs"),
                importsMenuBranch),
            this.routes);

        // Sur le menu global des imports on propose :
        //  - TODO FIXME : [la ou les pages d'importation qui regroupent plusieurs fichiers à importer]
        //  - l'historique des imports
        //  - les logs détaillés
        //  - les formats d'import
        //  - les colonnes des formats
        // TODO FIXME : On a un sous-menu "groupes" avec les groupes de api_type_ids qui utilisent un fichier commun :
        //  - TODO FIXME : la page qui permet de faire les imports en une fois
        // On va créer une branche pour chaque api_type_id importable, et proposer :
        //  - TODO FIXME : la page d'importation dédiée
        //  - l'historique des imports => lien vers le crud global de ce type mais pré-filtré
        //  - les logs détaillés => lien vers le crud global de ce type mais pré-filtré
        //  - la table intermédiaire d'importation
        //  - les formats d'import => liens vers le crud global pré-filtré
        for (let i in VOsTypesManager.getInstance().moduleTables_by_voType) {
            let moduleTable = VOsTypesManager.getInstance().moduleTables_by_voType[i];

            if (!moduleTable.importable) {
                continue;
            }

            let importMenuBranch: MenuBranch = new MenuBranch("__i__" + moduleTable.vo_type, MenuElementBase.PRIORITY_MEDIUM, "fa-upload", []);

            let raw_api_type_id: string = ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(moduleTable.vo_type);
            CRUDComponentManager.getInstance().defineMenuRouteToCRUD(
                DataImportHistoricVO.API_TYPE_ID,
                new MenuPointer(
                    new MenuLeaf("DataImportHistoricVO_" + moduleTable.vo_type, MenuElementBase.PRIORITY_ULTRAHIGH, "fa-history"),
                    importsMenuBranch,
                    importMenuBranch),
                this.routes,
                {
                    FILTER__api_type_id: moduleTable.vo_type,
                });

            CRUDComponentManager.getInstance().defineMenuRouteToCRUD(
                DataImportLogVO.API_TYPE_ID,
                new MenuPointer(
                    new MenuLeaf("DataImportLogVO_" + moduleTable.vo_type, MenuElementBase.PRIORITY_HIGH, "fa-info-circle"),
                    importsMenuBranch,
                    importMenuBranch),
                this.routes,
                {
                    FILTER__api_type_id: moduleTable.vo_type,
                });

            CRUDComponentManager.getInstance().registerCRUD(
                raw_api_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(raw_api_type_id, MenuElementBase.PRIORITY_MEDIUM, "fa-table"),
                    importsMenuBranch,
                    importMenuBranch),
                this.routes);

            CRUDComponentManager.getInstance().defineMenuRouteToCRUD(
                DataImportFormatVO.API_TYPE_ID,
                new MenuPointer(
                    new MenuLeaf("DataImportFormatVO_" + moduleTable.vo_type, MenuElementBase.PRIORITY_LOW, "fa-cogs"),
                    importsMenuBranch,
                    importMenuBranch),
                this.routes,
                {
                    FILTER__api_type_id: moduleTable.vo_type,
                });
        }
    }
}