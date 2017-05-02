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
 * @flow
 */

'use strict';

var CharacterMetadata = require('CharacterMetadata');
var Immutable = require('immutable');

import type {DraftInlineStyle} from 'DraftInlineStyle';

var {List, Map} = Immutable;

function createCharacterList(
  inlineStyles: Array<DraftInlineStyle>,
  entities: Array<?string>,
  metas: Array<?Map>,
): List<CharacterMetadata> {
  var characterArray = inlineStyles.map((style, ii) => {
    var entity = entities[ii];
    var meta = metas[ii]
    return CharacterMetadata.create({style, entity, meta});
  });
  return List(characterArray);
}

module.exports = createCharacterList;
