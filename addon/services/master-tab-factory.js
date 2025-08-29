import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { namespace, tabId, tabIdKey, shouldInvalidateMasterTabKey } from '../consts';
import { debug } from '../utils';

/**
 * Checks whether the current tab is the master tab.
 */
function isMasterTab() {
  return localStorage[tabIdKey] === tabId;
}

export default class MasterTabService extends Service {
  /** Tracks if this tab is the master */
  @tracked isMasterTab = false;

  /** List of current lock keys */
  lockNames = [];

  resolve = null;
  contestTimeout = null;

  /** Native event emitter */
  events = new EventTarget();

  /**
   * Subscribe to master-tab changes
   */
  onIsMasterTabChange(callback) {
    this.events.addEventListener('isMasterTab', callback);
    return () => this.events.removeEventListener('isMasterTab', callback);
  }

  /**
   * Sets up listeners and contests master tab status
   */
  setup() {
    const storageHandler = (e) => {
      switch (e.key) {
        case tabIdKey: {
          const newTabId = e.newValue;
          if (newTabId === null) {
            debug('Master tab currently being contested.');
            localStorage[shouldInvalidateMasterTabKey] = false;
            this.registerAsMasterTab();
          } else {
            if (this.isMasterTab && e.oldValue !== null && tabId !== newTabId) {
              debug('Lost master tab status. Probably race condition related.');
              this.isMasterTab = false;
              this.events.dispatchEvent(new CustomEvent('isMasterTab', { detail: false }));
            }
          }
          break;
        }
        case shouldInvalidateMasterTabKey: {
          const shouldInvalidateMasterTab = JSON.parse(e.newValue);
          const _isMaster = isMasterTab();
          if (shouldInvalidateMasterTab && _isMaster) {
            localStorage[shouldInvalidateMasterTabKey] = false;
            debug('Invalidation of master tab avoided.');
          } else if (!shouldInvalidateMasterTab && !_isMaster) {
            if (this.contestTimeout !== null) {
              clearTimeout(this.contestTimeout);
              this.contestTimeout = null;
              if (this.resolve) {
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

      this.lockNames.forEach((l) => {
        delete localStorage[l];
        debug(`Deleted lock [${l}].`);
      });

      if (isMasterTab()) {
        delete localStorage[tabIdKey];
        debug('Unregistered as master tab.');
      }
    });

    return this.contestMasterTab();
  }

  /**
   * Try to register as master tab
   */
  registerAsMasterTab() {
    let success = false;

    if (isMasterTab()) {
      success = true;
    } else {
      if (localStorage[tabIdKey] === undefined) {
        localStorage[tabIdKey] = tabId;
        localStorage[shouldInvalidateMasterTabKey] = false;
        success = true;
      }
      debug(`Trying to register as master tab... ${success ? 'SUCCESS' : 'FAILED'}.`);
    }


    this.isMasterTab = success;
    console.log('this.isMasterTab',this.isMasterTab);
    this.events.dispatchEvent(new CustomEvent('isMasterTab', { detail: success }));

    return success;
  }

  /**
   * Contest the current master tab
   */
  contestMasterTab() {
    return new Promise((resolve) => {
      if (!this.registerAsMasterTab()) {
        debug('Trying to invalidate master tab.');
        this.resolve = resolve;
        this.contestTimeout = setTimeout(() => {
          const shouldInvalidate = JSON.parse(localStorage[shouldInvalidateMasterTabKey]);
          if (shouldInvalidate) {
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
  }

  /**
   * Run a function if master tab
   */
  run(fn, options = {}) {
    if (typeof options !== 'object') {
      throw new Error('Options must be an object.');
    }

    const { force = false } = options;
    const _isMaster = isMasterTab();

    if (_isMaster || force) {
      fn();
    }

    return {
      else: (fallback) => {
        if (!_isMaster && !force) {
          fallback();
        }
      },
    };
  }

  /**
   * Locking mechanism
   */
  lock(lockName, fn, options = {}) {
    if (typeof options !== 'object') {
      throw new Error('Options must be an object.');
    }

    const {
      force = false,
      waitNext = true,
      waitNextDelay = 1000,
    } = options;

    const lockNameKey = `${namespace}lock:${lockName}`;
    const lockResultKey = `${lockNameKey}:result`;
    const lockResultTypeKey = `${lockNameKey}:result-type`;
    const isLocked = localStorage[lockNameKey] !== undefined;
    const _isMaster = isMasterTab();

    if ((_isMaster || force) && !isLocked) {
      localStorage[lockNameKey] = true;
      delete localStorage[lockResultKey];
      delete localStorage[lockResultTypeKey];

      if (!this.lockNames.includes(lockNameKey)) {
        this.lockNames.push(lockNameKey);
      }

      const p = fn();
      if (!p || !p.then) {
        throw new Error('The function argument must return a Promise.');
      }

      const callback = (type, result) => {
        localStorage[lockResultTypeKey] = type;
        localStorage[lockResultKey] = result;
        delete localStorage[lockNameKey];
        this.lockNames = this.lockNames.filter((l) => l !== lockNameKey);
      };

      p.then(
        (res) => callback('success', res),
        (err) => callback('failure', err)
      );
    }

    return {
      wait: (onSuccess, onFailure = null) => {
        if ((!_isMaster && !force) || isLocked) {
          const callCallback = (waited) => {
            const type = localStorage[lockResultTypeKey];
            const cb = type === 'success' ? onSuccess : onFailure;
            const result = localStorage[lockResultKey];
            if (cb) {
              cb(result, waited);
            }
          };

          if (isLocked || waitNext) {
            const handler = (e) => {
              if (e.key === lockNameKey && e.newValue === null) {
                window.removeEventListener('storage', handler);
                callCallback(true);
              }
            };
            window.addEventListener('storage', handler);

            if (waitNext) {
              setTimeout(() => {
                window.removeEventListener('storage', handler);
                callCallback(true);
              }, waitNextDelay);
            }
          } else {
            callCallback(false);
          }
        }
      },
    };
  }
}
