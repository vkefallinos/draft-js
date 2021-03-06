/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule convertFromRawToDraftState
 * @flow
 */

'use strict';

var ContentBlock = require('ContentBlock');
var ContentState = require('ContentState');
var DraftEntityInstance = require('DraftEntityInstance');
var DraftMetaInstance = require('DraftMetaInstance');


const addEntityToEntityMap = require('addEntityToEntityMap');
const addMetaToMetaMap = require('addMetaToMetaMap');
var createCharacterList = require('createCharacterList');
var decodeEntityRanges = require('decodeEntityRanges');
var decodeInlineStyleRanges = require('decodeInlineStyleRanges');
var decodeStyleMetaRanges = require('decodeStyleMetaRanges');
var generateRandomKey = require('generateRandomKey');
var Immutable = require('immutable');
var {OrderedMap} = Immutable;

import type {RawDraftContentState} from 'RawDraftContentState';

var {Map} = Immutable;

function convertFromRawToDraftState(
  rawState: RawDraftContentState
): ContentState {
  var {blocks, entityMap, metaMap} = rawState;

  var fromStorageToLocal = {};
  const newMetaMap = Object.keys(metaMap).reduce(
    (updatedMetaMap, storageKey) => {
      var encodedMeta = metaMap[storageKey];
      var {type, data} = encodedMeta;
      const instance = new DraftMetaInstance({type, data: data || {}});
      const tempMetaMap = addMetaToMetaMap(updatedMetaMap, instance, storageKey);
      return tempMetaMap;
    },
    OrderedMap(),
  )
  const newEntityMap = Object.keys(entityMap).reduce(
    (updatedEntityMap, storageKey) => {
      var encodedEntity = entityMap[storageKey];
      var {type, mutability, data} = encodedEntity;
      const instance = new DraftEntityInstance({type, mutability, data: data || {}});
      const tempEntityMap = addEntityToEntityMap(updatedEntityMap, instance, "");
      const newKey = tempEntityMap.keySeq().last();
      fromStorageToLocal[storageKey] = newKey;

      return tempEntityMap;
    },
    OrderedMap(),
  );

  var contentBlocks = blocks.map(
    block => {
      var {
        key,
        type,
        text,
        depth,
        inlineStyleRanges,
        entityRanges,
        data,
      } = block;
      key = key || generateRandomKey();
      type = type || 'unstyled';
      depth = depth || 0;
      inlineStyleRanges = inlineStyleRanges || [];
      entityRanges = entityRanges || [];
      data = Map(data);

      var inlineStyles = decodeInlineStyleRanges(text, inlineStyleRanges);
      var metas = decodeStyleMetaRanges(text, inlineStyleRanges)

      // Translate entity range keys to the DraftEntity map.
      var filteredEntityRanges = entityRanges
        .filter(range => fromStorageToLocal.hasOwnProperty(range.key))
        .map(range => {
          return {...range, key: fromStorageToLocal[range.key]};
        });

      var entities = decodeEntityRanges(text, filteredEntityRanges);
      var characterList = createCharacterList(inlineStyles, entities, metas);

      return new ContentBlock({key, type, text, depth, characterList, data});
    }
  );

  return ContentState.createFromBlockArray(contentBlocks, newEntityMap, newMetaMap);
}

module.exports = convertFromRawToDraftState;
