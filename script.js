// script.js

// 動的に Google Maps API を読み込む
function loadGoogleMapsAPI() {
  const script = document.createElement("script");
  script.src = "https://maps.googleapis.com/maps/api/js?key=" +
               CONFIG.GOOGLE_MAPS_API_KEY + "&callback=initMap";
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}
loadGoogleMapsAPI();

// グローバル変数
let map;
let selectedLatLng = null;
let funds = 10000;      // 初期所持金
const storeCost = 1000; // 店舗建設費
let stores = [];        // 各店舗の情報を格納する配列

// お弁当タイプごとのデータ（仕入れコストと販売価格）
const bentoTypes = {
  "シンプル": { salePrice: 300, cost: 200 },
  "贅沢":   { salePrice: 500, cost: 400 },
  "健康":   { salePrice: 400, cost: 300 }
};

// Google Maps の初期化（API の callback として呼ばれる）
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 35.6895, lng: 139.6917 },
    zoom: 10
  });

  // 地図クリックで位置を取得
  map.addListener("click", (e) => {
    selectedLatLng = e.latLng;
    document.getElementById("latlng").textContent =
      "緯度: " + selectedLatLng.lat().toFixed(4) +
      ", 経度: " + selectedLatLng.lng().toFixed(4);
    document.getElementById("buildStore").disabled = false;
  });
}

// 店舗建設ボタンの処理
document.getElementById("buildStore").addEventListener("click", () => {
  if (!selectedLatLng) {
    alert("まずは地図をクリックして位置を選んでください！");
    return;
  }
  if (funds < storeCost) {
    alert("所持金が不足しています！");
    return;
  }
  funds -= storeCost;
  updateFunds();

  // 各店舗に個別在庫を持たせる（初期は各弁当0個）
  const store = {
    marker: new google.maps.Marker({
      position: selectedLatLng,
      map: map,
      title: "お弁当屋さん"
    }),
    latLng: selectedLatLng,
    inventory: { "シンプル": 0, "贅沢": 0, "健康": 0 }
  };
  stores.push(store);

  document.getElementById("buildStore").disabled = true;
  document.getElementById("latlng").textContent = "なし";
  selectedLatLng = null;

  updateStoreStatus();
});

// 所持金表示更新
function updateFunds() {
  document.getElementById("money").textContent = funds;
}

// 店舗状況表示更新
function updateStoreStatus() {
  const statusDiv = document.getElementById("storeStatus");
  let html = "<h2>各店舗の仕入れ状況</h2>";
  if (stores.length === 0) {
    html += "<p>店舗はまだありません</p>";
  } else {
    stores.forEach((store, index) => {
      html += "<div class='store'>";
      html += "店舗 " + (index + 1) + "（緯度: " + store.latLng.lat().toFixed(4) +
              ", 経度: " + store.latLng.lng().toFixed(4) + "）<br>";
      html += "シンプル弁当: " + store.inventory["シンプル"] + " 個, ";
      html += "贅沢弁当: " + store.inventory["贅沢"] + " 個, ";
      html += "健康弁当: " + store.inventory["健康"] + " 個";
      html += "</div>";
    });
  }
  statusDiv.innerHTML = html;
}

// 毎日（1分ごと）の処理：自動仕入れと売上
setInterval(() => {
  // グローバル仕入れ設定を取得
  const selectedType = document.getElementById("bentoType").value;
  const bento = bentoTypes[selectedType];
  const restockAmount = parseInt(document.getElementById("restockAmount").value, 10) || 0;
  
  // 自動仕入れ：各店舗ごとに仕入れ
  let totalPurchaseCost = 0;
  stores.forEach((store) => {
    const cost = bento.cost * restockAmount;
    if (funds >= cost) {
      funds -= cost;
      store.inventory[selectedType] += restockAmount;
      totalPurchaseCost += cost;
    }
  });
  updateFunds();
  updateStoreStatus();
  console.log("各店舗で" + selectedType + "を" + restockAmount + "個ずつ仕入れ。合計費用: " + totalPurchaseCost + "円");

  // 売上：各店舗ごとに、全種類のお弁当で在庫があれば1個ずつ販売する
  let totalIncome = 0;
  stores.forEach((store) => {
    for (let type in store.inventory) {
      if (store.inventory[type] > 0) {
        store.inventory[type]--;
        totalIncome += bentoTypes[type].salePrice;
      }
    }
  });
  if (totalIncome > 0) {
    funds += totalIncome;
    updateFunds();
    updateStoreStatus();
    alert("1日経過！ 売上 " + totalIncome + " 円 が加算されました！");
  } else {
    alert("1日経過！ 在庫が不足しているため、売上はありませんでした。");
  }
}, 60000); // 60000ミリ秒＝1分
