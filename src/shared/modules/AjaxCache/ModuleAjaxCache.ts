import Module from '../Module';
import ModuleParamChange from '../ModuleParamChange';
import * as moment from 'moment';
/// #if false
import * as $ from 'jquery';
/// #endif
import RequestsCacheVO from './vos/RequestsCacheVO';
import RequestResponseCacheVO from './vos/RequestResponseCacheVO';
import CacheInvalidationRegexpRuleVO from './vos/CacheInvalidationRegexpRuleVO';
import CacheInvalidationRulesVO from './vos/CacheInvalidationRulesVO';
import { Duration } from 'moment';
import IDistantVOBase from '../IDistantVOBase';

export default class ModuleAjaxCache extends Module {

    public static getInstance(): ModuleAjaxCache {
        if (!ModuleAjaxCache.instance) {
            ModuleAjaxCache.instance = new ModuleAjaxCache();
        }
        return ModuleAjaxCache.instance;
    }

    private static instance: ModuleAjaxCache = null;

    private cache: RequestsCacheVO = new RequestsCacheVO();
    private invalidationRules: CacheInvalidationRulesVO = new CacheInvalidationRulesVO();
    private waitingForRequest: RequestResponseCacheVO[] = [];

    private timerProcessRequests = 100;

    private disableCache = false;
    private defaultInvalidationTimeout = 300000;

    private constructor() {

        super("ajax_cache", "AjaxCache");
        this.initialize();
    }

    public async hook_module_on_params_changed(paramChanged: Array<ModuleParamChange<any>>) { }
    public async hook_module_async_client_admin_initialization() { }

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
        url: string, api_types_involved: string[], postdatas = null, dataType = 'json',
        contentType: string = 'application/json; charset=utf-8', processData = null, timeout: number = null) {

        let self = this;

        let res = new Promise((resolve, reject) => {

            // On ajoute le système de catch code retour pour les POST aussi
            let cache = self.addCache(url, api_types_involved, resolve, reject);
            // On invalide le cache directement
            self.invalidateCachedItem(cache);

            self.invalidateCachesFromApiTypesInvolved(api_types_involved);

            let options = {
                type: "POST",
                url: url,
                data: postdatas
            };
            if (contentType == null) {
                options['contentType'] = false;
            } else {
                options['contentType'] = contentType;
            }
            if (dataType != null) {
                options['dataType'] = dataType;
            }
            if (processData != null) {
                options['processData'] = processData;
            }
            if (timeout != null) {
                options['timeout'] = timeout;
            }
            return $.ajax(options)
                .done((r) => {
                    resolve(r);
                })
                .fail((err) => {
                    self.traitementFailRequest(err, cache);

                    console.log("post failed :" + url + ":" + postdatas + ":" + err);
                });
        });

        return res;
    }

    public save(updates: IDistantVOBase[], deletes: IDistantVOBase[], replacer = null) {

        let self = this;
        let url = '/api/save';

        let res = new Promise((resolve, reject) => {

            // On peut induire les api_type_involved en regardant dans la data envoyée directement
            let api_types_involved: string[] = [];

            for (let i in updates) {
                if (updates[i] && updates[i]._type && (api_types_involved.indexOf(updates[i]._type) < 0)) {
                    api_types_involved.push(updates[i]._type);
                }
            }
            for (let i in deletes) {
                if (deletes[i] && deletes[i]._type && (api_types_involved.indexOf(deletes[i]._type) < 0)) {
                    api_types_involved.push(deletes[i]._type);
                }
            }

            // On ajoute le système de catch code retour pour les POST aussi
            let cache = self.addCache(url, api_types_involved, resolve, reject);
            // On invalide le cache directement
            self.invalidateCachedItem(cache);

            self.invalidateCachesFromApiTypesInvolved(api_types_involved);

            let data = null;

            if (replacer) {
                data = JSON.stringify({
                    updates: updates,
                    deletes: deletes
                }, replacer);
            } else {
                data = JSON.stringify({
                    updates: updates,
                    deletes: deletes
                });
            }

            return $.ajax({
                type: "POST",
                url: url,
                data: data,
                contentType: 'application/json; charset=utf-8',
                dataType: 'json'
            })
                .done((r) => {
                    resolve(r);
                })
                .fail((err) => {
                    self.traitementFailRequest(err, cache);

                    console.log("save failed :" + url + ":" + JSON.stringify({
                        updates: updates,
                        deletes: deletes
                    }) + ":" + err);
                });
        });

        return res;
    }

    // Saves VOs to distant storage and returns them with id provided by the server
    // ATTENTION les vos doivent déjà être typés
    public async createVOs(vos: IDistantVOBase[], _type: string): Promise<IDistantVOBase[]> {

        for (var i in vos) {
            if (!vos[i]._type) {
                vos[i]._type = _type;
            }
        }

        let r: any = await this.save(vos, null);

        // save inserted ids
        for (var i in vos) {
            if (!vos[i].id) {
                vos[i].id = r.updates_ids[i];
            }
        }

        return vos;
    }

    // Saves VOs to distant storage and returns them with id provided by the server
    // ATTENTION les vos doivent déjà être typés
    public async createVO<T extends IDistantVOBase>(vo: T, _type: string): Promise<T> {

        if (!vo._type) {
            vo._type = _type;
        }

        let r: any = await this.save([vo], null);

        // save inserted ids
        vo.id = (r.updates_ids && (r.updates_ids[0])) ? r.updates_ids[0] : null;

        return vo;
    }

    // ATTENTION les vos doivent déjà être typés
    public async deleteVO<T extends IDistantVOBase>(vo: T, _type: string): Promise<void> {

        if (!vo._type) {
            vo._type = _type;
        }

        let r: any = await this.save(null, [vo]);
    }

    public deleteItems(items, _type) {

        let self = this;

        let res = new Promise((resolve, reject) => {

            for (let i in items) {
                let item = items[i];

                item._type = _type;
            }

            return self.save([], items)
                .then((r) => {
                    resolve(r);
                })
                .catch((r) => {
                    reject(r);
                });
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

    public updateItems(items, _type) {

        let self = this;

        let res = new Promise((resolve, reject) => {

            for (let i in items) {
                let item = items[i];

                item._type = _type;
            }

            return self.save(items, [])
                .then((r) => {
                    resolve(r);
                })
                .catch((r) => {
                    reject(r);
                });
        });

        return res;
    }

    public addItems(items, _type) {

        let self = this;

        let res = new Promise((resolve, reject) => {

            for (let i in items) {
                let item = items[i];

                item._type = _type;
            }

            return self.save(items, [])
                .then((r) => {
                    resolve(r);
                })
                .catch((r) => {
                    reject(r);
                });
        });

        return res;
    }

    protected initialize() {
        this.fields = [];
        this.datatables = [];

        // Launch the process
        setTimeout(this.processRequests.bind(this), this.timerProcessRequests);
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

        cache.state = RequestResponseCacheVO.STATE_REQUESTED;
        this.waitingForRequest.push(cache);
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
                setTimeout(() => {
                    if (reject_callback) {
                        reject_callback(null);
                    }
                }, 10);
            }
        }
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

        if (self.waitingForRequest && self.waitingForRequest.length > 0) {

            let request: RequestResponseCacheVO = self.waitingForRequest.shift();


            // TODO fixme en cas d'erreur les post renvoient des GET ... pas valide...
            $.ajaxSetup({
                timeout: 30000
            }); // in milliseconds
            $.get(
                request.url,
                (datas) => {
                    request.datas = datas;
                    request.datasDate = moment();
                    request.state = RequestResponseCacheVO.STATE_RESOLVED;

                    while (request.resolve_callbacks && request.resolve_callbacks.length) {
                        let resolve_callback = request.resolve_callbacks.shift();

                        // Make the calls asynchronous to call them all at the same time
                        setTimeout(() => {
                            resolve_callback(datas);
                        }, 10);
                    }
                })
                .fail((err) => {
                    self.traitementFailRequest(err, request);
                });
        }

        setTimeout((async () => {
            self.processRequests();
        }), self.timerProcessRequests);
    }
}