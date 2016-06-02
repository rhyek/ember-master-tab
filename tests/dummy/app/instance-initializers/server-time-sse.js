import Ember from 'ember';

export function initialize(instance) {
  if (!Ember.testing) {
    instance.lookup('service:server-time-sse');
  }
}

export default {
  name: 'server-time-sse',
  initialize
};
