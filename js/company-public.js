/* 已并入 storefront.html（2026-10-29）。
   原本这里渲染「对外公开的公司主页」：publicProfile() 白名单 + 公开证书 + 团队，
   外加一句指向店铺主页的链接——也就是它自己承认是店铺主页的子集。
   这三块内容 storefront.html 都已覆盖（同一套 SupplierData.publicProfile() /
   publicCertificates() 与 SupplierDisplay），因此对外只保留店铺主页一个地址。
   本文件不再被任何页面加载，保留空壳只是让人顺着旧引用能找到去处。 */
