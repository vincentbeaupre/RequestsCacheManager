import * as utilities from "../utilities.js";
import * as serverVariables from "../serverVariables.js";
import { log } from "../log.js";

let requestCachesExpirationTime = serverVariables.get("main.requests.CacheExpirationTime");
global.requestCaches = []; //global for Glitch et globalThis for ES6

export default class CachedRequestsManager {
    static add(url, content, ETag = "") {
        CachedRequestsManager.clear(url);
        requestCaches.push({
            url,
            content,
            ETag,
            Expire_Time: utilities.nowInSeconds() + requestCachesExpirationTime
        });
        log("Response data for URL " + url + " added in requests cache");
    }

    static clear(url) {
      requestCaches = requestCaches.filter(cache => (cache.url.indexOf(url) == -1));
      console.log(`Cache cleared for url: ${url}`);
    }

    static find(url) {
      for (let cache of requestCaches) {
        if (cache.url === url) {
          // Renouvelle la cache si on l'utilise.
          cache.Expire_Time = utilities.nowInSeconds() + requestCachesExpirationTime;
          console.log(`Response for ${url} retrieved from cache`);
          return cache;
        }
      }
      return null; // Si aucune cache trouvée.
    }

    static flushExpired() {
        let now = utilities.nowInSeconds();
        requestCaches = requestCaches.filter(cache => cache.Expire_Time >= now);
        log("Expired request caches have been flushed");
    }

    static get(HttpContext) {
      if(HttpContext.req.method == 'GET') {
        let cache = CachedRequestsManager.find(HttpContext.req.url)

        if(cache) {
          HttpContext.response.JSON(cache.content, cache.ETag, true)
          return true;
        }
      }
      return false;
    }
}

// Nettoyage périodique des caches expirées
setInterval(CachedRequestsManager.flushExpired, requestCachesExpirationTime * 1000);
log("Periodic requests caches cleaning process started...");
