import type { Order } from '../types'
import { seedFarmers } from './farmers'

// 收件人姓名 / 電話皆為虛構。備註取自真實情境，涵蓋各判定/出貨狀態。
// 兩軸：judgeStatus（判定）× shipStatus（出貨）。
// 預定出貨區間預設「兩週」；備註講星期幾不能收貨的，已換算成區間內實際不可出貨日。
// （2026/6 星期：01一 05五 06六 07日 12五 13六 14日 19五 20六 21日 26五 27六 28日）
export const seedOrders: Order[] = [
  {
    id: '1', orderNumber: '260525841001', farmerId: 1,
    recipient: '王小明', phone: '0912000001', address: '台北市內湖區康寧路三段190巷35號8樓',
    productName: '玉荷包荔枝', variety: '玉荷包荔枝', spec: '1盒(5斤裝)', qty: 2, tempLayer: '冷藏',
    rawRemark: '6/7-6/11不收貨，請於6/12出貨 (管理員代收)', farmerRemark: '6/7–6/11 不可收貨；指定 6/12 出貨', driverRemark: '送貨前一小時請電聯收件人',
    judgeReason: '客人指定 6/12 出貨、6/7–6/11 不可收貨；「管理員代收/電聯」屬配送指示歸給司機備註',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/05', '06/18'], blockedDates: ['06/07–06/11'], forcedShipDate: '06/12',
  },
  {
    id: '2', orderNumber: '260525841002', farmerId: 1,
    recipient: '陳美玲', phone: '0912000002', address: '高雄市前鎮區管仲南路402號15樓',
    productName: '玉荷包荔枝', variety: '玉荷包荔枝', spec: '1盒(3斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '客人指定6/12出貨', farmerRemark: '指定 6/12 出貨',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/05', '06/18'], forcedShipDate: '06/12',
  },
  {
    id: '3', orderNumber: '260525841003', farmerId: 1,
    recipient: '林志豪', phone: '0912000003', address: '台中市南屯區楓樹里楓樹六街166號14樓',
    productName: '帝王芭樂', variety: '帝王芭樂', spec: '1盒(中果5斤裝)', qty: 3, tempLayer: '常溫',
    rawRemark: '請週五出貨，客人僅周六可收。帝王芭樂請給10顆裝', farmerRemark: '僅週五出貨、週六收；本單請出 10 顆裝', driverRemark: '大樓管理室代收（B1 管理員）',
    judgeReason: '客人僅週六可收→換算週五出貨；「10 顆裝」屬農友作業歸給農友備註',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/12', '06/25'], blockedDates: ['06/13–06/18', '06/20–06/25'],
  },
  {
    id: '4', orderNumber: '260525841004', farmerId: 1,
    recipient: '張淑芬', phone: '0912000004', address: '宜蘭縣宜蘭市泰山路85巷1號',
    productName: '百香果', variety: '百香果', spec: '1箱(大果4斤裝)', qty: 1, tempLayer: '常溫',
    rawRemark: '6/5後出貨', farmerRemark: '6/5 後出貨', driverRemark: '易碎，請小心輕放、勿倒置',
    judgeStatus: 'AI判定完成', shipStatus: '已印單',
    shipWindow: ['06/05', '06/18'], printedAt: '2026-06-05 09:12',
    trackingNos: ['900112233445'],
  },
  {
    id: '5', orderNumber: '260525841005', farmerId: 1,
    recipient: '黃建宏', phone: '0912000005', address: '台北市松山區北寧路60之1號10樓',
    productName: '夏雪芒果', variety: '夏雪芒果', spec: '1盒(精品大果)', qty: 1, tempLayer: '冷藏',
    rawRemark: '過兩天要出國6/6才回國，最快6/6可收貨，再麻煩晚一點寄出', farmerRemark: '客人 6/6 才可收貨，請晚一點寄', driverRemark: '收件人上班，請下午 5 點後配送',
    judgeReason: '到貨日 6/6→依黑貓天數反推、6/6 前標不可出貨',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/05', '06/18'], blockedDates: ['06/05'],
  },
  {
    id: '6', orderNumber: '260525841006', farmerId: 1,
    recipient: '吳雅婷', phone: '0912000006', address: '桃園市龜山區萬壽路一段241巷26號4樓',
    productName: '玉荷包荔枝', variety: '玉荷包荔枝', spec: '1盒(5斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '地址已更新', farmerRemark: '（地址已更新）',
    judgeStatus: 'AI判定完成', shipStatus: '改單待重印',
    shipWindow: ['06/10', '06/23'],
  },
  {
    id: '7', orderNumber: '260526841007', farmerId: 1,
    recipient: '劉冠廷', phone: '0912000007', address: '花蓮縣秀林鄉富世村天祥路120號',
    productName: '百香果', variety: '百香果', spec: '1箱(大果4斤裝)', qty: 1, tempLayer: '常溫',
    rawRemark: '6/20後再寄出', farmerRemark: '6/20 後才可出貨', driverRemark: '偏遠地區，配送前請先電聯',
    judgeStatus: 'AI判定完成', shipStatus: '未達出貨時間',
    shipWindow: ['06/20', '07/03'],
  },
  {
    id: '8', orderNumber: '260526841008', farmerId: 1,
    recipient: '蔡依玲', phone: '0912000008', address: '基隆市中正區中正路760巷1號3樓',
    productName: '夏雪芒果', variety: '夏雪芒果', spec: '1盒(精品大果)', qty: 1, tempLayer: '冷藏',
    rawRemark: '5/29~5/31無法收貨', farmerRemark: '5/29–5/31 不可收貨',
    judgeReason: '純日期區間，直接標為不可出貨日 5/29–5/31',
    judgeStatus: 'AI判定完成', shipStatus: '未達出貨時間',
    shipWindow: ['05/29', '06/11'], blockedDates: ['05/29–05/31'],
  },
  {
    id: '9', orderNumber: '260525841009', farmerId: 1,
    recipient: '鄭文傑', phone: '0912000009', address: '台北市內湖區文德路88號7樓',
    productName: '玉荷包荔枝', variety: '玉荷包荔枝', spec: '1盒(3斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '', farmerRemark: '', driverRemark: '沒人請放一樓管理員櫃檯',
    judgeStatus: 'AI判定完成', shipStatus: '已出貨',
    shipWindow: ['06/01', '06/14'], printedAt: '2026-06-03 08:40',
    trackingNos: ['900556677889'],
  },
  {
    id: '10', orderNumber: '260609851010', farmerId: 1,
    recipient: '謝宜君', phone: '0912000010', address: '嘉義市東區彌陀路264號12樓',
    productName: '黑葉荔枝', variety: '黑葉荔枝', spec: '1盒(5斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '荔枝請於6/18寄出，百香果請於6/20後再寄出，最晚6/30到貨，6/30後家中無人', farmerRemark: '',
    judgeReason: '多品項不同寄出日、且提到本單無對應品項，無法確定歸屬→低信心，建議人工',
    judgeStatus: 'AI判定完成(低信心)', shipStatus: '可出貨',
    shipWindow: ['06/16', '06/29'],
  },
  {
    id: '11', orderNumber: '260525841011', farmerId: 1,
    recipient: '周淑貞', phone: '0912000011', address: '台南市東區裕農路233號5樓',
    productName: '帝王芭樂', variety: '帝王芭樂', spec: '1盒(中果5斤裝)', qty: 2, tempLayer: '常溫',
    rawRemark: '產季已過，農友回報缺貨', farmerRemark: '',
    judgeStatus: 'AI判定完成', shipStatus: '無法出貨', failReason: '缺貨',
    shipWindow: ['06/01', '06/14'],
  },
  {
    id: '12', orderNumber: '260525841012', farmerId: 1,
    recipient: '高志成', phone: '0912000012', address: '新北市板橋區文化路一段188號12樓',
    productName: '玉荷包荔枝', variety: '玉荷包荔枝', spec: '1盒(5斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '出貨窗口已過，農友尚未出貨', farmerRemark: '請盡快出貨', driverRemark: '冷藏品，請盡快配送、勿久放車上',
    judgeStatus: 'AI判定完成', shipStatus: '逾期未出',
    shipWindow: ['05/30', '06/12'],
  },
  {
    id: '13', orderNumber: '260701852013', farmerId: 1,
    recipient: '簡育誠', phone: '0912000013', address: '南投縣仁愛鄉大同村廬山路50號',
    productName: '夏雪芒果', variety: '夏雪芒果', spec: '1盒(精品大果)', qty: 1, tempLayer: '冷藏',
    rawRemark: '看情況，盡量早點但不要太早，家裡有人再說', farmerRemark: '', driverRemark: '山區地址請走台14線；電話不通改撥 0912-345-678',
    judgeStatus: 'AI判定完成(低信心)', shipStatus: '可出貨',
    shipWindow: ['06/14', '06/27'],
  },
  {
    id: '14', orderNumber: '260701852014', farmerId: 1,
    recipient: '羅思穎', phone: '0912000014', address: '新竹市東區光復路二段101號',
    productName: '玉荷包荔枝', variety: '', spec: '1盒(5斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '6/10後出貨', farmerRemark: '',
    judgeStatus: '尚未判定', shipStatus: '未達出貨時間',
    shipWindow: ['06/10', '06/23'],
  },
  {
    id: '15', orderNumber: '260701852015', farmerId: 1,
    recipient: '曾雅琪', phone: '0912000015', address: '台中市西屯區台灣大道三段99號',
    productName: '帝王芭樂', variety: '帝王芭樂', spec: '1盒(中果5斤裝)', qty: 1, tempLayer: '常溫',
    rawRemark: '', farmerRemark: '',
    judgeStatus: '尚未判定', shipStatus: '未付款',
    shipWindow: ['06/18', '07/01'],
  },
  {
    id: '16', orderNumber: '260701852016', farmerId: 1,
    recipient: '許文彬', phone: '0912000016', address: '高雄市左營區博愛二路200號',
    productName: '百香果', variety: '', spec: '1箱(大果4斤裝)', qty: 1, tempLayer: '常溫',
    rawRemark: '端午連假出國，回來再收，時間我再跟你說', farmerRemark: '',
    judgeStatus: 'AI判定失敗', shipStatus: '未達出貨時間',
    shipWindow: ['06/15', '06/28'],
  },
  {
    id: '17', orderNumber: '260525841017', farmerId: 1,
    recipient: '潘冠宇', phone: '0912000017', address: '台北市大安區信義路四段1號6樓',
    productName: '玉荷包荔枝', variety: '玉荷包荔枝', spec: '1盒(5斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '', farmerRemark: '', driverRemark: '大門密碼 1234，可直接上樓',
    judgeStatus: '人工修正判定', shipStatus: '已到貨',
    shipWindow: ['06/01', '06/14'], printedAt: '2026-06-02 10:20',
    trackingNos: ['900001112223'],
  },

  // ── 農友 2：蔣蔣果園 ──
  {
    id: '18', orderNumber: '260610862018', farmerId: 2,
    recipient: '賴柏翰', phone: '0913000018', address: '台北市大同區重慶北路三段55號',
    productName: '玉荷包荔枝', variety: '玉荷包荔枝', spec: '1盒(3斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '收件人改成公司地址，麻煩重寄', farmerRemark: '（地址已更新）', driverRemark: '假日請避開中午 12–13 點配送', csRemark: '客服：客人改公司地址，已重新取號',
    judgeStatus: 'AI判定完成', shipStatus: '改單待重印',
    shipWindow: ['06/12', '06/25'],
  },
  {
    id: '19', orderNumber: '260610862019', farmerId: 2,
    recipient: '鍾佳蓉', phone: '0913000019', address: '新北市新莊區中正路100號8樓',
    productName: '玉荷包荔枝', variety: '玉荷包荔枝', spec: '1盒(5斤裝)', qty: 2, tempLayer: '冷藏',
    rawRemark: '客人指定6/12出貨', farmerRemark: '指定 6/12 出貨',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/12', '06/25'], forcedShipDate: '06/12',
  },

  // ── 農友 3：蕭家黑葉荔枝園 ──
  {
    id: '20', orderNumber: '260611863020', farmerId: 3,
    recipient: '范植偉', phone: '0914000020', address: '桃園市中壢區中央西路二段20號',
    productName: '黑葉荔枝', variety: '黑葉荔枝', spec: '1盒(5斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '數量改成 1 盒（原 2 盒），已跟客人確認', farmerRemark: '數量已改為 1 盒', csRemark: '客服：數量由 2 盒改 1 盒，客人已確認',
    judgeStatus: '人工修正判定', shipStatus: '改單待重印',
    shipWindow: ['06/16', '06/29'],
  },
  {
    id: '21', orderNumber: '260611863021', farmerId: 3,
    recipient: '杜詩梅', phone: '0914000021', address: '台中市北區三民路三段161號',
    productName: '黑葉荔枝', variety: '黑葉荔枝', spec: '1盒(5斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '看方便，我都可以，六月底前收到就好', farmerRemark: '',
    judgeStatus: 'AI判定完成(低信心)', shipStatus: '未達出貨時間',
    shipWindow: ['06/18', '07/01'],
  },

  // ── 農友 4：冬陽芒果農場 ──
  {
    id: '22', orderNumber: '260612864022', farmerId: 4,
    recipient: '簡宏偉', phone: '0915000022', address: '高雄市苓雅區四維三路6號12樓',
    productName: '夏雪芒果', variety: '夏雪芒果', spec: '1盒(精品大果)', qty: 1, tempLayer: '冷藏',
    rawRemark: '6/20-6/22 出國不在家', farmerRemark: '6/20–6/22 不可收貨', driverRemark: '需先電聯確認在家再送',
    judgeReason: '「出國不在家」為不可收貨→標 6/20–6/22 不可出貨日',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/15', '06/28'], blockedDates: ['06/20–06/22'],
  },
  {
    id: '23', orderNumber: '260612864023', farmerId: 4,
    recipient: '洪于晴', phone: '0915000023', address: '台南市永康區中華路1號',
    productName: '夏雪芒果', variety: '夏雪芒果', spec: '1盒(精品大果)', qty: 3, tempLayer: '冷藏',
    rawRemark: '', farmerRemark: '', driverRemark: '公司行號，週末不收，請平日配送',
    judgeStatus: 'AI判定完成', shipStatus: '已印單',
    shipWindow: ['06/14', '06/27'], printedAt: '2026-06-14 08:55',
    trackingNos: ['900778899001', '900778899002'],
  },

  // ── 農友 5：吉食百香果園 ──
  {
    id: '24', orderNumber: '260613865024', farmerId: 5,
    recipient: '莊凱', phone: '0916000024', address: '台北市文山區木柵路一段100號',
    productName: '百香果', variety: '百香果', spec: '1箱(大果4斤裝)', qty: 1, tempLayer: '常溫',
    rawRemark: '出貨窗口已過，尚未出貨', farmerRemark: '請盡快出貨',
    judgeStatus: 'AI判定完成', shipStatus: '逾期未出',
    shipWindow: ['06/05', '06/18'],
  },
  {
    id: '25', orderNumber: '260613865025', farmerId: 5,
    recipient: '傅子軒', phone: '0916000025', address: '宜蘭縣羅東鎮公正路120號',
    productName: '百香果', variety: '百香果', spec: '1箱(大果4斤裝)', qty: 2, tempLayer: '常溫',
    rawRemark: '週五寄，週六我在家', farmerRemark: '僅週五出貨、週六收', driverRemark: '放門口鞋櫃旁即可，不用簽收',
    judgeStatus: 'AI判定完成', shipStatus: '改單待重印',
    shipWindow: ['06/13', '06/26'], blockedDates: ['06/13–06/18', '06/20–06/25'],
  },

  // ── 區間內、中間被不可出貨日卡住（區間前後仍可出，中段不可）──
  {
    id: '26', orderNumber: '260614861026', farmerId: 1,
    recipient: '葉庭安', phone: '0912000026', address: '台北市中山區南京東路二段50號9樓',
    productName: '玉荷包荔枝', variety: '玉荷包荔枝', spec: '1盒(5斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '6/15-6/17 我出差不在，其他天都可以', farmerRemark: '6/15–6/17 不可收貨，其餘可',
    judgeReason: '區間中段 6/15–6/17 不可收貨，前後仍可出→標不可出貨日',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/12', '06/25'], blockedDates: ['06/15–06/17'], forcedShipDate: '06/13',
  },
  {
    id: '27', orderNumber: '260614864027', farmerId: 4,
    recipient: '施予恩', phone: '0915000027', address: '高雄市鼓山區明誠三路100號',
    productName: '夏雪芒果', variety: '夏雪芒果', spec: '1盒(精品大果)', qty: 2, tempLayer: '冷藏',
    rawRemark: '6/13、6/16 兩天有事沒辦法收，其他照舊', farmerRemark: '6/13、6/16 不可收貨', driverRemark: '樓層無電梯，重物請放一樓',
    judgeReason: '兩個單日不可收貨 6/13、6/16；「重物放一樓」屬配送指示歸給司機備註',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/10', '06/23'], blockedDates: ['06/13', '06/16'],
  },
  {
    id: '28', orderNumber: '260614863028', farmerId: 3,
    recipient: '孔翔宇', phone: '0914000028', address: '新竹縣竹北市光明六路120號',
    productName: '黑葉荔枝', variety: '黑葉荔枝', spec: '1盒(5斤裝)', qty: 1, tempLayer: '冷藏',
    rawRemark: '端午連假 6/19-6/22 都不在，且平日只有早上收得到', farmerRemark: '6/19–6/22 不可收貨（連假）',
    judgeReason: '6/19–6/22 不可收貨；「平日只有早上收得到」無法量化成出貨日→低信心',
    judgeStatus: 'AI判定完成(低信心)', shipStatus: '可出貨',
    shipWindow: ['06/16', '06/29'], blockedDates: ['06/19–06/22'],
  },

  // ── 農友 6：冠軍文旦園（文旦，分品種）· 7-11／統一 企業匯單（bulkOrderType: 統一711；品名開頭 711）──
  {
    id: '29', orderNumber: '260615711029', farmerId: 6,
    recipient: '7-ELEVEN 中崙門市', phone: '0227525111', address: '台北市松山區八德路三段12巷52號',
    productName: '711【統一專用】麻豆文旦 (9台斤/箱)', variety: '麻豆文旦', spec: '1箱(9台斤)', qty: 20, tempLayer: '常溫',
    rawRemark: '', farmerRemark: '統一企業匯單，整箱直送門市', driverRemark: '送統一超商門市，請走後場收貨',
    bulkOrderType: '統一711',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/05', '06/18'],
  },
  {
    id: '30', orderNumber: '260615711030', farmerId: 6,
    recipient: '7-ELEVEN 復興門市', phone: '0227720711', address: '台北市大安區復興南路一段107號',
    productName: '711【統一專用】麻豆文旦 (9台斤/箱)', variety: '麻豆文旦', spec: '1箱(9台斤)', qty: 15, tempLayer: '常溫',
    rawRemark: '', farmerRemark: '統一企業匯單，整箱直送門市', driverRemark: '送統一超商門市，請走後場收貨',
    bulkOrderType: '統一711',
    judgeStatus: 'AI判定完成', shipStatus: '已印單',
    shipWindow: ['06/05', '06/18'], printedAt: '2026-06-05 10:05', trackingNos: ['900711030001'],
  },
  {
    id: '31', orderNumber: '260615711031', farmerId: 6,
    recipient: '7-ELEVEN 竹科門市', phone: '0357788711', address: '新竹市東區力行路8號',
    productName: '711【統一專用】大白柚 (10台斤/箱)', variety: '大白柚', spec: '1箱(10台斤)', qty: 12, tempLayer: '常溫',
    rawRemark: '', farmerRemark: '統一企業匯單，整箱直送門市',
    bulkOrderType: '統一711',
    judgeStatus: 'AI判定完成', shipStatus: '未達出貨時間',
    shipWindow: ['06/20', '07/03'],
  },
  {
    id: '32', orderNumber: '260615711032', farmerId: 6,
    recipient: '7-ELEVEN 民生門市', phone: '0227198711', address: '台北市松山區民生東路四段56號',
    productName: '711【統一專用】麻豆文旦 (9台斤/箱)', variety: '麻豆文旦', spec: '1箱(9台斤)', qty: 18, tempLayer: '常溫',
    rawRemark: '', farmerRemark: '統一企業匯單，整箱直送門市', driverRemark: '送統一超商門市，請走後場收貨',
    bulkOrderType: '統一711',
    judgeStatus: 'AI判定完成', shipStatus: '已出貨',
    shipWindow: ['06/01', '06/14'], printedAt: '2026-06-02 09:30', trackingNos: ['900711032001'],
  },
  {
    id: '33', orderNumber: '260615711033', farmerId: 6,
    recipient: '7-ELEVEN 楠梓門市', phone: '0736011711', address: '高雄市楠梓區土庫一路60號',
    productName: '711【統一專用】大白柚 (10台斤/箱)', variety: '大白柚', spec: '1箱(10台斤)', qty: 10, tempLayer: '常溫',
    rawRemark: '門市地址調整，改送新門市', farmerRemark: '（門市地址已更新）', csRemark: '客服：統一改配送門市，已重新取號',
    bulkOrderType: '統一711',
    judgeStatus: 'AI判定完成', shipStatus: '改單待重印',
    shipWindow: ['06/10', '06/23'],
  },
  {
    id: '34', orderNumber: '260615711034', farmerId: 6,
    recipient: '7-ELEVEN 逢甲門市', phone: '0424518711', address: '台中市西屯區文華路100號',
    productName: '711【統一專用】麻豆文旦 (9台斤/箱)', variety: '麻豆文旦', spec: '1箱(9台斤)', qty: 16, tempLayer: '常溫',
    rawRemark: '統一指定 6/13 到各門市', farmerRemark: '指定 6/13 出貨（統一到店日）',
    bulkOrderType: '統一711',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/05', '06/18'], forcedShipDate: '06/13',
  },
  {
    id: '35', orderNumber: '260615711035', farmerId: 6,
    recipient: '7-ELEVEN 東門門市', phone: '0623901711', address: '台南市中西區府前路一段20號',
    productName: '711【統一專用】麻豆文旦 (9台斤/箱)', variety: '麻豆文旦', spec: '1箱(9台斤)', qty: 14, tempLayer: '常溫',
    rawRemark: '出貨窗口已過、農友尚未出貨', farmerRemark: '請盡快出貨',
    bulkOrderType: '統一711',
    judgeStatus: 'AI判定完成', shipStatus: '逾期未出',
    shipWindow: ['05/28', '06/10'],
  },
  {
    id: '36', orderNumber: '260615711036', farmerId: 6,
    recipient: '7-ELEVEN 羅東門市', phone: '0339540711', address: '宜蘭縣羅東鎮中正路100號',
    productName: '711【統一專用】大白柚 (10台斤/箱)', variety: '大白柚', spec: '1箱(10台斤)', qty: 12, tempLayer: '常溫',
    rawRemark: '', farmerRemark: '統一企業匯單，整箱直送門市',
    bulkOrderType: '統一711',
    judgeStatus: 'AI判定完成', shipStatus: '已到貨',
    shipWindow: ['06/01', '06/14'], printedAt: '2026-06-02 08:15', trackingNos: ['900711036001'],
  },

  // ── 農友 6：冠軍文旦園（文旦，分品種）· 非 7-11 企業匯單（bulkOrderType: 企業匯單；EnterpriseImport、下單會員電話 0900000000）──
  {
    id: '37', orderNumber: '260610872037', farmerId: 6,
    recipient: '宏達電子 採購部 林經理', phone: '0917000037', address: '桃園市龜山區文化一路120號',
    productName: '中秋嚴選【老欉文旦】冠軍文旦園', variety: '老欉文旦', spec: '禮盒(6粒裝)', qty: 50, tempLayer: '常溫',
    rawRemark: '', farmerRemark: '企業匯單，統一配送', driverRemark: '公司行號，請平日日間送達收發室', csRemark: '企業訂單匯入（2026/06/10）',
    bulkOrderType: '企業匯單',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/05', '06/18'],
  },
  {
    id: '38', orderNumber: '260610872038', farmerId: 6,
    recipient: '長青生技 王小姐', phone: '0917000038', address: '台中市西屯區台灣大道四段1727號',
    productName: '中秋嚴選【麻豆文旦】冠軍文旦園', variety: '麻豆文旦', spec: '1箱(10台斤)', qty: 30, tempLayer: '常溫',
    rawRemark: '', farmerRemark: '企業匯單；分兩箱寄', driverRemark: '公司行號，請平日日間送達', csRemark: '企業訂單匯入（2026/06/10）；補單分 2 箱',
    bulkOrderType: '企業匯單',
    judgeStatus: 'AI判定完成', shipStatus: '已印單',
    shipWindow: ['06/05', '06/18'], printedAt: '2026-06-05 11:20', trackingNos: ['900872038001', '900872038002'],
  },
  {
    id: '39', orderNumber: '260610872039', farmerId: 6,
    recipient: '康福保經 行政部', phone: '0917000039', address: '台北市信義區松仁路100號12樓',
    productName: '中秋嚴選【紅文旦】冠軍文旦園', variety: '紅文旦', spec: '禮盒(6粒裝)', qty: 40, tempLayer: '常溫',
    rawRemark: '', farmerRemark: '企業匯單，統一配送', csRemark: '企業訂單匯入（2026/06/10）',
    bulkOrderType: '企業匯單',
    judgeStatus: 'AI判定完成', shipStatus: '未達出貨時間',
    shipWindow: ['06/20', '07/03'],
  },
  {
    id: '40', orderNumber: '260610872040', farmerId: 6,
    recipient: '員工贈禮 陳先生', phone: '0917000040', address: '新北市新店區北新路三段200號',
    productName: '中秋嚴選【老欉文旦】冠軍文旦園', variety: '老欉文旦', spec: '禮盒(6粒裝)', qty: 1, tempLayer: '常溫',
    rawRemark: '中秋前後到，收禮人時間再確認', farmerRemark: '', driverRemark: '企業送禮，收件人旁註贈送單位',
    judgeReason: '企業匯入的送禮單、到貨時間語意模糊→低信心，建議人工',
    bulkOrderType: '企業匯單',
    judgeStatus: 'AI判定完成(低信心)', shipStatus: '可出貨',
    shipWindow: ['06/14', '06/27'], csRemark: '企業訂單匯入（2026/06/10）',
  },
  {
    id: '41', orderNumber: '260610872041', farmerId: 6,
    recipient: '大器建設 總務處', phone: '0917000041', address: '高雄市前鎮區成功二路25號',
    productName: '中秋嚴選【大白柚】冠軍文旦園', variety: '大白柚', spec: '1箱(10台斤)', qty: 25, tempLayer: '常溫',
    rawRemark: '', farmerRemark: '', csRemark: '企業訂單匯入（2026/06/09）；農友回報產季末缺貨',
    bulkOrderType: '企業匯單',
    judgeStatus: 'AI判定完成', shipStatus: '無法出貨', failReason: '產季末、數量不足',
    shipWindow: ['06/01', '06/14'],
  },
  {
    id: '42', orderNumber: '260610872042', farmerId: 6,
    recipient: '軒億科技 人資部', phone: '0917000042', address: '新竹縣竹北市台元街36號',
    productName: '中秋嚴選【老欉文旦】冠軍文旦園', variety: '老欉文旦', spec: '禮盒(6粒裝)', qty: 60, tempLayer: '常溫',
    rawRemark: '公司指定 6/12 統一到貨', farmerRemark: '指定 6/12 出貨', csRemark: '企業訂單匯入（2026/06/09）',
    bulkOrderType: '企業匯單',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/05', '06/18'], forcedShipDate: '06/12',
  },
  {
    id: '43', orderNumber: '260610872043', farmerId: 6,
    recipient: '恆安人壽 教育訓練部', phone: '0917000043', address: '台北市中山區南京東路二段125號',
    productName: '中秋嚴選【麻豆文旦】冠軍文旦園', variety: '麻豆文旦', spec: '1箱(10台斤)', qty: 20, tempLayer: '常溫',
    rawRemark: '', farmerRemark: '企業匯單，統一配送', csRemark: '企業訂單匯入（2026/06/08）',
    bulkOrderType: '企業匯單',
    judgeStatus: 'AI判定完成', shipStatus: '已出貨',
    shipWindow: ['06/01', '06/14'], printedAt: '2026-06-02 14:40', trackingNos: ['900872043001'],
  },
  {
    id: '44', orderNumber: '260610872044', farmerId: 6,
    recipient: '合豐貿易 財務部', phone: '0917000044', address: '台南市安平區永華路二段6號',
    productName: '中秋嚴選【紅文旦】冠軍文旦園', variety: '紅文旦', spec: '禮盒(6粒裝)', qty: 35, tempLayer: '常溫',
    rawRemark: '', farmerRemark: '', csRemark: '企業訂單匯入（2026/06/11）；待付款',
    bulkOrderType: '企業匯單',
    judgeStatus: '尚未判定', shipStatus: '未付款',
    shipWindow: ['06/18', '07/01'],
  },

  // ── 農友 1：鐵人果園（玉荷包荔枝）· 企業匯單（bulkOrderType: 企業匯單）──
  {
    id: '45', orderNumber: '260610873045', farmerId: 1,
    recipient: '台積電 福委會', phone: '0918000045', address: '新竹市東區力行六路8號',
    productName: '荔枝季【玉荷包荔枝】鐵人夫婦 1盒(5斤裝)', variety: '玉荷包荔枝', spec: '1盒(5斤裝)', qty: 40, tempLayer: '冷藏',
    rawRemark: '', farmerRemark: '企業匯單，統一配送', driverRemark: '公司行號，請平日日間送達收發室', csRemark: '企業訂單匯入（2026/06/10）',
    bulkOrderType: '企業匯單',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/05', '06/18'],
  },
  {
    id: '46', orderNumber: '260610873046', farmerId: 1,
    recipient: '國泰人壽 總務部', phone: '0918000046', address: '台北市大安區仁愛路四段296號',
    productName: '荔枝季【玉荷包荔枝】鐵人夫婦 1盒(5斤裝)', variety: '玉荷包荔枝', spec: '1盒(5斤裝)', qty: 30, tempLayer: '冷藏',
    rawRemark: '', farmerRemark: '企業匯單；分兩箱寄', driverRemark: '公司行號，請平日日間送達', csRemark: '企業訂單匯入（2026/06/10）；補單分 2 箱',
    bulkOrderType: '企業匯單',
    judgeStatus: 'AI判定完成', shipStatus: '已印單',
    shipWindow: ['06/05', '06/18'], printedAt: '2026-06-05 11:40', trackingNos: ['900873046001', '900873046002'],
  },
  {
    id: '47', orderNumber: '260610873047', farmerId: 1,
    recipient: '鴻海精密 採購處', phone: '0918000047', address: '新北市土城區自由街2號',
    productName: '荔枝季【玉荷包荔枝】鐵人夫婦 1盒(3斤裝)', variety: '玉荷包荔枝', spec: '1盒(3斤裝)', qty: 50, tempLayer: '冷藏',
    rawRemark: '', farmerRemark: '企業匯單，統一配送', csRemark: '企業訂單匯入（2026/06/11）',
    bulkOrderType: '企業匯單',
    judgeStatus: 'AI判定完成', shipStatus: '未達出貨時間',
    shipWindow: ['06/20', '07/03'],
  },
  {
    id: '48', orderNumber: '260610873048', farmerId: 1,
    recipient: '中華電信 員工福利', phone: '0918000048', address: '台北市中正區信義路一段21號',
    productName: '荔枝季【玉荷包荔枝】鐵人夫婦 1盒(5斤裝)', variety: '玉荷包荔枝', spec: '1盒(5斤裝)', qty: 25, tempLayer: '冷藏',
    rawRemark: '', farmerRemark: '企業匯單，統一配送', csRemark: '企業訂單匯入（2026/06/08）',
    bulkOrderType: '企業匯單',
    judgeStatus: 'AI判定完成', shipStatus: '已出貨',
    shipWindow: ['06/01', '06/14'], printedAt: '2026-06-02 15:10', trackingNos: ['900873048001'],
  },
  {
    id: '49', orderNumber: '260610873049', farmerId: 1,
    recipient: '玉山銀行 人資部', phone: '0918000049', address: '台北市松山區民生東路三段156號',
    productName: '荔枝季【玉荷包荔枝】鐵人夫婦 1盒(5斤裝)', variety: '玉荷包荔枝', spec: '1盒(5斤裝)', qty: 60, tempLayer: '冷藏',
    rawRemark: '公司指定 6/12 統一到貨', farmerRemark: '指定 6/12 出貨', csRemark: '企業訂單匯入（2026/06/09）',
    bulkOrderType: '企業匯單',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/05', '06/18'], forcedShipDate: '06/12',
  },

  // ── 農友 6：冠軍文旦園 · 一般消費者單（bulkOrderType 省略＝一般）；3 品種、文旦 3 規格、涵蓋各狀態，供農園展示 ──
  {
    id: '50', orderNumber: '260605861050', farmerId: 6,
    recipient: '王士豪', phone: '0919000050', address: '台北市大安區敦化南路二段63號8樓',
    productName: '中秋嚴選【麻豆文旦】冠軍文旦園', variety: '麻豆文旦', spec: '禮盒(6粒裝)', qty: 2, tempLayer: '常溫',
    rawRemark: '請務必於指定日 6/12 出貨', farmerRemark: '指定 6/12 出貨',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/05', '06/18'], forcedShipDate: '06/12',
  },
  {
    id: '51', orderNumber: '260530861051', farmerId: 6,
    recipient: '林淑惠', phone: '0919000051', address: '新北市板橋區文化路二段182巷3弄12號',
    productName: '中秋嚴選【麻豆文旦】冠軍文旦園', variety: '麻豆文旦', spec: '1箱(9台斤)', qty: 1, tempLayer: '常溫',
    rawRemark: '', farmerRemark: '',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['05/30', '06/12'],
  },
  {
    id: '52', orderNumber: '260603861052', farmerId: 6,
    recipient: '陳冠廷', phone: '0919000052', address: '桃園市中壢區中央西路二段166號',
    productName: '中秋嚴選【麻豆文旦】冠軍文旦園', variety: '麻豆文旦', spec: '1箱(20台斤)', qty: 1, tempLayer: '常溫',
    rawRemark: '', farmerRemark: '大箱裝，麻煩紮實包裝', driverRemark: '重物，樓層無電梯請放一樓',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/03', '06/14'],
  },
  {
    id: '53', orderNumber: '260528861053', farmerId: 6,
    recipient: '黃美珍', phone: '0919000053', address: '台中市西區美村路一段120號',
    productName: '中秋嚴選【大白柚】冠軍文旦園', variety: '大白柚', spec: '1箱(10台斤)', qty: 1, tempLayer: '常溫',
    rawRemark: '出貨窗口已過、尚未出貨', farmerRemark: '請盡快出貨',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['05/28', '06/10'],
  },
  {
    id: '54', orderNumber: '260610861054', farmerId: 6,
    recipient: '吳建霆', phone: '0919000054', address: '台南市東區林森路一段276號',
    productName: '中秋嚴選【大白柚】冠軍文旦園', variety: '大白柚', spec: '1箱(10台斤)', qty: 2, tempLayer: '常溫',
    rawRemark: '收件地址改成公司，麻煩重寄', farmerRemark: '（地址已更新）', csRemark: '客服：客人改公司地址，已重新取號',
    judgeStatus: 'AI判定完成', shipStatus: '改單待重印',
    shipWindow: ['06/10', '06/23'],
  },
  {
    id: '55', orderNumber: '260608861055', farmerId: 6,
    recipient: '蔡瑞麟', phone: '0919000055', address: '高雄市左營區博愛二路366號15樓',
    productName: '中秋嚴選【老欉文旦】冠軍文旦園', variety: '老欉文旦', spec: '禮盒(8粒精選)', qty: 1, tempLayer: '常溫',
    rawRemark: '6/14-6/16 出國不在，其他天都可以，收件人上班晚上才在家', farmerRemark: '6/14–6/16 不可收貨',
    driverRemark: '收件人上班，請 18:00 後配送、可先電聯',
    judgeReason: '「出國不在」為不可收貨→標 6/14–6/16；「晚上才在家」屬配送指示歸司機備註',
    judgeStatus: 'AI判定完成', shipStatus: '可出貨',
    shipWindow: ['06/08', '06/21'], blockedDates: ['06/14–06/16'],
  },
  {
    id: '56', orderNumber: '260605861056', farmerId: 6,
    recipient: '鄭雅文', phone: '0919000056', address: '新竹市東區關新路27號',
    productName: '中秋嚴選【老欉文旦】冠軍文旦園', variety: '老欉文旦', spec: '禮盒(8粒精選)', qty: 1, tempLayer: '常溫',
    rawRemark: '', farmerRemark: '', driverRemark: '大樓管理室代收',
    judgeStatus: 'AI判定完成', shipStatus: '已印單',
    shipWindow: ['06/05', '06/18'], printedAt: '2026-06-05 09:20', trackingNos: ['900861056001'],
  },
  {
    id: '57', orderNumber: '260601861057', farmerId: 6,
    recipient: '許志偉', phone: '0919000057', address: '台北市內湖區成功路四段188號',
    productName: '中秋嚴選【麻豆文旦】冠軍文旦園', variety: '麻豆文旦', spec: '禮盒(6粒裝)', qty: 1, tempLayer: '常溫',
    rawRemark: '', farmerRemark: '',
    judgeStatus: 'AI判定完成', shipStatus: '已出貨',
    shipWindow: ['06/01', '06/14'], printedAt: '2026-06-02 08:50', trackingNos: ['900861057001'],
  },
  {
    id: '58', orderNumber: '260620861058', farmerId: 6,
    recipient: '劉思妤', phone: '0919000058', address: '宜蘭縣宜蘭市女中路三段99號',
    productName: '中秋嚴選【大白柚】冠軍文旦園', variety: '大白柚', spec: '1箱(10台斤)', qty: 1, tempLayer: '常溫',
    rawRemark: '6/20後再出', farmerRemark: '6/20 後才可出貨',
    judgeStatus: 'AI判定完成', shipStatus: '未達出貨時間',
    shipWindow: ['06/20', '07/03'],
  },
  {
    id: '59', orderNumber: '260609861059', farmerId: 6,
    recipient: '謝孟儒', phone: '0919000059', address: '南投縣埔里鎮中山路三段220號',
    productName: '中秋嚴選【麻豆文旦】冠軍文旦園', variety: '麻豆文旦', spec: '1箱(9台斤)', qty: 1, tempLayer: '常溫',
    rawRemark: '看情況，盡量早點但不要太早，家裡有人再說', farmerRemark: '', driverRemark: '電話不通改撥 0912-987-654',
    judgeReason: '「盡量早點但不要太早」語意模糊、無法量化成明確日期→低信心，建議人工',
    judgeStatus: 'AI判定完成(低信心)', shipStatus: '可出貨',
    shipWindow: ['06/09', '06/22'],
  },
  {
    id: '60', orderNumber: '260601861060', farmerId: 6,
    recipient: '周庭妤', phone: '0919000060', address: '嘉義市西區垂楊路600號',
    productName: '中秋嚴選【老欉文旦】冠軍文旦園', variety: '老欉文旦', spec: '禮盒(8粒精選)', qty: 1, tempLayer: '常溫',
    rawRemark: '', farmerRemark: '', driverRemark: '沒人請放一樓管理員櫃檯',
    judgeStatus: '人工修正判定', shipStatus: '已到貨',
    shipWindow: ['06/01', '06/14'], printedAt: '2026-06-02 10:30', trackingNos: ['900861060001'],
  },
]

// 物流編號＝按過印單才有（每次印單即時要新號）。示範資料只給「已印過」的狀態帶號，
// 其餘（可出貨/未達出貨/未付款/逾期/失敗）一律尚無；改單待重印＝先前印過故留舊號可重印。
const PRINTED_STATUS = ['已印單', '改單待重印', '已出貨', '已到貨']
seedOrders.forEach((o) => {
  if (PRINTED_STATUS.includes(o.shipStatus)) {
    if (!o.trackingNos || o.trackingNos.length === 0) {
      o.trackingNos = [`9007${o.id.padStart(3, '0')}5678`]
    }
  } else {
    o.trackingNos = undefined
  }
})

// 判定信心：依 judgeStatus 反推示範用 confidence / needsHuman（實作時由 AI 回傳、judgeStatus 反由兩者映射，見 F3 §3-3）
seedOrders.forEach((o) => {
  if (o.needsHuman !== undefined) return
  if (o.judgeStatus === 'AI判定失敗') {
    o.needsHuman = true
    o.confidence = 0.2
  } else if (o.judgeStatus === 'AI判定完成(低信心)') {
    o.needsHuman = false
    o.confidence = 0.55
  } else if (o.judgeStatus === 'AI判定完成' || o.judgeStatus === '人工修正判定') {
    o.needsHuman = false
    o.confidence = 0.92
  }
  // 尚未判定：不設 confidence / needsHuman
})

// 偏遠客代綁農園（依農園地址，見 F4 §5）：由農友帶入，非看收件地
seedOrders.forEach((o) => {
  if (o.remoteAgentCode) return
  const f = seedFarmers.find((x) => x.id === o.farmerId)
  if (f?.remoteAgentCode) o.remoteAgentCode = f.remoteAgentCode
})

// 企業匯單分類（程式判定、711 優先，見 F3 §2-2）：未標記者預設「一般」消費者單
seedOrders.forEach((o) => {
  if (!o.bulkOrderType) o.bulkOrderType = '一般'
})
