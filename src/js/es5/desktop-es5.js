'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

(function (PLUGIN_ID) {
  'use strict';

  var conf = kintone.plugin.app.getConfig(PLUGIN_ID);
  if (!conf) {
    return;
  }
  var pluginData = JSON.parse(conf.content);

  // プラグインが有効か確認
  if (pluginData.isEnabled[0] !== 'enabled') {
    return;
  }

  // 地域フィールドのフィールドコード・都道府県フィールドのフィールドコード（・都道府県フィールドのフィールド名）・スペースフィールドの要素ID
  var fieldCode = {
    areaDrop: pluginData.table.map(function (val) {
      return val.areaDrop.value.split('_*_')[1];
    }),
    prefDrop: pluginData.table.map(function (val) {
      return val.prefDrop.value.split('_*_')[1];
    }),
    prefDropName: pluginData.table.map(function (val) {
      return val.prefDrop.value.split('_*_')[0];
    }),
    showPrefSpace: pluginData.table.map(function (val) {
      return val.showPrefSpace.value;
    })
  };

  // 別ファイルの地域都道府県マスタから情報取得
  var areatoPref = window.dynamicPref.itemList;

  var initDropdownItems = [{ label: '-----', value: '' }];
  var UIcomponentDropdown = fieldCode.showPrefSpace.map(function () {
    return new kintoneUIComponent.Dropdown({
      items: initDropdownItems,
      value: ''
    });
  });

  /*
  <<表示イベントとチェンジイベント>>
  都道府県フィールドを表示にする
  ui-componentのドロップダウンをスペースフィールドに表示する
  地域フィールドの値によってui-componentのドロップダウンの構成を変える
  */
  fieldCode.areaDrop.forEach(function (_, index) {
    kintone.events.on(['app.record.create.show', 'app.record.edit.show', 'app.record.create.change.' + fieldCode.areaDrop[index], 'app.record.edit.change.' + fieldCode.areaDrop[index]], function (event) {
      // 表示イベントのとき
      if (event.type === 'app.record.create.show' || event.type === 'app.record.edit.show') {
        // 都道府県のドロップダウンを非表示にする
        fieldCode.prefDrop.forEach(function (shownPrefVal) {
          kintone.app.record.setFieldShown(shownPrefVal, false);
        });
        // プラグイン設定で登録されたスペースフィールドの数だけui-componentのドロップダウンを生成する
        var div = document.createElement('div');
        var p = document.createElement('p');
        div.classList.add('space-field-name');
        p.textContent = fieldCode.prefDropName[index];
        div.appendChild(p);
        div.appendChild(UIcomponentDropdown[index].render());
        kintone.app.record.getSpaceElement(fieldCode.showPrefSpace[index]).appendChild(div);
      }

      // 地域に対応した都道府県を配列に格納する
      var prefArray = areatoPref.filter(function (filterVal) {
        return filterVal.area === event.record[fieldCode.areaDrop[index]].value;
      });

      // 地域フィールドで '-----' を選んだ時はui-componentのドロップダウンも空にする
      if (!prefArray.length) {
        UIcomponentDropdown[index].setItems(initDropdownItems);
        UIcomponentDropdown[index].setValue('');
        return;
      }

      // 地域フィールドの値を元にui-componentのドロップダウンの構成を変更する
      var items = [{ label: '-----', value: '' }].concat(_toConsumableArray(prefArray[0].pref.map(function (mapVal) {
        return {
          label: mapVal,
          value: mapVal
        };
      })));
      UIcomponentDropdown[index].setItems(items);
      UIcomponentDropdown[index].setValue(items[1].label);

      // 編集画面のときはui-componentのドロップダウンに前回選択された値を挿入する
      // ui-componentのドロップダウンが生成されていないとエラーになる
      if (event.type === 'app.record.edit.show') {
        UIcomponentDropdown[index].setValue(event.record[fieldCode.prefDrop[index]].value);
      }
      return event;
    });
  });

  /*
  <<保存イベントで都道府県フィールドに値を入れる>>
  ui-componentのドロップダウンの値を取得して対応する都道府県フィールドに値を挿入する
  */
  kintone.events.on(['app.record.create.submit', 'app.record.edit.submit'], function (event) {
    fieldCode.prefDrop.forEach(function (val, index) {
      event.record[val].value = UIcomponentDropdown[index].getValue();
    });
    return event;
  });
})(kintone.$PLUGIN_ID);
