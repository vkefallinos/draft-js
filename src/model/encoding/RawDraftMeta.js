/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule RawDraftMeta
 * @flow
 */

'use strict';


/**
 * A plain object representation of an EntityInstance.
 */
export type RawDraftMeta = {
  type: string,
  data: ?{[key: string]: any},
};
