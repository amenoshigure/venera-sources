/** @type {import('./_venera_.js')} */
class ManWaBa extends ComicSource {
    name = "漫蛙吧"
    key = "manwaba"
    version = "1.0.8"
    minAppVersion = "1.6.0"
    url = "https://cdn.jsdelivr.net/gh/amenoshigure/venera-sources@main/manwaba.js"

    baseUrl = "https://manwa.me"

    getHeaders(referer = this.baseUrl) {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': referer,
            'Connection': 'keep-alive'
        }
    }

    async requestGet(url, referer = this.baseUrl) {
        return await Network.get(url, {
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

    parseSearchResult = (item) => {
        const link = item.querySelector("a[href^='/book/']")
        const href = link?.attributes?.href || ""
        const id = this.safeId(href)
        
        const title = this.safeString(item.querySelector(".book-list-info-title")?.text)
        const img = item.querySelector(".book-list-cover-img")
        const cover = img?.attributes?.["data-original"] || img?.attributes?.src || ""
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

    categoryComics = {
        load: async (category, param, options, page) => {
            return { comics: [], maxPage: 1 }
        }
    }

comic = {
    loadInfo: async (id) => {
        if (!id) throw "漫画ID不能为空"
        
        const url = `${this.baseUrl}/book/${id}`
        const res = await this.requestGet(url, url)
        if (res.status !== 200) throw `详情页请求失败: ${res.status}`

        const doc = new HtmlDocument(res.body)
        
        const titleRaw = doc.querySelector("title")?.text || ""
        const title = titleRaw.replace(/-漫蛙漫画.*$/, "").trim() || id
        
        const authorElem = doc.querySelector(".detail-main-info-author")
        const author = authorElem?.text?.replace("作者：", "").trim() || "未知"
        
        const statusElem = doc.querySelector(".detail-main-info-status")
        const status = statusElem?.text?.replace("更新状态：", "").trim() || "连载中"
        
        const chapterElem = doc.querySelector(".detail-main-info-chapter")
        const lastChapter = chapterElem?.text?.replace("最新章节：", "").trim() || ""

        const cover = doc.querySelector(".book-cover-img")?.attributes?.src || 
                      doc.querySelector("img[alt*='记忆万物']")?.attributes?.src || 
                      ""

        doc.dispose()

        // 创建占位章节
        const chapters = {}
        chapters["1"] = lastChapter || "第1话"

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
    },

    loadEp: async (comicId, epId) => {
        if (!comicId || !epId) {
            throw "漫画ID或章节ID不能为空"
        }
        
        const url = `${this.baseUrl}/read/${comicId}/${epId}`
        const res = await this.requestGet(url, `${this.baseUrl}/book/${comicId}`)
        if (res.status !== 200) throw `阅读页请求失败: ${res.status}`

        const doc = new HtmlDocument(res.body)
        const images = []
        for (const img of doc.querySelectorAll("img")) {
            const src = img.attributes?.src || ""
            if (src && 
                typeof src === 'string' && 
                src.length > 0 &&
                !src.includes("logo") && 
                !src.includes("icon") && 
                !src.includes("avatar") && 
                !src.includes("favicon") &&
                !src.includes("loading") &&
                !src.includes("blank")) {
                images.push(src)
            }
        }
        doc.dispose()

        if (images.length === 0) {
            throw "本章未找到任何图片"
        }
        
        return { 
            images: images.filter(img => img != null && img.length > 0)
        }
    },

    onImageLoad: (url, comicId, epId) => {
        return {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': `${this.baseUrl}/read/${comicId}/${epId}`,
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
            }
        }
    }
}
