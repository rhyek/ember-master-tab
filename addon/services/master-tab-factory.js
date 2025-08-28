import { run } from '@ember/runloop';
import Evented from '@ember/object/evented';
import Service from '@ember/service';
import { debug } from '../utils';
import {
  namespace,
  tabId,
  tabIdKey,
  shouldInvalidateMasterTabKey
} from '../consts';

/**
 * Checks whether the current tab is the master tab.
 */
function isMasterTab() {
  return localStorage[tabIdKey] === tabId;
}

/** The service factory. */
export default Service.extend(Evented, {
  /** Contains current lock names that will be deleted during the 'beforeunload' window event. */
  lockNames: [],
  resolve: null,
  contestTimeout: null,
  /**
   * Sets up listeners on the 'storage' and 'beforeunload' window events.
   * Returns a promise that resolves immediately if this or another tab is the master tab and that
   * tab is currently present. In case the master tab crashed and a new tab is opened, this promise
   * will resolve after a short delay while it invalidates the master tab.
   */
  setup() {
    const storageHandler = e => {
      switch (e.key) {
        case tabIdKey: {
          const newTabId = e.newValue;
          if (newTabId === null) {

            debug('Master tab currently being contested.');
            localStorage[shouldInvalidateMasterTabKey] = false;
            this.registerAsMasterTab();
          } else {
            if (this.get('isMasterTab') && e.oldValue !== null && tabId !== newTabId) {
              debug('Lost master tab status. Probably race condition related.');
              run(() => {
                this.set('isMasterTab', false);
                this.trigger('isMasterTab', false);
              });
            }
          }
          break;
        }
        case shouldInvalidateMasterTabKey: {
          const shouldInvalidateMasterTab = eval(e.newValue);
          const _isMasterTab = isMasterTab();
          if (shouldInvalidateMasterTab && _isMasterTab) {
            localStorage[shouldInvalidateMasterTabKey] = false;
            debug('Invalidation of master tab avoided.');
          } else if (!shouldInvalidateMasterTab && !_isMasterTab) {
            if (this.contestTimeout !== null) {
              clearTimeout(this.contestTimeout);
              this.contestTimeout = null;
              if (this.resolve !== null) {
                this.resolve();
                this.resolve = null;
              }
              debug('Invalidation of master tab aborted.');
            }
          }
          break;
        }
      }
    };
    window.addEventListener('storage', storageHandler);
    window.addEventListener('beforeunload', () => {
      window.removeEventListener('storage', storageHandler);
      this.lockNames.forEach(l => {
        delete localStorage[l];
        debug(`Deleted lock [${l}].`);
      });
      if (isMasterTab()) {
        delete localStorage[tabIdKey];
        debug('Unregistered as master tab. ');
      }
    });
    return this.contestMasterTab();
  },
  isMasterTab: false,
  /** Tries to register as the master tab if there is no current master tab registered. */
  registerAsMasterTab() {
    let success = false;
    if (isMasterTab()) {
      success = true;
    } else {
      if (typeof localStorage[tabIdKey] === 'undefined') {
        localStorage[tabIdKey] = tabId;
        localStorage[shouldInvalidateMasterTabKey] = false;
        success = true;
      }
      debug(`Trying to register as master tab... ${success ? 'SUCCESS' : 'FAILED'}.`);
    }
    run(() => {
      this.set('isMasterTab', success);
      this.trigger('isMasterTab', success);
    });
    return success;
  },

  /**
   * Returns a promise which attempts to contest the master tab.
   */
  contestMasterTab() {
    return new Promise(resolve => {
      if (!this.registerAsMasterTab()) {
        debug('Trying to invalidate master tab.');
        this.resolve = resolve;
        this.contestTimeout = setTimeout(() => {
          const shouldInvalidateMasterTab = eval(localStorage[shouldInvalidateMasterTabKey]);
          if (shouldInvalidateMasterTab) {
            localStorage[shouldInvalidateMasterTabKey] = false;
            delete localStorage[tabIdKey];
            this.registerAsMasterTab();
          }
          resolve();
        }, 500);
        localStorage[shouldInvalidateMasterTabKey] = true;
      } else {
        resolve();
      }
    });
  },
  /**
   * Runs the provided function if this is the master tab. If this is not the current tab, run
   * the function provided to 'else()'.
   */
  run(func, options = {}) {
    if (typeof options !== 'object') {
      throw 'Options must be an object.';
    }
    const finalOptions = Object.assign({
      force: false
    }, options);
    const _isMasterTab = isMasterTab();
    if (_isMasterTab || finalOptions.force) {
      func();
    }
    return {
      else(func) {
        if (!_isMasterTab && !finalOptions.force) {
          func();
        }
      }
    };
  },
  /**
   * Runs the provided function (which should return a Promise) if this is the master tab.
   * It creates a lock which is freed once the Promise is resolved or rejected.
   * If this is not the master tab, run the function provided to 'wait()'. If there is no
   * lock present currently, the function runs immediately. If there is, it will run once
   * the promise on the master tab resolves or rejects.
   */
  lock(lockName, func, options = {}) {
    if (typeof options !== 'object') {
      throw 'Options must be an object.';
    }
    const finalOptions = Object.assign({
      force: false,
      waitNext: true,
      waitNextDelay: 1000
    }, options);
    const lockNameKey = `${namespace}lock:${lockName}`;
    const lockResultKey = `${lockNameKey}:result`;
    const lockResultTypeKey = `${lockNameKey}:result-type`;
    const isLocked = typeof localStorage[lockNameKey] !== 'undefined';
    const _isMasterTab = isMasterTab();
    if ((_isMasterTab || finalOptions.force) && !isLocked) {
      localStorage[lockNameKey] = true;
      delete localStorage[lockResultKey];
      delete localStorage[lockResultTypeKey];
      if (this.lockNames.indexOf(lockNameKey) === -1) {
        this.lockNames.push(lockNameKey);
      }
      const p = func();
      if (!p || !p.then) {
        throw 'The function argument must return a thennable object.';
      }
      const callback = (type, result) => {
        localStorage[lockResultTypeKey] = type;
        localStorage[lockResultKey] = result;
        delete localStorage[lockNameKey];
        const index = this.lockNames.indexOf(lockNameKey);
        if (index > -1) {
          this.lockNames.splice(index, 1);
        }
      };
      p.then(result => callback('success', result), result => callback('failure', result));
    }
    return {
      wait(success, failure = null) {
        if ((!_isMasterTab && !finalOptions.force) || isLocked) {
          const callCallback = waited => {
            const resultType = localStorage[lockResultTypeKey];
            const func = resultType === 'success' ? success : failure;
            const result = localStorage[lockResultKey];
            if (func !== null) {
              func(result, waited);
            }
          };
          if (isLocked || finalOptions.waitNext) {
            const handler = e => {
              if (e.key === lockNameKey && e.newValue === null) {
                window.removeEventListener('storage', handler);
                callCallback(true);
              }
            };
            window.addEventListener('storage', handler);
            if (finalOptions.waitNext) {
              setTimeout(() => {
                window.removeEventListener('storage', handler);
                callCallback(true);
              }, finalOptions.waitNextDelay);
            }
          } else {
            callCallback(false);
          }
        }
      }
    };
  }
});
