/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule convertFromRawToDraftState
 * 
 */

'use strict';

var _assign = require('object-assign');

var _extends = _assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var ContentBlock = require('./ContentBlock');
var ContentState = require('./ContentState');
var DraftEntityInstance = require('./DraftEntityInstance');
var DraftMetaInstance = require('./DraftMetaInstance');

var addEntityToEntityMap = require('./addEntityToEntityMap');
var addMetaToMetaMap = require('./addMetaToMetaMap');
var createCharacterList = require('./createCharacterList');
var decodeEntityRanges = require('./decodeEntityRanges');
var decodeInlineStyleRanges = require('./decodeInlineStyleRanges');
var decodeStyleMetaRanges = require('./decodeStyleMetaRanges');
var generateRandomKey = require('./generateRandomKey');
var Immutable = require('immutable');
var OrderedMap = Immutable.OrderedMap;
var Map = Immutable.Map;


function convertFromRawToDraftState(rawState) {
  var blocks = rawState.blocks,
      entityMap = rawState.entityMap,
      metaMap = rawState.metaMap;


  var fromStorageToLocal = {};
  var newMetaMap = Object.keys(metaMap).reduce(function (updatedMetaMap, storageKey) {
    var encodedMeta = metaMap[storageKey];
    var type = encodedMeta.type,
        data = encodedMeta.data;

    var instance = new DraftMetaInstance({ type: type, data: data || {} });
    var tempMetaMap = addMetaToMetaMap(updatedMetaMap, instance, storageKey);
    return tempMetaMap;
  }, OrderedMap());
  var newEntityMap = Object.keys(entityMap).reduce(function (updatedEntityMap, storageKey) {
    var encodedEntity = entityMap[storageKey];
    var type = encodedEntity.type,
        mutability = encodedEntity.mutability,
        data = encodedEntity.data;

    var instance = new DraftEntityInstance({ type: type, mutability: mutability, data: data || {} });
    var tempEntityMap = addEntityToEntityMap(updatedEntityMap, instance, "");
    var newKey = tempEntityMap.keySeq().last();
    fromStorageToLocal[storageKey] = newKey;

    return tempEntityMap;
  }, OrderedMap());

  var contentBlocks = blocks.map(function (block) {
    var key = block.key,
        type = block.type,
        text = block.text,
        depth = block.depth,
        inlineStyleRanges = block.inlineStyleRanges,
        entityRanges = block.entityRanges,
        data = block.data;

    key = key || generateRandomKey();
    type = type || 'unstyled';
    depth = depth || 0;
    inlineStyleRanges = inlineStyleRanges || [];
    entityRanges = entityRanges || [];
    data = Map(data);

    var inlineStyles = decodeInlineStyleRanges(text, inlineStyleRanges);
    var metas = decodeStyleMetaRanges(text, inlineStyleRanges);

    // Translate entity range keys to the DraftEntity map.
    var filteredEntityRanges = entityRanges.filter(function (range) {
      return fromStorageToLocal.hasOwnProperty(range.key);
    }).map(function (range) {
      return _extends({}, range, { key: fromStorageToLocal[range.key] });
    });

    var entities = decodeEntityRanges(text, filteredEntityRanges);
    var characterList = createCharacterList(inlineStyles, entities, metas);

    return new ContentBlock({ key: key, type: type, text: text, depth: depth, characterList: characterList, data: data });
  });

  return ContentState.createFromBlockArray(contentBlocks, newEntityMap, newMetaMap);
}

module.exports = convertFromRawToDraftState;