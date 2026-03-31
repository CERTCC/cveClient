/**
 * Test helpers — pure function implementations extracted from source
 * files so they can be imported into Vitest without loading the full
 * browser app.
 */

/**
 * Extract standalone functions from cveInterface.js.
 * Only pure functions that don't depend on DOM/jQuery globals.
 */
export function loadCveInterfaceFunctions() {
  const fns = {};

  // simpleCopy — needs to exist before set_deep
  fns.simpleCopy = function simpleCopy(injson) {
    return JSON.parse(JSON.stringify(injson));
  };

  // get_deep
  fns.get_deep = function get_deep(obj, prop) {
    if (typeof obj != "object") return undefined;
    let props = prop.split(".");
    var x = obj;
    for (var i = 0; i < props.length; i++) {
      if (props[i] in x) x = x[props[i]];
      else return undefined;
    }
    return x;
  };

  // set_deep
  fns.set_deep = function set_deep(obj, prop, val) {
    if (typeof obj != "object") return undefined;
    let fobj = fns.simpleCopy(obj);
    var x = fobj;
    let props = prop.split(".");
    let fprop = props.pop();
    for (var i = 0; i < props.length; i++) {
      if (props[i] in x) {
        x = x[props[i]];
        continue;
      } else {
        if (i + 1 < props.length) {
          if (props[i + 1].match(/^\d+$/)) x[props[i]] = [];
          else x[props[i]] = {};
        } else if (fprop.match(/^\d+$/)) {
          x[props[i]] = [];
        } else {
          x[props[i]] = {};
        }
        x = x[props[i]];
      }
    }
    if (val === undefined) {
      if (fprop.match(/^\d+$/)) {
        x.splice(parseInt(fprop), 1);
      } else {
        delete x[fprop];
      }
    } else {
      x[fprop] = val;
    }
    return fobj;
  };

  // checkurl
  fns.checkurl = function checkurl(x) {
    try {
      new URL(x);
      return true;
    } catch (e) {
      return false;
    }
  };

  // check_json
  fns.check_json = function check_json(cjson) {
    return !!(
      cjson.affected &&
      cjson.affected.length > 0 &&
      cjson.affected[0].versions &&
      cjson.affected[0].versions.length > 0
    );
  };

  // queryParser (with prototype pollution fix)
  fns.queryParser = function queryParser(query) {
    const urlParams = {};
    let match;
    const pl = /\+/g;
    const search = /([^&=:]+)[=:]?([^&]*)/g;
    const decode = function (s) {
      return decodeURIComponent(s.replace(pl, " "));
    };
    while ((match = search.exec(query))) {
      let key = decode(match[1]);
      if (key === "__proto__" || key === "constructor" || key === "prototype")
        continue;
      urlParams[key] = decode(match[2]);
    }
    return urlParams;
  };

  return fns;
}

/**
 * safeHTML — uses DOM textContent/innerHTML for escaping.
 */
export function createSafeHTML() {
  return function safeHTML(uinput) {
    const div = document.createElement("div");
    div.textContent = uinput;
    return div.innerHTML;
  };
}

/**
 * cleanHTML from autoCompleter.js — same textContent pattern.
 */
export function createCleanHTML() {
  return function cleanHTML(content) {
    const div = document.createElement("div");
    div.textContent = content;
    return div.innerHTML;
  };
}

/**
 * URItoarrayBuffer from encrypt-storage.js — pure function.
 */
export function createURItoarrayBuffer() {
  return function URItoarrayBuffer(URI) {
    var byteString = atob(URI.split(",")[1]);
    var arrayBuffer = new ArrayBuffer(byteString.length);
    var _ia = new Uint8Array(arrayBuffer);
    for (var i = 0; i < byteString.length; i++) {
      _ia[i] = byteString.charCodeAt(i);
    }
    return arrayBuffer;
  };
}

/**
 * Mock cveClient class for API client tests.
 * Captures request details instead of making real HTTP calls.
 */
export function createMockCveClient() {
  class cveClient {
    constructor(org, user, key, url) {
      this.org = org;
      this.user = user;
      this.key = key;
      this.url = url;
      this.user_path = "/org/" + this.org + "/user/" + this.user;
      this._lastRequest = null;
    }

    rfetch(path, opts, qvars) {
      let url;
      try {
        url = new URL(this.url);
        delete this.error;
      } catch (err) {
        this.error = err;
        return Promise.reject(err);
      }
      url.pathname = url.pathname.replace(/\/$/, "") + path;
      if (!opts) {
        opts = { method: "GET" };
      }
      if (qvars) {
        var qstr = new URLSearchParams();
        Object.keys(qvars).forEach(function (x) {
          if (qvars[x] != "") qstr.append(x, qvars[x]);
        });
        url.search = qstr.toString();
      }
      if (!("headers" in opts)) opts.headers = {};
      opts.headers = Object.assign({}, opts.headers, {
        "CVE-API-KEY": this.key,
        "CVE-API-ORG": this.org,
        "CVE-API-USER": this.user,
      });

      this._lastRequest = {
        url: url.toString(),
        method: opts.method || "GET",
        headers: opts.headers,
        body: opts.body ? JSON.parse(opts.body) : undefined,
      };

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    }

    getjson(path, opts, qvars) {
      return this.rfetch(path, opts, qvars).then((r) => r.json());
    }

    putjson(path, opts, qvars, pvars) {
      if (!opts) opts = { method: "POST" };
      if (!("headers" in opts)) opts.headers = {};
      opts.headers["Content-Type"] = "application/json";
      if (pvars) opts.body = JSON.stringify(pvars);
      return this.rfetch(path, opts, qvars).then((r) => r.json());
    }

    publishadp(cve, adp) {
      let path = "/cve/" + cve + "/adp";
      let opts = { method: "PUT" };
      return this.putjson(path, opts, null, adp);
    }
    getadp(cve) {
      return this.getjson("/cve/" + cve + "/adp");
    }
    deleteadp(cve) {
      let path = "/cve/" + cve + "/adp";
      let opts = { method: "DELETE" };
      return this.rfetch(path, opts).then((r) => r.json());
    }
    publishcve(cve, cnajson, update, rejected) {
      let opts = null;
      if (update) opts = { method: "PUT" };
      let path = "/cve/" + cve + "/cna";
      if (rejected) path = "/cve/" + cve + "/reject";
      return this.putjson(path, opts, null, { cnaContainer: cnajson });
    }
    getcvedetail(cve) {
      return this.getjson("/cve/" + cve);
    }
    getcve(cve) {
      return this.getjson("/cve-id/" + cve);
    }
    reservecve(amount, cve_year, batch_type) {
      let path = "/cve-id/";
      let opts = { method: "POST" };
      let valid_batch_types = { nonsequential: 1, sequential: 1 };
      let qvars = {
        amount: amount ? amount : 1,
        short_name: this.org,
        cve_year: cve_year ? cve_year : new Date().getFullYear(),
      };
      if (amount > 1) {
        if (batch_type && batch_type in valid_batch_types) {
          qvars["batch_type"] = batch_type;
        } else {
          qvars["batch_type"] = "sequential";
        }
      }
      return this.putjson(path, opts, qvars);
    }
  }

  return cveClient;
}
