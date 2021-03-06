'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

(function (PLUGIN_ID) {
  'use strict';

  var body = document.getElementsByTagName('BODY')[0];

  // kintone-ui-componentで使う変数
  var spinner = void 0,
      isEnabledChk = void 0,
      fieldsSettingTable = void 0;

  // スピナー
  spinner = new kintoneUIComponent.Spinner();

  // スピナー表示
  body.appendChild(spinner.render());
  spinner.show();

  // プラグインの有効化チェックボックス
  isEnabledChk = new kintoneUIComponent.CheckBox({
    items: [{
      label: '有効',
      value: 'enabled'
    }],
    value: []
  });
  document.getElementById('plugin-config-area-isEnabled').appendChild(isEnabledChk.render());

  /*
  <<プラグイン画面のドロップダウンの項目に表示するテキストの生成>>
  スペースフィールド： 【スペースフィールド (spaceID)】
  ドロップダウンフィールド: 【フィールド名 (フィールドコード)】
  */
  var setDropLabel = function setDropLabel(FIELDS, TYPE) {
    if (TYPE === 'SPACER') {
      return FIELDS.filter(function (filterVal) {
        return filterVal.type === TYPE;
      }).map(function (mapVal) {
        return {
          label: '\u30B9\u30DA\u30FC\u30B9\u30D5\u30A3\u30FC\u30EB\u30C9 (' + mapVal.elementId + ')',
          value: mapVal.elementId
        };
      });
    }
    return FIELDS.filter(function (filterVal) {
      return filterVal.type === TYPE;
    }).map(function (mapVal) {
      return {
        label: mapVal.label + ' (' + mapVal.code + ')',
        value: mapVal.label + '_*_' + mapVal.code
      };
    });
  };

  /*
  <<別ファイルの地域・都道府県マスタから9地域・47都道府県の情報を取得>>
  kintone REST API のフォーム設定のパラメータ形式に格納
  https://developer.cybozu.io/hc/ja/articles/204529724
  */
  var setAreaList = function setAreaList() {
    var areaList = window.dynamicPref.itemList;
    var obj = {};
    areaList.forEach(function (val, index) {
      var newObj = _defineProperty({}, val.area, {
        label: [val.area][0],
        index: index
      });
      Object.assign(obj, newObj);
    });
    return obj;
  };
  var setPrefList = function setPrefList() {
    var prefList = window.dynamicPref.itemList;
    var obj = {};
    var prefecture = [];
    prefList.map(function (val) {
      return val.pref;
    }).forEach(function (val) {
      prefecture = [].concat(_toConsumableArray(prefecture), _toConsumableArray(val));
    });
    prefecture.forEach(function (val, index) {
      var newObj = _defineProperty({}, val, {
        label: val,
        index: index
      });
      Object.assign(obj, newObj);
    });
    return obj;
  };

  /*
  <<プラグイン設定画面のテーブル情報を引数に、フィールドの設定変更APIを実行する処理>>
  9地域・47都道府県の項目をテーブルで指定したドロップダウンに適用する
  */
  var setFieldsItem = function setFieldsItem(arr) {
    var areaDrop = arr.map(function (filterVal) {
      return filterVal.areaDrop.value;
    });
    var prefDrop = arr.map(function (filterVal) {
      return filterVal.prefDrop.value;
    });

    var params = {
      app: kintone.app.getId(),
      properties: {}
    };

    // テーブルの行数分ループしてパラメータに格納する
    areaDrop.forEach(function (_, index) {
      var _newParams;

      var newParams = (_newParams = {}, _defineProperty(_newParams, areaDrop[index].split('_*_')[1], {
        "type": "DROP_DOWN",
        "code": areaDrop[index].split('_*_')[1],
        "label": areaDrop[index].split('_*_')[0],
        "noLabel": false,
        "required": false,
        "options": setAreaList(),
        "defaultValue": ""
      }), _defineProperty(_newParams, prefDrop[index].split('_*_')[1], {
        "type": "DROP_DOWN",
        "code": prefDrop[index].split('_*_')[1],
        "label": prefDrop[index].split('_*_')[0],
        "noLabel": false,
        "required": false,
        "options": setPrefList(),
        "defaultValue": ""
      }), _newParams);
      params.properties = Object.assign(params.properties, newParams);
    });
    return kintone.api(kintone.api.url('/k/v1/preview/app/form/fields', true), 'PUT', params);
  };

  /*
  <<一度プラグインの設定を保存した後にフィールドを追加・削除した場合の対応>>
  テーブルのsetValueは選択肢の構造ごと適用されるので、getValueしたときの構成がそのまま入る
  → フィールドをあとから追加した場合に現状のメソッドでは対応できないため、別途分岐処理をする
  もともとセットされていた値とconfig-helperで取得したフォーム情報を比較して、フォーム情報の中に値がなければフィールドが消されたことになる
  */
  var checkSelectedItem = function checkSelectedItem(VALUE, NEWLIST) {
    return NEWLIST.filter(function (val) {
      return val.value === VALUE;
    });
  };

  /*
  <<フォームの設定情報を取得して、プラグイン設定画面の項目を作る処理>>
  */
  var dropdownFields = void 0,
      spaceFields = void 0;
  KintoneConfigHelper.getFields().then(function (resp) {
    // ドロップダウンフィールドの情報を格納するkintone-ui-componentのドロップダウン
    dropdownFields = {
      items: setDropLabel(resp, 'DROP_DOWN'),
      value: setDropLabel(resp, 'DROP_DOWN')[0].value
    };
    // スペースフィールドの情報を格納するkintone-ui-componentのドロップダウン
    spaceFields = {
      items: setDropLabel(resp, 'SPACER'),
      value: setDropLabel(resp, 'SPACER')[0].value
    };
    // フィールド設定用のkintone-ui-componentのテーブル
    fieldsSettingTable = new kintoneUIComponent.Table({
      data: [{
        areaDrop: dropdownFields,
        showPrefSpace: spaceFields,
        prefDrop: dropdownFields
      }],
      defaultRowData: {
        areaDrop: dropdownFields,
        showPrefSpace: spaceFields,
        prefDrop: dropdownFields
      },
      columns: [{
        header: '【地域用】ドロップダウン',
        cell: function cell() {
          return kintoneUIComponent.createTableCell('dropdown', 'areaDrop');
        }
      }, {
        header: '【都道府県表示用】スペース',
        cell: function cell() {
          return kintoneUIComponent.createTableCell('dropdown', 'showPrefSpace');
        }
      }, {
        header: '【都道府県用】ドロップダウン',
        cell: function cell() {
          return kintoneUIComponent.createTableCell('dropdown', 'prefDrop');
        }
      }]
    });
    document.getElementById('plugin-config-area-selectFields-table').appendChild(fieldsSettingTable.render());
  }).then(function () {
    spinner.hide();
    /*
    <<すでにプラグインが保存されていれば、その時の設定値を初期値にセットする処理>>
    */
    var conf = kintone.plugin.app.getConfig(PLUGIN_ID);
    if (!conf.content) {
      return;
    }
    var pluginConfigData = JSON.parse(conf.content);

    // プラグイン保存時にgetValueした値ではなく、最新のフォーム情報の値を設定
    pluginConfigData.table[0].areaDrop.items = dropdownFields.items;
    pluginConfigData.table[0].prefDrop.items = dropdownFields.items;
    pluginConfigData.table[0].showPrefSpace.items = spaceFields.items;

    /*
    // <<前回選ばれていたフィールドが削除されていた場合にドロップダウンの値を初期値に戻す処理>>
    config-helperで取得した最新のフォーム情報の中に、前回選ばれていた値があれば配列のlengthが1以上になる
    → 値がない（=フィールドが消された）場合、配列のlengthは0
    */
    if (!checkSelectedItem(pluginConfigData.table[0].areaDrop.value, dropdownFields.items).length) {
      pluginConfigData.table[0].areaDrop.value = dropdownFields.value;
    }
    if (!checkSelectedItem(pluginConfigData.table[0].prefDrop.value, dropdownFields.items).length) {
      pluginConfigData.table[0].prefDrop.value = dropdownFields.value;
    }
    if (!checkSelectedItem(pluginConfigData.table[0].showPrefSpace.value, spaceFields.items).length) {
      pluginConfigData.table[0].showPrefSpace.value = spaceFields.value;
    }

    // // 前回設定された値をセットする
    isEnabledChk.setValue(pluginConfigData.isEnabled);
    fieldsSettingTable.setValue(pluginConfigData.table);
    spinner.hide();
  }).catch(function (err) {
    swal({
      title: 'Error',
      text: 'フィールド情報の取得に失敗しました。\n少し時間を置いてから再度画面を開いて下さい。\n\n※ 最低2つのドロップダウンと1つのスペースフィールドが必要です。',
      icon: 'error'
    });
    console.dir(err);
    spinner.hide();
  });

  // 反映ボタンのクリック処理。フィールドの設定変更APIを実行
  document.getElementById('setItem-submit').onclick = function () {
    setFieldsItem(fieldsSettingTable.getValue()).then(function (resp) {
      swal({
        title: 'Success!',
        text: 'フィールド情報を更新しました！',
        icon: 'success'
      });
    }).catch(function (err) {
      swal({
        title: 'Error',
        text: 'フィールド情報の更新に失敗しました。',
        icon: 'error'
      });
      console.dir(err);
    });
  };

  // 保存ボタン・キャンセルボタンの処理
  document.getElementById('submit').onclick = function () {
    var config = {
      content: JSON.stringify({
        isEnabled: isEnabledChk.getValue(),
        table: fieldsSettingTable.getValue()
      })
    };
    kintone.plugin.app.setConfig(config);
  };
  document.getElementById('cancel').onclick = function () {
    swal({
      title: 'Warning',
      text: 'プラグインの設定を保存せずに戻ってよろしいでしょうか？',
      icon: 'warning',
      buttons: true,
      dangerMode: true
    }).then(function (willBack) {
      if (willBack) {
        history.back();
      }
    });
  };
})(kintone.$PLUGIN_ID);
