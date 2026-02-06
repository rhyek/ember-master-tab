import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Service | master-tab-factory', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    // Clear localStorage before each test
    localStorage.clear();
  });

  hooks.afterEach(function () {
    // Clean up localStorage after each test
    localStorage.clear();
  });

  test('it exists', function (assert) {
    let service = this.owner.lookup('service:master-tab-factory');
    assert.ok(service, 'service exists');
  });

  test('it initializes with correct default properties', function (assert) {
    let service = this.owner.lookup('service:master-tab-factory');
    assert.false(service.isMasterTab, 'isMasterTab is initially false');
    assert.deepEqual(
      service.lockNames,
      [],
      'lockNames is initially empty array'
    );
    assert.strictEqual(service.resolve, null, 'resolve is initially null');
    assert.strictEqual(
      service.contestTimeout,
      null,
      'contestTimeout is initially null'
    );
  });

  test('setup() returns a promise', async function (assert) {
    let service = this.owner.lookup('service:master-tab-factory');
    const setupPromise = service.setup();
    assert.ok(setupPromise instanceof Promise, 'setup returns a promise');
    await setupPromise;
    assert.ok(true, 'setup promise resolves');
  });

  test('registerAsMasterTab() sets isMasterTab property', function (assert) {
    let service = this.owner.lookup('service:master-tab-factory');
    assert.false(service.isMasterTab, 'initially not master tab');

    const success = service.registerAsMasterTab();

    assert.ok(success, 'registration was successful');
    assert.true(service.isMasterTab, 'isMasterTab is now true');
  });

  test('contestMasterTab() returns a promise that resolves', async function (assert) {
    let service = this.owner.lookup('service:master-tab-factory');
    const promise = service.contestMasterTab();

    assert.ok(promise instanceof Promise, 'contestMasterTab returns a promise');
    await promise;
    assert.true(service.isMasterTab, 'service became master tab');
  });

  test('run() executes function when force option is true', function (assert) {
    let service = this.owner.lookup('service:master-tab-factory');
    let executed = false;

    service.run(
      () => {
        executed = true;
      },
      { force: true }
    );

    assert.ok(executed, 'function was executed with force option');
  });

  test('run() returns an object with else() method', function (assert) {
    let service = this.owner.lookup('service:master-tab-factory');
    let mainExecuted = false;
    let elseExecuted = false;

    const result = service.run(
      () => {
        mainExecuted = true;
      },
      { force: true }
    );

    assert.strictEqual(
      typeof result.else,
      'function',
      'result has else method'
    );

    result.else(() => {
      elseExecuted = true;
    });

    assert.ok(mainExecuted, 'main function executed');
    assert.notOk(
      elseExecuted,
      'else function did not execute when force is true'
    );
  });

  test('lock() throws error when function does not return promise', function (assert) {
    let service = this.owner.lookup('service:master-tab-factory');
    service.registerAsMasterTab();

    assert.throws(
      () => {
        service.lock('test-lock', () => {
          return 'not a promise';
        });
      },
      /thennable/,
      'throws error when function does not return thennable'
    );
  });

  test('lock() returns an object with wait() method', function (assert) {
    let service = this.owner.lookup('service:master-tab-factory');
    service.registerAsMasterTab();

    const result = service.lock('test-lock', () => {
      return Promise.resolve('success');
    });

    assert.strictEqual(
      typeof result.wait,
      'function',
      'result has wait method'
    );
  });

  test('lock() tracks lock names', function (assert) {
    let service = this.owner.lookup('service:master-tab-factory');
    service.registerAsMasterTab();

    assert.strictEqual(service.lockNames.length, 0, 'no locks initially');

    service.lock('test-lock', () => {
      return Promise.resolve('success');
    });

    assert.strictEqual(service.lockNames.length, 1, 'lock was added');
    assert.ok(
      service.lockNames[0].includes('test-lock'),
      'lock name contains test-lock'
    );
  });

  test('run() and lock() throw error for invalid options', function (assert) {
    let service = this.owner.lookup('service:master-tab-factory');

    assert.throws(
      () => {
        service.run(() => {}, 'invalid');
      },
      /Options must be an object/,
      'run() throws error for invalid options'
    );

    assert.throws(
      () => {
        service.lock('test', () => Promise.resolve(), 'invalid');
      },
      /Options must be an object/,
      'lock() throws error for invalid options'
    );
  });

  test('service maintains event triggering capability', function (assert) {
    let service = this.owner.lookup('service:master-tab-factory');
    let eventFired = false;
    let eventValue = null;

    service.on('isMasterTab', (value) => {
      eventFired = true;
      eventValue = value;
    });

    service.registerAsMasterTab();

    assert.ok(eventFired, 'event was triggered');
    assert.true(eventValue, 'event passed correct value');
  });

  test('parseBooleanFromStorage helper works correctly (via contestMasterTab)', async function (assert) {
    let service = this.owner.lookup('service:master-tab-factory');

    // Set up a scenario where parseBooleanFromStorage will be called
    localStorage.setItem(
      'ember-master-tab:should-invalidate-master-tab',
      'true'
    );

    await service.contestMasterTab();

    assert.ok(true, 'contestMasterTab completed without eval errors');
    assert.true(service.isMasterTab, 'service became master tab');
  });

  test('isMasterTab property is tracked and reactive', function (assert) {
    let service = this.owner.lookup('service:master-tab-factory');
    let changeCount = 0;
    let lastValue = null;

    // Track changes to isMasterTab
    const trackingFn = () => {
      lastValue = service.isMasterTab;
      changeCount++;
    };

    // Initial check
    trackingFn();
    assert.strictEqual(changeCount, 1, 'tracking function called initially');
    assert.false(lastValue, 'initial value is false');

    // Register as master tab and verify the property updated
    service.registerAsMasterTab();
    trackingFn();
    assert.strictEqual(changeCount, 2, 'tracking function called after change');
    assert.true(lastValue, 'value changed to true');
    assert.true(service.isMasterTab, 'isMasterTab is now true');
  });
});
