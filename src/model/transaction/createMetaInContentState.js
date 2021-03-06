/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule createMetaInContentState
 * @typechecks
 * @flow
 */

'use strict';

const DraftMetaInstance = require('DraftMetaInstance');

const addMetaToContentState = require('addMetaToContentState');

import type ContentState from 'ContentState';

function createMetaInContentState(
  contentState: ContentState,
  type: string,
  data?: Object,
  key: string,
): ContentState {
  return addMetaToContentState(
    contentState,
    new DraftMetaInstance({type, data: data || {}}),
    key,
  );
}

module.exports = createMetaInContentState;
