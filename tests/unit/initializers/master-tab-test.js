import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import MasterTabInitializer from 'dummy/initializers/master-tab';

module('Unit | Initializer | master tab', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    // Clear localStorage before each test
    localStorage.clear();
  });

  hooks.afterEach(function () {
    // Clean up localStorage after each test
    localStorage.clear();
  });

  test('it has the correct name', function (assert) {
    assert.strictEqual(
      MasterTabInitializer.name,
      'master-tab',
      'initializer has correct name'
    );
  });

  test('it has an initialize function', function (assert) {
    assert.strictEqual(
      typeof MasterTabInitializer.initialize,
      'function',
      'initialize is a function'
    );
  });

  test('it does not run during testing', function (assert) {
    const application = this.owner;
    application.testing = true;

    // Should not throw an error and should exit early
    MasterTabInitializer.initialize(application);

    assert.ok(true, 'initializer exits early during testing');
  });

  test('the master-tab service is registered and available', function (assert) {
    // The service should be available via dependency injection
    const masterTab = this.owner.lookup('service:master-tab');

    assert.ok(masterTab, 'master-tab service is registered');
    assert.strictEqual(
      typeof masterTab.setup,
      'function',
      'service has setup method'
    );
    assert.strictEqual(
      typeof masterTab.run,
      'function',
      'service has run method'
    );
    assert.strictEqual(
      typeof masterTab.lock,
      'function',
      'service has lock method'
    );
  });
});
