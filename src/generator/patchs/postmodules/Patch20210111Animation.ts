import { IDatabase } from 'pg-promise';
import ModuleAnimation from '../../../shared/modules/Animation/ModuleAnimation';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20210111Animation implements IGeneratorWorker {

    public static getInstance(): Patch20210111Animation {
        if (!Patch20210111Animation.instance) {
            Patch20210111Animation.instance = new Patch20210111Animation();
        }
        return Patch20210111Animation.instance;
    }

    private static instance: Patch20210111Animation = null;

    get uid(): string {
        return 'Patch20210111Animation';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        await ModuleParams.getInstance().setParamValue(ModuleAnimation.PARAM_NAME_SEUIL_VALIDATION_MODULE_PRCT, "0.8");
        await ModuleParams.getInstance().setParamValue(ModuleAnimation.PARAM_NAME_IMAGE_HOME, "/client/public/img/home_animation.jpg");
    }
}