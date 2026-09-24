if (typeof globalThis.FormData === 'undefined') {
  globalThis.FormData = class FormData {
    constructor() {
      this._parts = [];
    }
    append(key, value) {
      this._parts.push([key, value]);
    }
    get(key) {
      const entry = this._parts.find(([k]) => k === key);
      return entry ? entry[1] : null;
    }
    getAll(key) {
      return this._parts.filter(([k]) => k === key).map(([, v]) => v);
    }
    has(key) {
      return this._parts.some(([k]) => k === key);
    }
    delete(key) {
      this._parts = this._parts.filter(([k]) => k !== key);
    }
  };
  global.FormData = globalThis.FormData;
}

if (typeof globalThis.Request === 'undefined' || typeof globalThis.Response === 'undefined' || typeof globalThis.Headers === 'undefined') {
  try {
    const fetch = require('node-fetch');
    if (typeof globalThis.Headers === 'undefined') {
      globalThis.Headers = fetch.Headers;
      global.Headers = fetch.Headers;
    }
    if (typeof globalThis.Request === 'undefined') {
      globalThis.Request = fetch.Request;
      global.Request = fetch.Request;
    }
    if (typeof globalThis.Response === 'undefined') {
      globalThis.Response = fetch.Response;
      global.Response = fetch.Response;
    }
  } catch (e) {
    // node-fetch not available
  }
}
