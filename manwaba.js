/** @type {import('./_venera_.js')} */
class ManWaBa extends ComicSource {
    // ============================================
    // 漫画源基本信息
    // ============================================
    name = "漫蛙吧"
    key = "manwaba"
    version = "1.0.7"
    minAppVersion = "1.6.0"
    url = "https://cdn.jsdelivr.net/gh/amenoshigure/venera-sources@main/manwaba.js"

    // ============================================
    // 基础 URL
    // ============================================
    baseUrl = "https://manwa.me"

    // ============================================
    // 请求头
    // ============================================
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

    // ============================================
    // 工具函数
    // ============================================
    safeString = (value) => {
        return value?.trim() || ""
    }

    safeId = (href) => {
        if (!href) return ""
        const parts = href.split("/")
        return parts[parts.length - 1] || ""
    }

    // ============================================
    // 从搜索结果页面解析漫画 - 根据实际HTML结构
    // ============================================
    parseSearchResult = (item) => {
        // 获取链接
        const link = item.querySelector("a[href^='/book/']")
        const href = link?.attributes?.href || ""
        const id = this.safeId(href)
        
        // 获取标题
        const title = this.safeString(item.querySelector(".book-list-info-title")?.text)
        
        // 获取封面
        const img = item.querySelector(".book-list-cover-img")
        const cover = img?.attributes?.["data-original"] || img?.attributes?.src || ""
        
        // 获取作者
        const authorElem = item.querySelector(".book-list-info-bottom-item")
        const author = authorElem?.text?.replace("作者：", "").trim() || ""
        
        // 获取状态
        const statusElem = item.querySelector(".book-list-info-bottom-right-font")
        const status = statusElem?.text?.trim() || ""
        
        // 获取简介
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
            // TODO: 首页结构需要进一步分析
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
            // TODO: 需要分析分类页面的 HTML 结构
            return { comics: [], maxPage: 1 }
        }
    }

    // ============================================
    // 漫画详情
    // ============================================
    comic = {
        loadInfo: async (id) => {
            if (!id) throw "漫画ID不能为空"
            
            const url = `${this.baseUrl}/book/${id}`
            const res = await this.requestGet(url, url)
            if (res.status !== 200) throw `详情页请求失败: ${res.status}`

            const doc = new HtmlDocument(res.body)
            
            // 提取标题
            const title = doc.querySelector(".book-list-info-title")?.text?.trim() || 
                          doc.querySelector(".page-title")?.text?.trim() || 
                          id
            // 提取封面
            const cover = doc.querySelector(".book-list-cover-img")?.attributes?.["data-original"] || 
                          doc.querySelector(".book-cover-img")?.attributes?.src || 
                          ""
            // 提取简介
            const description = doc.querySelector(".book-list-info-desc")?.text?.trim() || ""
            // 提取作者
            const authorElem = doc.querySelector(".book-list-info-bottom-item")
            const author = authorElem?.text?.replace("作者：", "").trim() || ""

            // 提取章节列表
            const chapters = {}
            const chapterItems = doc.querySelectorAll(".chapter-list li, .chapters a, .list a")
            for (const item of chapterItems) {
                const href = item.attributes?.href || ""
                const cid = this.safeId(href)
                const name = item.text?.trim() || ""
                if (cid && name) {
                    chapters[cid] = name
                }
            }

            doc.dispose()

            return new ComicDetails({
                title: title,
                cover: cover,
                description: description,
                subTitle: author,
                chapters: chapters,
                url: url
            })
        },

        loadEp: async (comicId, epId) => {
            if (!comicId || !epId) throw "参数不能为空"
            
            const url = `${this.baseUrl}/read/${comicId}/${epId}`
            const res = await this.requestGet(url, `${this.baseUrl}/book/${comicId}`)
            if (res.status !== 200) throw `阅读页请求失败: ${res.status}`

            const doc = new HtmlDocument(res.body)
            const images = []
            for (const img of doc.querySelectorAll("img")) {
                const src = img.attributes?.src || ""
                if (src && !src.includes("logo") && !src.includes("icon") && !src.includes("avatar") && !src.includes("favicon")) {
                    images.push(src)
                }
            }
            doc.dispose()

            if (images.length === 0) {
                throw "本章未找到任何图片"
            }
            return { images: images }
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
}
