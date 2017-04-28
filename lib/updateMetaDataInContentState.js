/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule updateMetaDataInContentState
 * @typechecks
 * 
 */

'use strict';

var _assign = require('object-assign');

var _extends = _assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function updateMetaDataInContentState(contentState, key, data, merge) {
  var instance = contentState.getMeta(key);
  var metaData = instance.getData();
  var newData = merge ? _extends({}, metaData, data) : data;

  var newInstance = instance.set('data', newData);
  var newMetaMap = contentState.getMetaMap().set(key, newInstance);
  return contentState.set('metaMap', newMetaMap);
}

module.exports = updateMetaDataInContentState;