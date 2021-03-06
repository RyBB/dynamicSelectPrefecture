((PLUGIN_ID) => {
  'use strict';
  const conf = kintone.plugin.app.getConfig(PLUGIN_ID);
  if (!conf) { return; }
  const pluginData = JSON.parse(conf.content);

  // プラグインが有効か確認
  if (pluginData.isEnabled[0] !== 'enabled') { return; }

  // 地域フィールドのフィールドコード・都道府県フィールドのフィールドコード（・都道府県フィールドのフィールド名）・スペースフィールドの要素ID
  const fieldCode = {
    areaDrop: pluginData.table.map(val => val.areaDrop.value.split('_*_')[1]),
    prefDrop: pluginData.table.map(val => val.prefDrop.value.split('_*_')[1]),
    prefDropName: pluginData.table.map(val => val.prefDrop.value.split('_*_')[0]),
    showPrefSpace: pluginData.table.map(val => val.showPrefSpace.value)
  };

  // 別ファイルの地域都道府県マスタから情報取得
  const areatoPref = window.dynamicPref.itemList;

  const initDropdownItems = [{label: '-----', value: ''}];
  const UIcomponentDropdown = fieldCode.showPrefSpace.map(() => {
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
  fieldCode.areaDrop.forEach((_, index) => {
    kintone.events.on([
      'app.record.create.show',
      'app.record.edit.show',
      `app.record.create.change.${fieldCode.areaDrop[index]}`,
      `app.record.edit.change.${fieldCode.areaDrop[index]}`
    ], event => {
      // 表示イベントのとき
      if (event.type === 'app.record.create.show' || event.type === 'app.record.edit.show') {
        // 都道府県のドロップダウンを非表示にする
        fieldCode.prefDrop.forEach((shownPrefVal) => {
          kintone.app.record.setFieldShown(shownPrefVal, false);
        });
        // プラグイン設定で登録されたスペースフィールドの数だけui-componentのドロップダウンを生成する
        const div = document.createElement('div');
        const p = document.createElement('p');
        div.classList.add('space-field-name');
        p.textContent = fieldCode.prefDropName[index];
        div.appendChild(p);
        div.appendChild(UIcomponentDropdown[index].render());
        kintone.app.record.getSpaceElement(fieldCode.showPrefSpace[index]).appendChild(div);
      }

      // 地域に対応した都道府県を配列に格納する
      const prefArray = areatoPref.filter(filterVal => {
        return filterVal.area === event.record[fieldCode.areaDrop[index]].value;
      });

      // 地域フィールドで '-----' を選んだ時はui-componentのドロップダウンも空にする
      if (!prefArray.length) {
        UIcomponentDropdown[index].setItems(initDropdownItems);
        UIcomponentDropdown[index].setValue('');
        return;
      }

      // 地域フィールドの値を元にui-componentのドロップダウンの構成を変更する
      const items = [{label: '-----', value: ''}, ...prefArray[0].pref.map(mapVal => {
        return {
          label: mapVal,
          value: mapVal
        };
      })];
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
  kintone.events.on(['app.record.create.submit', 'app.record.edit.submit'], event => {
    fieldCode.prefDrop.forEach((val, index) => {
      event.record[val].value = UIcomponentDropdown[index].getValue();
    });
    return event;
  });
})(kintone.$PLUGIN_ID);
