import type { Order } from '../types'

/**
 * 顯示／分區用的商品名：優先用 AI 清洗後的品種名 `variety`，退回原始 `productName`。
 * 原始品名帶行銷前綴（中秋嚴選【…】…），拿來分區會把同一種水果拆成好幾組。
 *
 * ⚠️ 抽出來共用的理由是**需出貨頁的品項篩選必須和分區用的是同一把 key**：
 * 兩邊只要有一邊改了取名規則，篩了某個品項卻篩出空清單（或篩出兩組），
 * 而且不會有任何錯誤——只會安靜地少一批單。所以這裡是唯一來源。
 *
 * 目前的消費者：ProductGroupList（分區）／EnterpriseGroupList（分區）／ProductFilter（篩選）。
 * ⚠️ 另有四處同一行的複本尚未收：ListFilter.tsx、UnshippedPreview.tsx、utils/shipDate.ts。
 * 那三處服務的是別的頁面，改動要各自驗證，沒有跟著一起換。
 */
export const productKey = (o: Order) => (o.variety && o.variety.trim()) || o.productName
