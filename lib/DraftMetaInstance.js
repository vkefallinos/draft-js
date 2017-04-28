/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DraftMetaInstance
 * 
 */

'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Immutable = require('immutable');

var Record = Immutable.Record;


var DraftMetaInstanceRecord = Record({
  type: 'DEFAULT',
  data: Object
});

/**
 * An instance of a document meta, consisting of a `type` and relevant
 * `data`, metadata about the style.
 *
 */

var DraftMetaInstance = function (_DraftMetaInstanceRec) {
  _inherits(DraftMetaInstance, _DraftMetaInstanceRec);

  function DraftMetaInstance() {
    _classCallCheck(this, DraftMetaInstance);

    return _possibleConstructorReturn(this, _DraftMetaInstanceRec.apply(this, arguments));
  }

  DraftMetaInstance.prototype.getType = function getType() {
    return this.get('type');
  };

  DraftMetaInstance.prototype.getData = function getData() {
    return this.get('data');
  };

  return DraftMetaInstance;
}(DraftMetaInstanceRecord);

module.exports = DraftMetaInstance;