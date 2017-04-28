/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DraftModifier
 * @typechecks
 * 
 */

'use strict';

var CharacterMetadata = require('./CharacterMetadata');
var ContentStateInlineStyle = require('./ContentStateInlineStyle');
var Immutable = require('immutable');

var applyEntityToContentState = require('./applyEntityToContentState');
var getCharacterRemovalRange = require('./getCharacterRemovalRange');
var getContentStateFragment = require('./getContentStateFragment');
var insertFragmentIntoContentState = require('./insertFragmentIntoContentState');
var insertTextIntoContentState = require('./insertTextIntoContentState');
var invariant = require('fbjs/lib/invariant');
var modifyBlockForContentState = require('./modifyBlockForContentState');
var removeEntitiesAtEdges = require('./removeEntitiesAtEdges');
var removeRangeFromContentState = require('./removeRangeFromContentState');
var splitBlockInContentState = require('./splitBlockInContentState');
var addOperationToContentState = require('./addOperationToContentState');
var moveBlockInContentState = require('./moveBlockInContentState');
var updateEntityDataInContentState = require('./updateEntityDataInContentState');
var createEntityInContentState = require('./createEntityInContentState');
var addEntityToContentState = require('./addEntityToContentState');
var updateMetaDataInContentState = require('./updateMetaDataInContentState');
var createMetaInContentState = require('./createMetaInContentState');
var addMetaToContentState = require('./addMetaToContentState');
var adjustBlockDepthForContentState = require('./adjustBlockDepthForContentState');

var generateRandomKey = require('./generateRandomKey');

var OrderedSet = Immutable.OrderedSet,
    OrderedMap = Immutable.OrderedMap;

/**
 * `DraftModifier` provides a set of convenience methods that apply
 * modifications to a `ContentState` object based on a target `SelectionState`.
 *
 * Any change to a `ContentState` should be decomposable into a series of
 * transaction functions that apply the required changes and return output
 * `ContentState` objects.
 *
 * These functions encapsulate some of the most common transaction sequences.
 */

var DraftModifier = {
  enableOT: function enableOT(contentState) {
    return contentState.merge({
      ot: true
    });
  },
  disableOT: function disableOT(contentState) {
    return contentState.merge({
      ot: false
    });
  },
  clearOperations: function clearOperations(contentState) {
    return contentState.merge({
      operations: OrderedMap({})
    });
  },

  replaceText: function replaceText(contentState, rangeToReplace, text, inlineStyle, entityKey, meta) {
    if (contentState.isOTEnabled()) contentState = addOperationToContentState(contentState, "replaceText", [].concat(Array.prototype.slice.call(arguments)));
    var withoutEntities = removeEntitiesAtEdges(contentState, rangeToReplace);
    var withoutText = removeRangeFromContentState(withoutEntities, rangeToReplace);
    var character = CharacterMetadata.create({
      style: inlineStyle || OrderedSet(),
      entity: entityKey || null,
      meta: meta || Immutable.Map()
    });

    return insertTextIntoContentState(withoutText, withoutText.getSelectionAfter(), text, character);
  },

  insertText: function insertText(contentState, targetRange, text, inlineStyle, entityKey, meta) {
    !targetRange.isCollapsed() ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Target range must be collapsed for `insertText`.') : invariant(false) : void 0;
    return DraftModifier.replaceText(contentState, targetRange, text, inlineStyle, entityKey, meta);
  },
  moveBlock: function moveBlock(contentState, atomicBlock, targetBlock, insertionMode) {
    if (contentState.isOTEnabled()) contentState = addOperationToContentState(contentState, "moveBlock", [].concat(Array.prototype.slice.call(arguments)));
    return moveBlockInContentState(contentState, atomicBlock, targetBlock, insertionMode);
  },
  moveText: function moveText(contentState, removalRange, targetRange) {

    var movedFragment = getContentStateFragment(contentState, removalRange);

    var afterRemoval = DraftModifier.removeRange(contentState, removalRange, 'backward');

    return DraftModifier.replaceWithFragment(afterRemoval, targetRange, movedFragment);
  },

  replaceWithFragment: function replaceWithFragment(contentState, targetRange, fragment) {
    fragment = fragment.map(function (fragmentBlock) {
      return fragmentBlock.getKey() ? fragmentBlock : fragmentBlock.set('key', generateRandomKey());
    });
    if (contentState.isOTEnabled()) contentState = addOperationToContentState(contentState, "replaceWithFragment", [arguments[0], arguments[1], fragment]);
    var withoutEntities = removeEntitiesAtEdges(contentState, targetRange);
    var withoutText = removeRangeFromContentState(withoutEntities, targetRange);

    return insertFragmentIntoContentState(withoutText, withoutText.getSelectionAfter(), fragment);
  },

  removeRange: function removeRange(contentState, rangeToRemove, removalDirection) {
    // Check whether the selection state overlaps with a single entity.
    // If so, try to remove the appropriate substring of the entity text.
    if (contentState.isOTEnabled()) contentState = addOperationToContentState(contentState, "removeRange", [].concat(Array.prototype.slice.call(arguments)));
    if (rangeToRemove.getAnchorKey() === rangeToRemove.getFocusKey()) {
      var key = rangeToRemove.getAnchorKey();
      var startOffset = rangeToRemove.getStartOffset();
      var endOffset = rangeToRemove.getEndOffset();
      var block = contentState.getBlockForKey(key);

      var startEntity = block.getEntityAt(startOffset);
      var endEntity = block.getEntityAt(endOffset - 1);
      if (startEntity && startEntity === endEntity) {
        var adjustedRemovalRange = getCharacterRemovalRange(contentState.getEntityMap(), block, rangeToRemove, removalDirection);
        return removeRangeFromContentState(contentState, adjustedRemovalRange);
      }
    }

    var withoutEntities = removeEntitiesAtEdges(contentState, rangeToRemove);
    return removeRangeFromContentState(withoutEntities, rangeToRemove);
  },

  splitBlock: function splitBlock(contentState, selectionState, keyBelow) {
    if (!keyBelow) {
      keyBelow = generateRandomKey();
    }
    if (contentState.isOTEnabled()) contentState = addOperationToContentState(contentState, "splitBlock", [].concat(Array.prototype.slice.call(arguments), [keyBelow]));

    var withoutEntities = removeEntitiesAtEdges(contentState, selectionState);
    var withoutText = removeRangeFromContentState(withoutEntities, selectionState);
    return splitBlockInContentState(withoutText, withoutText.getSelectionAfter(), keyBelow);
  },

  applyInlineStyle: function applyInlineStyle(contentState, selectionState, inlineStyle, metaKey) {
    if (contentState.isOTEnabled()) contentState = addOperationToContentState(contentState, "applyInlineStyle", [].concat(Array.prototype.slice.call(arguments)));
    return ContentStateInlineStyle.add(contentState, selectionState, inlineStyle, metaKey);
  },

  removeInlineStyle: function removeInlineStyle(contentState, selectionState, inlineStyle) {
    if (contentState.isOTEnabled()) contentState = addOperationToContentState(contentState, "removeInlineStyle", [].concat(Array.prototype.slice.call(arguments)));
    return ContentStateInlineStyle.remove(contentState, selectionState, inlineStyle);
  },
  removeBlockWithKey: function removeBlockWithKey(contentState, selectionAfter, key) {
    var blockMap = contentState.getBlockMap()['delete'](key);
    return contentState.merge({ blockMap: blockMap, selectionAfter: selectionAfter });
  },
  setBlockType: function setBlockType(contentState, selectionState, blockType) {
    if (contentState.isOTEnabled()) contentState = addOperationToContentState(contentState, "setBlockType", [].concat(Array.prototype.slice.call(arguments)));
    return modifyBlockForContentState(contentState, selectionState, function (block) {
      return block.merge({ type: blockType, depth: 0 });
    });
  },

  setBlockData: function setBlockData(contentState, selectionState, blockData) {
    if (contentState.isOTEnabled()) contentState = addOperationToContentState(contentState, "setBlockData", [].concat(Array.prototype.slice.call(arguments)));

    return modifyBlockForContentState(contentState, selectionState, function (block) {
      return block.merge({ data: blockData });
    });
  },

  mergeBlockData: function mergeBlockData(contentState, selectionState, blockData) {
    if (contentState.isOTEnabled()) contentState = addOperationToContentState(contentState, "mergeBlockData", [].concat(Array.prototype.slice.call(arguments)));

    return modifyBlockForContentState(contentState, selectionState, function (block) {
      return block.merge({ data: block.getData().merge(blockData) });
    });
  },
  adjustBlockDepth: function adjustBlockDepth(contentState, selectionState, adjustment, maxDepth) {
    if (contentState.isOTEnabled()) contentState = addOperationToContentState(contentState, "adjustBlockDepth", [].concat(Array.prototype.slice.call(arguments)));
    return adjustBlockDepthForContentState(contentState, selectionState, adjustment, maxDepth);
  },

  createMeta: function createMeta(contentState, type, data, key) {
    if (!key) {
      var metaMap = contentState.getMetaMap();
      var lastKey = metaMap.keySeq().last();
      if (!lastKey) {
        key = 1;
      } else {
        key = Number(lastKey) + 1;
      }
    }
    if (contentState.isOTEnabled()) contentState = addOperationToContentState(contentState, "createMeta", [].concat(Array.prototype.slice.call(arguments), [key]));
    return createMetaInContentState(contentState, type, data, key);
  },
  addMeta: function addMeta(contentState, instance, key) {
    if (!key) {
      var metaMap = contentState.getMetaMap();
      var lastKey = metaMap.keySeq().last();
      if (!lastKey) {
        key = 1;
      } else {
        key = Number(lastKey) + 1;
      }
    }
    if (contentState.isOTEnabled()) contentState = addOperationToContentState(contentState, "addMeta", [].concat(Array.prototype.slice.call(arguments), [key]));
    return addMetaToContentState(contentState, instance, key);
  },

  mergeMetaData: function mergeMetaData(contentState, key, newData) {
    if (contentState.isOTEnabled()) contentState = addOperationToContentState(contentState, "mergeMetaData", [].concat(Array.prototype.slice.call(arguments)));
    return updateMetaDataInContentState(contentState, key, newData, true);
  },

  replaceMetaData: function replaceMetaData(contentState, key, newData) {
    if (contentState.isOTEnabled()) contentState = addOperationToContentState(contentState, "replaceMetaData", [].concat(Array.prototype.slice.call(arguments)));
    return updateMetaDataInContentState(contentState, key, newData, false);
  },

  createEntity: function createEntity(contentState, type, mutability, data, key) {
    if (!key) {
      var entityMap = contentState.getEntityMap();
      var lastKey = entityMap.keySeq().last();
      if (!lastKey) {
        key = 1;
      } else {
        key = Number(lastKey) + 1;
      }
    }
    if (contentState.isOTEnabled()) contentState = addOperationToContentState(contentState, "createEntity", [].concat(Array.prototype.slice.call(arguments), [key]));
    return createEntityInContentState(contentState, type, mutability, data, key);
  },

  addEntity: function addEntity(contentState, instance, key) {
    if (!key) {
      var entityMap = contentState.getEntityMap();
      var lastKey = entityMap.keySeq().last();
      if (!lastKey) {
        key = 1;
      } else {
        key = Number(lastKey) + 1;
      }
    }
    if (contentState.isOTEnabled()) contentState = addOperationToContentState(contentState, "addEntity", [].concat(Array.prototype.slice.call(arguments), [key]));
    return addEntityToContentState(contentState, instance, key);
  },

  applyEntity: function applyEntity(contentState, selectionState, entityKey) {
    if (contentState.isOTEnabled()) contentState = addOperationToContentState(contentState, "applyEntity", [].concat(Array.prototype.slice.call(arguments)));
    var withoutEntities = removeEntitiesAtEdges(contentState, selectionState);
    return applyEntityToContentState(withoutEntities, selectionState, entityKey);
  },

  mergeEntityData: function mergeEntityData(contentState, key, newData) {
    if (contentState.isOTEnabled()) contentState = addOperationToContentState(contentState, "mergeEntityData", [].concat(Array.prototype.slice.call(arguments)));
    return updateEntityDataInContentState(contentState, key, newData, true);
  },

  replaceEntityData: function replaceEntityData(contentState, key, newData) {
    if (contentState.isOTEnabled()) contentState = addOperationToContentState(contentState, "replaceEntityData", [].concat(Array.prototype.slice.call(arguments)));
    return updateEntityDataInContentState(contentState, key, newData, false);
  }

};

module.exports = DraftModifier;