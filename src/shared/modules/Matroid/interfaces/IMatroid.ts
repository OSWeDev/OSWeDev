import IDistantVOBase from '../../IDistantVOBase';

export default interface IMatroid extends IDistantVOBase {

    // On hérite du IDistantVOBase pour avoir l'info de la structure de l'objet par réflexion
    //  en utilisant le _type et le VoTypesManager
    //  On peut en déduire les bases du matroid, qui sont les attributs de type ranges
}