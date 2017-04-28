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
 * @flow
 */

'use strict';

const BlockMapBuilder = require('BlockMapBuilder');
const CharacterMetadata = require('CharacterMetadata');
const ContentBlock = require('ContentBlock');
const Immutable = require('immutable');
const SelectionState = require('SelectionState');
const DraftModifier = require('DraftModifier')
const invariant = require('invariant');
const generateRandomKey = require('generateRandomKey');
const sanitizeDraftText = require('sanitizeDraftText');

import type {BlockMap} from 'BlockMap';
import type {EntityMap} from 'EntityMap';
import type {MetaMap} from 'MetaMap';
import type DraftEntityInstance from 'DraftEntityInstance';
import type DraftMetaInstance from 'DraftMetaInstance';
import type {DraftEntityMutability} from 'DraftEntityMutability';
import type {DraftEntityType} from 'DraftEntityType';

const {List, Record, Repeat, OrderedMap} = Immutable;

const defaultRecord: {
  ot: ?boolean,
  operations: ?OrderedMap,
  entityMap: ?EntityMap,
  blockMap: ?BlockMap,
  metaMap: ?MetaMap,
  selectionBefore: ?SelectionState,
  selectionAfter: ?SelectionState,
} = {
  ot: false,
  operations: OrderedMap({}),
  entityMap: null,
  blockMap: null,
  metaMap: OrderedMap({}),
  selectionBefore: null,
  selectionAfter: null,
};

const ContentStateRecord = Record(defaultRecord);

class ContentState extends ContentStateRecord {

  isOTEnabled(): boolean {
    return this.get('ot')
  }

  getOperations(): any {
    return this.get('operations')
  }

  getEntityMap(): any {
    return this.get('entityMap');
  }

  getBlockMap(): BlockMap {
    return this.get('blockMap');
  }

  getMetaMap(): MetaMap {
    return this.get('metaMap');
  }

  getSelectionBefore(): SelectionState {
    return this.get('selectionBefore');
  }

  getSelectionAfter(): SelectionState {
    return this.get('selectionAfter');
  }

  getBlockForKey(key: string): ContentBlock {
    var block: ContentBlock = this.getBlockMap().get(key);
    return block;
  }

  getKeyBefore(key: string): ?string {
    return this.getBlockMap()
      .reverse()
      .keySeq()
      .skipUntil(v => v === key)
      .skip(1)
      .first();
  }

  getKeyAfter(key: string): ?string {
    return this.getBlockMap()
      .keySeq()
      .skipUntil(v => v === key)
      .skip(1)
      .first();
  }

  getBlockAfter(key: string): ?ContentBlock {
    return this.getBlockMap()
      .skipUntil((_, k) => k === key)
      .skip(1)
      .first();
  }

  getBlockBefore(key: string): ?ContentBlock {
    return this.getBlockMap()
      .reverse()
      .skipUntil((_, k) => k === key)
      .skip(1)
      .first();
  }

  getBlocksAsArray(): Array<ContentBlock> {
    return this.getBlockMap().toArray();
  }

  getFirstBlock(): ContentBlock {
    return this.getBlockMap().first();
  }

  getLastBlock(): ContentBlock {
    return this.getBlockMap().last();
  }

  getPlainText(delimiter?: string): string {
    return this.getBlockMap()
      .map(block => {
        return block ? block.getText() : '';
      })
      .join(delimiter || '\n');
  }

  getLastCreatedEntityKey() {
    return this.getEntityMap().keySeq().last();
  }

  getLastCreatedMetaKey() {
    return this.getMetaMap().keySeq().last();
  }

  hasText(): boolean {
    var blockMap = this.getBlockMap();
    return (
      blockMap.size > 1 ||
      blockMap.first().getLength() > 0
    );
  }

  createEntity(
    type: DraftEntityType,
    mutability: DraftEntityMutability,
    data?: Object,
  ): ContentState {
    return DraftModifier.createEntity(this, type, mutability, data);
  }

  mergeEntityData(
    key: string,
    toMerge: {[key: string]: any},
  ): ContentState {
    return DraftModifier.mergeEntityData(this, key, toMerge);
  }

  replaceEntityData(
    key: string,
    newData: {[key: string]: any},
  ): ContentState {
    return DraftModifier.replaceEntityData(this, key, newData, false);
  }

  addEntity(instance: DraftEntityInstance): ContentState {
    return DraftModifier.addEntity(this, instance);
  }

  getEntity(key: string): DraftEntityInstance {
    const instance = this.getEntityMap().get(key);
    invariant(!!instance, 'Unknown DraftEntity Key.');
    return instance;
  }

  createMeta(
    type: string,
    data?: Object
  ): ContentState {
    return DraftModifier.createMeta(this, type, data)
  }
  mergeMetaData(
    key: string,
    toMerge: {[key: string]: any},
  ): ContentState {
    return DraftModifier.mergeMetaData(this, key, toMerge);
  }

  replaceMetaData(
    key: string,
    newData: {[key: string]: any},
  ): ContentState {
    return DraftModifier.replaceMetaData(this, key, newData, false);
  }

  addMeta(instance: DraftMetaInstance): ContentState {
    return DraftModifier.addMeta(this, instance);
  }

  getMeta(key: string): DraftMetaInstance {
    const instance = this.getMetaMap().get(key);
    invariant(!!instance, 'Unknown DraftMeta Key.');
    return instance;
  }

  static createFromBlockArray(
    blocks: Array<ContentBlock>,
    entityMap: ?OrderedMap,
  ): ContentState {
    var blockMap = BlockMapBuilder.createFromArray(blocks);
    var selectionState = blockMap.isEmpty()
      ? new SelectionState()
      : SelectionState.createEmpty(blockMap.first().getKey());
    return new ContentState({
      blockMap,
      entityMap: entityMap || OrderedMap(),
      selectionBefore: selectionState,
      selectionAfter: selectionState,
    });
  }

  static createFromText(
    text: string,
    delimiter: string | RegExp = /\r\n?|\n/g,
  ): ContentState {
    const strings = text.split(delimiter);
    const blocks = strings.map(
      block => {
        block = sanitizeDraftText(block);
        return new ContentBlock({
          key: generateRandomKey(),
          text: block,
          type: 'unstyled',
          characterList: List(Repeat(CharacterMetadata.EMPTY, block.length)),
        });
      }
    );
    return ContentState.createFromBlockArray(blocks);
  }
}

module.exports = ContentState;
