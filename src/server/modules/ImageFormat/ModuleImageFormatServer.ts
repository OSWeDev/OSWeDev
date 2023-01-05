import * as fs from 'fs';
import * as jimp from 'jimp';
import * as path from 'path';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleFile from '../../../shared/modules/File/ModuleFile';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import ModuleImageFormat from '../../../shared/modules/ImageFormat/ModuleImageFormat';
import FormattedImageVO from '../../../shared/modules/ImageFormat/vos/FormattedImageVO';
import ImageFormatVO from '../../../shared/modules/ImageFormat/vos/ImageFormatVO';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';

export default class ModuleImageFormatServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleImageFormatServer.instance) {
            ModuleImageFormatServer.instance = new ModuleImageFormatServer();
        }
        return ModuleImageFormatServer.instance;
    }

    private static instance: ModuleImageFormatServer = null;

    private constructor() {
        super(ModuleImageFormat.getInstance().name);
    }

    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleImageFormat.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'Formats d\'image'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleImageFormat.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration des Formats d\'image'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    public async configure() {
        let postUpdateTrigger: DAOPostUpdateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);

        // Quand on change un fichier on check si on doit changer l'url d'une image formattee au passage.
        postUpdateTrigger.registerHandler(FileVO.API_TYPE_ID, this, this.force_formatted_image_path_from_file_changed);
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleImageFormat.APINAME_get_formatted_image, this.get_formatted_image.bind(this));
    }

    private async force_formatted_image_path_from_file_changed(vo_update_handler: DAOUpdateVOHolder<FileVO>) {
        let fimgs: FormattedImageVO[] = await query(FormattedImageVO.API_TYPE_ID).filter_by_num_eq('file_id', vo_update_handler.post_update_vo.id).select_vos<FormattedImageVO>();

        if ((!fimgs) || (!fimgs.length)) {
            return;
        }

        for (let i in fimgs) {
            let fimg = fimgs[i];

            fimg.formatted_src = vo_update_handler.post_update_vo.path;
            await ModuleDAO.getInstance().insertOrUpdateVO(fimg);
        }
    }

    private async get_formatted_image(
        src: string,
        format_name: string,
        width: number,
        height: number): Promise<FormattedImageVO> {

        if ((!format_name) || (!height) || (!src) || (!width)) {
            return null;
        }

        try {

            let param_height = parseInt(height.toString());
            let param_width = parseInt(width.toString());

            let format: ImageFormatVO = await query(ImageFormatVO.API_TYPE_ID).filter_by_text_eq('name', format_name, ImageFormatVO.API_TYPE_ID, true).select_vo<ImageFormatVO>();

            if (!format) {
                ConsoleHandler.getInstance().error('Impossible de charger le format d\'image :' + format_name);
                return null;
            }

            param_height = !!format.height ? format.height : param_height;
            param_width = !!format.width ? format.width : param_width;

            /**
             * On tente de trouver une image cohérente (même format et résolution proche)
             *  Si on trouve, on envoie l'image
             *  Si on trouve pas on génère la nouvelle image et on la renvoie
             */
            let fis: FormattedImageVO[] = await query(FormattedImageVO.API_TYPE_ID)
                .filter_by_text_eq('name', format_name, ImageFormatVO.API_TYPE_ID)
                .filter_by_text_eq('image_src', src)
                .select_vos<FormattedImageVO>();

            let res_diff_min_value: number = null;
            let res_diff_min_fi: FormattedImageVO = null;

            if (fis && (fis.length > 1)) {

                let param_res = param_height * param_width;
                for (let i in fis) {
                    let fi = fis[i];

                    let fi_res = fi.image_height * fi.image_width;

                    /**
                     * Si l'image couvre pas, on ignore
                     *  Attention, on définit que l'image couvre par rapport à la couverture du nouveau format. Ya peut-etre un trou ici à surveiller
                     */
                    if ((param_height > fi.image_height) || (param_width > fi.image_width)) {
                        continue;
                    }

                    /**
                     * TODO FIXME pour l'instant on fait simple si on trouve pas on crée
                     */
                    if (fi_res != param_res) {
                        continue;
                    }

                    // /**
                    //  * Si la res est > à +100% (*2) on ignore aussi
                    //  */
                    // if (fi_res > (param_res * 2)) {
                    //     continue;
                    // }

                    /**
                     * Sinon, on voit si on fait mieux
                     */
                    let res_diff = fi_res - param_res;
                    if ((res_diff_min_value == null) || (res_diff < res_diff_min_value)) {
                        res_diff_min_value = res_diff;
                        res_diff_min_fi = fi;
                    }
                }
            }

            if (res_diff_min_fi) {
                return res_diff_min_fi;
            }

            /**
             * Sinon il faut générer l'image
             */
            let extname: string = path.extname(src);
            let new_src: string = ModuleImageFormat.RESIZABLE_IMGS_PATH_BASE + format.name + "/" + src.replace(ModuleFile.FILES_ROOT, '').replace(extname, '') + '__' + param_width + '_' + param_height + extname;

            let image = await jimp.read(src);

            let base_image_width: number = image.getWidth();
            let base_image_height: number = image.getHeight();

            if (!image) {
                ConsoleHandler.getInstance().error('Impossible de charger l\'image à cette url :' + new_src);
                return null;
            }

            if ((!format.remplir_haut) && (!format.remplir_larg)) {
                let ratio_height: number = param_height ? (base_image_height / param_height) : 0;
                let ratio_width: number = param_width ? (base_image_width / param_width) : 0;

                if (ratio_height > ratio_width) {
                    // On veut remplir en hauteur uniquement : resize largeur fixée, hauteur auto
                    image.resize(jimp.AUTO, param_height);
                } else if (ratio_width > ratio_height) {
                    // On veut remplir en largeur uniquement : resize hauteur fixée, largeur auto
                    image.resize(param_width, jimp.AUTO);
                } else {
                    // contain
                    image.contain(param_width, param_height);
                }

            } else if (!format.remplir_haut) {
                // On veut remplir en largeur uniquement : resize hauteur fixée, largeur auto
                image.resize(jimp.AUTO, param_height);

            } else if (!format.remplir_larg) {
                // On veut remplir en hauteur uniquement : resize largeur fixée, hauteur auto
                image.resize(param_width, jimp.AUTO);

            } else {
                // On veut tout remplir : cover
                image.cover(param_width, param_height);
            }

            let new_img_file: FileVO = new FileVO();
            new_img_file.is_secured = false;
            new_img_file.path = new_src;

            let src_dirname: string = path.dirname(new_img_file.path);
            if (!fs.existsSync(src_dirname)) {
                fs.mkdirSync(src_dirname, { recursive: true });
            }

            await image.writeAsync(new_img_file.path);

            let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(new_img_file);
            new_img_file.id = res.id;

            let new_img_formattee: FormattedImageVO = new FormattedImageVO();
            new_img_formattee.align_haut = format.align_haut;
            new_img_formattee.align_larg = format.align_larg;
            new_img_formattee.file_id = new_img_file.id;
            new_img_formattee.image_format_id = format.id;
            new_img_formattee.image_height = param_height;
            new_img_formattee.image_width = param_width;
            new_img_formattee.image_src = src;
            new_img_formattee.quality = format.quality;
            new_img_formattee.remplir_haut = format.remplir_haut;
            new_img_formattee.remplir_larg = format.remplir_larg;
            new_img_formattee.formatted_src = new_img_file.path;
            res = await ModuleDAO.getInstance().insertOrUpdateVO(new_img_formattee);
            new_img_formattee.id = res.id;
            return new_img_formattee;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            return null;
        }
    }
}