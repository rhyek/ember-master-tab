import Ember from 'ember';
import { namespace } from './consts';

export function debug() {
  Ember.Logger.debug(namespace, ...arguments);
}

export function getFunc() {
  let func = null;
  if (arguments.length === 2) {
    func = arguments[1].bind(arguments[0]);
  } else {
    func = arguments[0];
  }
  return func;
}