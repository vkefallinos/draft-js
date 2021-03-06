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
 * @flow
 */

'use strict';

import type ContentState from 'ContentState';

function updateMetaDataInContentState(
  contentState: ContentState,
  key: string,
  data: {[key: string]: any},
  merge: boolean,
): ContentState {
  const instance = contentState.getMeta(key);
  const metaData = instance.getData();
  const newData = merge ?
    {...metaData, ...data} :
    data;

  const newInstance = instance.set('data', newData);
  const newMetaMap = contentState.getMetaMap().set(key, newInstance);
  return contentState.set('metaMap', newMetaMap);
}

module.exports = updateMetaDataInContentState;
