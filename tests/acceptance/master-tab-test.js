import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { getContext } from '@ember/test-helpers';

module('Acceptance | master tab', function(hooks) {
  setupApplicationTest(hooks);

  test('check if the test tab is master', async function(assert) {
    const { owner } = getContext();
    const masterTabService = owner.lookup('service:master-tab');

    assert.equal(masterTabService.isMasterTab, true); 
  });
});
