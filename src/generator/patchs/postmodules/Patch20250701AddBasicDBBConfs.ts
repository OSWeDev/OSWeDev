import { IDatabase } from "pg-promise";
import AccessPolicyServerController from "../../../server/modules/AccessPolicy/AccessPolicyServerController";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import ModuleAccessPolicy from "../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import DBBConfVO from "../../../shared/modules/DashboardBuilder/vos/DBBConfVO";
import DashboardVO from "../../../shared/modules/DashboardBuilder/vos/DashboardVO";
import DashboardWidgetVO from "../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO";
import NumSegment from "../../../shared/modules/DataRender/vos/NumSegment";
import { field_names } from "../../../shared/tools/ObjectHandler";
import { all_promises } from "../../../shared/tools/PromiseTools";
import RangeHandler from "../../../shared/tools/RangeHandler";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20250701AddBasicDBBConfs implements IGeneratorWorker {

    private static instance: Patch20250701AddBasicDBBConfs = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250701AddBasicDBBConfs';
    }

    public static getInstance(): Patch20250701AddBasicDBBConfs {
        if (!Patch20250701AddBasicDBBConfs.instance) {
            Patch20250701AddBasicDBBConfs.instance = new Patch20250701AddBasicDBBConfs();
        }
        return Patch20250701AddBasicDBBConfs.instance;
    }

    public async work(db: IDatabase<unknown>) {
        // On crée des confs par défaut pour les DBB
        // Donc en particulier, la cnof DBB full pour les admins
        // La conf DBB DMS / activée pour les admins ici mais pour ouverture potentiellement à d'autres utilisateurs
        // La conf DBB Templates de consultation des VOs / qui permet d'accéder aux DBBs / confs liées aux template de vos, mais uniquement pour la consultation des VOs, pas de formulaires
        // La conf DBB Tempalte VO CRUD, complète, pour gérer aussi les formulaires de CRUD des VOs

        await all_promises([
            this.add_basic_admin_conf(),
            this.add_cms_conf(),
            this.add_templates_consultation_conf(),
            this.add_templates_create_update_conf(),
        ]);

        // Une fois qu'on a des confs, on affecte par défaut à la conf admin tous les dbs existants
        const all_dbs: DashboardVO[] = await query(DashboardVO.API_TYPE_ID)
            .filter_is_null_or_empty(field_names<DashboardVO>().dbb_conf_id) // On ne prend que les dbs qui n'ont pas de conf
            .exec_as_server()
            .select_vos<DashboardVO>();
        const conf: DBBConfVO = await query(DBBConfVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<DBBConfVO>().name, DBBConfVO.CONF_NAME_DBB_FULL)
            .exec_as_server()
            .select_vo<DBBConfVO>();
        for (const i in all_dbs) {
            const dbb: DashboardVO = all_dbs[i];

            // On affecte la conf admin par défaut
            dbb.dbb_conf_id = conf.id;

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(dbb);
        }
    }

    private async add_basic_admin_conf() {
        let conf: DBBConfVO = await query(DBBConfVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<DBBConfVO>().name, DBBConfVO.CONF_NAME_DBB_FULL)
            .exec_as_server()
            .select_vo<DBBConfVO>();

        if (conf) {
            // Si la conf existe déjà, on ne la recrée pas
            return;
        }

        conf = new DBBConfVO();

        conf.name = DBBConfVO.CONF_NAME_DBB_FULL;
        conf.description = "Dashboard Builder complet pour les admins, accès à tous les Dashboards et à tous les widgets sans restrictions.";
        conf.is_main_admin_conf = true; // Cette conf est la conf principale pour les admins, elle est donc utilisée par défaut pour les admins et surtout elle permet d'accèder à tous les dbs quelques soit la conf actuellement liée au db
        conf.weight = 0; // On la met en premier
        conf.is_active = true; // La conf est active par défaut
        conf.role_id_ranges = [RangeHandler.create_single_elt_NumRange(AccessPolicyServerController.get_registered_role(ModuleAccessPolicy.ROLE_ADMIN).id, NumSegment.TYPE_INT)]; // Admins
        conf.valid_widget_id_ranges = null; // Pas de restriction sur les widgets
        conf.valid_moduletable_id_ranges = null; // Pas de restriction sur les tables
        conf.has_access_to_tables_tab = true; // Accès à l'onglet Tables
        conf.has_access_to_tables_tab_graph = true; // Accès à l'onglet Graphes des tables
        conf.has_access_to_templating_options = true; // Accès aux options de templating
        conf.has_access_to_create_or_update_crud_templating_option = true; // Accès à la création et à la modification des options de templating
        conf.has_access_to_widgets_tab = true; // Accès à l'onglet Widgets
        conf.has_access_to_menus_tab = true; // Accès à l'onglet Menus
        conf.has_access_to_shared_filters_tab = true; // Accès à l'onglet Filtres partagés
        conf.has_access_to_export_to_json = true; // Accès à l'export des DB en JSON
        conf.has_access_to_import_from_json = true; // Accès à l'import des DB en JSON

        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(conf);
    }

    private async add_cms_conf() {
        let conf: DBBConfVO = await query(DBBConfVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<DBBConfVO>().name, DBBConfVO.CONF_NAME_DBB_CMS)
            .exec_as_server()
            .select_vo<DBBConfVO>();

        if (conf) {
            // Si la conf existe déjà, on ne la recrée pas
            return;
        }

        conf = new DBBConfVO();

        const all_cms_widgets = await query(DashboardWidgetVO.API_TYPE_ID)
            .filter_by_text_has(field_names<DashboardWidgetVO>().name, [
                DashboardWidgetVO.WIDGET_NAME_cmsbloctext,
                DashboardWidgetVO.WIDGET_NAME_cmsimage,
                DashboardWidgetVO.WIDGET_NAME_cmslinkbutton,
                DashboardWidgetVO.WIDGET_NAME_cmslikebutton,
                DashboardWidgetVO.WIDGET_NAME_cmsbooleanbutton,
                DashboardWidgetVO.WIDGET_NAME_cmsprintparam,
                DashboardWidgetVO.WIDGET_NAME_cmsvisionneusepdf,
                DashboardWidgetVO.WIDGET_NAME_crudbuttons,
            ])
            .select_vos<DashboardWidgetVO>();

        conf.name = DBBConfVO.CONF_NAME_DBB_CMS;
        conf.description = "CMS Builder pour permettre la gestion des contenus du site web, orienté vers les widgets CMS (bloctext, image, lien, like, ...).";
        conf.is_main_admin_conf = false;
        conf.weight = 1;
        conf.is_active = true; // La conf est active par défaut
        conf.role_id_ranges = [RangeHandler.create_single_elt_NumRange(AccessPolicyServerController.get_registered_role(ModuleAccessPolicy.ROLE_ADMIN).id, NumSegment.TYPE_INT)]; // Admins par défaut
        conf.valid_widget_id_ranges = RangeHandler.get_ids_ranges_from_vos(all_cms_widgets);
        conf.valid_moduletable_id_ranges = null; // Pas de restriction sur les tables => à configurer dans les projets concernés

        conf.has_access_to_tables_tab = false; // Par défaut on part du principe que les CMS n'ont pas de tables
        conf.has_access_to_tables_tab_graph = false; // Par défaut on part du principe que les CMS n'ont pas de tables
        conf.has_access_to_templating_options = false; // Par défaut on part du principe que les CMS n'ont pas de tables
        conf.has_access_to_create_or_update_crud_templating_option = false; // Par défaut on part du principe que les CMS n'ont pas de tables

        conf.has_access_to_widgets_tab = true; // Accès à l'onglet Widgets
        conf.has_access_to_menus_tab = true; // Accès à l'onglet Menus
        conf.has_access_to_shared_filters_tab = false; // Par défaut on part du principe que les CMS n'ont pas de filtres
        conf.has_access_to_export_to_json = false; // Par défaut on part du principe que les imports/exports sont pas utiles sur le CMS
        conf.has_access_to_import_from_json = false; // Par défaut on part du principe que les imports/exports sont pas utiles sur le CMS

        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(conf);
    }

    private async add_templates_consultation_conf() {
        let conf: DBBConfVO = await query(DBBConfVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<DBBConfVO>().name, DBBConfVO.CONF_NAME_DBB_TEMPLATES_CONSULTATION)
            .exec_as_server()
            .select_vo<DBBConfVO>();

        if (conf) {
            // Si la conf existe déjà, on ne la recrée pas
            return;
        }

        const all_cms_widgets = await query(DashboardWidgetVO.API_TYPE_ID)
            .filter_by_text_has(field_names<DashboardWidgetVO>().name, [
                DashboardWidgetVO.WIDGET_NAME_cmsbloctext,
                DashboardWidgetVO.WIDGET_NAME_cmsimage,
                DashboardWidgetVO.WIDGET_NAME_cmslinkbutton,
                DashboardWidgetVO.WIDGET_NAME_cmslikebutton,
                DashboardWidgetVO.WIDGET_NAME_cmsbooleanbutton,
                DashboardWidgetVO.WIDGET_NAME_cmsprintparam,
                DashboardWidgetVO.WIDGET_NAME_cmsvisionneusepdf,
                DashboardWidgetVO.WIDGET_NAME_crudbuttons,
            ])
            .select_vos<DashboardWidgetVO>();


        const all_template_consultation_widgets = await query(DashboardWidgetVO.API_TYPE_ID)
            .filter_by_text_has(field_names<DashboardWidgetVO>().name, [
                DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_bloctext,
                DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_crudbuttons,
                DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_image,
                DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_linkbutton,
                DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_visionneusepdf,
            ])
            .select_vos<DashboardWidgetVO>();

        const all_widgets = all_cms_widgets.concat(all_template_consultation_widgets);

        conf = new DBBConfVO();

        conf.name = DBBConfVO.CONF_NAME_DBB_TEMPLATES_CONSULTATION;
        conf.description = "Templates de consultation des données, accès aux DBBs / confs liées aux template de vos, mais uniquement pour la consultation des VOs, pas de formulaires.";
        conf.is_main_admin_conf = false; // Pas une conf d'admin
        conf.weight = 2; // On la met après la conf CMS
        conf.is_active = true; // La conf est active par défaut
        conf.role_id_ranges = [RangeHandler.create_single_elt_NumRange(AccessPolicyServerController.get_registered_role(ModuleAccessPolicy.ROLE_ADMIN).id, NumSegment.TYPE_INT)]; // Admins par défaut
        conf.valid_widget_id_ranges = RangeHandler.get_ids_ranges_from_vos(all_widgets); // On ne prend que les widgets de template / consultation de VO + les widgets de CMS
        conf.valid_moduletable_id_ranges = null; // Pas de restriction sur les tables

        conf.has_access_to_tables_tab = true; // Accès à l'onglet Tables
        conf.has_access_to_tables_tab_graph = false; // Pas d'accès par défaut au graph des tables, par ce qu'en consultation on a pas forcément besoin de faire des liens vers d'autres tables
        conf.has_access_to_templating_options = true; // Pas d'accès aux options de templating
        conf.has_access_to_create_or_update_crud_templating_option = false; // Pas d'accès à la création et à la modification des options de templating

        conf.has_access_to_widgets_tab = true; // Accès à l'onglet Widgets
        conf.has_access_to_menus_tab = false; // Compliqué de configurer un lien de menu sur un template, il faudrait créer un lien de menu par vo en fait du coup
        conf.has_access_to_shared_filters_tab = false; // Par défaut on part du principe que les templates de consultation n'ont pas de filtres partagés
        conf.has_access_to_export_to_json = false; // Par défaut on part du principe que les imports/exports sont pas utile sur les templates de consultation
        conf.has_access_to_import_from_json = false; // Par défaut on part du principe que les imports/exports sont pas utiles sur les templates de consultation

        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(conf);
    }

    private async add_templates_create_update_conf() {
        let conf: DBBConfVO = await query(DBBConfVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<DBBConfVO>().name, DBBConfVO.CONF_NAME_DBB_TEMPLATES_CREATE_UPDATE)
            .exec_as_server()
            .select_vo<DBBConfVO>();

        if (conf) {
            // Si la conf existe déjà, on ne la recrée pas
            return;
        }

        const all_cms_widgets = await query(DashboardWidgetVO.API_TYPE_ID)
            .filter_by_text_has(field_names<DashboardWidgetVO>().name, [
                DashboardWidgetVO.WIDGET_NAME_cmsbloctext,
                DashboardWidgetVO.WIDGET_NAME_cmsimage,
                DashboardWidgetVO.WIDGET_NAME_cmslinkbutton,
                DashboardWidgetVO.WIDGET_NAME_cmslikebutton,
                DashboardWidgetVO.WIDGET_NAME_cmsbooleanbutton,
                DashboardWidgetVO.WIDGET_NAME_cmsprintparam,
                DashboardWidgetVO.WIDGET_NAME_cmsvisionneusepdf,
                DashboardWidgetVO.WIDGET_NAME_crudbuttons,
            ])
            .select_vos<DashboardWidgetVO>();


        const all_template_consultation_widgets = await query(DashboardWidgetVO.API_TYPE_ID)
            .filter_by_text_has(field_names<DashboardWidgetVO>().name, [
                DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_bloctext,
                DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_crudbuttons,
                DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_image,
                DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_linkbutton,
                DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_visionneusepdf,
            ])
            .select_vos<DashboardWidgetVO>();

        // TODO add the CRUD widgets for templates later

        const all_widgets = all_cms_widgets.concat(all_template_consultation_widgets);

        conf = new DBBConfVO();

        conf.name = DBBConfVO.CONF_NAME_DBB_TEMPLATES_CREATE_UPDATE;
        conf.description = "Formulaires de saisie des données, accès aux DBBs / confs liées aux template de vos, mais pour la création et la modification des VOs.";
        conf.is_main_admin_conf = false; // Pas une conf d'admin
        conf.weight = 3; // On la met après la conf de consultation
        conf.is_active = true; // La conf est active par défaut
        conf.role_id_ranges = [RangeHandler.create_single_elt_NumRange(AccessPolicyServerController.get_registered_role(ModuleAccessPolicy.ROLE_ADMIN).id, NumSegment.TYPE_INT)]; // Admins par défaut
        conf.valid_widget_id_ranges = RangeHandler.get_ids_ranges_from_vos(all_widgets); // On ne prend que les widgets de template / CRUD + les widgets de CMS
        conf.valid_moduletable_id_ranges = null; // Pas de restriction sur les tables

        conf.has_access_to_tables_tab = true; // Accès à l'onglet Tables
        conf.has_access_to_tables_tab_graph = false; // Pas d'accès par défaut au graph des tables, par ce qu'en consultation on a pas forcément besoin de faire des liens vers d'autres tables
        conf.has_access_to_templating_options = true; // Accès aux options de templating
        conf.has_access_to_create_or_update_crud_templating_option = true; // Accès au mode template + formulaire

        conf.has_access_to_widgets_tab = true; // Accès à l'onglet Widgets

        conf.has_access_to_menus_tab = true; // On peut avoir un lien de menu vers un formulaire de création

        conf.has_access_to_shared_filters_tab = false; // Par défaut on part du principe que les templates de création / modification n'ont pas de filtres partagés
        conf.has_access_to_export_to_json = false; // Par défaut on part du principe que les imports/exports sont pas utile sur les templates de création / modification
        conf.has_access_to_import_from_json = false; // Par défaut on part du principe que les imports/exports sont pas utiles sur les templates de création / modification

        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(conf);
    }
}