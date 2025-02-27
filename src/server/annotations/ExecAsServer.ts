import ModulesManager from "../../shared/modules/ModulesManager";
import StackContext from "../StackContext";
import 'reflect-metadata';

// Clé pour stocker l'index du paramètre
const EXEC_AS_SERVER_PARAM_KEY = Symbol("ExecAsServerParam");

export function ExecAsServerParam(target: any, propertyKey: string, parameterIndex: number) {
    // Stocker l'index du paramètre marqué
    Reflect.defineMetadata(EXEC_AS_SERVER_PARAM_KEY, parameterIndex, target, propertyKey);
}

type AsyncMethod = (...args: any[]) => Promise<any>;

/**
 * ATTENTION : la méthode décorée est obligatoirement async !
 * Permet de définir une méthode qui est exécutée côté serveur, quel que soit le thread d'appel. On retourne sur le thread d'appel à la fin de la fonction
 */
export function ExecAsServer<T extends AsyncMethod>(target: unknown, propertyKey: string, descriptor: PropertyDescriptor): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value;

    // Vérification runtime : si la fonction n’est pas async, on bloque => valide uniquement côté serveur
    if (ModulesManager.isServerSide && originalMethod.constructor.name !== 'AsyncFunction') {
        throw new Error(
            `La méthode "${propertyKey}" doit impérativement être déclarée "async".`
        );
    }

    descriptor.value = async function (...args: any[]) { // Attention si on déclare la fonction avec la flèche on perd le this

        // Récupérer l'index du paramètre marqué
        const paramIndex: number | undefined = Reflect.getMetadata(
            EXEC_AS_SERVER_PARAM_KEY,
            target,
            propertyKey
        );

        // Si un paramètre est marqué, récupérer sa valeur
        const execAsServer = paramIndex !== undefined ? args[paramIndex] : true;

        // Encapsule la méthode originale dans StackContext.runPromise
        return await StackContext.exec_as_server(originalMethod, this, execAsServer, ...args);
    };

    return descriptor;
}