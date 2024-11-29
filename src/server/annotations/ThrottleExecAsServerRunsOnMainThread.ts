import Throttle, { ThrottleOptions } from "../../shared/annotations/Throttle";
import { RunsOnMainThread } from "../modules/BGThread/annotations/RunsOnMainThread";
import { ExecAsServer } from "./ExecAsServer";

// Décorateur Throttled
export default function ThrottleExecAsServerRunsOnMainThread(
    throttleOptions: ThrottleOptions
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
        const descriptorAterRunsOnMainThread = RunsOnMainThread(target, propertyKey, descriptorAterThrottle);

        // Mais on doit aussi throttle le RunsOnBgThread pour pas patater le bgthread
        const descriptorAterSecondThrottle = Throttle(throttleOptions)(target, propertyKey, descriptorAterRunsOnMainThread);

        // Retourner le descriptor final
        return descriptorAterSecondThrottle;
    };
}