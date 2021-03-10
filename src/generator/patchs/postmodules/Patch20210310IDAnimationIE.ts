/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from "pg-promise";
import AnimationModuleVO from "../../../shared/modules/Animation/vos/AnimationModuleVO";
import AnimationQRVO from "../../../shared/modules/Animation/vos/AnimationQRVO";
import AnimationThemeVO from "../../../shared/modules/Animation/vos/AnimationThemeVO";
import ModuleDAO from "../../../shared/modules/DAO/ModuleDAO";
import IGeneratorWorker from "../../IGeneratorWorker";

export default class Patch20210310IDAnimationIE implements IGeneratorWorker {

    public static getInstance(): Patch20210310IDAnimationIE {
        if (!Patch20210310IDAnimationIE.instance) {
            Patch20210310IDAnimationIE.instance = new Patch20210310IDAnimationIE();
        }
        return Patch20210310IDAnimationIE.instance;
    }

    private static instance: Patch20210310IDAnimationIE = null;

    get uid(): string {
        return 'Patch20210310IDAnimationIE';
    }

    private constructor() { }

    /**
     * Objectif : attribuer les bonnes valeurs aux id_import à tous les vos animation
     */
    public async work(db: IDatabase<any>) {

        try {
            let themes: AnimationThemeVO[] = await ModuleDAO.getInstance().getVos<AnimationThemeVO>(AnimationThemeVO.API_TYPE_ID);
            let modules: AnimationModuleVO[] = await ModuleDAO.getInstance().getVos<AnimationModuleVO>(AnimationModuleVO.API_TYPE_ID);
            let QRs: AnimationQRVO[] = await ModuleDAO.getInstance().getVos<AnimationQRVO>(AnimationQRVO.API_TYPE_ID);

            themes.forEach((theme) => { theme.id_import = theme.id; });
            modules.forEach((module) => { module.id_import = module.id; });
            modules.forEach((module) => { module.theme_id_import = module.theme_id; });
            QRs.forEach((QR) => { QR.module_id_import = QR.module_id; });

            await ModuleDAO.getInstance().insertOrUpdateVOs(themes);
            await ModuleDAO.getInstance().insertOrUpdateVOs(modules);
            await ModuleDAO.getInstance().insertOrUpdateVOs(QRs);

        } catch (error) { }
    }
}