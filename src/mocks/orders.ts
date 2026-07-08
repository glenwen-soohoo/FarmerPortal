import type { Order } from '../types'

// 收件人姓名 / 電話皆為虛構。備註取自真實情境，涵蓋各判定/出貨狀態。
// 兩軸：judgeStatus（判定）× shipStatus（出貨）。
// 預定出貨區間預設「兩週」；備註講星期幾不能收貨的，已換算成區間內實際不可出貨日。
// （2026/6 星期：01一 05五 06六 07日 12五 13六 14日 19五 20六 21日 26五 27六 28日）
export const seedOrders: Order[] = [
  {
    id: '1', orderNumber: '260525841001', farmerId: 1,
    recipient: '王小明', phone: '0912000001', address: '台北市內湖區康寧路三段190巷35號8樓',
    productName: '玉荷包荔枝', variety: '玉荷包荔枝', spec: '1盒(5斤裝)', qty: 2, tempLayer: '冷藏',
    rawRemark: '6/7-6/11不收貨，請於6/12出貨 (管理員代收)', cleanRemark: '6/7–6/11 不可收貨；指定 6/12 出貨', shipRemark: '送貨前一小時請電聯收件人',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/05', '06/18'], shippableDate: '06/05', blockedDates: ['06/07–06/11'], forcedShipDate: '06/12',
  },
  {
    id: '2', orderNumber: '260525841002', farmerId: 1,
    recipient: '陳美玲', phone: '0912000002', address: '高雄市前鎮區管仲南路402號15樓',
    productName: '玉荷包荔枝', variety: '玉荷包荔枝', spec: '1盒(3斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '客人指定6/12出貨', cleanRemark: '指定 6/12 出貨',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/05', '06/18'], shippableDate: '06/05', forcedShipDate: '06/12',
  },
  {
    id: '3', orderNumber: '260525841003', farmerId: 1,
    recipient: '林志豪', phone: '0912000003', address: '台中市南屯區楓樹里楓樹六街166號14樓',
    productName: '帝王芭樂', variety: '帝王芭樂', spec: '1盒(中果5斤裝)', qty: 3, tempLayer: '常溫',
    rawRemark: '請週五出貨，客人僅周六可收。帝王芭樂請給10顆裝', cleanRemark: '僅週五出貨、週六收；本單請出 10 顆裝', shipRemark: '大樓管理室代收（B1 管理員）',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/12', '06/25'], shippableDate: '06/12', blockedDates: ['06/13–06/18', '06/20–06/25'],
    isWeekendPref: true,
  },
  {
    id: '4', orderNumber: '260525841004', farmerId: 1,
    recipient: '張淑芬', phone: '0912000004', address: '宜蘭縣宜蘭市泰山路85巷1號',
    productName: '百香果', variety: '百香果', spec: '1箱(大果4斤裝)', qty: 1, tempLayer: '常溫',
    rawRemark: '6/5後出貨', cleanRemark: '6/5 後出貨', shipRemark: '易碎，請小心輕放、勿倒置',
    judgeStatus: 'AI判定完成', shipStatus: '已印單',
    shipWindow: ['06/05', '06/18'], shippableDate: '06/05', printedAt: '2026-06-05 09:12',
    trackingNos: ['900112233445'],
  },
  {
    id: '5', orderNumber: '260525841005', farmerId: 1,
    recipient: '黃建宏', phone: '0912000005', address: '台北市松山區北寧路60之1號10樓',
    productName: '夏雪芒果', variety: '夏雪芒果', spec: '1盒(精品大果)', qty: 1, tempLayer: '冷藏',
    rawRemark: '過兩天要出國6/6才回國，最快6/6可收貨，再麻煩晚一點寄出', cleanRemark: '客人 6/6 才可收貨，請晚一點寄', shipRemark: '收件人上班，請下午 5 點後配送',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/05', '06/18'], shippableDate: '06/05', blockedDates: ['06/05'],
  },
  {
    id: '6', orderNumber: '260525841006', farmerId: 1,
    recipient: '吳雅婷', phone: '0912000006', address: '桃園市龜山區萬壽路一段241巷26號4樓',
    productName: '玉荷包荔枝', variety: '玉荷包荔枝', spec: '1盒(5斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '地址已更新', cleanRemark: '（地址已更新）',
    judgeStatus: 'AI判定完成', shipStatus: '改單待重印',
    shipWindow: ['06/10', '06/23'], shippableDate: '06/10', isUpdated: true,
  },
  {
    id: '7', orderNumber: '260526841007', farmerId: 1,
    recipient: '劉冠廷', phone: '0912000007', address: '花蓮縣秀林鄉富世村天祥路120號',
    productName: '百香果', variety: '百香果', spec: '1箱(大果4斤裝)', qty: 1, tempLayer: '常溫',
    rawRemark: '6/20後再寄出', cleanRemark: '6/20 後才可出貨', shipRemark: '偏遠地區，配送前請先電聯',
    judgeStatus: 'AI判定完成', shipStatus: '未達出貨時間',
    shipWindow: ['06/20', '07/03'], shippableDate: '06/20', remoteAgentCode: 'F03（花蓮秀林）',
  },
  {
    id: '8', orderNumber: '260526841008', farmerId: 1,
    recipient: '蔡依玲', phone: '0912000008', address: '基隆市中正區中正路760巷1號3樓',
    productName: '夏雪芒果', variety: '夏雪芒果', spec: '1盒(精品大果)', qty: 1, tempLayer: '冷藏',
    rawRemark: '5/29~5/31無法收貨', cleanRemark: '5/29–5/31 不可收貨',
    judgeStatus: 'AI判定完成', shipStatus: '未達出貨時間',
    shipWindow: ['05/29', '06/11'], shippableDate: '06/01', blockedDates: ['05/29–05/31'],
  },
  {
    id: '9', orderNumber: '260525841009', farmerId: 1,
    recipient: '鄭文傑', phone: '0912000009', address: '台北市內湖區文德路88號7樓',
    productName: '玉荷包荔枝', variety: '玉荷包荔枝', spec: '1盒(3斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '', cleanRemark: '', shipRemark: '沒人請放一樓管理員櫃檯',
    judgeStatus: 'AI判定完成', shipStatus: '已出貨',
    shipWindow: ['06/01', '06/14'], shippableDate: '06/03', printedAt: '2026-06-03 08:40',
    trackingNos: ['900556677889'],
  },
  {
    id: '10', orderNumber: '260609851010', farmerId: 1,
    recipient: '謝宜君', phone: '0912000010', address: '嘉義市東區彌陀路264號12樓',
    productName: '黑葉荔枝', variety: '黑葉荔枝', spec: '1盒(5斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '荔枝請於6/18寄出，百香果請於6/20後再寄出，最晚6/30到貨，6/30後家中無人', cleanRemark: '',
    judgeStatus: 'AI判定完成(低信心)', shipStatus: '可出貨',
    shipWindow: ['06/16', '06/29'], shippableDate: '06/16',
  },
  {
    id: '11', orderNumber: '260525841011', farmerId: 1,
    recipient: '周淑貞', phone: '0912000011', address: '台南市東區裕農路233號5樓',
    productName: '帝王芭樂', variety: '帝王芭樂', spec: '1盒(中果5斤裝)', qty: 2, tempLayer: '常溫',
    rawRemark: '產季已過，農友回報缺貨', cleanRemark: '',
    judgeStatus: 'AI判定完成', shipStatus: '無法出貨', failReason: '缺貨',
    shipWindow: ['06/01', '06/14'], shippableDate: '06/05',
  },
  {
    id: '12', orderNumber: '260525841012', farmerId: 1,
    recipient: '高志成', phone: '0912000012', address: '新北市板橋區文化路一段188號12樓',
    productName: '玉荷包荔枝', variety: '玉荷包荔枝', spec: '1盒(5斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '出貨窗口已過，農友尚未出貨', cleanRemark: '請盡快出貨', shipRemark: '冷藏品，請盡快配送、勿久放車上',
    judgeStatus: 'AI判定完成', shipStatus: '逾期未出',
    shipWindow: ['05/30', '06/12'], shippableDate: '06/02',
  },
  {
    id: '13', orderNumber: '260701852013', farmerId: 1,
    recipient: '簡育誠', phone: '0912000013', address: '南投縣仁愛鄉大同村廬山路50號',
    productName: '夏雪芒果', variety: '夏雪芒果', spec: '1盒(精品大果)', qty: 1, tempLayer: '冷藏',
    rawRemark: '中秋前後看情況，盡量早點但不要太早，家裡有人再說', cleanRemark: '', shipRemark: '山區地址請走台14線；電話不通改撥 0912-345-678',
    judgeStatus: 'AI判定完成(低信心)', shipStatus: '可出貨',
    shipWindow: ['06/14', '06/27'], shippableDate: '06/14', remoteAgentCode: 'N02（南投仁愛）',
  },
  {
    id: '14', orderNumber: '260701852014', farmerId: 1,
    recipient: '羅思穎', phone: '0912000014', address: '新竹市東區光復路二段101號',
    productName: '玉荷包荔枝', variety: '', spec: '1盒(5斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '6/10後出貨', cleanRemark: '',
    judgeStatus: '尚未判定', shipStatus: '未達出貨時間',
    shipWindow: ['06/10', '06/23'], shippableDate: '06/10',
  },
  {
    id: '15', orderNumber: '260701852015', farmerId: 1,
    recipient: '曾雅琪', phone: '0912000015', address: '台中市西屯區台灣大道三段99號',
    productName: '帝王芭樂', variety: '帝王芭樂', spec: '1盒(中果5斤裝)', qty: 1, tempLayer: '常溫',
    rawRemark: '', cleanRemark: '',
    judgeStatus: '尚未判定', shipStatus: '未付款',
    shipWindow: ['06/18', '07/01'], shippableDate: '06/18',
  },
  {
    id: '16', orderNumber: '260701852016', farmerId: 1,
    recipient: '許文彬', phone: '0912000016', address: '高雄市左營區博愛二路200號',
    productName: '百香果', variety: '', spec: '1箱(大果4斤裝)', qty: 1, tempLayer: '常溫',
    rawRemark: '端午連假出國，回來再收，時間我再跟你說', cleanRemark: '',
    judgeStatus: 'AI判定失敗', shipStatus: '未達出貨時間',
    shipWindow: ['06/15', '06/28'], shippableDate: '06/15',
  },
  {
    id: '17', orderNumber: '260525841017', farmerId: 1,
    recipient: '潘冠宇', phone: '0912000017', address: '台北市大安區信義路四段1號6樓',
    productName: '玉荷包荔枝', variety: '玉荷包荔枝', spec: '1盒(5斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '', cleanRemark: '', shipRemark: '大門密碼 1234，可直接上樓',
    judgeStatus: '人工修正判定', shipStatus: '已到貨',
    shipWindow: ['06/01', '06/14'], shippableDate: '06/02', printedAt: '2026-06-02 10:20',
    trackingNos: ['900001112223'],
  },

  // ── 農友 2：蔣蔣果園 ──
  {
    id: '18', orderNumber: '260610862018', farmerId: 2,
    recipient: '賴柏翰', phone: '0913000018', address: '台北市大同區重慶北路三段55號',
    productName: '玉荷包荔枝', variety: '玉荷包荔枝', spec: '1盒(3斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '收件人改成公司地址，麻煩重寄', cleanRemark: '（地址已更新）', shipRemark: '假日請避開中午 12–13 點配送',
    judgeStatus: 'AI判定完成', shipStatus: '改單待重印',
    shipWindow: ['06/12', '06/25'], shippableDate: '06/12', isUpdated: true,
  },
  {
    id: '19', orderNumber: '260610862019', farmerId: 2,
    recipient: '鍾佳蓉', phone: '0913000019', address: '新北市新莊區中正路100號8樓',
    productName: '玉荷包荔枝', variety: '玉荷包荔枝', spec: '1盒(5斤裝)', qty: 2, tempLayer: '冷藏',
    rawRemark: '客人指定6/12出貨', cleanRemark: '指定 6/12 出貨',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/12', '06/25'], shippableDate: '06/12', forcedShipDate: '06/12',
  },

  // ── 農友 3：蕭家黑葉荔枝園 ──
  {
    id: '20', orderNumber: '260611863020', farmerId: 3,
    recipient: '范植偉', phone: '0914000020', address: '桃園市中壢區中央西路二段20號',
    productName: '黑葉荔枝', variety: '黑葉荔枝', spec: '1盒(5斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '數量改成 1 盒（原 2 盒），已跟客人確認', cleanRemark: '數量已改為 1 盒',
    judgeStatus: '人工修正判定', shipStatus: '改單待重印',
    shipWindow: ['06/16', '06/29'], shippableDate: '06/16', isUpdated: true,
  },
  {
    id: '21', orderNumber: '260611863021', farmerId: 3,
    recipient: '杜詩梅', phone: '0914000021', address: '台中市北區三民路三段161號',
    productName: '黑葉荔枝', variety: '黑葉荔枝', spec: '1盒(5斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '看方便，我都可以，六月底前收到就好', cleanRemark: '',
    judgeStatus: 'AI判定完成(低信心)', shipStatus: '未達出貨時間',
    shipWindow: ['06/18', '07/01'], shippableDate: '06/18',
  },

  // ── 農友 4：冬陽芒果農場 ──
  {
    id: '22', orderNumber: '260612864022', farmerId: 4,
    recipient: '簡宏偉', phone: '0915000022', address: '高雄市苓雅區四維三路6號12樓',
    productName: '夏雪芒果', variety: '夏雪芒果', spec: '1盒(精品大果)', qty: 1, tempLayer: '冷藏',
    rawRemark: '6/20-6/22 出國不在家', cleanRemark: '6/20–6/22 不可收貨', shipRemark: '需先電聯確認在家再送',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/15', '06/28'], shippableDate: '06/15', blockedDates: ['06/20–06/22'],
  },
  {
    id: '23', orderNumber: '260612864023', farmerId: 4,
    recipient: '洪于晴', phone: '0915000023', address: '台南市永康區中華路1號',
    productName: '夏雪芒果', variety: '夏雪芒果', spec: '1盒(精品大果)', qty: 3, tempLayer: '冷藏',
    rawRemark: '', cleanRemark: '', shipRemark: '公司行號，週末不收，請平日配送',
    judgeStatus: 'AI判定完成', shipStatus: '已印單',
    shipWindow: ['06/14', '06/27'], shippableDate: '06/14', printedAt: '2026-06-14 08:55',
    trackingNos: ['900778899001', '900778899002'],
  },

  // ── 農友 5：吉食百香果園 ──
  {
    id: '24', orderNumber: '260613865024', farmerId: 5,
    recipient: '莊凱', phone: '0916000024', address: '台北市文山區木柵路一段100號',
    productName: '百香果', variety: '百香果', spec: '1箱(大果4斤裝)', qty: 1, tempLayer: '常溫',
    rawRemark: '出貨窗口已過，尚未出貨', cleanRemark: '請盡快出貨',
    judgeStatus: 'AI判定完成', shipStatus: '逾期未出',
    shipWindow: ['06/05', '06/18'], shippableDate: '06/05',
  },
  {
    id: '25', orderNumber: '260613865025', farmerId: 5,
    recipient: '傅子軒', phone: '0916000025', address: '宜蘭縣羅東鎮公正路120號',
    productName: '百香果', variety: '百香果', spec: '1箱(大果4斤裝)', qty: 2, tempLayer: '常溫',
    rawRemark: '週五寄，週六我在家', cleanRemark: '僅週五出貨、週六收', shipRemark: '放門口鞋櫃旁即可，不用簽收',
    judgeStatus: 'AI判定完成', shipStatus: '改單待重印',
    shipWindow: ['06/13', '06/26'], shippableDate: '06/13', blockedDates: ['06/13–06/18', '06/20–06/25'], isUpdated: true,
  },

  // ── 區間內、中間被不可出貨日卡住（區間前後仍可出，中段不可）──
  {
    id: '26', orderNumber: '260614861026', farmerId: 1,
    recipient: '葉庭安', phone: '0912000026', address: '台北市中山區南京東路二段50號9樓',
    productName: '玉荷包荔枝', variety: '玉荷包荔枝', spec: '1盒(5斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '6/15-6/17 我出差不在，其他天都可以', cleanRemark: '6/15–6/17 不可收貨，其餘可',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/12', '06/25'], shippableDate: '06/12', blockedDates: ['06/15–06/17'], forcedShipDate: '06/13',
  },
  {
    id: '27', orderNumber: '260614864027', farmerId: 4,
    recipient: '施予恩', phone: '0915000027', address: '高雄市鼓山區明誠三路100號',
    productName: '夏雪芒果', variety: '夏雪芒果', spec: '1盒(精品大果)', qty: 2, tempLayer: '冷藏',
    rawRemark: '6/13、6/16 兩天有事沒辦法收，其他照舊', cleanRemark: '6/13、6/16 不可收貨', shipRemark: '樓層無電梯，重物請放一樓',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/10', '06/23'], shippableDate: '06/10', blockedDates: ['06/13', '06/16'],
  },
  {
    id: '28', orderNumber: '260614863028', farmerId: 3,
    recipient: '孔翔宇', phone: '0914000028', address: '新竹縣竹北市光明六路120號',
    productName: '黑葉荔枝', variety: '黑葉荔枝', spec: '1盒(5斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '端午連假 6/19-6/22 都不在，且平日只有早上收得到', cleanRemark: '6/19–6/22 不可收貨（連假）',
    judgeStatus: 'AI判定完成(低信心)', shipStatus: '可出貨',
    shipWindow: ['06/16', '06/29'], shippableDate: '06/16', blockedDates: ['06/19–06/22'],
  },
]

// 「可出貨」代表第一次進可出貨時已跟黑貓取號 → 一律要有物流編號。
// 沒手動帶號的可出貨單，自動補一個示範號（未來新增也會涵蓋）。
seedOrders.forEach((o) => {
  if (o.shipStatus === '可出貨' && (!o.trackingNos || o.trackingNos.length === 0)) {
    o.trackingNos = [`9007${o.id.padStart(3, '0')}5678`]
  }
})
