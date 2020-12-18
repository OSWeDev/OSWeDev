import { Request } from 'express';
import IAPIParamTranslator from './IAPIParamTranslator';

/**
 * Déclaration de traducteur pour les parametres des APIs. Le constructeur doit avoir les mêmes paramètres que l'API et dans le même ordre
 * On force l'URL uniquement pour répondre à un pb de compilation. Si tous les champs sont non nécessaires et qu'on en utilise aucun,
 * TS répond que la classe n'a aucun attribut lié à l'interface. Je vois pas pourquoi ça pose un problème mais admettons. Mettre null du
 * coup pour les apis qui en ont pas l'usage
 */
export default interface IAPIParamTranslatorStatic<T> {
    URL?: string;
    fromREQ?: (req: Request) => IAPIParamTranslator<T>;
    fromParams: (...params) => IAPIParamTranslator<T>;
    getAPIParams: (param: IAPIParamTranslator<T>) => any[];
}
