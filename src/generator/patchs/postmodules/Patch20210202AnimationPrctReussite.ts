import { IDatabase } from 'pg-promise';
import ModuleAnimation from '../../../shared/modules/Animation/ModuleAnimation';
import ThemeModuleDataParamRangesVO from '../../../shared/modules/Animation/params/theme_module/ThemeModuleDataParamRangesVO';
import VarDayPrctReussiteAnimationController from '../../../shared/modules/Animation/vars/VarDayPrctReussiteAnimationController';
import AnimationUserModuleVO from '../../../shared/modules/Animation/vos/AnimationUserModuleVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import ISimpleNumberVarData from '../../../shared/modules/Var/interfaces/ISimpleNumberVarData';
import SimpleNumberVarDataController from '../../../shared/modules/Var/simple_vars/SimpleNumberVarDataController';
import VarsController from '../../../shared/modules/Var/VarsController';
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

            aums[i].prct_reussite = SimpleNumberVarDataController.getInstance().getValueOrDefault(
                await VarsController.getInstance().registerDataParamAndReturnVarData(ThemeModuleDataParamRangesVO.createNew(
                    VarDayPrctReussiteAnimationController.getInstance().varConf.id,
                    null,
                    [RangeHandler.getInstance().create_single_elt_NumRange(aums[i].module_id, NumSegment.TYPE_INT)],
                    [RangeHandler.getInstance().create_single_elt_NumRange(aums[i].user_id, NumSegment.TYPE_INT)],
                ), true, true) as ISimpleNumberVarData,
                0
            );
        }

        await ModuleDAO.getInstance().insertOrUpdateVOs(aums);
    }
}