/**
 * 農友端跨頁共用的公司資訊。
 *
 * ⚠️ 這裡的值在後端也有一份：`FarmerPortal/Infrastructure/BlackCat/BlackCatConstants.cs`
 * 的 `SenderTel`（黑貓出貨單上的寄件人電話，本身又對齊 fruit_web 的 Constant）。
 * 改的時候兩邊都要改——農友手上那張出貨單印的是後端那份，畫面上顯示的是這份，
 * 兩者不一致會讓農友打到不同的號碼。後端那支已加註解指回這裡。
 *
 * 為什麼不從 API 取：這是十年不動一次的公開資訊，為它開一個端點不划算。
 * 用「兩邊互相指向的註解」換掉「多一層 API」是刻意的取捨。
 */

/** 公司電話（顯示用，加破折號斷讀）。後端 BlackCatConstants.SenderTel 是無格式的 '0227712900'。 */
export const COMPANY_TEL = '02-2771-2900'
