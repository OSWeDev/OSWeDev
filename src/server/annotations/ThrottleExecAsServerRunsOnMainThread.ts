import Throttle, { ThrottleOptions } from "../../shared/annotations/Throttle";
import ModulesManager from "../../shared/modules/ModulesManager";
import { RunsOnMainThread } from "../modules/BGThread/annotations/RunsOnMainThread";
import { ExecAsServer } from "./ExecAsServer";

type AsyncMethod = (...args: any[]) => Promise<any>;

/**
 * ATTENTION : la méthode décorée est obligatoirement async !
 * Décorateur Throttled + ExecAsServer + RunsOnMainThread
 */
export default function ThrottleExecAsServerRunsOnMainThread(
    throttleOptions: ThrottleOptions,
    instanceGetter: () => any,
) {
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

        // Appliquer ExecAsServer sur le descriptor modifié par RunsOnMainThread
        const descriptorAfterExecAsServer = ExecAsServer<T>(target, propertyKey, descriptor);

        // Appliquer Throttle sur le descriptor modifié par ExecAsServer
        const descriptorAterThrottle = Throttle(throttleOptions)<T>(target, propertyKey, descriptorAfterExecAsServer);

        // Appliquer d'abord RunsOnMainThread
        const descriptorAterRunsOnMainThread = RunsOnMainThread(instanceGetter)<T>(target, propertyKey, descriptorAterThrottle);

        // Alors on a un souci si on throttle avant et après le changement de thread, dans le cas où on change pas de thread, c'est donc le même throttle qu'on utilise et ça part en boucle infinie
        // Donc en l'état osef le deuxième throttle, on le vire
        // // Mais on doit aussi throttle le RunsOnBgThread pour pas patater le bgthread
        // const descriptorAterSecondThrottle = Throttle(throttleOptions)(target, propertyKey, descriptorAterRunsOnMainThread);

        // // Retourner le descriptor final
        // return descriptorAterSecondThrottle;
        return descriptorAterRunsOnMainThread;
    };
}