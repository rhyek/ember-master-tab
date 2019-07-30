import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Service | ember master tab', function(hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function(assert) {
    let service = this.owner.lookup('service:master-tab-factory');
    assert.ok(service);
  });
});
