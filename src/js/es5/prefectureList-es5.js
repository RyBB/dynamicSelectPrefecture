'use strict';

(function () {
  'use strict';

  var itemList = [{ area: '北海道', pref: ['北海道'] }, { area: '東北', pref: ['青森', '岩手', '宮城', '秋田', '山形', '福島'] }, { area: '北関東・甲信', pref: ['茨城', '栃木', '群馬', '山梨', '長野'] }, { area: '南関東', pref: ['埼玉', '千葉', '東京', '神奈川'] }, { area: '北陸', pref: ['新潟', '富山', '石川', '福井'] }, { area: '東海', pref: ['岐阜', '静岡', '愛知', '三重'] }, { area: '近畿', pref: ['滋賀', '京都', '大阪', '兵庫', '奈良', '和歌山'] }, { area: '中国', pref: ['鳥取', '島根', '岡山', '広島', '山口'] }, { area: '四国', pref: ['徳島', '香川', '愛媛', '高知'] }, { area: '九州', pref: ['福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島', '沖縄'] }];
  window.dynamicPref = {};
  window.dynamicPref.itemList = itemList;
})();