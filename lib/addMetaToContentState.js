/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule addMetaToContentState
 * @typechecks
 * 
 */

'use strict';

var addMetaToMetaMap = require('./addMetaToMetaMap');

function addMetaToContentState(contentState, instance, key) {
  return contentState.set('metaMap', addMetaToMetaMap(contentState.getMetaMap(), instance, key));
}

module.exports = addMetaToContentState;