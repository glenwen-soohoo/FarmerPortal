import type { Farmer } from '../types'

export const seedFarmers: Farmer[] = [
  {
    id: 1, name: '陳鐵人', farm: '鐵人果園', phone: '0922000111', status: '已開通', lastLogin: '2026-06-29 08:10', earlyShipAllowed: true,
    brand: '鐵人夫婦', origin: '花蓮縣瑞穗鄉', cert: '產銷履歷 TAP', bank: '822 中國信託 ****3210', lineId: '@ironfarm',
  },
  {
    id: 2, name: '蔣文良', farm: '蔣蔣果園', phone: '0922000222', status: '未開通',
    brand: '蔣蔣', origin: '台南市玉井區', cert: '有機轉型期', bank: '004 台灣銀行 ****7788', lineId: '@jjfarm',
  },
  {
    id: 3, name: '蕭美惠', farm: '蕭家黑葉荔枝園', phone: '0922000333', status: '未開通',
    brand: '蕭家', origin: '高雄市大樹區', cert: '產銷履歷 TAP', bank: '808 玉山銀行 ****1234', lineId: '@hsiao_litchi',
  },
  {
    id: 4, name: '林冬陽', farm: '冬陽芒果農場', phone: '0922000444', status: '已停用', lastLogin: '2022-04-16 03:54',
    brand: '冬陽', origin: '屏東縣枋山鄉', cert: '吉園圃', bank: '700 郵局 ****5566', lineId: '@dongyang',
  },
  {
    id: 5, name: '吳吉食', farm: '吉食百香果園', phone: '0922000555', status: '未開通',
    brand: '吉食鮮果', origin: '南投縣埔里鎮', cert: '產銷履歷 TAP', bank: '806 元大銀行 ****9900', lineId: '@jishi',
  },
]
