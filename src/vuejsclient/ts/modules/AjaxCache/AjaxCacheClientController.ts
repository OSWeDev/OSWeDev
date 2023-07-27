import zlib from 'zlib';
import APIDefinition from '../../../../shared/modules/API/vos/APIDefinition';
import AjaxCacheController from '../../../../shared/modules/AjaxCache/AjaxCacheController';
import IAjaxCacheClientController from '../../../../shared/modules/AjaxCache/interfaces/IAjaxCacheClientController';
import CacheInvalidationRegexpRuleVO from '../../../../shared/modules/AjaxCache/vos/CacheInvalidationRegexpRuleVO';
import CacheInvalidationRulesVO from '../../../../shared/modules/AjaxCache/vos/CacheInvalidationRulesVO';
import LightWeightSendableRequestVO from '../../../../shared/modules/AjaxCache/vos/LightWeightSendableRequestVO';
import RequestResponseCacheVO from '../../../../shared/modules/AjaxCache/vos/RequestResponseCacheVO';
import RequestsCacheVO from '../../../../shared/modules/AjaxCache/vos/RequestsCacheVO';
import RequestsWrapperResult from '../../../../shared/modules/AjaxCache/vos/RequestsWrapperResult';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import EnvHandler from '../../../../shared/tools/EnvHandler';
import PromisePipeline from '../../../../shared/tools/PromisePipeline/PromisePipeline';
import { all_promises } from '../../../../shared/tools/PromiseTools';

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

    // public ajaxcache_debouncer: number = 25;

    public api_logs: LightWeightSendableRequestVO[] = [];

    public csrf_token: string = null;

    private cache: RequestsCacheVO = new RequestsCacheVO();
    private invalidationRules: CacheInvalidationRulesVO = new CacheInvalidationRulesVO();

    /**
     * Les requêtes pour le prochain batch d'envoi
     */
    private waitingForRequest: RequestResponseCacheVO[] = [];

    private disableCache = false;
    private defaultInvalidationTimeout: number = 300; //seconds

    // Limite en dur, juste pour essayer de limiter un minimum l'impact mémoire
    private api_logs_limit: number = 101;

    /**
     * Semaphore pour savoir si actuellement le système d'envoi des requêtes est en train de tourner
     *  Si oui, inutile de le relancer
     */
    private is_processing_requests: boolean = false;

    // private processRequestsWrapperSemaphore: boolean = false;
    // private processRequestsSemaphore: boolean = false;
    // private processRequestsSemaphore_needs_reload: boolean = false;

    // private debounced_requests_wrapper = ThrottleHelper.declare_throttle_without_args(this.processRequestsWrapper.bind(this), this.ajaxcache_debouncer, { leading: true, trailing: true });

    public async getCSRFToken() {
        StatsController.register_stat_COMPTEUR('AjaxCacheClientController', 'getCSRFToken', 'IN');
        let time_in = Dates.now_ms();

        let res = await this.get(null, '/api/getcsrftoken', CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED);
        if (!res) {
            StatsController.register_stat_COMPTEUR('AjaxCacheClientController', 'getCSRFToken', 'FAILED');
            StatsController.register_stat_DUREE('AjaxCacheClientController', 'getCSRFToken', 'FAILED', Dates.now_ms() - time_in);
            return;
        }
        this.csrf_token = res['csrfToken'];
        StatsController.register_stat_COMPTEUR('AjaxCacheClientController', 'getCSRFToken', 'OK');
        StatsController.register_stat_DUREE('AjaxCacheClientController', 'getCSRFToken', 'OK', Dates.now_ms() - time_in);
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

        let time_in = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('AjaxCacheClientController', 'get', 'IN');
        let self = this;

        return new Promise((resolve, reject) => {

            let resolve_stats_wrapper = (res) => {
                StatsController.register_stat_COMPTEUR('AjaxCacheClientController', 'get', 'OK');
                StatsController.register_stat_DUREE('AjaxCacheClientController', 'get', 'OK', Dates.now_ms() - time_in);
                resolve(res);
            };

            let reject_stats_wrapper = (err) => {
                StatsController.register_stat_COMPTEUR('AjaxCacheClientController', 'get', 'FAILED');
                StatsController.register_stat_DUREE('AjaxCacheClientController', 'get', 'FAILED', Dates.now_ms() - time_in);
                reject(err);
            };

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
                            resolve_stats_wrapper(cache.datas);
                        } else if (cache.state == RequestResponseCacheVO.STATE_REJECTED) {
                            reject_stats_wrapper(cache.datas);
                        }
                    } else {
                        self.invalidateCachedItem(cache);
                        self.addCallback(cache, resolve_stats_wrapper, reject_stats_wrapper);
                        self.addToWaitingRequestsStack(cache);
                    }
                } else if (cache.state == RequestResponseCacheVO.STATE_REQUESTED) {
                    self.addCallback(cache, resolve_stats_wrapper, reject_stats_wrapper);
                } else if (cache.state == RequestResponseCacheVO.STATE_INIT) {
                    self.addCallback(cache, resolve_stats_wrapper, reject_stats_wrapper);
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
                    resolve_stats_wrapper,
                    reject_stats_wrapper,
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

        let time_in = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('AjaxCacheClientController', 'get', 'IN');

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

            let resolve_stats_wrapper = (datas) => {
                StatsController.register_stat_COMPTEUR('AjaxCacheClientController', 'post', 'OK');
                StatsController.register_stat_DUREE('AjaxCacheClientController', 'post', 'OK', Dates.now_ms() - time_in);
                resolve(datas);
            };

            let reject_stats_wrapper = (err) => {
                StatsController.register_stat_COMPTEUR('AjaxCacheClientController', 'post', 'FAILED');
                StatsController.register_stat_DUREE('AjaxCacheClientController', 'post', 'FAILED', Dates.now_ms() - time_in);
                reject(err);
            };

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
                resolve_stats_wrapper,
                reject_stats_wrapper,
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
            } else {
                options.timeout = 120000;
            }
            if (!!self.csrf_token) {
                options.headers['X-CSRF-Token'] = self.csrf_token;
                options.headers['client_tab_id'] = AjaxCacheClientController.getInstance().client_tab_id;
            }
            if (!!EnvHandler.VERSION) {
                options.headers['version'] = EnvHandler.VERSION;
            }
            self.addCallback(cache, resolve_stats_wrapper, reject_stats_wrapper);

            // const $ = await import('jquery');
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

        cache.state = RequestResponseCacheVO.STATE_REQUESTED;
        this.waitingForRequest.push(cache);

        if (this.is_processing_requests) {
            return;
        }

        this.is_processing_requests = true;
        try {
            this.processRequests()
                .catch((err) => {
                    ConsoleHandler.error('addToWaitingRequestsStack:processRequests:FAILED:' + err);
                })
                .finally(() => {
                    this.is_processing_requests = false;

                    // Petite sécu au cas où le sémaphore ne se libère pas au bon moment
                    if (this.waitingForRequest.length) {
                        this.addToWaitingRequestsStack(this.waitingForRequest.shift());
                    }
                });
        } catch (error) {
            ConsoleHandler.error("addToWaitingRequestsStack:processRequests:FAILED:" + error);
            this.is_processing_requests = false;
        }
    }

    private async traitementFailRequest(err, request: RequestResponseCacheVO) {
        let self = this;
        StatsController.register_stat_COMPTEUR('AjaxCacheClientController', 'traitementFailRequest', 'IN');

        if (401 == err.status) {
            StatsController.register_stat_COMPTEUR('AjaxCacheClientController', 'traitementFailRequest', '401');
            (window as any).location.replace('/login');
        } else if (((503 == err.status) || (502 == err.status) || ('timeout' == err.statusText)) && (request.tries < 3) && (request.type != RequestResponseCacheVO.API_TYPE_POST)) {
            StatsController.register_stat_COMPTEUR('AjaxCacheClientController', 'traitementFailRequest', '503_502_timeout_NOT_POST_3_tries');
            request.tries += 1;
            setTimeout(() => {
                self.addToWaitingRequestsStack(request);
            }, 2000);
        } else {
            StatsController.register_stat_COMPTEUR('AjaxCacheClientController', 'traitementFailRequest', 'Default');
            ConsoleHandler.log("request failed :" + request + ":" + err);
            if ((503 == err.status) || (502 == err.status) || ('timeout' == err.statusText)) {
                ConsoleHandler.error("Loading failure - Please reload your page:" + JSON.stringify(request) + ":" + JSON.stringify(err));
                StatsController.register_stat_COMPTEUR('AjaxCacheClientController', 'traitementFailRequest', 'Loading_failure_Please_reload_your_page');
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

    private async wrap_request(wrappable_requests: RequestResponseCacheVO[], nb_requests: number) {
        if ((!wrappable_requests) || (wrappable_requests.length <= 0)) {
            return;
        }

        let sendable_objects_by_request_num: { [num: number]: LightWeightSendableRequestVO[] } = {};
        let wrappable_requests_by_request_num: { [num: number]: RequestResponseCacheVO[] } = {};
        let request_num_from_url: { [url: string]: number } = {};
        let request_barrel_num: number = -1;

        // let sendable_objects: LightWeightSendableRequestVO[] = [];
        let correspondance_by_request_num: { [num: number]: { [id_local: string]: string } } = {};
        for (let i in wrappable_requests) {
            let request = wrappable_requests[i];

            // Choix du pool de requête
            if (!request_num_from_url[request.url]) {
                request_barrel_num++;

                if (request_barrel_num >= nb_requests) {
                    request_barrel_num = 0;
                }

                request_num_from_url[request.url] = request_barrel_num;
            }

            // Ajout de la requête dans le pool
            if (!wrappable_requests_by_request_num[request_num_from_url[request.url]]) {
                wrappable_requests_by_request_num[request_num_from_url[request.url]] = [];
            }
            wrappable_requests_by_request_num[request_num_from_url[request.url]].push(request);

            // Ajout de l'index de la requête au sein du pool
            let this_query_index: string = (wrappable_requests_by_request_num[request_num_from_url[request.url]].length - 1).toString();
            request.index = this_query_index;

            // Ajout de la correspondance entre l'index de la requête et son id local
            if (!correspondance_by_request_num[request_num_from_url[request.url]]) {
                correspondance_by_request_num[request_num_from_url[request.url]] = {};
            }
            correspondance_by_request_num[request_num_from_url[request.url]][this_query_index] = AjaxCacheController.getInstance().getUIDIndex(request.url, request.postdatas, request.type);

            // Version Light pour envoi
            let light_weight = new LightWeightSendableRequestVO(request);
            if (!sendable_objects_by_request_num[request_num_from_url[request.url]]) {
                sendable_objects_by_request_num[request_num_from_url[request.url]] = [];
            }
            sendable_objects_by_request_num[request_num_from_url[request.url]].push(light_weight);


            if (this.api_logs.length >= this.api_logs_limit) {
                this.api_logs.shift();
            }
            this.api_logs.push(light_weight);
        }

        // On encapsule les gets dans une requête de type post
        let promise_pipeline = new PromisePipeline(nb_requests);

        for (let i in sendable_objects_by_request_num) {
            let sendable_objects = sendable_objects_by_request_num[i];

            if (!sendable_objects.length) {
                continue;
            }

            if (sendable_objects.length == 1) {
                await this.resolve_non_wrappable_request(wrappable_requests_by_request_num[i][0]);
                continue;
            }

            await promise_pipeline.push(async () => {
                await this.wrap_request_send(sendable_objects, wrappable_requests_by_request_num[i], correspondance_by_request_num[i]);
            });
        }

        await promise_pipeline.end();
    }

    private async wrap_request_send(sendable_objects: LightWeightSendableRequestVO[], wrappable_requests: RequestResponseCacheVO[], correspondance: { [id_local: string]: string }) {
        try {
            let results: RequestsWrapperResult = await this.post(
                null,
                "/api_handler/requests_wrapper", [],
                JSON.stringify(sendable_objects),
                null,
                'application/json; charset=utf-8',
                null, null, false, true
            ) as RequestsWrapperResult;

            if ((!results) || (!results.requests_results)) {
                StatsController.register_stat_COMPTEUR('AjaxCacheClientController', 'wrap_request', 'Pas_de_resultat_pour_la_requete_groupee');
                throw new Error('Pas de résultat pour la requête groupée.');
            }

            for (let i in wrappable_requests) {
                let wrapped_request = wrappable_requests[i];

                if ((!wrapped_request.url) || (typeof results.requests_results[i] === 'undefined')) {
                    StatsController.register_stat_COMPTEUR('AjaxCacheClientController', 'wrap_request', 'Pas_de_resultat_pour_la_requete');
                    throw new Error('Pas de résultat pour la requête :' + wrapped_request.url + ":");
                }

                wrapped_request.index = correspondance[i];

                await this.resolve_request(wrapped_request, results.requests_results[i]);
            }
        } catch (error) {
            StatsController.register_stat_COMPTEUR('AjaxCacheClientController', 'wrap_request', 'Echec_de_requete_groupee');
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

            await all_promises([this.wrap_request(left_wrappable_requests, 1), this.wrap_request(right_wrappable_requests, 1)]);
            return;
        }
    }

    /**
     * On traite les requêtes en attente
     */
    private async processRequests() {

        while (this.waitingForRequest.length > 0) {

            let this_batch_requests = this.waitingForRequest;
            this.waitingForRequest = [];

            // On commence par séparer les requêtes wrappable des autres
            let wrappable_requests: RequestResponseCacheVO[] = [];
            let non_wrappable_requests: RequestResponseCacheVO[] = [];

            for (let i in this_batch_requests) {
                let request = this_batch_requests[i];

                if (request.wrappable_request) {
                    wrappable_requests.push(request);
                } else {
                    non_wrappable_requests.push(request);
                }
            }

            /**
             * On se fait un PromisePipeline de 6 requêtes max, qui correspond à la limite de requêtes simultanées du navigateur
             * (https://stackoverflow.com/questions/985431/max-parallel-http-connections-in-a-browser)
             */
            let max_query = 6;
            let promise_pipeline: PromisePipeline = new PromisePipeline(max_query);

            // on traite d'une part les requêtes wrappable
            if (wrappable_requests.length > 0) {
                await promise_pipeline.push(async () => {
                    await this.wrap_request(wrappable_requests, Math.max(1, max_query - non_wrappable_requests.length));
                });
            }

            // on traite d'autre part les requêtes non wrappable
            if (non_wrappable_requests.length > 0) {
                for (let i in non_wrappable_requests) {
                    let request = non_wrappable_requests[i];

                    await promise_pipeline.push(async () => {
                        await this.resolve_non_wrappable_request(request);
                    });
                }
            }

            // On attend la fin de toutes les requêtes
            await promise_pipeline.end();
        }
    }

    private async resolve_non_wrappable_request(request: RequestResponseCacheVO) {

        let self = this;
        let light_weight = new LightWeightSendableRequestVO(request);

        if (this.api_logs.length >= this.api_logs_limit) {
            this.api_logs.shift();
        }
        this.api_logs.push(light_weight);

        switch (request.type) {
            case RequestResponseCacheVO.API_TYPE_GET:

                // const $ = await import('jquery');

                if ($.ajaxSetup) {
                    $.ajaxSetup({
                        timeout: 120000,
                        headers: {
                            version: EnvHandler.VERSION
                        }
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