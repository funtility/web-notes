/**
 * A TabInfo object represents a single browser tab URL visited.
 */
class TabInfo {
  constructor(data = {}) {
    if (!data) return;
    this.url = data.hasOwnProperty("url") ? data.url : "";
    this.subDomain = data.hasOwnProperty("subDomain") ? data.subDomain : "";
    this.domain = data.hasOwnProperty("domain") ? data.domain : "";
    this.route = data.hasOwnProperty("route") ? data.route : "";
    this.queryParams = data.hasOwnProperty("queryParams")
      ? data.queryParams
      : {};
    this.fragmentIdentifiers = data.hasOwnProperty("fragmentIdentifiers")
      ? data.fragmentIdentifiers
      : {};
  }

  fromTab(tab) {
    this.tabId = tab.id;
    return this.fromUrl(tab.url);
  }

  fromUrl(url) {
    this.url = url;

    if (!this.url) {
      this.subDomain = "";
      this.domain = "";
      this.route = "";
      this.queryParams = {};
    } else {
      const url = new URL(this.url);
      if (url.hostname.split(".").length === 3) {
        const parts = url.hostname.split(".");
        this.subDomain = parts[0] == "www" ? "" : parts[0];
        this.domain = parts[parts.length - 2] + "." + parts[parts.length - 1];
      } else {
        const parts = url.hostname.split(".");
        this.subDomain = parts[0];
        this.domain = parts[parts.length - 2] + "." + parts[parts.length - 1];
      }

      this.route = url.pathname;

      if (url.search) {
        const paramString = url.search.substring(1);
        const params = paramString.split("&");
        this.queryParams = {};
        for (let i = 0; i < params.length; i++) {
          const pair = params[i].split("=");
          this.queryParams[pair[0]] = pair[1];
        }
      } else {
        this.queryParams = {};
      }

      if (url.hash) {
        const paramString = url.hash.substring(1);
        const params = paramString.split("&");
        this.fragmentIdentifiers = {};
        for (let i = 0; i < params.length; i++) {
          const pair = params[i].split("=");
          this.fragmentIdentifiers[pair[0]] = pair[1];
        }
      } else {
        this.fragmentIdentifiers = {};
      }
    }
    return this;
  }

  get isNotRestricted() {
    let result = true;
    if (this.url.includes("undefined")) {
      result = false;
    } else if (this.url.includes("newtab")) {
      result = false;
    } else if (this.url.includes("extension")) {
      result = false;
    }
    return result;
  }
}

class RecordSet {
  constructor(data = {}) {
    this.id = data.hasOwnProperty("id") ? data.id : Date.now();
    this.title = data.hasOwnProperty("title") ? data.title : "";
    this.domain = data.hasOwnProperty("domain") ? data.domain : "";
    this.isFocused = data.hasOwnProperty("isFocused") ? data.isFocused : false;
  }
}

class Record {
  constructor(data = {}) {
    this.id = data.hasOwnProperty("id") ? data.id : Date.now();
    this.recordSetId = data.hasOwnProperty("recordSetId")
      ? data.recordSetId
      : "";
    this.key = data.hasOwnProperty("key") ? data.key : "";
    this.value = data.hasOwnProperty("value") ? data.value : "";
    this.isHidden = data.hasOwnProperty("isHidden") ? data.isHidden : false;
  }
}
