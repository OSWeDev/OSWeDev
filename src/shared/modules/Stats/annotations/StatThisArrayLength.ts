import ConsoleHandler from "../../../tools/ConsoleHandler";
import ThreadHandler from "../../../tools/ThreadHandler";
import StatsController from "../StatsController";

interface ObjectToStat {
    target: any;
    property_key: string;
    instance_getter: () => any;
    stat_object_name: string;
}

const INTERVAL = 10000;
let interval_object = null;
const objects_to_stat: ObjectToStat[] = [];

function stat_this_array(arrayRef: Array<any>, stat_object_name: string, property_key: string) {
    if (!arrayRef) {
        return;
    }

    if (arrayRef && (typeof arrayRef.length === 'undefined')) {
        throw new Error('This is not an array ! : ' + stat_object_name + '.' + property_key);
    }

    StatsController.register_stat_QUANTITE('StatThisArrayLength', stat_object_name, property_key, arrayRef.length);
}

export function init_interval_for_StatThisArrayLength() {
    // On init l'interval si pas encore init
    if (!interval_object) {
        interval_object = ThreadHandler.set_interval('StatThisArrayLength', () => {
            for (const object_to_stat of objects_to_stat) {
                try {

                    // Récupère le tableau (statique ou sur l'instance)
                    const arrayRef = object_to_stat.instance_getter
                        ? object_to_stat.instance_getter()[object_to_stat.property_key]
                        : object_to_stat.target[object_to_stat.property_key];

                    stat_this_array(arrayRef, object_to_stat.stat_object_name, object_to_stat.property_key);
                } catch (e) {
                    ConsoleHandler.error('StatThisArrayLength:FAILED:' + e);
                }
            }

            // et on stat aussi la conf du StatThisArrayLength
            stat_this_array(objects_to_stat, 'StatThisArrayLength', 'objects_to_stat');
        }, INTERVAL, 'StatThisArrayLength', false);

        // Pour stopper proprement à la fin si nécessaire (ex: setTimeout ou autre mécanisme)
        // setTimeout(() => clearInterval(interval), 60000);
    }
}

/**
 * Décorateur qui log la taille de l'array toutes les 10 secondes si StatsController.enabled
 * Si instance_getter est null, on est sur un statique
 * @param instance_getter Pour récupérer l'instance de l'objet si pas statique
 * @param stat_object_name Le nom de l'objet sur lequel on fait le stat pour utiliser comme sub_category de stat. L'event de la stat sera automatiquement le nom de la propriété
 */
export function StatThisArrayLength(stat_object_name: string, instance_getter: () => any = null): PropertyDecorator {
    return (target: any, propertyKey: string | symbol) => {
        // On stocke la valeur initiale au cas où
        const originalValue = target[propertyKey];

        objects_to_stat.push({
            target,
            property_key: propertyKey.toString(),
            instance_getter,
            stat_object_name
        });

        // On "supprime" l'annotation en restaurant le comportement d'origine
        // (ici, on se contente de réassigner la valeur initiale et on ne remet plus de métadonnées).
        Object.defineProperty(target, propertyKey, {
            value: originalValue,
            writable: true,
            enumerable: true,
            configurable: true
        });
    };
}
