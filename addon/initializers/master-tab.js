import MasterTabService from '../services/master-tab-factory';

export function initialize(application) {
    if (!application.testing) {
      const masterTab = MasterTabService.create();
      application.unregister('service:master-tab-factory');
      application.register('service:master-tab', masterTab, { instantiate: false });
      application.deferReadiness();
      masterTab.setup().then(() => {
        application.advanceReadiness();
      });
    }
}

export default {
  name: 'master-tab',
  initialize
};
