// if false
// FIXME RIEN A FAIRE ICI
import * as $ from 'jquery';
import * as debounce from 'lodash/debounce';
import * as moment from 'moment';
import { Duration } from 'moment';
import AccessPolicyTools from '../../tools/AccessPolicyTools';
import ModuleAPI from '../API/ModuleAPI';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import CacheInvalidationRegexpRuleVO from './vos/CacheInvalidationRegexpRuleVO';
import CacheInvalidationRulesVO from './vos/CacheInvalidationRulesVO';
import RequestResponseCacheVO from './vos/RequestResponseCacheVO';
// endif
import RequestsCacheVO from './vos/RequestsCacheVO';
import RequestsWrapperResult from './vos/RequestsWrapperResult';

export default class ModuleAjaxCache extends Module {

    public static MODULE_NAME: string = "AjaxCache";

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleAjaxCache.MODULE_NAME;

    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAjaxCache.MODULE_NAME + ".FO_ACCESS";

    public static APINAME_REQUESTS_WRAPPER: string = "REQUESTS_WRAPPER";

    public static getInstance(): ModuleAjaxCache {
        if (!ModuleAjaxCache.instance) {
            ModuleAjaxCache.instance = new ModuleAjaxCache();
        }
        return ModuleAjaxCache.instance;
    }

    private static instance: ModuleAjaxCache = null;

    public ajaxcache_debouncer: number = 200;

    private cache: RequestsCacheVO = new RequestsCacheVO();
    private invalidationRules: CacheInvalidationRulesVO = new CacheInvalidationRulesVO();
    private waitingForRequest: RequestResponseCacheVO[] = [];

    // private timerProcessRequests = 100;

    private disableCache = false;
    private defaultInvalidationTimeout = 300000;

    private processRequestsSemaphore: boolean = false;
    private processRequestsSemaphore_needs_reload: boolean = false;
    private actions_waiting_for_release_of_processRequestsSemaphore: Array<() => Promise<void>> = [];

    private constructor() {

        super("ajax_cache", ModuleAjaxCache.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<RequestResponseCacheVO[], RequestsWrapperResult>(
            ModuleAjaxCache.APINAME_REQUESTS_WRAPPER,
            []
        ));
    }

    public async get(url: string, api_types_involved: string[]) {

        let self = this;

        return new Promise((resolve, reject) => {

            // If in cache
            if (self.cache.requestResponseCaches[url]) {

                let cache: RequestResponseCacheVO = self.cache.requestResponseCaches[url];
                // Un contrôle de cohérence possible : le api_types_involved doit contenir l'union de toutes les fois où on utilise ce cache

                // If resolved / rejected
                if ((cache.state == RequestResponseCacheVO.STATE_RESOLVED) ||
                    (cache.state == RequestResponseCacheVO.STATE_REJECTED)) {

                    // If valid
                    if (self.isValidCache(cache)) {
                        if (cache.state == RequestResponseCacheVO.STATE_RESOLVED) {
                            resolve(cache.datas);
                        } else if (cache.state == RequestResponseCacheVO.STATE_REJECTED) {
                            reject(cache.datas);
                        }
                    } else {
                        self.invalidateCachedItem(cache);
                        self.addCallback(cache, resolve, reject);
                        self.addToWaitingRequestsStack(cache);
                    }
                } else if (cache.state == RequestResponseCacheVO.STATE_REQUESTED) {
                    self.addCallback(cache, resolve, reject);
                } else if (cache.state == RequestResponseCacheVO.STATE_INIT) {
                    self.addCallback(cache, resolve, reject);
                    self.addToWaitingRequestsStack(cache);
                }
            } else {
                let cache = self.addCache(url, api_types_involved, resolve, reject);
                self.addToWaitingRequestsStack(cache);
            }
        });
    }

    public post(
        url: string, api_types_involved: string[], postdatas = null, dataType: string = 'json',
        contentType: string = 'application/json; charset=utf-8', processData = null, timeout: number = null) {

        let self = this;

        let res = new Promise((resolve, reject) => {

            // On ajoute le système de catch code retour pour les POST aussi
            let cache = self.addCache(url, api_types_involved, resolve, reject);
            // On invalide le cache directement
            self.invalidateCachedItem(cache);

            self.invalidateCachesFromApiTypesInvolved(api_types_involved);

            let options: any = {
                type: "POST",
                url: url
            };
            if ((typeof postdatas != 'undefined') && (postdatas != null)) {
                options.data = postdatas;
            }
            if (contentType == null) {
                options.contentType = false;
            } else {
                options.contentType = contentType;
            }
            if (dataType != null) {
                options.dataType = dataType;
            }
            if (processData != null) {
                options.processData = processData;
            }
            if (timeout != null) {
                options.timeout = timeout;
            }
            if ($.ajax) {
                return $.ajax(options)
                    .done((r) => {
                        resolve(r);
                    })
                    .fail((err) => {
                        self.traitementFailRequest(err, cache);

                        console.log("post failed :" + url + ":" + postdatas + ":" + err);
                    });
            } else {
                resolve(null);
            }
        });

        return res;
    }



    public invalidateCachesFromApiTypesInvolved(api_types_involved: string[]) {

        for (let i in api_types_involved) {
            let api_type_involved: string = api_types_involved[i];

            for (let j in this.cache.requestResponseCaches) {
                let cache = this.cache.requestResponseCaches[j];

                if (cache.api_types_involved == CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED) {
                    this.invalidateCachedItem(cache);
                    continue;
                }
                if (cache.api_types_involved.indexOf(api_type_involved) >= 0) {
                    this.invalidateCachedItem(cache);
                    continue;
                }
            }
        }
    }

    public invalidateUsingURLRegexp(regexp) {

        for (let i in this.cache.requestResponseCaches) {
            let cachedItem: RequestResponseCacheVO = this.cache.requestResponseCaches[i];

            if (regexp.test(cachedItem.url)) {
                this.invalidateCachedItem(cachedItem);
            }
        }
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        // Launch the process
        // setTimeout(this.processRequests.bind(this), this.timerProcessRequests);
    }

    // Fonctionnement du cache :
    // 	2 process :
    //    - Un qui dépile des requetes
    //    - Un qui dépile des callbacks

    // Invalidation du cache :
    //  Définition d'une table [request_regexp] => validité max

    // Un type qui gère les résultats de requetes :
    //  - Date de récupération de la donnée (pour invalidation)
    //  - Valid : true / false
    //  - Donnée
    //  - Requete concernée : string

    // Pour les callbacks on les gère pas, on renvoie des promises directement et on renvoie en fait les infos issues du get ()

    // Type de gestion des requetes :
    //  - requete : string

    private addCache(url: string, api_types_involved: string[], resolve: (datas) => void, reject: (datas) => void) {
        if (!this.cache.requestResponseCaches[url]) {
            this.cache.requestResponseCaches[url] = new RequestResponseCacheVO(url, api_types_involved);
            this.cache.requestResponseCaches[url].resolve_callbacks.push(resolve);
            this.cache.requestResponseCaches[url].reject_callbacks.push(reject);

            // On indique si on peut stacker ou pas
            //  pour l'instant on essaie de stacker tout ce qui part vers les apis
            if (url.match(/^\/api_handler\/.*/ig)) {
                this.cache.requestResponseCaches[url].wrappable_request = true;
            }
        }

        return this.cache.requestResponseCaches[url];
    }

    private addCallback(cache: RequestResponseCacheVO, resolve: (datas) => void, reject: (datas) => void) {
        if (resolve) {
            cache.resolve_callbacks.push(resolve);
        }
        if (reject) {
            cache.reject_callbacks.push(reject);
        }
    }

    private isValidCache(cache: RequestResponseCacheVO) {

        // Switch global
        if (this.disableCache) {
            return false;
        }

        // Check for invalidation
        let defaultTimeout = true;
        for (let i in this.invalidationRules.regexpRules) {
            let invalidationRule: CacheInvalidationRegexpRuleVO = this.invalidationRules.regexpRules[i];

            if (invalidationRule.regexp.test(cache.url)) {
                if (cache.datasDate && moment(cache.datasDate).add(invalidationRule.max_duration).isBefore(moment())) {

                    return false;
                }
                defaultTimeout = false;
            }
        }

        if (defaultTimeout) {
            if (cache.datasDate && moment(cache.datasDate).add(this.defaultInvalidationTimeout).isBefore(moment())) {
                return false;
            }
        }

        return true;
    }

    private invalidateCachedItem(cache: RequestResponseCacheVO) {

        cache.state = RequestResponseCacheVO.STATE_INIT;
        cache.tries = 0;
        cache.datas = null;
        cache.datasDate = null;
    }

    private addInvalidationRule(regexp: RegExp, max_duration: Duration) {
        if ((!this.invalidationRules.regexpRules[regexp.source]) || (this.invalidationRules[regexp.source].max_duration.asMilliseconds() > max_duration.asMilliseconds())) {
            this.invalidationRules[regexp.source] = new CacheInvalidationRegexpRuleVO(regexp, max_duration);
        }
    }

    private addToWaitingRequestsStack(cache: RequestResponseCacheVO) {

        if (this.processRequestsSemaphore) {
            let self = this;
            this.actions_waiting_for_release_of_processRequestsSemaphore.push(async () => {
                self.addToWaitingRequestsStack(cache);
            });
            return false;
        }

        cache.state = RequestResponseCacheVO.STATE_REQUESTED;
        this.waitingForRequest.push(cache);

        this.debounced_processRequests();
    }

    private traitementFailRequest(err, request: RequestResponseCacheVO) {
        let self = this;

        if (401 == err.status) {
            (window as any).location.replace('/login');
        } else if (((503 == err.status) || (502 == err.status) || ('timeout' == err.statusText)) && (request.tries < 3)) {
            request.tries += 1;
            setTimeout(() => {
                self.addToWaitingRequestsStack(request);
            }, 2000);
        } else {
            console.log("request failed :" + request + ":" + err);
            if ((503 == err.status) || (502 == err.status) || ('timeout' == err.statusText)) {
                (window as any).alert('Loading failure - Please reload your page');
            }
            request.datasDate = moment();
            request.state = RequestResponseCacheVO.STATE_REJECTED;

            while (request.reject_callbacks && request.reject_callbacks.length) {
                let reject_callback = request.reject_callbacks.shift();

                // Make the calls asynchronous to call them all at the same time
                let callback = async () => {
                    reject_callback(null);
                };
                callback();

            }
        }
    }

    get debounced_processRequests() {

        if (this.processRequestsSemaphore) {
            // ça veut dire qu'on demande un process alors qu'un est déjà en cours.
            // Il faut pouvoir revenir s'en occuper
            this.processRequestsSemaphore_needs_reload = true;
            return () => { };
        }

        let self = this;
        return debounce(async () => {
            // Il faut stocker une info de type sémaphore pour refuser de lancer l'update pendant qu'il est en cours
            // Mais du coup quand l'update est terminé, il est important de vérifier si de nouvelles demandes de mise à jour ont eues lieues.
            //  et si oui relancer une mise à jour.
            // ATTENTION : Risque d'explosion de la pile des appels si on a un temps trop élevé de résolution des variables, par rapport à une mise
            //  à jour automatique par exemple à intervale régulier, plus court que le temps de mise à jour.
            if (self.processRequestsSemaphore) {
                return;
            }
            self.processRequestsSemaphore_needs_reload = false;
            self.processRequestsSemaphore = true;
            try {
                await self.processRequests();
            } catch (error) {
                console.error(error);
            }

            self.processRequestsSemaphore = false;

            if ((!!self.actions_waiting_for_release_of_processRequestsSemaphore) && (self.actions_waiting_for_release_of_processRequestsSemaphore.length)) {
                for (let i in self.actions_waiting_for_release_of_processRequestsSemaphore) {
                    let action = self.actions_waiting_for_release_of_processRequestsSemaphore[i];

                    await action();
                }
            }

            self.actions_waiting_for_release_of_processRequestsSemaphore = [];

            if (self.processRequestsSemaphore_needs_reload) {
                // Si on a eu des demandes pendant ce calcul on relance le plus vite possible
                self.processRequestsSemaphore_needs_reload = false;
                self.debounced_processRequests();
            }
        }, this.ajaxcache_debouncer);
    }

    // Le processus qui dépile les requêtes en attente
    // Pour rappel structure de la request
    //  url: url,
    //  resolve_callbacks: [resolve],
    //  reject_callbacks: [reject],
    //  state: this.STATE_INIT,
    //  creationDate: moment(),
    //  datas: null,
    //  datasDate: null
    private async processRequests() {

        let self = this;

        // On a 1 ou plusieurs requêtes. Ce qu'on veut idéalement c'est pouvoir gérer directement toutes les requêtes en attente
        //  en 1 seul batch, et recevoir une seule réponse qui encapsule toutes les questions.
        // On doit pouvoir faire ça pour les gets sans trop de difficultés

        if (self.waitingForRequest && (self.waitingForRequest.length > 1)) {

            let requests: RequestResponseCacheVO[] = Array.from(self.waitingForRequest).filter((req) => req.wrappable_request);
            if (requests && (requests.length > 1)) {

                let everything_went_well: boolean = true;

                // On encapsule les gets dans une requête de type post
                try {
                    let results: RequestsWrapperResult = await this.post("/api_handler/requests_wrapper", [], JSON.stringify(requests)) as RequestsWrapperResult;

                    if ((!results) || (!results.requests_results)) {
                        throw new Error('Pas de résultat pour la requête groupée.');
                    }

                    for (let i in requests) {
                        let wrapped_request = requests[i];

                        if ((!wrapped_request.url) || (typeof results.requests_results[wrapped_request.url] === 'undefined')) {
                            throw new Error('Pas de résultat pour la requête :' + wrapped_request.url + ":");
                        }

                        self.resolve_request(wrapped_request, results.requests_results[wrapped_request.url]);
                    }
                } catch (error) {
                    // Si ça échoue, on utilise juste le système normal de requêtage individuel.
                    console.error("Echec de requête groupée : " + error);
                    everything_went_well = false;
                }
                if (everything_went_well) {
                    self.waitingForRequest = self.waitingForRequest.filter((req: RequestResponseCacheVO) => (requests.indexOf(req) < 0));
                }
            }
        }

        if (self.waitingForRequest && (self.waitingForRequest.length > 0)) {
            let request: RequestResponseCacheVO = self.waitingForRequest.shift();

            // TODO fixme en cas d'erreur les post renvoient des GET ... pas valide...
            if ($.ajaxSetup) {
                $.ajaxSetup({
                    timeout: 180000
                }); // in milliseconds
            }

            if ($.get) {
                $.get(
                    request.url,
                    (datas) => {
                        self.resolve_request(request, datas);
                    })
                    .fail((err) => {
                        self.traitementFailRequest(err, request);
                    });
            } else {
                let resolve_callback = request.resolve_callbacks.shift();
                resolve_callback(null);
            }
        }

        if (self.waitingForRequest && (self.waitingForRequest.length > 0)) {
            this.processRequestsSemaphore_needs_reload = true;
        }

        // setTimeout((async () => {
        //     self.processRequests();
        // }), self.timerProcessRequests);
    }

    private resolve_request(request, datas) {
        request.datas = datas;
        request.datasDate = moment();
        request.state = RequestResponseCacheVO.STATE_RESOLVED;

        while (request.resolve_callbacks && request.resolve_callbacks.length) {
            let resolve_callback = request.resolve_callbacks.shift();

            // Make the calls asynchronous to call them all at the same time
            let callback = async () => {
                resolve_callback(datas);
            };
            callback();
        }
    }
}