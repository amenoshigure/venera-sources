/** @type {import('./_venera_.js')} */

const BASE_URL = "https://manwa.me";
const CDN_URL = "https://mwappimgs.cc";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const HEADERS = {
    "User-Agent": UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
};

class ManWaBa extends ComicSource {
    name = "漫蛙吧"
    key = "manwaba_v8"
    version = "1.0.31"
    minAppVersion = "1.6.0"
    url = "https://cdn.jsdelivr.net/gh/amenoshigure/venera-sources@main/manwaba.js"

    // ============================================
    // Settings
    // ============================================
    settings = {
        domains: {
            title: "主域名",
            type: "select",
            options: [
                { value: "manwa.me", text: "manwa.me" },
                { value: "manwa.cc", text: "manwa.cc" },
            ],
            default: "manwa.me",
        },
        cdn_domains: {
            title: "图片CDN",
            type: "select",
            options: [
                { value: "mwappimgs.cc", text: "mwappimgs.cc" },
                { value: "mwfimsvfast47.cc", text: "mwfimsvfast47.cc" },
            ],
            default: "mwappimgs.cc",
        },
        fix_webp: {
            title: "WebP转JPG",
            type: "select",
            options: [
                { value: "true", text: "开启" },
                { value: "false", text: "关闭" },
            ],
            default: "true",
        },
    }

    get baseUrl() {
        const domain = this.loadSetting("domains") || "manwa.me";
        return `https://${domain}`;
    }

    get cdnDomain() {
        return this.loadSetting("cdn_domains") || "mwappimgs.cc";
    }

    get fixWebp() {
        return this.loadSetting("fix_webp") === "true";
    }

    // ============================================
    // Headers
    // ============================================
    get headers() {
        return {
            "User-Agent": UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Referer": this.baseUrl,
        }
    }

    // ============================================
    // 工具方法
    // ============================================
    toAbsoluteUrl = (url) => {
        if (!url) return ""
        if (typeof url !== 'string') return ""
        url = url.trim()
        if (!url) return ""
        if (url.startsWith('https://')) return url
        if (url.startsWith('http://')) return url.replace('http://', 'https://')
        if (url.startsWith('//')) return `https:${url}`
        const base = this.cdnDomain.endsWith('/') ? this.cdnDomain.slice(0, -1) : this.cdnDomain
        const path = url.startsWith('/') ? url : `/${url}`
        return `https://${base}${path}`
    }

    fixImageUrl = (url) => {
        let fixed = this.toAbsoluteUrl(url)
        if (this.fixWebp && fixed.includes('.webp')) {
            fixed = fixed.replace(/\.webp(\?.*)?$/, '.jpg$1')
        }
        return fixed
    }

    async requestGet(url, referer = this.baseUrl) {
        const headers = { ...this.headers, "Referer": referer }
        const resp = await Network.get(url, headers)
        return resp
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
    // 解析漫画（通用）
    // ============================================
    parseComic = (item) => {
        const link = item.querySelector("a[href^='/book/']")
        if (!link) return null
        
        const href = link.attributes?.href || ""
        const baseId = this.safeId(href)
        const id = `mw_${baseId}`
        
        const img = link.querySelector("img")
        let cover = img?.attributes?.["data-original"] || 
                    img?.attributes?.["data-src"] || 
                    img?.attributes?.src || ""
        cover = this.fixImageUrl(cover)
        
        const title = link.querySelector(".book-title, .title, .name, h4, h3")?.text?.trim() || 
                      img?.attributes?.["alt"] || 
                      link.text?.trim() || 
                      baseId
        
        const subTitle = item.querySelector(".author, .sub-title, .book-author")?.text?.trim() || ""
        const description = item.querySelector(".desc, .description, .book-desc")?.text?.trim() || ""
        const status = item.querySelector(".status, .book-status")?.text?.trim() || ""

        return {
            id: id,
            title: title,
            cover: cover,
            subTitle: subTitle,
            description: description || status,
            tags: status ? [status] : []
        }
    }

    // ============================================
    // 解析搜索结果
    // ============================================
    parseSearchResult = (item) => {
        const link = item.querySelector("a[href^='/book/']")
        const href = link?.attributes?.href || ""
        const baseId = this.safeId(href)
        const id = `mw_${baseId}`
        
        const title = this.safeString(item.querySelector(".book-list-info-title")?.text)
        const img = item.querySelector(".book-list-cover-img")
        let cover = img?.attributes?.["data-original"] || img?.attributes?.src || ""
        cover = this.fixImageUrl(cover)
        
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
            if (res.status !== 200) throw `搜索页面请求失败: ${res.status}`

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
    // ✅ Explore - 参考拷贝漫画实现
    // ============================================
    explore = [{
        title: "漫蛙吧",
        type: "singlePageWithMultiPart",
        load: async () => {
            const res = await this.requestGet(this.baseUrl)
            if (res.status !== 200) throw `主页请求失败: ${res.status}`
            
            const doc = new HtmlDocument(res.body)
            const result = {}
            
            // 查找首页的推荐/热门区域
            // manwa.me 首页结构通常是 .index-recommend-items
            const sections = doc.querySelectorAll(".index-recommend-items, .recommend-section, .home-section")
            
            for (const section of sections) {
                // 获取分区标题
                let title = section.querySelector(".section-title, .catalog-title, .title, h2, h3")?.text?.trim() || "推荐"
                
                // 提取漫画
                const comics = []
                const items = section.querySelectorAll(".comics-card, .book-item, .book-list-item, li")
                for (const item of items) {
                    const comic = this.parseComic(item)
                    if (comic && comic.id && comic.title) {
                        comics.push(comic)
                    }
                }
                
                if (comics.length > 0) {
                    result[title] = comics
                }
            }
            
            // 如果上面的方法没找到，直接查找所有漫画链接
            if (Object.keys(result).length === 0) {
                const allComics = []
                const items = doc.querySelectorAll("a[href^='/book/']")
                for (const item of items) {
                    const comic = this.parseComic(item)
                    if (comic && comic.id && comic.title && comic.cover) {
                        allComics.push(comic)
                    }
                }
                
                // 去重
                const seen = new Set()
                const uniqueComics = allComics.filter(c => {
                    if (seen.has(c.id)) return false
                    seen.add(c.id)
                    return true
                })
                
                if (uniqueComics.length > 0) {
                    result["推荐"] = uniqueComics.slice(0, 20)
                    if (uniqueComics.length > 20) {
                        result["更多"] = uniqueComics.slice(20, 40)
                    }
                }
            }
            
            doc.dispose()
            return result
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
                    const comic = this.parseComic(item)
                    if (comic && comic.id && comic.title) {
                        comics.push(comic)
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
    // 漫画详情
    // ============================================
    comic = {
        loadInfo: async (id) => {
            if (!id) throw "漫画ID不能为空"
            const realId = id.replace(/^mw_/, '')
            const url = `${this.baseUrl}/book/${realId}`
            const res = await this.requestGet(url, url)
            if (res.status !== 200) throw `详情页请求失败: ${res.status}`

            const doc = new HtmlDocument(res.body)
            
            // 提取标题
            let title = doc.querySelector(".detail-main-info-title, .book-title, h1")?.text?.trim() || ""
            if (!title) {
                const titleRaw = doc.querySelector("title")?.text || ""
                title = titleRaw.split("-")[0]?.trim() || ""
            }
            if (!title) {
                title = realId
            }
            
            const author = doc.querySelector(".detail-main-info-author")?.text?.replace("作者：", "").trim() || "未知"
            const status = doc.querySelector(".detail-main-info-status")?.text?.replace("更新状态：", "").trim() || "连载中"
            const lastChapter = doc.querySelector(".detail-main-info-chapter")?.text?.replace("最新章节：", "").trim() || ""

            let cover = doc.querySelector(".book-cover-img")?.attributes?.src || 
                        doc.querySelector(".detail-cover-img")?.attributes?.src ||
                        ""
            cover = this.fixImageUrl(cover)

            // 章节列表
            const chapters = new Map()
            const chapterLinks = doc.querySelectorAll(".detail-list-1 a, .chapterlist a, .chapter-item a, .chapter-link, .chapter-list a, .detail-list-select a, a[href^='/chapter/']")
            for (const item of chapterLinks) {
                const href = item.attributes?.href || ""
                const cid = href.split("/").pop() || ""
                const name = item.text?.trim() || ""
                if (cid && name && !isNaN(cid) && cid.length > 0) {
                    chapters.set(cid, name)
                }
            }

            if (chapters.size === 0) {
                const chapterLink = doc.querySelector(".detail-main-info-chapter a")
                if (chapterLink) {
                    const href = chapterLink.attributes?.href || ""
                    const cid = href.split("/").pop() || ""
                    if (cid && !isNaN(cid) && cid.length > 0) {
                        chapters.set(cid, lastChapter || "第1话")
                    }
                }
            }

            if (chapters.size === 0) {
                chapters.set(realId, lastChapter || "第1话")
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

        // ============================================
        // 加载章节图片
        // ============================================
        loadEp: async (comicId, epId) => {
            if (!comicId || !epId) {
                throw "漫画ID或章节ID不能为空"
            }
            const realComicId = comicId.replace(/^mw_/, '')
            const url = `${this.baseUrl}/chapter/${epId}`
            const res = await this.requestGet(url, `${this.baseUrl}/book/${realComicId}`)
            if (res.status !== 200) throw `阅读页请求失败: ${res.status}`

            const doc = new HtmlDocument(res.body)
            const images = []
            
            const imgElements = doc.querySelectorAll("img.content-img, img.lazy_img, .img-content img")
            for (const img of imgElements) {
                let src = img.attributes?.["data-r-src"] || 
                          img.attributes?.["data-original"] || 
                          img.attributes?.src || ""
                
                src = this.fixImageUrl(src)
                
                if (src && 
                    typeof src === 'string' && 
                    src.length > 0 &&
                    src.startsWith("https://") &&
                    !src.includes("logo") && 
                    !src.includes("icon") && 
                    !src.includes("avatar") && 
                    !src.includes("favicon") &&
                    !src.includes("loading") &&
                    !src.includes("blank") &&
                    !src.includes("imagecover3") &&
                    !src.includes("mwmissing") &&
                    !src.includes("blob:")) {
                    images.push(src)
                }
            }
            doc.dispose()

            if (images.length === 0) {
                throw "本章未找到任何图片"
            }
            
            return { images: images }
        },

        // ============================================
        // 图片加载配置
        // ============================================
        onImageLoad: (url, comicId, epId) => {
            let fullUrl = this.fixImageUrl(url)
            return {
                url: fullUrl,
                headers: {
                    "Referer": `${this.baseUrl}/chapter/${epId}`,
                    "User-Agent": UA,
                    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
                    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                    "Sec-Fetch-Dest": "image",
                    "Sec-Fetch-Mode": "no-cors",
                    "Sec-Fetch-Site": "cross-site",
                },
            }
        },

        onThumbnailLoad: (url) => {
            let fullUrl = this.fixImageUrl(url)
            return {
                url: fullUrl,
                headers: {
                    "Referer": this.baseUrl,
                    "User-Agent": UA,
                    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
                    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                    "Sec-Fetch-Dest": "image",
                    "Sec-Fetch-Mode": "no-cors",
                    "Sec-Fetch-Site": "cross-site",
                },
            }
        },
    }
}
