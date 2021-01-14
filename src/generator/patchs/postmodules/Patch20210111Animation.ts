import { IDatabase } from 'pg-promise';
import ModuleAnimation from '../../../shared/modules/Animation/ModuleAnimation';
import AnimationParametersVO from '../../../shared/modules/Animation/vos/AnimationParametersVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
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
        let params: AnimationParametersVO = await ModuleAnimation.getInstance().getParameters();

        if (params) {
            return;
        }

        params = new AnimationParametersVO();
        params.seuil_validation_module_prct = 0.8;

        await ModuleDAO.getInstance().insertOrUpdateVO(params);
    }
}