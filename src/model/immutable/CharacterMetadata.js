/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule CharacterMetadata
 * @typechecks
 * @flow
 */

'use strict';

var {
  Map,
  OrderedSet,
  Record,
} = require('immutable');

import type {DraftInlineStyle} from 'DraftInlineStyle';

// Immutable.map is typed such that the value for every key in the map
// must be the same type.
type CharacterMetadataConfigValueType = DraftInlineStyle | ?string | Map<string, string>;

type CharacterMetadataConfig = {
  style?: CharacterMetadataConfigValueType,
  entity?: CharacterMetadataConfigValueType,
  meta?: CharacterMetadataConfigValueType,
};

const EMPTY_SET = OrderedSet();
const EMPTY_MAP = Map();
var defaultRecord: CharacterMetadataConfig = {
  style: EMPTY_SET,
  meta: EMPTY_MAP,
  entity: null,
};

var CharacterMetadataRecord = Record(defaultRecord);

class CharacterMetadata extends CharacterMetadataRecord {
  getStyle(): DraftInlineStyle {
    return this.get('style');
  }

  getStyleMeta(style: string): ?string {
    return this.get('meta').get(style) || ""
  }

  getMeta(): Map {
    return this.get('meta')
  }

  getEntity(): ?string {
    return this.get('entity');
  }

  hasStyle(style: string): boolean {
    return this.getStyle().includes(style);
  }

  static applyStyle(
    record: CharacterMetadata,
    style: string,
    metaKey: ?string
  ): CharacterMetadata {
    var withStyle = record.set('style', record.getStyle().add(style));
    var withStyleMeta = withStyle.set('meta', record.getMeta().set(style, metaKey))
    return CharacterMetadata.create(withStyleMeta);
  }

  static removeStyle(
    record: CharacterMetadata,
    style: string,
  ): CharacterMetadata {
    var withoutStyle = record.set('style', record.getStyle().remove(style));
    var withoutStyleMeta = withoutStyle
      .set('meta', record.getMeta().delete(style));
    return CharacterMetadata.create(withoutStyleMeta);
  }

  static applyEntity(
    record: CharacterMetadata,
    entityKey: ?string,
  ): CharacterMetadata {
    var withEntity = record.getEntity() === entityKey ?
      record :
      record.set('entity', entityKey);
    return CharacterMetadata.create(withEntity);
  }

  /**
   * Use this function instead of the `CharacterMetadata` constructor.
   * Since most content generally uses only a very small number of
   * style/entity permutations, we can reuse these objects as often as
   * possible.
   */
  static create(config?: CharacterMetadataConfig): CharacterMetadata {
    if (!config) {
      return EMPTY;
    }

    const defaultConfig: CharacterMetadataConfig =
      {style: EMPTY_SET, meta: EMPTY_MAP, entity: (null: ?string)};

    // Fill in unspecified properties, if necessary.
    var configMap = Map(defaultConfig).merge(config);

    var existing: ?CharacterMetadata = pool.get(configMap);
    if (existing) {
      return existing;
    }

    var newCharacter = new CharacterMetadata(configMap);
    pool = pool.set(configMap, newCharacter);
    return newCharacter;
  }
}

var EMPTY = new CharacterMetadata();
var pool: Map<Map<any, any>, CharacterMetadata> = Map([[Map(defaultRecord), EMPTY]]);

CharacterMetadata.EMPTY = EMPTY;

module.exports = CharacterMetadata;
