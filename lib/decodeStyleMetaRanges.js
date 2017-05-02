/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule decodeStyleMetaRanges
 * @typechecks
 * 
 */

'use strict';

var UnicodeUtils = require('fbjs/lib/UnicodeUtils');

var _require = require('immutable'),
    Map = _require.Map;

var substr = UnicodeUtils.substr;


var EMPTY_MAP = Map();

/**
 * Convert to native JavaScript string lengths to determine ranges.
 */
function decodeStyleMetaRanges(text, ranges) {
  var metas = Array(text.length).fill(EMPTY_MAP);
  if (ranges) {
    ranges.forEach(function ( /*object*/range) {
      var cursor = substr(text, 0, range.offset).length;
      var end = cursor + substr(text, range.offset, range.length).length;
      while (cursor < end) {
        metas[cursor] = metas[cursor].set(range.style, range.key);
        cursor++;
      }
    });
  }
  return metas;
}

module.exports = decodeStyleMetaRanges;