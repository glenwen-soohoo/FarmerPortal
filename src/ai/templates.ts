import type { MasterInput } from './types'

// 母單範本：涵蓋 F3 各判定情境。方便一鍵帶入後再手動改 rawRemark 試 AI 反應。
// 分三組（TEMPLATE_GROUPS）：基本情境 / 口語特殊情境 / 極端 noise。
// 口語特殊與 noise 來源＝討論紀錄 0716-33_回饋.md「補充測試備註」。

const W: [string, string] = ['06/16', '06/29'] // 共用預設出貨區間

export interface Template {
  key: string
  group: string
  label: string
  hint: string
  data: MasterInput
}

export const TEMPLATE_GROUPS = ['基本情境', '口語特殊情境', '多品項壓測', '極端 noise'] as const

// 產一張單品項母單的小工具（口語/ noise 情境多為單子單）
let _seq = 90000
function one(rawRemark: string, opts?: Partial<MasterInput> & { product?: string; farm?: string; spec?: string; temp?: string; window?: [string, string] }): MasterInput {
  const id = _seq++
  return {
    masterOrderId: id,
    masterOrderNo: String(260600000000 + id),
    orderDate: opts?.orderDate ?? '2026-06-08',
    rawRemark,
    carrierLeadDays: opts?.carrierLeadDays ?? 1,
    items: [
      {
        orderId: id,
        subOrderNo: String(260600000000 + id) + '0',
        farm: opts?.farm ?? '冠軍文旦園',
        productName: opts?.product ?? '中秋嚴選【麻豆文旦】冠軍文旦園',
        spec: opts?.spec ?? '1箱(9台斤)',
        qty: 1,
        tempLayer: opts?.temp ?? '常溫',
        defaultShipWindow: opts?.window ?? ['06/08', '06/21'],
      },
    ],
  }
}

export const TEMPLATES: Template[] = [
  // ── 基本情境 ──────────────────────────────────────────
  {
    key: 'multi',
    group: '基本情境',
    label: '多品項分派（F3 經典）',
    hint: '荔枝 6/18 寄、百香果 6/20 後寄、帝王芭樂 10 顆裝 + 電聯 → 應分派到各子單',
    data: {
      masterOrderId: 12345,
      masterOrderNo: '26052584100',
      orderDate: '2026-05-25',
      rawRemark:
        '荔枝請於6/18寄出，百香果6/20後再寄出，帝王芭樂給10顆裝。收件人上班日18:00後在家，可先電聯',
      carrierLeadDays: 1,
      items: [
        { orderId: 88001, subOrderNo: '260525841010', farm: '蕭家黑葉荔枝園', productName: '黑葉荔枝', spec: '1盒(5斤裝)', qty: 1, tempLayer: '冷藏', defaultShipWindow: W },
        { orderId: 88002, subOrderNo: '260525841020', farm: '吉食百香果園', productName: '百香果', spec: '1箱(大果4斤裝)', qty: 1, tempLayer: '常溫', defaultShipWindow: W },
        { orderId: 88003, subOrderNo: '260525841030', farm: '阿明芭樂園', productName: '帝王芭樂', spec: '1盒(中果5斤裝)', qty: 1, tempLayer: '常溫', defaultShipWindow: W },
      ],
    },
  },
  {
    key: 'date',
    group: '基本情境',
    label: '純日期（不可收貨+指定出貨）',
    hint: '「6/7–6/11不收貨，請於6/12出貨（管理員代收）」→ blockedDates + forcedShipDate + driverRemark',
    data: {
      masterOrderId: 22001,
      masterOrderNo: '26052584101',
      orderDate: '2026-05-25',
      rawRemark: '6/7-6/11不收貨，請於6/12出貨 (管理員代收)',
      carrierLeadDays: 1,
      items: [
        { orderId: 88101, subOrderNo: '260525841011', farm: '鐵人果園', productName: '玉荷包荔枝', spec: '1盒(5斤裝)', qty: 2, tempLayer: '冷藏', defaultShipWindow: ['06/05', '06/18'] },
      ],
    },
  },
  {
    key: 'arrival',
    group: '基本情境',
    label: '到貨日反推（carrierLeadDays）',
    hint: '「最快6/6可收貨，晚一點寄」→ 依到貨天數反推、6/6 前標不可出貨',
    data: {
      masterOrderId: 23001,
      masterOrderNo: '26052584102',
      orderDate: '2026-05-25',
      rawRemark: '過兩天要出國6/6才回國，最快6/6可收貨，再麻煩晚一點寄出。收件人上班，下午5點後配送',
      carrierLeadDays: 2,
      items: [
        { orderId: 88201, subOrderNo: '260525841021', farm: '冬陽芒果農場', productName: '夏雪芒果', spec: '1盒(精品大果)', qty: 1, tempLayer: '冷藏', defaultShipWindow: ['06/05', '06/18'] },
      ],
    },
  },
  {
    key: 'fuzzy',
    group: '基本情境',
    label: '語意模糊（預期低信心）',
    hint: '「中秋前後看情況，盡量早點但不要太早，家裡有人再說」→ 應標 needsHuman / 低信心',
    data: {
      masterOrderId: 24001,
      masterOrderNo: '26070185201',
      orderDate: '2026-07-01',
      rawRemark: '中秋前後看情況，盡量早點但不要太早，家裡有人再說。電話不通改撥 0912-987-654',
      carrierLeadDays: 1,
      items: [
        { orderId: 88301, subOrderNo: '260701852011', farm: '冠軍文旦園', productName: '中秋嚴選【麻豆文旦】冠軍文旦園', spec: '1箱(9台斤)', qty: 1, tempLayer: '常溫', defaultShipWindow: ['06/09', '06/22'] },
      ],
    },
  },
  {
    key: 'mismatch',
    group: '基本情境',
    label: '講到但對不上子單（需人工）',
    hint: '備註提到「荔枝、百香果」，但本母單只有芒果 → needsHuman=true',
    data: {
      masterOrderId: 25001,
      masterOrderNo: '26060985101',
      orderDate: '2026-06-09',
      rawRemark: '荔枝請於6/18寄出，百香果請於6/20後再寄出，最晚6/30到貨，6/30後家中無人',
      carrierLeadDays: 1,
      items: [
        { orderId: 88401, subOrderNo: '260609851010', farm: '冬陽芒果農場', productName: '夏雪芒果', spec: '1盒(精品大果)', qty: 1, tempLayer: '冷藏', defaultShipWindow: W },
      ],
    },
  },
  {
    key: 'empty',
    group: '基本情境',
    label: '空白備註（企業匯單）',
    hint: 'rawRemark 空白 → farmerRemark / driverRemark 應為空、blockedDates 空、高信心',
    data: {
      masterOrderId: 26001,
      masterOrderNo: '26061587101',
      orderDate: '2026-06-15',
      rawRemark: '',
      carrierLeadDays: 1,
      items: [
        { orderId: 88501, subOrderNo: '260615711010', farm: '冠軍文旦園', productName: '711【統一專用】麻豆文旦 (9台斤/箱)', spec: '1箱(9台斤)', qty: 20, tempLayer: '常溫', defaultShipWindow: ['06/05', '06/18'] },
      ],
    },
  },

  // ── 口語特殊情境（0716-33 補充） ──────────────────────
  {
    key: 'rel-week',
    group: '口語特殊情境',
    label: '相對日期（下禮拜一）',
    hint: '「下禮拜一以後再出～感恩🥲」→ 需依 orderDate 換算；本週 blockedDates',
    data: one('這禮拜都不方便捏🥲 下禮拜一以後再幫我出好嗎～感恩喔', { orderDate: '2026-06-08', window: ['06/08', '06/21'] }),
  },
  {
    key: 'festival',
    group: '口語特殊情境',
    label: '節慶農曆（端午前）',
    hint: '「端午節前一定要收到」→ 節慶對西曆(需假日表)、到貨反推；查不到→needsHuman',
    data: one('端午節前一定要收到喔！不然拜拜來不及', { orderDate: '2026-06-05', window: ['06/10', '06/23'] }),
  },
  {
    key: 'birthday',
    group: '口語特殊情境',
    label: '指定當天到（生日驚喜）',
    hint: '「我媽6/15生日想當天收到」→ forcedShipDate=6/15反推；情感字濾掉',
    data: one('我媽6/15生日，想讓她當天收到當驚喜，拜託準時🙏', { orderDate: '2026-06-05', window: ['06/08', '06/21'] }),
  },
  {
    key: 'conflict-ok',
    group: '口語特殊情境',
    label: '可解衝突（指定日+當天不在）',
    hint: '「6/20一定到，但那天上班放管理室」→ forcedShipDate 6/20 + driverRemark；不要把6/20塞blockedDates',
    data: one('6/20那天一定要到，但那天我白天要上班可能不在，放管理室也可以啦', { orderDate: '2026-06-10', window: ['06/12', '06/25'] }),
  },
  {
    key: 'condition',
    group: '口語特殊情境',
    label: '模糊條件（不趕）',
    hint: '「來得及就這週，不然下週，不趕」→ 無明確日期，低信心/needsHuman',
    data: one('如果這禮拜來得及就這禮拜，來不及就下禮拜再說啦，不趕', { orderDate: '2026-06-08', window: ['06/08', '06/21'] }),
  },
  {
    key: 'ship-vs-arrive',
    group: '口語特殊情境',
    label: '出貨vs到貨（客人澄清）',
    hint: '「6/10這天出、不是到」→ forcedShipDate=6/10 直接當出貨日、不反推',
    data: one("麻煩6/10這天『出』喔，是出貨不是到貨，不要又提早", { orderDate: '2026-06-05', window: ['06/05', '06/18'] }),
  },
  {
    key: 'dialect',
    group: '口語特殊情境',
    label: '台語注音錯字',
    hint: '「麥賣ㄊㄞˋ早寄，拜五ㄟ工收」＝不要太早寄、週五才能收 → blockedDates 週五前',
    data: one('麥賣ㄊㄞˋ早寄啦，等我拜五休假ㄟ工收，感謝啦', { orderDate: '2026-06-08', product: '荔枝季【玉荷包荔枝】鐵人夫婦 1盒(5斤裝)', farm: '鐵人果園', spec: '1盒(5斤裝)', temp: '冷藏', window: ['06/08', '06/21'] }),
  },
  {
    key: 'delivery-only',
    group: '口語特殊情境',
    label: '純配送無日期',
    hint: '「警衛代收、晚上6點後電聯」→ 全進 driverRemark；日期欄皆空',
    data: one('警衛室代收，大樓白天沒人，晚上六點後打這支 0912-345-678 找我', { orderDate: '2026-06-05', window: ['06/05', '06/18'] }),
  },
  {
    key: 'gift',
    group: '口語特殊情境',
    label: '送禮保密卡片',
    hint: '「送人的、別露金額、卡片寫生日快樂、匿名」→ 屬送禮呈現(F4 §5)、非出貨判定；可能needsHuman',
    data: one('這是要送人的，金額不要露出來，卡片幫我寫「生日快樂」，不要讓對方知道是我送的', { orderDate: '2026-06-05', window: ['06/05', '06/18'] }),
  },
  {
    key: 'long-noisy',
    group: '口語特殊情境',
    label: '超長情緒多意圖',
    hint: '出差(blockedDates)+搬三樓(driverRemark)+不要太熟(farmerRemark)+emoji噪音 → 考拆分',
    data: one('欸不好意思啦我知道很麻煩🙏 就是我下禮拜二三要出差不在家，然後我媽腳不方便沒辦法搬，可以麻煩司機幫忙搬到三樓嗎？還有水果不要太熟先不要放太久喔，謝謝你們人超好的❤️❤️', { orderDate: '2026-06-10', window: ['06/12', '06/25'] }),
  },

  // ── 多品項壓測（跨子單協調 / 超長備註 + 錯字） ────────
  {
    key: 'mango-weekly',
    group: '多品項壓測',
    label: '多種芒果·每週只出一種',
    hint: '3 種芒果指定「一週只出一種、不要同週出兩種」→ 跨子單錯開週次（shiftSteps 0/1/2）',
    data: {
      masterOrderId: 31001,
      masterOrderNo: '26061590101',
      orderDate: '2026-06-15',
      rawRemark: '訂了三種芒果，麻煩一週只出一種，不要同一週出兩種喔，錯開分開寄，感謝！',
      carrierLeadDays: 1,
      items: [
        { orderId: 89001, subOrderNo: '260615901010', farm: '冬陽芒果農場', productName: '芒果季【愛文芒果】冬陽農場', spec: '1盒(精品大果)', qty: 1, tempLayer: '冷藏', defaultShipWindow: ['06/16', '06/29'] },
        { orderId: 89002, subOrderNo: '260615901020', farm: '冬陽芒果農場', productName: '芒果季【金煌芒果】冬陽農場', spec: '1盒(精品大果)', qty: 1, tempLayer: '冷藏', defaultShipWindow: ['06/16', '06/29'] },
        { orderId: 89003, subOrderNo: '260615901030', farm: '冬陽芒果農場', productName: '芒果季【夏雪芒果】冬陽農場', spec: '1盒(精品大果)', qty: 1, tempLayer: '冷藏', defaultShipWindow: ['06/16', '06/29'] },
      ],
    },
  },
  {
    key: 'mega-long',
    group: '多品項壓測',
    label: '超長備註·多水果+錯字',
    hint: '5 種水果各別需求＋出貨/收貨/送禮/電聯＋錯字（記出、在寄、勿必…）→ 逐子單分派、濾噪音、抗錯字',
    data: {
      masterOrderId: 32001,
      masterOrderNo: '26061590201',
      orderDate: '2026-06-15',
      rawRemark:
        '你好～這次訂比較多不好意思🙏 荔枝的部分請一定要6/18當天記出不要提早不然會壞掉；百香果我要放熟一點所以請6/22以後在寄最晚6/30到就好；愛文芒果那箱是要送我婆婆的麻煩挑漂亮一點然後卡片寫母親節快樂喔(雖然過了哈哈)金額不要露出來；金煌芒果不要跟愛文放一起寄分開兩箱；文旦先不用急放到中秋前在說。另外我禮拜二三四都要上班家裡沒人只有週一週五跟假日可以收，芒果那箱可以放管理室但荔枝勿必親簽因為很貴。司機大哥電話打不通請改打我先生0912-666-888，辛苦了❤️❤️',
      carrierLeadDays: 1,
      items: [
        { orderId: 89101, subOrderNo: '260615902010', farm: '鐵人果園', productName: '荔枝季【玉荷包荔枝】鐵人夫婦', spec: '1盒(5斤裝)', qty: 1, tempLayer: '冷藏', defaultShipWindow: ['06/16', '06/29'] },
        { orderId: 89102, subOrderNo: '260615902020', farm: '吉食百香果園', productName: '團購【都香3號百香果】吉食鮮果', spec: '1箱(大果4斤裝)', qty: 1, tempLayer: '常溫', defaultShipWindow: ['06/16', '06/29'] },
        { orderId: 89103, subOrderNo: '260615902030', farm: '冬陽芒果農場', productName: '芒果季【愛文芒果】冬陽農場', spec: '1盒(精品大果)', qty: 1, tempLayer: '冷藏', defaultShipWindow: ['06/16', '06/29'] },
        { orderId: 89104, subOrderNo: '260615902040', farm: '冬陽芒果農場', productName: '芒果季【金煌芒果】冬陽農場', spec: '1盒(精品大果)', qty: 1, tempLayer: '冷藏', defaultShipWindow: ['06/16', '06/29'] },
        { orderId: 89105, subOrderNo: '260615902050', farm: '冠軍文旦園', productName: '中秋嚴選【麻豆文旦】冠軍文旦園', spec: '1箱(9台斤)', qty: 1, tempLayer: '常溫', defaultShipWindow: ['09/01', '09/14'] },
      ],
    },
  },

  // ── 極端 noise（判不出來就別硬猜） ────────────────────
  {
    key: 'noise-emoji',
    group: '極端 noise',
    label: 'noise：只有 emoji',
    hint: '「🍋🍋🍋👍」→ 無意義，三欄空、不要亂填日期',
    data: one('🍋🍋🍋👍', { orderDate: '2026-06-15', window: W }),
  },
  {
    key: 'noise-history',
    group: '極端 noise',
    label: 'noise：參照上次',
    hint: '「跟我上次那張一樣就好」→ 系統看不到「上次」→ needsHuman',
    data: one('跟我上次那張一樣就好', { orderDate: '2026-06-15', window: W }),
  },
  {
    key: 'noise-vague',
    group: '極端 noise',
    label: 'noise：你們決定',
    hint: '「都可以啦你們決定就好，越快越好」→ 無明確日期，維持預設、中低信心',
    data: one('都可以啦你們決定就好，越快越好', { orderDate: '2026-06-15', window: W }),
  },
  {
    key: 'noise-garbage',
    group: '極端 noise',
    label: 'noise：亂碼測試字',
    hint: '「測試 aaa 123 ㄎㄎ」→ 無意義、needsHuman 或忽略',
    data: one('測試 aaa 123 ㄎㄎ', { orderDate: '2026-06-15', window: W }),
  },
  {
    key: 'noise-phone',
    group: '極端 noise',
    label: 'noise：只寫電話',
    hint: '「0912345678」→ 只有號碼無指示 → driverRemark 聯絡 或 needsHuman',
    data: one('0912345678', { orderDate: '2026-06-15', window: W }),
  },
]

// 空白母單（完全從零手刻）
export function blankMaster(): MasterInput {
  return {
    masterOrderId: 0,
    masterOrderNo: '',
    orderDate: '2026-06-16',
    rawRemark: '',
    carrierLeadDays: 1,
    items: [
      { orderId: 0, subOrderNo: '', farm: '', productName: '', spec: '', qty: 1, tempLayer: '常溫', defaultShipWindow: W },
    ],
  }
}

export function blankItem(): MasterInput['items'][number] {
  return { orderId: 0, subOrderNo: '', farm: '', productName: '', spec: '', qty: 1, tempLayer: '常溫', defaultShipWindow: ['06/16', '06/29'] }
}
