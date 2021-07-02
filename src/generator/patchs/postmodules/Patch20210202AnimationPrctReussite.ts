import { IDatabase } from 'pg-promise';
import VarDayPrctReussiteAnimationController from '../../../server/modules/Animation/vars/VarDayPrctReussiteAnimationController';
import VarsServerCallBackSubsController from '../../../server/modules/Var/VarsServerCallBackSubsController';
import ModuleAnimation from '../../../shared/modules/Animation/ModuleAnimation';
import ThemeModuleDataRangesVO from '../../../shared/modules/Animation/params/theme_module/ThemeModuleDataRangesVO';
import AnimationUserModuleVO from '../../../shared/modules/Animation/vos/AnimationUserModuleVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import RangeHandler from '../../../shared/tools/RangeHandler';
import IGeneratorWorker from '../../IGeneratorWorker';


export default class Patch20210202AnimationPrctReussite implements IGeneratorWorker {

    public static getInstance(): Patch20210202AnimationPrctReussite {
        if (!Patch20210202AnimationPrctReussite.instance) {
            Patch20210202AnimationPrctReussite.instance = new Patch20210202AnimationPrctReussite();
        }
        return Patch20210202AnimationPrctReussite.instance;
    }

    private static instance: Patch20210202AnimationPrctReussite = null;

    get uid(): string {
        return 'Patch20210202AnimationPrctReussite';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        if (!ModuleAnimation.getInstance().actif) {
            return;
        }

        let aums: AnimationUserModuleVO[] = await ModuleDAO.getInstance().getVos<AnimationUserModuleVO>(AnimationUserModuleVO.API_TYPE_ID);

        for (let i in aums) {
            // Si aps terminé, on va pas setter la valeur
            if (!aums[i].end_date) {
                continue;
            }

            let var_data = await VarsServerCallBackSubsController.getInstance().get_var_data(ThemeModuleDataRangesVO.createNew(
                VarDayPrctReussiteAnimationController.getInstance().varConf.name,
                false,
                [RangeHandler.getInstance().getMaxNumRange()],
                [RangeHandler.getInstance().create_single_elt_NumRange(aums[i].module_id, NumSegment.TYPE_INT)],
                [RangeHandler.getInstance().create_single_elt_NumRange(aums[i].user_id, NumSegment.TYPE_INT)],
            ));

            let data = await VarsServerCallBackSubsController.getInstance().get_var_data(ThemeModuleDataRangesVO.createNew(
                VarDayPrctReussiteAnimationController.getInstance().varConf.name,
                false,
                [RangeHandler.getInstance().getMaxNumRange()],
                [RangeHandler.getInstance().create_single_elt_NumRange(aums[i].module_id, NumSegment.TYPE_INT)],
                [RangeHandler.getInstance().create_single_elt_NumRange(aums[i].user_id, NumSegment.TYPE_INT)],
            ));

            aums[i].prct_reussite = (data && data.value) ? data.value : 0;
        }

        await ModuleDAO.getInstance().insertOrUpdateVOs(aums);
    }
}