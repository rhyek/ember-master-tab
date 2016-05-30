import Ember from 'ember';
import { namespace } from './consts';

export function debug() {
  Ember.Logger.debug(namespace, ...arguments);
}