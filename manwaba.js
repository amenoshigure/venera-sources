/** @type {import('./_venera_.js')} */
class ManWaBa extends ComicSource {
    name = "漫蛙吧"
    key = "manwaba"
    version = "1.0.14"
    minAppVersion = "1.6.0"
    url = "https://cdn.jsdelivr.net/gh/amenoshigure/venera-sources@main/manwaba.js"

    baseUrl = "https://manwa.me"
    imageBaseUrl = "https://mwappimgs.cc"

    getHeaders(referer = this.baseUrl, extra = {}) {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,image/*,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': referer,
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'image',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'cross-site',
            ...extra
        }
    }

    // 图片请求专用Headers
    getImageHeaders(referer) {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': referer || this.baseUrl,
            'Sec-Fetch-Dest': 'image',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'cross-site'
        }
    }

    ensureFullUrl = (url, base = this.baseUrl) => {
        if (!url) return ""
        if (typeof url !== 'string') return ""
        url = url.trim()
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url
        }
        const baseUrl = base.endsWith('/') ? base.slice(0, -1) : base
        const path = url.startsWith('/') ? url : `/${url}`
        return `${baseUrl}${path}`
    }

    async requestGet(url, referer = this.baseUrl) {
        const fullUrl = this.ensureFullUrl(url, this.baseUrl)
        return await Network.get(fullUrl, {
            headers: this.getHeaders(referer),
            timeout: 30000
        })
    }

    // 专门用于图片请求
    async requestImage(url, referer) {
        const fullUrl = this.ensureFullUrl(url, this.imageBaseUrl)
        return await Network.get(fullUrl, {
            headers: this.getImageHeaders(referer || this.baseUrl),
            timeout: 60000,
            responseType: 'bytes'  // 获取二进制数据
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
        let cover = img?.attributes?.["data-original"] || img?.attributes?.src || ""
        cover = this.ensureFullUrl(cover, this.imageBaseUrl)
        
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
                    const id = href.split("/").pop() || ""
                    
                    const title = item.querySelector(".book-title, .comic-title, .name")?.text?.trim() || ""
                    const img = item.querySelector("img")
                    let cover = img?.attributes?.["data-original"] || img?.attributes?.src || ""
                    cover = this.ensureFullUrl(cover, this.imageBaseUrl)
                    
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

            let cover = doc.querySelector(".book-cover-img")?.attributes?.src || 
                        doc.querySelector("img[alt*='记忆万物']")?.attributes?.src || 
                        ""
            cover = this.ensureFullUrl(cover, this.imageBaseUrl)

            const chapters = {}
            
            const chapterLinks = doc.querySelectorAll(".detail-list-1 a, .chapterlist a, .chapter-item a, .chapter-link, .chapter-list a")
            for (const item of chapterLinks) {
                const href = item.attributes?.href || ""
                const cid = href.split("/").pop() || ""
                const name = item.text?.trim() || ""
                if (cid && name && !isNaN(cid) && cid.length > 0) {
                    chapters[cid] = name
                }
            }

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

            if (Object.keys(chapters).length === 0) {
                chapters[id] = lastChapter || "第1话"
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
        },

        loadEp: async (comicId, epId) => {
            if (!comicId || !epId) {
                throw "漫画ID或章节ID不能为空"
            }
            
            // 先获取阅读页HTML，提取所有图片URL
            const url = `${this.baseUrl}/chapter/${epId}`
            const res = await this.requestGet(url, `${this.baseUrl}/book/${comicId}`)
            if (res.status !== 200) throw `阅读页请求失败: ${res.status}`

            const doc = new HtmlDocument(res.body)
            const images = []
            
            // 提取所有图片URL
            const imgElements = doc.querySelectorAll("img.content-img, img.lazy_img, .img-content img")
            for (const img of imgElements) {
                let src = img.attributes?.["data-r-src"] || 
                          img.attributes?.["data-original"] || 
                          img.attributes?.src || ""
                
                src = this.ensureFullUrl(src, this.imageBaseUrl)
                
                // 过滤掉无效的图片URL
                if (src && 
                    typeof src === 'string' && 
                    src.length > 0 &&
                    !src.includes("logo") && 
                    !src.includes("icon") && 
                    !src.includes("avatar") && 
                    !src.includes("favicon") &&
                    !src.includes("loading") &&
                    !src.includes("blank") &&
                    !src.includes("imagecover3") &&
                    !src.includes("mwmissing") &&
                    !src.startsWith("blob:") &&
                    src.startsWith("http")) {
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
            // 返回图片请求的Headers
            return {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                    'Referer': `${this.baseUrl}/chapter/${epId}`,
                    'Sec-Fetch-Dest': 'image',
                    'Sec-Fetch-Mode': 'no-cors',
                    'Sec-Fetch-Site': 'cross-site'
                }
            }
        }
    }
}
