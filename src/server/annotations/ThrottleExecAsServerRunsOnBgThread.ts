import { Throttle, ThrottleOptions } from "../../shared/annotations/Throttle";
import { RunsOnBgThread } from "../modules/BGThread/annotations/RunsOnBGThread";
import { ExecAsServer } from "./ExecAsServer";

// Décorateur Throttled
export function ThrottleExecAsServerRunsOnBgThread(
    throttleOptions: ThrottleOptions,
    bgthread: string,
    defaults_to_this_thread: boolean = false
) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {

        // Appliquer ExecAsServer sur le descriptor modifié par RunsOnBgThread
        const descriptorAfterExecAsServer = ExecAsServer(target, propertyKey, descriptor);

        // Appliquer Throttle sur le descriptor modifié par ExecAsServer
        const descriptorAterThrottle = Throttle(throttleOptions)(target, propertyKey, descriptorAfterExecAsServer);

        // Appliquer d'abord RunsOnBgThread
        const descriptorAterRunsOnBgThread = RunsOnBgThread(bgthread, defaults_to_this_thread)(target, propertyKey, descriptorAterThrottle);

        // Mais on doit aussi throttle le RunsOnBgThread pour pas patater le bgthread
        const descriptorAterSecondThrottle = Throttle(throttleOptions)(target, propertyKey, descriptorAterRunsOnBgThread);

        // Retourner le descriptor final
        return descriptorAterSecondThrottle;
    };
}