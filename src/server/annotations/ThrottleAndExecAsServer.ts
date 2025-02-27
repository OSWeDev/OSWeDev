import Throttle, { ThrottleOptions } from "../../shared/annotations/Throttle";
import ModulesManager from "../../shared/modules/ModulesManager";
import { ExecAsServer } from "./ExecAsServer";

type AsyncMethod = (...args: any[]) => Promise<any>;

/**
 * ATTENTION : la méthode décorée est obligatoirement async !
 * Décorateur Throttled + ExecAsServer
 */
export default function ThrottleAndExecAsServer(options: ThrottleOptions) {
    return function <T extends AsyncMethod>(
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor): TypedPropertyDescriptor<T> {

        const originalMethod = descriptor.value;

        // Vérification runtime : si la fonction n’est pas async, on bloque => valide uniquement côté serveur
        if (ModulesManager.isServerSide && originalMethod.constructor.name !== 'AsyncFunction') {
            throw new Error(
                `La méthode "${propertyKey}" doit impérativement être déclarée "async".`
            );
        }

        // Appliquer d'abord ExecAsServer
        const descriptorAfterExecAsServer = ExecAsServer<T>(target, propertyKey, descriptor);

        // Puis appliquer Throttle sur le descriptor modifié
        const finalDescriptor = Throttle(options)<T>(target, propertyKey, descriptorAfterExecAsServer);

        // Retourner le descriptor final
        return finalDescriptor;
    };
}