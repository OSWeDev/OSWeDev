import { Throttle, ThrottleOptions } from "../../shared/annotations/Throttle";
import { ExecAsServer } from "./ExecAsServer";

// Décorateur Throttled
export function ThrottleAndExecAsServer(options: ThrottleOptions) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {

        // Appliquer d'abord ExecAsServer
        const descriptorAfterExecAsServer = ExecAsServer(target, propertyKey, descriptor);

        // Puis appliquer Throttle sur le descriptor modifié
        const finalDescriptor = Throttle(options)(target, propertyKey, descriptorAfterExecAsServer);

        // Retourner le descriptor final
        return finalDescriptor;
    };
}