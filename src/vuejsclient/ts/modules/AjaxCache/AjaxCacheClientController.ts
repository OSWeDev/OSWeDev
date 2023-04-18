import debounce from 'lodash/debounce';
import AjaxCacheController from '../../../../shared/modules/AjaxCache/AjaxCacheController';
import IAjaxCacheClientController from '../../../../shared/modules/AjaxCache/interfaces/IAjaxCacheClientController';
import CacheInvalidationRegexpRuleVO from '../../../../shared/modules/AjaxCache/vos/CacheInvalidationRegexpRuleVO';
import CacheInvalidationRulesVO from '../../../../shared/modules/AjaxCache/vos/CacheInvalidationRulesVO';
import LightWeightSendableRequestVO from '../../../../shared/modules/AjaxCache/vos/LightWeightSendableRequestVO';
import RequestResponseCacheVO from '../../../../shared/modules/AjaxCache/vos/RequestResponseCacheVO';
import RequestsCacheVO from '../../../../shared/modules/AjaxCache/vos/RequestsCacheVO';
import RequestsWrapperResult from '../../../../shared/modules/AjaxCache/vos/RequestsWrapperResult';
import APIDefinition from '../../../../shared/modules/API/vos/APIDefinition';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import EnvHandler from '../../../../shared/tools/EnvHandler';
import { all_promises } from '../../../../shared/tools/PromiseTools';
const zlib = require('zlib');

export default class AjaxCacheClientController implements IAjaxCacheClientController {

    public static getInstance(): AjaxCacheClientController {
        if (!AjaxCacheClientController.instance) {
            AjaxCacheClientController.instance = new AjaxCacheClientController();
        }
        return AjaxCacheClientController.instance;
    }

    private static instance: AjaxCacheClientController = null;

    /**
     * This is used to identify the tab the app is running in to send appropriate notifications to the corresponding tab
     */
    public client_tab_id: string = Dates.now() + '_' + Math.floor(Math.random() * 100000);

    public ajaxcache_debouncer: number = 200;
    public api_logs: LightWeightSendableRequestVO[] = [];

    public csrf_token: string = null;

    private cache: RequestsCacheVO = new RequestsCacheVO();
    private invalidationRules: CacheInvalidationRulesVO = new CacheInvalidationRulesVO();
    private waitingForRequest: RequestResponseCacheVO[] = [];

    // private timerProcessRequests = 100;

    private disableCache = false;
    private defaultInvalidationTimeout: number = 300; //seconds

    // Limite en dur, juste pour essayer de limiter un minimum l'impact mémoire
    private api_logs_limit: number = 101;

    private processRequestsSemaphore: boolean = false;
    private processRequestsSemaphore_needs_reload: boolean = false;
    private actions_waiting_for_release_of_processRequestsSemaphore: Array<() => Promise<void>> = [];

    private debounced_requests_wrapper = debounce(this.processRequestsWrapper, this.ajaxcache_debouncer);

    public async getCSRFToken() {
        let res = await this.get(null, '/api/getcsrftoken', CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED);
        if (!res) {
            return;
        }
        this.csrf_token = res['csrfToken'];
    }

    /**
     *
     * @param url
     * @param api_types_involved
     * @param postdatas USE ONLY : si post for get
     * @param dataType USE ONLY : si post for get
     * @param contentType USE ONLY : si post for get
     * @param processData USE ONLY : si post for get
     * @param timeout USE ONLY : si post for get
     * @param post_for_get USE ONLY : si post for get
     */
    public async get(
        apiDefinition: APIDefinition<any, any>,
        url: string,
        api_types_involved: string[],
        postdatas = null,
        dataType: string = 'json',
        contentType: string = 'application/json; charset=utf-8',
        processData = null,
        timeout: number = null,
        post_for_get: boolean = false) {

        let self = this;

        return new Promise((resolve, reject) => {

            // If in cache
            let UIDindex = AjaxCacheController.getInstance().getUIDIndex(url, postdatas, post_for_get ? RequestResponseCacheVO.API_TYPE_POST_FOR_GET : RequestResponseCacheVO.API_TYPE_GET);
            if (self.cache.requestResponseCaches[UIDindex]) {

                let cache: RequestResponseCacheVO = self.cache.requestResponseCaches[UIDindex];
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
                let cache = self.addCache(
                    apiDefinition,
                    url,
                    postdatas,
                    dataType,
                    contentType,
                    processData,
                    timeout,
                    api_types_involved,
                    resolve,
                    reject,
                    post_for_get ? RequestResponseCacheVO.API_TYPE_POST_FOR_GET : RequestResponseCacheVO.API_TYPE_GET);
                self.addToWaitingRequestsStack(cache);
            }
        });
    }

    /**
     *
     * @param url URL de l'api
     * @param api_types_involved Les api_types_ids que l'on doit invalider dans le cache puisque modifiés par le post
     * @param postdatas
     * @param dataType
     * @param contentType
     * @param processData
     * @param timeout
     * @param post_for_get True indique qu'on invalide rien et qu'on fait juste la requête
     */
    public post(
        apiDefinition: APIDefinition<any, any>,
        url: string, api_types_involved: string[], postdatas = null, dataType: string = 'json',
        contentType: string = 'application/json; charset=utf-8', processData = null, timeout: number = null, post_for_get: boolean = false,
        is_wrapper: boolean = false): Promise<any> {

        let self = this;

        if (!is_wrapper) {
            let light_weight = new LightWeightSendableRequestVO(null);
            light_weight.url = url;
            light_weight.contentType = contentType;
            light_weight.postdatas = postdatas;
            light_weight.dataType = dataType;
            light_weight.processData = processData;
            light_weight.type = post_for_get ? LightWeightSendableRequestVO.API_TYPE_POST_FOR_GET : LightWeightSendableRequestVO.API_TYPE_POST;
            if (this.api_logs.length >= this.api_logs_limit) {
                this.api_logs.shift();
            }
            this.api_logs.push(light_weight);
        }

        let res = new Promise(async (resolve, reject) => {

            // On ajoute le système de catch code retour pour les POST aussi
            let cache = self.addCache(
                apiDefinition,
                url,
                postdatas,
                dataType,
                contentType,
                processData,
                timeout,
                api_types_involved,
                resolve,
                reject,
                post_for_get ? RequestResponseCacheVO.API_TYPE_POST_FOR_GET : RequestResponseCacheVO.API_TYPE_POST);

            if (!post_for_get) {
                // On invalide le cache directement
                self.invalidateCachedItem(cache);

                self.invalidateCachesFromApiTypesInvolved(api_types_involved);
            }

            let options: any = {
                type: "POST",
                url: url
            };

            if (!options.headers) {
                options.headers = {};
            }

            if ((typeof cache.postdatas != 'undefined') && (cache.postdatas != null)) {
                if ((EnvHandler.COMPRESS) && (typeof cache.postdatas == 'string')) {
                    options.data = JSON.stringify(zlib.gzipSync(cache.postdatas));
                    options.headers[AjaxCacheController.HEADER_GZIP] = 'true';
                } else {
                    options.data = cache.postdatas;
                }
            }
            if (contentType == null) {
                options.contentType = false;
            } else {
                options.contentType = contentType;
            }
            if (dataType != null) {
                options.dataType = dataType;
            }
            if (cache.processData != null) {
                options.processData = cache.processData;
            }
            if (cache.timeout != null) {
                options.timeout = cache.timeout;
            }
            if (!!self.csrf_token) {
                options.headers['X-CSRF-Token'] = self.csrf_token;
                options.headers['client_tab_id'] = AjaxCacheClientController.getInstance().client_tab_id;
            }
            self.addCallback(cache, resolve, reject);

            // const $ = await import(/* webpackChunkName: "jquery" */ 'jquery');
            if ($.ajax) {
                await $.ajax(options)
                    .done(async (r) => {
                        await self.resolve_request(cache, r);
                    })
                    .fail(async (err) => {
                        await self.traitementFailRequest(err, cache);

                        ConsoleHandler.log("post failed :" + url + ":" + postdatas + ":" + err);
                    });
            } else {
                await self.resolve_request(cache, null);
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

    public invalidateUsingURLRegexp(regexp: RegExp) {

        for (let i in this.cache.requestResponseCaches) {
            let cachedItem: RequestResponseCacheVO = this.cache.requestResponseCaches[i];

            if (regexp.test(cachedItem.url)) {
                this.invalidateCachedItem(cachedItem);
            }
        }
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

    private addCache(
        apiDefinition: APIDefinition<any, any>,
        url: string,
        postdatas: any,
        dataType: string,
        contentType: string,
        processData,
        timeout: number,
        api_types_involved: string[], resolve: (datas) => void, reject: (datas) => void, type: number = RequestResponseCacheVO.API_TYPE_GET) {

        let index = AjaxCacheController.getInstance().getUIDIndex(url, postdatas, type);
        if (!this.cache.requestResponseCaches[index]) {
            this.cache.requestResponseCaches[index] = new RequestResponseCacheVO(apiDefinition, url, api_types_involved, type);
            this.cache.requestResponseCaches[index].postdatas = postdatas;
            this.cache.requestResponseCaches[index].dataType = dataType;
            this.cache.requestResponseCaches[index].contentType = contentType;
            this.cache.requestResponseCaches[index].processData = processData;
            this.cache.requestResponseCaches[index].timeout = timeout;
            this.cache.requestResponseCaches[index].resolve_callbacks.push(resolve);
            this.cache.requestResponseCaches[index].reject_callbacks.push(reject);

            // On indique si on peut stacker ou pas
            //  pour l'instant on essaie de stacker tout ce qui part vers les apis sauf les post
            if (url.match(/^\/api_handler\/.*/ig) && (type != RequestResponseCacheVO.API_TYPE_POST)) {
                this.cache.requestResponseCaches[index].wrappable_request = true;
            }
        }

        return this.cache.requestResponseCaches[index];
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
                if (cache.datasDate && (Dates.add(cache.datasDate, invalidationRule.max_duration) < Dates.now())) {

                    return false;
                }
                defaultTimeout = false;
            }
        }

        if (defaultTimeout) {
            if (cache.datasDate && (Dates.add(cache.datasDate, this.defaultInvalidationTimeout) < Dates.now())) {
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

    private addInvalidationRule(regexp: RegExp, max_duration: number) {
        if ((!this.invalidationRules.regexpRules[regexp.source]) || (this.invalidationRules[regexp.source].max_duration > max_duration)) {
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

    private async traitementFailRequest(err, request: RequestResponseCacheVO) {
        let self = this;

        if (401 == err.status) {
            (window as any).location.replace('/login');
        } else if (((503 == err.status) || (502 == err.status) || ('timeout' == err.statusText)) && (request.tries < 3) && (request.type != RequestResponseCacheVO.API_TYPE_POST)) {
            request.tries += 1;
            setTimeout(() => {
                self.addToWaitingRequestsStack(request);
            }, 2000);
        } else {
            ConsoleHandler.log("request failed :" + request + ":" + err);
            if ((503 == err.status) || (502 == err.status) || ('timeout' == err.statusText)) {
                (window as any).alert('Loading failure - Please reload your page');
            }
            request.datasDate = Dates.now();
            request.state = RequestResponseCacheVO.STATE_REJECTED;

            while (request.reject_callbacks && request.reject_callbacks.length) {
                let reject_callback = request.reject_callbacks.shift();

                // Make the calls asynchronous to call them all at the same time
                let callback = async () => {
                    reject_callback(null);
                };
                await callback();

            }
        }
    }

    private debounced_processRequests() {

        if (this.processRequestsSemaphore) {
            // ça veut dire qu'on demande un process alors qu'un est déjà en cours.
            // Il faut pouvoir revenir s'en occuper
            this.processRequestsSemaphore_needs_reload = true;
            return () => { };
        }

        this.debounced_requests_wrapper();
    }

    private async processRequestsWrapper() {
        // Il faut stocker une info de type sémaphore pour refuser de lancer l'update pendant qu'il est en cours
        // Mais du coup quand l'update est terminé, il est important de vérifier si de nouvelles demandes de mise à jour ont eues lieues.
        //  et si oui relancer une mise à jour.
        // ATTENTION : Risque d'explosion de la pile des appels si on a un temps trop élevé de résolution des variables, par rapport à une mise
        //  à jour automatique par exemple à intervale régulier, plus court que le temps de mise à jour.
        if (this.processRequestsSemaphore) {
            return;
        }
        this.processRequestsSemaphore_needs_reload = false;
        this.processRequestsSemaphore = true;
        try {
            await this.processRequests();
        } catch (error) {
            ConsoleHandler.error(error);
        }

        this.processRequestsSemaphore = false;

        if ((!!this.actions_waiting_for_release_of_processRequestsSemaphore) && (this.actions_waiting_for_release_of_processRequestsSemaphore.length)) {
            for (let i in this.actions_waiting_for_release_of_processRequestsSemaphore) {
                let action = this.actions_waiting_for_release_of_processRequestsSemaphore[i];

                await action();
            }
        }

        this.actions_waiting_for_release_of_processRequestsSemaphore = [];

        if (this.processRequestsSemaphore_needs_reload) {
            // Si on a eu des demandes pendant ce calcul on relance le plus vite possible
            this.processRequestsSemaphore_needs_reload = false;
            this.debounced_processRequests();
        }
    }

    private async wrap_request(wrappable_requests: RequestResponseCacheVO[]) {
        if ((!wrappable_requests) || (wrappable_requests.length <= 0)) {
            return;
        }

        let sendable_objects: LightWeightSendableRequestVO[] = [];
        let correspondance: { [id_local: string]: string } = {};
        for (let i in wrappable_requests) {
            let request = wrappable_requests[i];

            request.index = i.toString();
            correspondance[i.toString()] = AjaxCacheController.getInstance().getUIDIndex(request.url, request.postdatas, request.type);

            let light_weight = new LightWeightSendableRequestVO(request);
            sendable_objects.push(light_weight);

            if (this.api_logs.length >= this.api_logs_limit) {
                this.api_logs.shift();
            }
            this.api_logs.push(light_weight);
        }

        // On encapsule les gets dans une requête de type post
        try {
            let results: RequestsWrapperResult = await this.post(
                null,
                "/api_handler/requests_wrapper", [],
                JSON.stringify(sendable_objects),
                null,
                'application/json; charset=utf-8',
                null, null, false, true) as RequestsWrapperResult;

            if ((!results) || (!results.requests_results)) {
                throw new Error('Pas de résultat pour la requête groupée.');
            }

            for (let i in wrappable_requests) {
                let wrapped_request = wrappable_requests[i];

                if ((!wrapped_request.url) || (typeof results.requests_results[i] === 'undefined')) {
                    throw new Error('Pas de résultat pour la requête :' + wrapped_request.url + ":");
                }

                wrapped_request.index = correspondance[i];

                await this.resolve_request(wrapped_request, results.requests_results[i]);
            }
        } catch (error) {
            ConsoleHandler.error("Echec de requête groupée : " + error);

            // Si ça échoue, on relance avec une logique de dichotomie, si il reste plus d'une requête à traiter. On demande minimum 2 requêtes par wrap
            let left_wrappable_requests: RequestResponseCacheVO[] = [];
            let right_wrappable_requests: RequestResponseCacheVO[] = [];

            if (wrappable_requests.length <= 3) {
                // on fait 1 requete puis groupe de 2 automatiquement
                return;
            }

            left_wrappable_requests = wrappable_requests.slice(0, Math.floor(wrappable_requests.length / 2));
            right_wrappable_requests = wrappable_requests.slice(Math.floor(wrappable_requests.length / 2));

            await all_promises([this.wrap_request(left_wrappable_requests), this.wrap_request(right_wrappable_requests)]);
            return;
        }

        this.waitingForRequest = this.waitingForRequest.filter((req: RequestResponseCacheVO) => (wrappable_requests.indexOf(req) < 0));
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

            await this.wrap_request(Array.from(self.waitingForRequest).filter((req) => req.wrappable_request));
        }

        if (self.waitingForRequest && (self.waitingForRequest.length > 0)) {
            let request: RequestResponseCacheVO = self.waitingForRequest.shift();

            let light_weight = new LightWeightSendableRequestVO(request);

            if (this.api_logs.length >= this.api_logs_limit) {
                this.api_logs.shift();
            }
            this.api_logs.push(light_weight);

            switch (request.type) {
                case RequestResponseCacheVO.API_TYPE_GET:

                    // const $ = await import(/* webpackChunkName: "jquery" */ 'jquery');

                    if ($.ajaxSetup) {
                        $.ajaxSetup({
                            timeout: 30000
                        }); // in milliseconds
                    }

                    if ($.get) {
                        $.get(
                            request.url,
                            async (datas) => {
                                await self.resolve_request(request, datas);
                            })
                            .fail(async (err) => {
                                await self.traitementFailRequest(err, request);
                            });
                    } else {
                        let resolve_callback = request.resolve_callbacks.shift();
                        resolve_callback(null);
                    }
                    break;

                case RequestResponseCacheVO.API_TYPE_POST:
                    ConsoleHandler.error('Should never happen :processRequests:TYPE == POST:');
                    break;

                case RequestResponseCacheVO.API_TYPE_POST_FOR_GET:
                    let res = await this.post(
                        request.apiDefinition,
                        request.url, request.api_types_involved, request.postdatas,
                        request.dataType, request.contentType, request.processData, request.timeout,
                        true);

                    await this.resolve_request(request, res);
                    break;
            }
        }

        if (self.waitingForRequest && (self.waitingForRequest.length > 0)) {
            this.processRequestsSemaphore_needs_reload = true;
        }

        // setTimeout((async () => {
        //     self.processRequests();
        // }), self.timerProcessRequests);
    }

    private async resolve_request(request: RequestResponseCacheVO, datas) {

        if (request.type != RequestResponseCacheVO.API_TYPE_POST) {
            request.datas = datas;
            request.datasDate = Dates.now();
            request.state = RequestResponseCacheVO.STATE_RESOLVED;
        }

        while (request.resolve_callbacks && request.resolve_callbacks.length) {
            let resolve_callback = request.resolve_callbacks.shift();

            // Make the calls asynchronous to call them all at the same time
            let callback = async () => {
                resolve_callback(datas);
            };
            await callback();
        }
    }

    private prepare_for_encoding(postdatas: any) {

        // if (typeof postdatas !== 'object') {
        return postdatas;
        // }

        // let res = Object.assign({}, postdatas);

        // /**
        //  * On recherche des functions pour les supprimer
        //  */
        // for (let i in postdatas) {

        //     if (typeof postdatas[i] === 'object') {
        //         res[i] = this.prepare_for_encoding(postdatas[i]);
        //         continue;
        //     }

        //     if (typeof postdatas[i] === 'function') {
        //         delete res[i];
        //         continue;
        //     }
        // }

        // return res;
    }
}