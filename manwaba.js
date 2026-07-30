/** @type {import('./_venera_.js')} */
class ManWaBa extends ComicSource {
    name = "漫蛙吧"
    key = "manwaba_nocover"  // 全新key
    version = "1.0.25"
    minAppVersion = "1.6.0"
    url = "https://cdn.jsdelivr.net/gh/amenoshigure/venera-sources@main/manwaba.js"

    baseUrl = "https://manwa.me"
    imageBaseUrl = "https://mwappimgs.cc"

    // ... getHeaders, toAbsoluteUrl, requestGet, safeString, safeId 保持不变 ...

    // ============================================
    // 从搜索结果页面解析漫画 - 不返回封面
    // ============================================
    parseSearchResult = (item) => {
        const link = item.querySelector("a[href^='/book/']")
        const href = link?.attributes?.href || ""
        const baseId = this.safeId(href)
        const id = `mw_${baseId}`
        
        const title = this.safeString(item.querySelector(".book-list-info-title")?.text)
        
        // ⚠️ 不返回封面，避免历史记录保存错误URL
        const cover = ""
        
        const authorElem = item.querySelector(".book-list-info-bottom-item")
        const author = authorElem?.text?.replace("作者：", "").trim() || ""
        const statusElem = item.querySelector(".book-list-info-bottom-right-font")
        const status = statusElem?.text?.trim() || ""
        const desc = this.safeString(item.querySelector(".book-list-info-desc")?.text)

        return {
            id: id,
            title: title,
            cover: cover,  // 空封面
            subTitle: author,
            description: desc || status,
            tags: [status]
        }
    }

    // ... search, explore, category, categoryComics 保持不变 ...

    comic = {
        loadInfo: async (id) => {
            if (!id) throw "漫画ID不能为空"
            
            const realId = id.replace(/^mw_/, '')
            const url = `${this.baseUrl}/book/${realId}`
            const res = await this.requestGet(url, url)
            if (res.status !== 200) throw `详情页请求失败: ${res.status}`

            const doc = new HtmlDocument(res.body)
            
            // 提取标题
            let title = doc.querySelector('meta[property="og:title"]')?.attributes?.content || ""
            if (!title) {
                const titleRaw = doc.querySelector("title")?.text || ""
                title = titleRaw.split("-")[0]?.trim() || ""
            }
            if (!title) {
                title = doc.querySelector("h1")?.text?.trim() || ""
            }
            if (!title) {
                title = realId
            }
            
            const authorElem = doc.querySelector(".detail-main-info-author")
            const author = authorElem?.text?.replace("作者：", "").trim() || "未知"
            
            const statusElem = doc.querySelector(".detail-main-info-status")
            const status = statusElem?.text?.replace("更新状态：", "").trim() || "连载中"
            
            const chapterElem = doc.querySelector(".detail-main-info-chapter")
            const lastChapter = chapterElem?.text?.replace("最新章节：", "").trim() || ""

            // ✅ 在详情页获取封面（只在这里获取）
            let cover = doc.querySelector(".book-cover-img")?.attributes?.src || 
                        doc.querySelector(".detail-cover-img")?.attributes?.src ||
                        doc.querySelector("img[alt*='封面']")?.attributes?.src ||
                        ""
            cover = this.toAbsoluteUrl(cover)

            // ... 提取章节列表 ...

            doc.dispose()

            return new ComicDetails({
                title: title,
                cover: cover,  // 详情页才有封面
                description: `状态：${status}，最新章节：${lastChapter}`,
                subTitle: author,
                tags: {
                    "作者": [author],
                    "状态": [status]
                },
                chapters: chapters,
                url: url
            })
        },

        // ... loadEp, onImageLoad 保持不变 ...
    }
}
