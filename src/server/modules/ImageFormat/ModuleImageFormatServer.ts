import fs from 'fs';
import jimp from 'jimp';
import { isEqual } from 'lodash';
import path from 'path';
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
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import { field_names } from '../../../shared/tools/ObjectHandler';

export default class ModuleImageFormatServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleImageFormatServer.instance) {
            ModuleImageFormatServer.instance = new ModuleImageFormatServer();
        }
        return ModuleImageFormatServer.instance;
    }

    private static instance: ModuleImageFormatServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleImageFormat.getInstance().name);
    }

    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleImageFormat.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'Formats d\'image'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleImageFormat.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Administration des Formats d\'image'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    // istanbul ignore next: cannot test configure
    public async configure() {
        const postUpdateTrigger: DAOPostUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);

        // Quand on change un fichier on check si on doit changer l'url d'une image formattee au passage.
        postUpdateTrigger.registerHandler(FileVO.API_TYPE_ID, this, this.force_formatted_image_path_from_file_changed);
        postUpdateTrigger.registerHandler(ImageFormatVO.API_TYPE_ID, this, this.handleTriggerPostUpdateImageFormat);
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleImageFormat.APINAME_get_formatted_image, this.get_formatted_image.bind(this));
    }

    private async force_formatted_image_path_from_file_changed(vo_update_handler: DAOUpdateVOHolder<FileVO>) {
        const fimgs: FormattedImageVO[] = await query(FormattedImageVO.API_TYPE_ID).filter_by_num_eq('file_id', vo_update_handler.post_update_vo.id).exec_as_server().select_vos<FormattedImageVO>();

        if ((!fimgs) || (!fimgs.length)) {
            return;
        }

        for (const i in fimgs) {
            const fimg = fimgs[i];

            fimg.formatted_src = vo_update_handler.post_update_vo.path;
        }
        await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(fimgs);
    }

    private async handleTriggerPostUpdateImageFormat(update: DAOUpdateVOHolder<ImageFormatVO>) {
        if (!update || !update.pre_update_vo || !update.post_update_vo) {
            return;
        }

        // Si c'est les mêmes, je passe
        if (isEqual(update.pre_update_vo, update.post_update_vo)) {
            return;
        }

        // Sinon je vais vider le répertoire pour que les images soient recréées
        const rep: string = ModuleImageFormat.RESIZABLE_IMGS_PATH_BASE + update.post_update_vo.name + "/";

        try {
            if (fs.existsSync(rep)) {
                fs.rmdirSync(rep, { recursive: true });
            }
        } catch (e) {
            ConsoleHandler.error(e);
        }
    }

    private async get_formatted_image(
        src: string,
        format_name: string,
        width: number,
        height: number
    ): Promise<FormattedImageVO> {

        if ((!format_name) || (!src)) {
            return null;
        }

        if (!(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(src))) {
            return null;
        }

        try {

            let param_height = height ? parseInt(height.toString()) : 0;
            let param_width = width ? parseInt(width.toString()) : 0;

            const format: ImageFormatVO = await query(ImageFormatVO.API_TYPE_ID).filter_by_text_eq(field_names<ImageFormatVO>().name, format_name, ImageFormatVO.API_TYPE_ID, true).select_vo<ImageFormatVO>();

            if (!format) {
                ConsoleHandler.error('Impossible de charger le format d\'image :' + format_name);
                return null;
            }

            param_height = format.height ? format.height : param_height;
            param_width = format.width ? format.width : param_width;

            /**
             * On tente de trouver une image cohérente (même format et résolution proche)
             *  Si on trouve, on envoie l'image
             *  Si on trouve pas on génère la nouvelle image et on la renvoie
             */
            const fis: FormattedImageVO[] = await query(FormattedImageVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<ImageFormatVO>().name, format_name, ImageFormatVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<FormattedImageVO>().image_src, src)
                .select_vos<FormattedImageVO>();

            let res_diff_min_value: number = null;
            let res_diff_min_fi: FormattedImageVO = null;

            if (fis && (fis.length > 1)) {

                const param_res = param_height * param_width;
                for (const i in fis) {
                    const fi = fis[i];

                    const fi_res = fi.image_height * fi.image_width;

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
                    const res_diff = fi_res - param_res;
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
            const extname: string = path.extname(src);
            let new_src: string = ModuleImageFormat.RESIZABLE_IMGS_PATH_BASE + format.name + "/" + src.replace(ModuleFile.FILES_ROOT, '').replace(extname, '');

            if (format.add_size_rename_name) {
                new_src += '__' + param_width + '_' + param_height;
            }

            new_src += extname;

            let image = await jimp.read(src);

            let base_image_width: number = image.getWidth();
            let base_image_height: number = image.getHeight();

            if (!image) {
                ConsoleHandler.error('Impossible de charger l\'image à cette url :' + new_src);
                return null;
            }

            if ((!format.remplir_haut) && (!format.remplir_larg)) {
                const ratio_height: number = param_height ? (base_image_height / param_height) : 0;
                const ratio_width: number = param_width ? (base_image_width / param_width) : 0;

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

            // Si le file existe déjà, on le récupère
            let new_img_file: FileVO = await query(FileVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<FileVO>().path, new_src)
                .select_vo<FileVO>();

            if (!new_img_file) {
                new_img_file = new FileVO();
                new_img_file.is_secured = false;
                new_img_file.path = new_src;
                const resnew_img_file: InsertOrDeleteQueryResult = await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(new_img_file);
                new_img_file.id = resnew_img_file.id;
            }

            const src_dirname: string = path.dirname(new_img_file.path);
            if (!fs.existsSync(src_dirname)) {
                fs.mkdirSync(src_dirname, { recursive: true });
            }

            await image.writeAsync(new_img_file.path);

            if (format.watermark_txt) {
                image = await jimp.read(new_img_file.path);
                base_image_width = image.getWidth();
                base_image_height = image.getHeight();

                let text_image_width: number = base_image_width;
                let text_image_height: number = base_image_height;

                if (format.watermark_rotate && ((format.watermark_rotate == 90) || (format.watermark_rotate == 270))) {
                    text_image_width = base_image_height;
                    text_image_height = base_image_width;
                }

                const fontCanvas = await jimp.create(text_image_width, text_image_height);

                const font = await jimp.loadFont(jimp['FONT_SANS_' + format.watermark_font + '_BLACK']);

                fontCanvas.print(font, format.watermark_x, format.watermark_y, {
                    text: format.watermark_txt,
                    alignmentX: format.watermark_horizontal_align,
                    alignmentY: format.watermark_vertical_align
                }, text_image_width, text_image_height);

                if (format.watermark_rotate) {
                    fontCanvas.rotate(format.watermark_rotate);
                }

                // image.print(font, format.watermark_x, format.watermark_y, {
                //     text: format.watermark_txt,
                //     alignmentX: format.watermark_horizontal_align,
                //     alignmentY: format.watermark_vertical_align
                // }, base_image_width, base_image_height);

                await image.blit(fontCanvas, 0, 0).writeAsync(new_img_file.path);
            }

            const new_img_formattee: FormattedImageVO = new FormattedImageVO();
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
            const res = await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(new_img_formattee);
            new_img_formattee.id = res.id;
            return new_img_formattee;
        } catch (error) {
            ConsoleHandler.error(error);
            return null;
        }
    }
}