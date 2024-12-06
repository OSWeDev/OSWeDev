import { IDatabase } from 'pg-promise';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleSuiviCompetences from '../../../shared/modules/SuiviCompetences/ModuleSuiviCompetences';
import SuiviCompetencesGroupeVO from '../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGroupeVO';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20241030SuiviCompetencesGroupeShortName implements IGeneratorWorker {

    private static instance: Patch20241030SuiviCompetencesGroupeShortName = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20241030SuiviCompetencesGroupeShortName';
    }

    public static getInstance(): Patch20241030SuiviCompetencesGroupeShortName {
        if (!Patch20241030SuiviCompetencesGroupeShortName.instance) {
            Patch20241030SuiviCompetencesGroupeShortName.instance = new Patch20241030SuiviCompetencesGroupeShortName();
        }
        return Patch20241030SuiviCompetencesGroupeShortName.instance;
    }

    public async work(db: IDatabase<unknown>) {
        if (!ModuleSuiviCompetences.getInstance().actif) {
            return;
        }

        const vos: SuiviCompetencesGroupeVO[] = await query(SuiviCompetencesGroupeVO.API_TYPE_ID).select_vos<SuiviCompetencesGroupeVO>();
        const toupdate: SuiviCompetencesGroupeVO[] = [];

        for (const i in vos) {
            const vo = vos[i];

            if (!vo.short_name) {
                vo.short_name = vo.name;

                toupdate.push(vo);
            }
        }

        if (toupdate.length) {
            await ModuleDAO.getInstance().insertOrUpdateVOs(toupdate);
        }
    }
}