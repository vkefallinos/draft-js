/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule createCharacterList
 * @typechecks
 * 
 */

'use strict';

var CharacterMetadata = require('./CharacterMetadata');
var Immutable = require('immutable');

var List = Immutable.List,
    Map = Immutable.Map;


function createCharacterList(inlineStyles, entities, metas) {
  var characterArray = inlineStyles.map(function (style, ii) {
    var entity = entities[ii];
    var meta = metas[ii];
    return CharacterMetadata.create({ style: style, entity: entity, meta: meta });
  });
  return List(characterArray);
}

module.exports = createCharacterList;