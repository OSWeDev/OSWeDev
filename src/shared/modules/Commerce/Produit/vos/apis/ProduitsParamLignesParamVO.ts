import ProduitParamLigneParamVO from './ProduitParamLigneParamVO';
import CommandeVO from '../../../Commande/vos/CommandeVO';
import IAPIParamTranslator from '../../../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../../../API/interfaces/IAPIParamTranslatorStatic';

export default class ProduitsParamLignesParamVO implements IAPIParamTranslator<ProduitsParamLignesParamVO>{

    public static fromParams(
        produitsParam: ProduitParamLigneParamVO[],
        commande: CommandeVO): ProduitsParamLignesParamVO {

        return new ProduitsParamLignesParamVO(produitsParam, commande);
    }

    public static getAPIParams(param: ProduitsParamLignesParamVO): any[] {
        return [param.produitsParam, param.commande];
    }

    public constructor(
        public produitsParam: ProduitParamLigneParamVO[],
        public commande: CommandeVO
    ) { }
}

export const ProduitsParamLignesParamVOStatic: IAPIParamTranslatorStatic<ProduitsParamLignesParamVO> = ProduitsParamLignesParamVO;