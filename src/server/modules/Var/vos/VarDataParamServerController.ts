import IRange from "../../../../shared/modules/DataRender/interfaces/IRange";
import VarDataBaseVO from "../../../../shared/modules/Var/vos/VarDataBaseVO";
import VarServerControllerBase from "../VarServerControllerBase";

type ExtractVarServerControllerBaseType<T> = T extends VarServerControllerBase<infer U> ? U : never;

/**
 * Paramètre le calcul de variables
 */
export default class VarDataParamServerController {

    /**
     * Méthode pour créer un nouveau paramètre de var, avec un contrôle fort sur le type de retour vs le type de la var
     * On ajoute les champs additionnels à la volée, et donc le type de retour est étendu
     * @param param_to_clone Le param que l'on doit cloner
     * @param controller_type Le controller cible
     * @param static_fields Les champs additionnels à ajouter
     * @param clone_fields Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas). TRUE par défaut
     * @returns le paramètre cloné
     */
    public static get_cloned_param_for_dep_controller_with_additional_fields<
        InputType extends VarDataBaseVO,
        AdditionalFieldsType extends { [field_id: string]: IRange[] },
        OutputType extends InputType & { [key in keyof AdditionalFieldsType as `_${Extract<key, string>}`]: IRange[] } & ExtractVarServerControllerBaseType<ControllerType>,
        ControllerParamType extends VarDataBaseVO,
        ControllerType extends VarServerControllerBase<ControllerParamType>
    >(
        param_to_clone: InputType,
        controller_type: ControllerType,
        static_fields: AdditionalFieldsType = null,
        clone_fields: boolean = true,
    ): OutputType {

        return VarDataBaseVO.cloneFieldsFromVarName<InputType, OutputType>(param_to_clone, controller_type.varConf.name, clone_fields, static_fields);
    }

    /**
     * Méthode pour créer un nouveau paramètre de var, avec un contrôle fort sur le type de retour vs le type de la var
     * @param param_to_clone Le param que l'on doit cloner
     * @param controller_type Le controller cible
     * @param clone_fields Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas). TRUE par défaut
     * @returns le paramètre cloné
     */
    public static get_cloned_param_for_dep_controller<
        InputType extends ExtractVarServerControllerBaseType<ControllerType>,
        ControllerParamType extends VarDataBaseVO,
        ControllerType extends VarServerControllerBase<ControllerParamType>
    >(
        param_to_clone: InputType,
        controller_type: ControllerType,
        clone_fields: boolean = true): ExtractVarServerControllerBaseType<ControllerType> {

        return VarDataBaseVO.cloneFieldsFromVarName<InputType, ExtractVarServerControllerBaseType<ControllerType>>(param_to_clone, controller_type.varConf.name, clone_fields);
    }

    /**
     * Méthode pour créer un nouveau paramètre de var, quelque soit le type, utilisé pour la remontée des invalidateurs
     *  puisqu'ils peuvent avoir des maxranges. Ne pas utiliser pour descendre/définir des deps.
     * @param params_to_clone Les params que l'on doit cloner
     * @param controller_type Le controller cible (souvent le controller de la var courante - on ne peut pas utiliser this pour permettre l'inférence de type. Utiliser le nom de la var à la place + '.getInstance()'
     * @param clone_fields Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas). TRUE par défaut
     * @returns les params clonés
     */
    public static get_cloned_invalidators_from_dep_controller<
        InputType extends VarDataBaseVO,
        ControllerParamType extends VarDataBaseVO,
        ControllerType extends VarServerControllerBase<ControllerParamType>
    >(
        params_to_clone: InputType[],
        controller_type: ControllerType,
        clone_fields: boolean = true): Array<ExtractVarServerControllerBaseType<ControllerType>> {

        return VarDataBaseVO.cloneArrayFrom<InputType, ExtractVarServerControllerBaseType<ControllerType>>(params_to_clone, controller_type.varConf.name, clone_fields);
    }
}