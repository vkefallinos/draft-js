/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ContentState
 * @typechecks
 * 
 */

'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BlockMapBuilder = require('./BlockMapBuilder');
var CharacterMetadata = require('./CharacterMetadata');
var ContentBlock = require('./ContentBlock');
var Immutable = require('immutable');
var SelectionState = require('./SelectionState');
var DraftModifier = require('./DraftModifier');
var invariant = require('fbjs/lib/invariant');
var generateRandomKey = require('./generateRandomKey');
var sanitizeDraftText = require('./sanitizeDraftText');

var List = Immutable.List,
    Record = Immutable.Record,
    Repeat = Immutable.Repeat,
    OrderedMap = Immutable.OrderedMap;


var defaultRecord = {
  ot: false,
  operations: OrderedMap({}),
  entityMap: null,
  blockMap: null,
  metaMap: OrderedMap({}),
  selectionBefore: null,
  selectionAfter: null
};

var ContentStateRecord = Record(defaultRecord);

var ContentState = function (_ContentStateRecord) {
  _inherits(ContentState, _ContentStateRecord);

  function ContentState() {
    _classCallCheck(this, ContentState);

    return _possibleConstructorReturn(this, _ContentStateRecord.apply(this, arguments));
  }

  ContentState.prototype.isOTEnabled = function isOTEnabled() {
    return this.get('ot');
  };

  ContentState.prototype.getOperations = function getOperations() {
    return this.get('operations');
  };

  ContentState.prototype.getEntityMap = function getEntityMap() {
    return this.get('entityMap');
  };

  ContentState.prototype.getBlockMap = function getBlockMap() {
    return this.get('blockMap');
  };

  ContentState.prototype.getMetaMap = function getMetaMap() {
    return this.get('metaMap');
  };

  ContentState.prototype.getSelectionBefore = function getSelectionBefore() {
    return this.get('selectionBefore');
  };

  ContentState.prototype.getSelectionAfter = function getSelectionAfter() {
    return this.get('selectionAfter');
  };

  ContentState.prototype.getBlockForKey = function getBlockForKey(key) {
    var block = this.getBlockMap().get(key);
    return block;
  };

  ContentState.prototype.getKeyBefore = function getKeyBefore(key) {
    return this.getBlockMap().reverse().keySeq().skipUntil(function (v) {
      return v === key;
    }).skip(1).first();
  };

  ContentState.prototype.getKeyAfter = function getKeyAfter(key) {
    return this.getBlockMap().keySeq().skipUntil(function (v) {
      return v === key;
    }).skip(1).first();
  };

  ContentState.prototype.getBlockAfter = function getBlockAfter(key) {
    return this.getBlockMap().skipUntil(function (_, k) {
      return k === key;
    }).skip(1).first();
  };

  ContentState.prototype.getBlockBefore = function getBlockBefore(key) {
    return this.getBlockMap().reverse().skipUntil(function (_, k) {
      return k === key;
    }).skip(1).first();
  };

  ContentState.prototype.getBlocksAsArray = function getBlocksAsArray() {
    return this.getBlockMap().toArray();
  };

  ContentState.prototype.getFirstBlock = function getFirstBlock() {
    return this.getBlockMap().first();
  };

  ContentState.prototype.getLastBlock = function getLastBlock() {
    return this.getBlockMap().last();
  };

  ContentState.prototype.getPlainText = function getPlainText(delimiter) {
    return this.getBlockMap().map(function (block) {
      return block ? block.getText() : '';
    }).join(delimiter || '\n');
  };

  ContentState.prototype.getLastCreatedEntityKey = function getLastCreatedEntityKey() {
    return this.getEntityMap().keySeq().last();
  };

  ContentState.prototype.getLastCreatedMetaKey = function getLastCreatedMetaKey() {
    return this.getMetaMap().keySeq().last();
  };

  ContentState.prototype.hasText = function hasText() {
    var blockMap = this.getBlockMap();
    return blockMap.size > 1 || blockMap.first().getLength() > 0;
  };

  ContentState.prototype.createEntity = function createEntity(type, mutability, data) {
    return DraftModifier.createEntity(this, type, mutability, data);
  };

  ContentState.prototype.mergeEntityData = function mergeEntityData(key, toMerge) {
    return DraftModifier.mergeEntityData(this, key, toMerge);
  };

  ContentState.prototype.replaceEntityData = function replaceEntityData(key, newData) {
    return DraftModifier.replaceEntityData(this, key, newData, false);
  };

  ContentState.prototype.addEntity = function addEntity(instance) {
    return DraftModifier.addEntity(this, instance);
  };

  ContentState.prototype.getEntity = function getEntity(key) {
    var instance = this.getEntityMap().get(key);
    !!!instance ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Unknown DraftEntity Key.') : invariant(false) : void 0;
    return instance;
  };

  ContentState.prototype.createMeta = function createMeta(type, data) {
    return DraftModifier.createMeta(this, type, data);
  };

  ContentState.prototype.mergeMetaData = function mergeMetaData(key, toMerge) {
    return DraftModifier.mergeMetaData(this, key, toMerge);
  };

  ContentState.prototype.replaceMetaData = function replaceMetaData(key, newData) {
    return DraftModifier.replaceMetaData(this, key, newData, false);
  };

  ContentState.prototype.addMeta = function addMeta(instance) {
    return DraftModifier.addMeta(this, instance);
  };

  ContentState.prototype.getMeta = function getMeta(key) {
    var instance = this.getMetaMap().get(key);
    !!!instance ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Unknown DraftMeta Key.') : invariant(false) : void 0;
    return instance;
  };

  ContentState.createFromBlockArray = function createFromBlockArray(blocks, entityMap, metaMap) {
    var blockMap = BlockMapBuilder.createFromArray(blocks);
    var selectionState = blockMap.isEmpty() ? new SelectionState() : SelectionState.createEmpty(blockMap.first().getKey());
    return new ContentState({
      blockMap: blockMap,
      entityMap: entityMap || OrderedMap(),
      metaMap: metaMap || OrderedMap(),
      selectionBefore: selectionState,
      selectionAfter: selectionState
    });
  };

  ContentState.createFromText = function createFromText(text) {
    var delimiter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : /\r\n?|\n/g;

    var strings = text.split(delimiter);
    var blocks = strings.map(function (block) {
      block = sanitizeDraftText(block);
      return new ContentBlock({
        key: generateRandomKey(),
        text: block,
        type: 'unstyled',
        characterList: List(Repeat(CharacterMetadata.EMPTY, block.length))
      });
    });
    return ContentState.createFromBlockArray(blocks);
  };

  return ContentState;
}(ContentStateRecord);

module.exports = ContentState;