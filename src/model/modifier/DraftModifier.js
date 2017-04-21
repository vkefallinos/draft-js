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
 * @flow
 */

'use strict';

var CharacterMetadata = require('CharacterMetadata');
var ContentStateInlineStyle = require('ContentStateInlineStyle');
var Immutable = require('immutable');

var applyEntityToContentState = require('applyEntityToContentState');
var getCharacterRemovalRange = require('getCharacterRemovalRange');
var getContentStateFragment = require('getContentStateFragment');
var insertFragmentIntoContentState = require('insertFragmentIntoContentState');
var insertTextIntoContentState = require('insertTextIntoContentState');
var invariant = require('invariant');
var modifyBlockForContentState = require('modifyBlockForContentState');
var removeEntitiesAtEdges = require('removeEntitiesAtEdges');
var removeRangeFromContentState = require('removeRangeFromContentState');
var splitBlockInContentState = require('splitBlockInContentState');
var addOperationToContentState = require('addOperationToContentState');
var moveBlockInContentState = require('moveBlockInContentState');
const updateEntityDataInContentState = require('updateEntityDataInContentState');
const createEntityInContentState = require('createEntityInContentState');
const addEntityToContentState = require('addEntityToContentState');
const adjustBlockDepthForContentState = require('adjustBlockDepthForContentState');

var generateRandomKey = require('generateRandomKey');

import type {BlockMap} from 'BlockMap';
import type ContentState from 'ContentState';
import type {DraftBlockType} from 'DraftBlockType';
import type {DraftInlineStyle} from 'DraftInlineStyle';
import type {DraftRemovalDirection} from 'DraftRemovalDirection';
import type {Map} from 'immutable';
import type SelectionState from 'SelectionState';

const {OrderedSet, OrderedMap} = Immutable;

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
  clearOperations: function(
    contentState: ContentState
  ): ContentState {
    console.log(contentState)
    return contentState.merge({
      operations: OrderedMap({})
    })
  },

  replaceText: function(
    contentState: ContentState,
    rangeToReplace: SelectionState,
    text: string,
    inlineStyle?: DraftInlineStyle,
    entityKey?: ?string
  ): ContentState {
    contentState = addOperationToContentState(
      "replaceText",
      contentState,
      [...arguments]
    )
    var withoutEntities = removeEntitiesAtEdges(contentState, rangeToReplace);
    var withoutText = removeRangeFromContentState(
      withoutEntities,
      rangeToReplace
    );
    var character = CharacterMetadata.create({
      style: inlineStyle || OrderedSet(),
      entity: entityKey || null,
    });

    return insertTextIntoContentState(
      withoutText,
      withoutText.getSelectionAfter(),
      text,
      character
    );
  },

  insertText: function(
    contentState: ContentState,
    targetRange: SelectionState,
    text: string,
    inlineStyle?: DraftInlineStyle,
    entityKey?: ?string
  ): ContentState {
    invariant(
      targetRange.isCollapsed(),
      'Target range must be collapsed for `insertText`.'
    );
    return DraftModifier.replaceText(
      contentState,
      targetRange,
      text,
      inlineStyle,
      entityKey
    );
  },
  moveBlock: function(
    contentState: ContentState,
    atomicBlock: ContentBlock,
    targetBlock: ContentBlock,
    insertionMode?: DraftInsertionType
  ){
    contentState = addOperationToContentState(
      contentState,
      "moveBlock",
      [...arguments]
    )
    return  moveBlockInContentState(
      contentState,
      atomicBlock,
      targetBlock,
      insertionMode
    );
  },
  moveText: function(
    contentState: ContentState,
    removalRange: SelectionState,
    targetRange: SelectionState
  ): ContentState {

    var movedFragment = getContentStateFragment(contentState, removalRange);

    var afterRemoval = DraftModifier.removeRange(
      contentState,
      removalRange,
      'backward'
    );

    return DraftModifier.replaceWithFragment(
      afterRemoval,
      targetRange,
      movedFragment
    );
  },

  replaceWithFragment: function(
    contentState: ContentState,
    targetRange: SelectionState,
    fragment: BlockMap
  ): ContentState {
    fragment = fragment.map(
      fragmentBlock => {
        return fragmentBlock.getKey()?
        fragmentBlock:fragmentBlock.set('key', generateRandomKey());
      }
    );
    contentState = addOperationToContentState(
      contentState,
      "replaceWithFragment",
      [...arguments, fragment]
    )
    var withoutEntities = removeEntitiesAtEdges(contentState, targetRange);
    var withoutText = removeRangeFromContentState(
      withoutEntities,
      targetRange
    );

    return insertFragmentIntoContentState(
      withoutText,
      withoutText.getSelectionAfter(),
      fragment
    );
  },

  removeRange: function(
    contentState: ContentState,
    rangeToRemove: SelectionState,
    removalDirection: DraftRemovalDirection
  ): ContentState {
    // Check whether the selection state overlaps with a single entity.
    // If so, try to remove the appropriate substring of the entity text.
    contentState = addOperationToContentState(
      contentState,
      "removeRange",
      [...arguments]
    )
    if (rangeToRemove.getAnchorKey() === rangeToRemove.getFocusKey()) {
      var key = rangeToRemove.getAnchorKey();
      var startOffset = rangeToRemove.getStartOffset();
      var endOffset = rangeToRemove.getEndOffset();
      var block = contentState.getBlockForKey(key);

      var startEntity = block.getEntityAt(startOffset);
      var endEntity = block.getEntityAt(endOffset - 1);
      if (startEntity && startEntity === endEntity) {
        var adjustedRemovalRange = getCharacterRemovalRange(
          contentState.getEntityMap(),
          block,
          rangeToRemove,
          removalDirection
        );
        return removeRangeFromContentState(contentState, adjustedRemovalRange);
      }
    }

    var withoutEntities = removeEntitiesAtEdges(contentState, rangeToRemove);
    return removeRangeFromContentState(withoutEntities, rangeToRemove);
  },

  splitBlock: function(
    contentState: ContentState,
    selectionState: SelectionState,
    keyBelow?: string
  ): ContentState {
    if(!keyBelow){
      keyBelow = generateRandomKey()
    }
    contentState = addOperationToContentState(
      contentState,
      "splitBlock",
      [...arguments, keyBelow]
    )

    var withoutEntities = removeEntitiesAtEdges(contentState, selectionState);
    var withoutText = removeRangeFromContentState(
      withoutEntities,
      selectionState
    );
    return splitBlockInContentState(
      withoutText,
      withoutText.getSelectionAfter(),
      keyBelow
    );
  },

  applyInlineStyle: function(
    contentState: ContentState,
    selectionState: SelectionState,
    inlineStyle: string
  ): ContentState {
    contentState = addOperationToContentState(
      contentState,
      "applyInlineStyle",
      [...arguments]
    )
    return ContentStateInlineStyle.add(
      contentState,
      selectionState,
      inlineStyle
    );
  },

  removeInlineStyle: function(
    contentState: ContentState,
    selectionState: SelectionState,
    inlineStyle: string
  ): ContentState {
    contentState = addOperationToContentState(
      contentState,
      "removeInlineStyle",
      [...arguments]
    )
    return ContentStateInlineStyle.remove(
      contentState,
      selectionState,
      inlineStyle
    );
  },
  removeBlockWithKey: function(
    contentState: ContentState,
    selectionAfter: SelectionState,
    key: string
  ): ContentState {
    const blockMap = contentState.getBlockMap().delete(key);
    return contentState.merge({blockMap, selectionAfter});
  },
  setBlockType: function(
    contentState: ContentState,
    selectionState: SelectionState,
    blockType: DraftBlockType
  ): ContentState {
    contentState = addOperationToContentState(
      contentState,
      "setBlockType",
      [...arguments]
    )
    return modifyBlockForContentState(
      contentState,
      selectionState,
      (block) => block.merge({type: blockType, depth: 0})
    );
  },

  setBlockData: function(
    contentState: ContentState,
    selectionState: SelectionState,
    blockData: Map<any, any>,
  ): ContentState {
    contentState = addOperationToContentState(
      contentState,
      "setBlockData",
      [...arguments]
    )

    return modifyBlockForContentState(
      contentState,
      selectionState,
      (block) => block.merge({data: blockData})
    );
  },

  mergeBlockData: function(
    contentState: ContentState,
    selectionState: SelectionState,
    blockData: Map<any, any>,
  ): ContentState {
    contentState = addOperationToContentState(
      contentState,
      "mergeBlockData",
      [...arguments]
    )

    return modifyBlockForContentState(
      contentState,
      selectionState,
      (block) => block.merge({data: block.getData().merge(blockData)})
    );
  },
  adjustBlockDepth: function(
    contentState: ContentState,
    selectionState: SelectionState,
    adjustment: number,
    maxDepth: number
  ){
    contentState = addOperationToContentState(
      contentState,
      "adjustBlockDepth",
      [...arguments]
    )
    return adjustBlockDepthForContentState(
      contentState,
      selectionState,
      adjustment,
      maxDepth
    )
  },
  replaceEntityData: function(
    contentState: ContentState,
    key: string,
    newData: {[key: string]: any},
  ): ContentState {
    contentState = addOperationToContentState(
      contentState,
      "replaceEntityData",
      [...arguments]
    )
    return updateEntityDataInContentState(contentState, key, newData, false);
  },

  createEntity: function(
    contentState: ContentState,
    type: DraftEntityType,
    mutability: DraftEntityMutability,
    data?: Object,
    key?: string
  ): ContentState {
    if(!key){
      const entityMap = contentState.getEntityMap()
      const lastKey = entityMap.keySeq().last()
      if(!lastKey){
        key = 1
      }else{
        key = Number(lastKey)+1
      }
    }
    contentState = addOperationToContentState(
      contentState,
      "createEntity",
      [...arguments, key]
    )
    return createEntityInContentState(contentState, type, mutability, data, key);
  },

  addEntity: function(
    contentState: ContentState,
    instance: DraftEntityInstance,
    key?: string
  ): ContentState {
    if(!key){
      const entityMap = contentState.getEntityMap()
      const lastKey = entityMap.keySeq().last()
      if(!lastKey){
        key = 1
      }else{
        key = Number(lastKey)+1
      }
    }
    contentState = addOperationToContentState(
      contentState,
      "addEntity",
      [...arguments, key]
    )
    return addEntityToContentState(contentState, instance, key);
  },

  applyEntity: function(
    contentState: ContentState,
    selectionState: SelectionState,
    entityKey: ?string
  ): ContentState {
    contentState = addOperationToContentState(
      contentState,
      "applyEntity",
      [...arguments]
    )
    var withoutEntities = removeEntitiesAtEdges(contentState, selectionState);
    return applyEntityToContentState(
      withoutEntities,
      selectionState,
      entityKey
    );
  },
};

module.exports = DraftModifier;
