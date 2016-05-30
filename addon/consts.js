import { v4 } from 'ember-uuid';

export const namespace = 'ember-master-tab:';

export const tabIdKey = `${namespace}tab-id`;
export const shouldInvalidateMasterTabKey = `${namespace}should-invalidate-master-tab`;
export const tabId = v4();