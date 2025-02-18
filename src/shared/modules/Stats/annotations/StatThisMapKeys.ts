import ConsoleHandler from "../../../tools/ConsoleHandler";
import ThreadHandler from "../../../tools/ThreadHandler";
import StatsController from "../StatsController";

interface ObjectToStat {
    target: any;
    property_key: string;
    instance_getter: () => any;
    stat_object_name: string;
    depth: number; // Recursive depth
    stat_value_type_array_length_instead_of_keys: boolean;
}

const INTERVAL = 10000;
let interval_object = null;
const objects_to_stat: ObjectToStat[] = [];

export function get_keys_length(mapRef: { [key: string]: any }, stat_object_name: string, property_key: string, depth: number, stat_value_type_array_length_instead_of_keys: boolean): number {
    if (depth < 0) {
        throw new Error('should not happen :length < 0: ' + stat_object_name + '.' + property_key);
    }

    if (!mapRef) {
        return null;
    }
    if (typeof mapRef !== 'object') {
        throw new Error('This is not an object ! : ' + stat_object_name + '.' + property_key);
    }

    if (depth === 0) {

        if (stat_value_type_array_length_instead_of_keys) {
            if (Array.isArray(mapRef)) {
                return mapRef.length;
            }

            return null;
        }
        return Object.keys(mapRef).length;
    }

    let res = 0;
    depth--;
    for (const key in mapRef) {
        const value = mapRef[key];

        if (typeof value !== 'object') {
            res++;
            continue;
        }

        const length = get_keys_length(value, stat_object_name, property_key, depth, stat_value_type_array_length_instead_of_keys);
        res += (length == null) ? 0 : length;
    }

    return res;
}

function stat_this_map(mapRef: { [key: string]: any }, stat_object_name: string, property_key: string, stat_value_type_array_length_instead_of_keys: boolean) {
    const length = get_keys_length(mapRef, stat_object_name, property_key, 1, stat_value_type_array_length_instead_of_keys);
    if (length == null) {
        return;
    }
    StatsController.register_stat_QUANTITE('StatThisMapKeys', stat_object_name, property_key, length);
}

export function init_interval_for_StatThisMapKeys() {
    if (!interval_object) {
        interval_object = ThreadHandler.set_interval('StatThisMapKeys', () => {
            for (const object_to_stat of objects_to_stat) {
                try {
                    const mapRef = object_to_stat.instance_getter
                        ? object_to_stat.instance_getter()[object_to_stat.property_key]
                        : object_to_stat.target[object_to_stat.property_key];

                    stat_this_map(mapRef, object_to_stat.stat_object_name, object_to_stat.property_key, object_to_stat.stat_value_type_array_length_instead_of_keys);
                } catch (e) {
                    ConsoleHandler.error('StatThisMapKeys:FAILED:' + e);
                }
            }

            stat_this_map(objects_to_stat as any, 'StatThisMapKeys', 'objects_to_stat', false);
        }, INTERVAL, 'StatThisMapKeys', false);
    }
}

export function StatThisMapKeys(stat_object_name: string, instance_getter: () => any = null, depth: number = 0, stat_value_type_array_length_instead_of_keys: boolean = false): PropertyDecorator {
    return (target: any, propertyKey: string | symbol) => {
        const originalValue = target[propertyKey];
        objects_to_stat.push({
            target,
            property_key: propertyKey.toString(),
            instance_getter,
            stat_object_name,
            depth,
            stat_value_type_array_length_instead_of_keys,
        });

        Object.defineProperty(target, propertyKey, {
            value: originalValue,
            writable: true,
            enumerable: true,
            configurable: true
        });
    };
}
