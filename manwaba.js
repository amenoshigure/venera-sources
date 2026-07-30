/** @type {import('./_venera_.js')} */
class ManWaBa extends ComicSource {
    name = "漫蛙吧"
    key = "manwaba"
    version = "1.0.20"
    minAppVersion = "1.6.0"
    url = "https://cdn.jsdelivr.net/gh/amenoshigure/venera-sources@main/manwaba.js"

    baseUrl = "https://manwa.me"
    imageBaseUrl = "https://mwappimgs.cc"

    getHeaders(referer = this.baseUrl) {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': referer,
            'Connection': 'keep-alive'
        }
    }

    toAbsoluteUrl = (url) => {
        if (!url) return ""
        if (typeof url !== 'string') return ""
        url = url.trim()
        if (!url) return ""
        if (url.startsWith('https://')) return url
        if (url.startsWith('http://')) return url.replace('http://', 'https://')
        if (url.startsWith('//')) return `https:${url}`
        const base = this.imageBaseUrl.endsWith('/') ? this.imageBaseUrl.slice(0, -1) : this.imageBaseUrl
        const path = url.startsWith('/') ? url : `/${url}`
        return `${base}${path}`
    }

    async requestGet(url, referer = this.baseUrl) {
        const fullUrl = this.toAbsoluteUrl(url)
        return await Network.get(fullUrl, {
            headers: this.getHeaders(referer),
            timeout: 30000
        })
    }

    safeString = (value) => {
        return value?.trim() || ""
    }

    safeId = (href) => {
        if (!href) return ""
        const parts = href.split("/")
        return parts[parts.length - 1] || ""
    }

    // ============================================
    // 从搜索结果页面解析漫画
    // ============================================
    parseSearchResult = (item) => {
        const link = item.querySelector("a[href^='/book/']")
        const href = link?.attributes?.href || ""
        let id = this.safeId(href)
        id = `mw_${id}`
        
        const title = this.safeString(item.querySelector(".book-list-info-title")?.text)
        const img = item.querySelector(".book-list-cover-img")
        let cover = img?.attributes?.["data-original"] || img?.attributes?.src || ""
        cover = this.toAbsoluteUrl(cover)
        
        const authorElem = item.querySelector(".book-list-info-bottom-item")
        const author = authorElem?.text?.replace("作者：", "").trim() || ""
        const statusElem = item.querySelector(".book-list-info-bottom-right-font")
        const status = statusElem?.text?.trim() || ""
        const desc = this.safeString(item.querySelector(".book-list-info-desc")?.text)

        return {
            id: id,
            title: title,
            cover: cover,
            subTitle: author,
            description: desc || status,
            tags: [status]
        }
    }

    // ============================================
    // 搜索
    // ============================================
    search = {
        load: async (keyword, options, page) => {
            const url = `${this.baseUrl}/search?keyword=${encodeURIComponent(keyword)}&page=${page || 1}`
            const res = await this.requestGet(url, `${this.baseUrl}/search`)
            
            if (res.status !== 200) {
                throw `搜索页面请求失败: ${res.status}`
            }

            const doc = new HtmlDocument(res.body)
            const items = doc.querySelectorAll("ul.book-list li")
            const comics = []

            for (const item of items) {
                const comic = this.parseSearchResult(item)
                if (comic.id && comic.title) {
                    comics.push(comic)
                }
            }
            
            doc.dispose()
            return { comics: comics, maxPage: 1 }
        }
    }

    // ============================================
    // 发现页（首页）
    // ============================================
    explore = [{
        title: "漫蛙吧",
        type: "singlePageWithMultiPart",
        load: async () => {
            const res = await this.requestGet(this.baseUrl)
            if (res.status !== 200) throw `主页请求失败: ${res.status}`
            const doc = new HtmlDocument(res.body)
            doc.dispose()
            return {}
        }
    }]

    // ============================================
    // 分类页
    // ============================================
    category = {
        title: "分类浏览",
        parts: [{
            name: "分类",
            type: "fixed",
            categories: ["全部", "热血", "玄幻", "恋爱", "冒险", "古风", "都市", "穿越", "奇幻", "搞笑", "战斗", "重生", "逆袭", "BL", "韩漫"],
            categoryParams: ["", "热血", "玄幻", "恋爱", "冒险", "古风", "都市", "穿越", "奇幻", "搞笑", "战斗", "重生", "逆袭", "BL", "韩漫"],
            itemType: "category"
        }]
    }

    // ============================================
    // 分类漫画加载
    // ============================================
    categoryComics = {
        load: async (category, param, options, page) => {
            let url = `${this.baseUrl}/booklist`
            if (category && category !== "全部" && category !== "") {
                url = `${this.baseUrl}/booklist?category=${encodeURIComponent(category)}`
            }
            if (page && page > 1) {
                url += (url.includes('?') ? '&' : '?') + `page=${page}`
            }
            
            try {
                const res = await this.requestGet(url, this.baseUrl)
                if (res.status !== 200) throw `分类页面请求失败: ${res.status}`

                const doc = new HtmlDocument(res.body)
                const items = doc.querySelectorAll("ul.book-list li, .book-item, .comic-item")
                const comics = []

                for (const item of items) {
                    const link = item.querySelector("a[href^='/book/']")
                    const href = link?.attributes?.href || ""
                    let id = href.split("/").pop() || ""
                    id = `mw_${id}`
                    
                    const title = item.querySelector(".book-title, .comic-title, .name")?.text?.trim() || ""
                    const img = item.querySelector("img")
                    let cover = img?.attributes?.["data-original"] || img?.attributes?.src || ""
                    cover = this.toAbsoluteUrl(cover)
                    
                    if (id && title) {
                        comics.push({
                            id: id,
                            title: title,
                            cover: cover,
                            subTitle: "",
                            description: "",
                            tags: []
                        })
                    }
                }
                
                doc.dispose()
                
                let maxPage = 1
                const pageLinks = doc.querySelectorAll(".pagination a, .page-list a")
                for (const link of pageLinks) {
                    const text = link.text?.trim() || ""
                    const num = parseInt(text)
                    if (!isNaN(num) && num > maxPage) {
                        maxPage = num
                    }
                }
                
                return { comics: comics, maxPage: maxPage }
            } catch (e) {
                return { comics: [], maxPage: 1 }
            }
        }
    }

    // ============================================
    // 漫画详情 - 修复标题提取
    // ============================================
    comic = {
       loadInfo: async (id) => {
    if (!id) throw "漫画ID不能为空"
    
    const realId = id.replace(/^mw_/, '')
    const url = `${this.baseUrl}/book/${realId}`
    const res = await this.requestGet(url, url)
    if (res.status !== 200) throw `详情页请求失败: ${res.status}`

    const doc = new HtmlDocument(res.body)
    
    // ✅ 从Vue渲染的HTML中提取标题
    // 方法1：从 meta 标签提取
    let title = doc.querySelector('meta[property="og:title"]')?.attributes?.content || ""
    
    // 方法2：从 title 标签提取（但需要过滤掉网站名称）
    if (!title) {
        const titleRaw = doc.querySelector("title")?.text || ""
        // 取 "-" 之前的部分
        title = titleRaw.split("-")[0]?.trim() || ""
    }
    
    // 方法3：从 h1 或 .title 提取
    if (!title) {
        title = doc.querySelector("h1")?.text?.trim() || ""
    }
    
    // 如果还是没找到，使用ID
    if (!title) {
        title = realId
    }
    
    // 提取作者
    const authorElem = doc.querySelector(".detail-main-info-author")
    const author = authorElem?.text?.replace("作者：", "").trim() || "未知"
    
    // 提取状态
    const statusElem = doc.querySelector(".detail-main-info-status")
    const status = statusElem?.text?.replace("更新状态：", "").trim() || "连载中"
    
    // 提取最新章节信息
    const chapterElem = doc.querySelector(".detail-main-info-chapter")
    const lastChapter = chapterElem?.text?.replace("最新章节：", "").trim() || ""

    // 提取封面
    let cover = doc.querySelector(".book-cover-img")?.attributes?.src || 
                doc.querySelector(".detail-cover-img")?.attributes?.src ||
                doc.querySelector("img[alt*='封面']")?.attributes?.src ||
                ""
    cover = this.toAbsoluteUrl(cover)

    // 提取章节列表
    const chapters = {}
    
    // 从Vue渲染的章节列表提取
    const chapterLinks = doc.querySelectorAll(".detail-list-1 a, .chapterlist a, .chapter-item a, .chapter-link, .chapter-list a, .detail-list-select a, a[href^='/chapter/']")
    for (const item of chapterLinks) {
        const href = item.attributes?.href || ""
        // 从 /chapter/31440179 提取 31440179
        const cid = href.split("/").pop() || ""
        const name = item.text?.trim() || ""
        if (cid && name && !isNaN(cid) && cid.length > 0) {
            chapters[cid] = name
        }
    }

    // 如果上面的方法没有找到，尝试从最新章节链接提取
    if (Object.keys(chapters).length === 0) {
        const chapterLink = doc.querySelector(".detail-main-info-chapter a")
        if (chapterLink) {
            const href = chapterLink.attributes?.href || ""
            const cid = href.split("/").pop() || ""
            if (cid && !isNaN(cid) && cid.length > 0) {
                chapters[cid] = lastChapter || "第1话"
            }
        }
    }

    // 如果还是没找到，使用漫画ID作为章节ID（临时方案）
    if (Object.keys(chapters).length === 0) {
        chapters[realId] = lastChapter || "第1话"
    }

    doc.dispose()

    return new ComicDetails({
        title: title,
        cover: cover,
        description: `状态：${status}，最新章节：${lastChapter}`,
        subTitle: author,
        tags: {
            "作者": [author],
            "状态": [status]
        },
        chapters: chapters,
        url: url
    })
}
