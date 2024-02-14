import ConsoleHandler from "../../../../shared/tools/ConsoleHandler";
import ThreadHandler from "../../../../shared/tools/ThreadHandler";
import EvolizAPIRateLimitRequestWrapper from "./EvolizAPIRateLimitRequestWrapper";

/**
 * Le plan, c'est encapsuler les appels à l'API d'Evoliz dans des fonctions qui gèrent les erreurs de rate limit.
 * On stack les demandes d'appels à l'API dans une queue, et on les exécute une par une, en attendant le délai nécessaire entre chaque appel.
 * Si on se fait bloquer par le rate limit, on attend le délai nécessaire, et on réessaie.
 */
export default class EvolizAPIRateLimitHandler {

    public static async wrap_request(request_sender: () => Promise<any>): Promise<any> {
        return new Promise((resolve, reject) => {
            EvolizAPIRateLimitHandler.send_request_and_catch_rate_limit(new EvolizAPIRateLimitRequestWrapper(request_sender, resolve, reject));
        });
    }

    private static async send_request_and_catch_rate_limit(request: EvolizAPIRateLimitRequestWrapper) {

        try {
            request.request_resolver(await request.request_sender());
        } catch (error) {

            // https://evoliz.io/documentation#section/Rate-limiting
            if (error && error.code == 429) {
                ConsoleHandler.warn('EvolizAPIRateLimitHandler warn:Rate-limiting:', error);
                // On retente dans 20 secondes - pif total, on peut imaginer des systèmes plus précis mais on n'a pas l'info du type de rate limit (fixed ou sliding window par exemple)
                //  et ya des règles différentes pour les différents types de requêtes d'après la doc sans préciser quoi/où...
                await ThreadHandler.sleep(20000, 'EvolizAPIRateLimitHandler');
                await EvolizAPIRateLimitHandler.send_request_and_catch_rate_limit(request);
                return;
            }
            ConsoleHandler.error('EvolizAPIRateLimitHandler error:', error);
            request.request_rejecter(error);
        }
    }
}