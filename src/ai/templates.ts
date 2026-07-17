import type { MasterInput } from './types'

// 母單範本：涵蓋 F3 各判定情境（多品項分派 / 純日期 / 到貨日反推 / 語意模糊低信心 /
// 多品項對不上子單 / 空備註）。方便一鍵帶入後再手動改 rawRemark 試 AI 反應。

const W: [string, string] = ['06/16', '06/29'] // 共用預設出貨區間

export interface Template {
  key: string
  label: string
  hint: string
  data: MasterInput
}

export const TEMPLATES: Template[] = [
  {
    key: 'multi',
    label: '多品項分派（F3 經典案例）',
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
    label: '純日期（不可收貨 + 指定出貨）',
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
    label: '講到但對不上子單（預期需人工）',
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
