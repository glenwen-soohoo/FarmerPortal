import type { Product } from '../types'

// 模擬「商品↔農友綁定」現況：直送商品多半未綁（對齊真實資料缺口）
export const seedProducts: Product[] = [
  { id: 'p1', name: '玉荷包荔枝', spec: '1盒(5斤裝)', isTransform: true, boundFarmerId: 1 },
  { id: 'p2', name: '玉荷包荔枝', spec: '1盒(3斤裝)', isTransform: true },
  { id: 'p3', name: '黑葉荔枝', spec: '1盒(5斤裝)', isTransform: true },
  { id: 'p4', name: '帝王芭樂', spec: '1盒(中果5斤裝)', isTransform: true },
  { id: 'p5', name: '夏雪芒果', spec: '1盒(精品大果)', isTransform: true },
  { id: 'p6', name: '百香果', spec: '1箱(大果4斤裝)', isTransform: true },
  { id: 'p7', name: '有機紅鬚玉米筍', spec: '1箱(4斤裝)', isTransform: true },
  { id: 'p8', name: '常溫綜合禮盒', spec: '1盒', isTransform: false, boundFarmerId: 1 },
]
