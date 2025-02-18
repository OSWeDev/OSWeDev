import Throttle, { ThrottleOptions } from "../../shared/annotations/Throttle";
import { RunsOnMainThread } from "../modules/BGThread/annotations/RunsOnMainThread";
import { ExecAsServer } from "./ExecAsServer";

// Décorateur Throttled
export default function ThrottleExecAsServerRunsOnMainThread(
    throttleOptions: ThrottleOptions,
    instanceGetter: () => any,
) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {

        // Appliquer ExecAsServer sur le descriptor modifié par RunsOnMainThread
        const descriptorAfterExecAsServer = ExecAsServer(target, propertyKey, descriptor);

        // Appliquer Throttle sur le descriptor modifié par ExecAsServer
        const descriptorAterThrottle = Throttle(throttleOptions)(target, propertyKey, descriptorAfterExecAsServer);

        // Appliquer d'abord RunsOnMainThread
        const descriptorAterRunsOnMainThread = RunsOnMainThread(instanceGetter)(target, propertyKey, descriptorAterThrottle);

        // Alors on a un souci si on throttle avant et après le changement de thread, dans le cas où on change pas de thread, c'est donc le même throttle qu'on utilise et ça part en boucle infinie
        // Donc en l'état osef le deuxième throttle, on le vire
        // // Mais on doit aussi throttle le RunsOnBgThread pour pas patater le bgthread
        // const descriptorAterSecondThrottle = Throttle(throttleOptions)(target, propertyKey, descriptorAterRunsOnMainThread);

        // // Retourner le descriptor final
        // return descriptorAterSecondThrottle;
        return descriptorAterRunsOnMainThread;
    };
}