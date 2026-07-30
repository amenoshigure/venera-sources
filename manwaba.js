/** @type {import('./_venera_.js')} */

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

class ManWaBa extends ComicSource {
    name = "漫蛙吧"
    key = "manwaba_final_v5"
    version = "1.0.37"
    minAppVersion = "1.6.0"
    url = "https://cdn.jsdelivr.net/gh/amenoshigure/venera-sources@main/manwaba.js"

    baseUrl = "https://manwa.me"
    imageBaseUrl = "https://tu.mwzu.cc"

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
        const base = this.imageBaseUrl.endsWith('/') ? this.imageBaseUrl.slice(0, -1) : this.imageBaseUrl
        const path = url.startsWith('/') ? url : `/${url}`
        return `${base}${path}`
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
    // ✅ 解析搜索结果（修正选择器）
    // ============================================
    parseSearchResult = (item) => {
        // 查找 a[href^='/comic/']
        const link = item.querySelector("a[href^='/comic/']")
        if (!link) return null
        
        const href = link.attributes?.href || ""
        const baseId = this.safeId(href)
        if (!baseId) return null
        
        const id = `mw_${baseId}`
        
        // 查找 .thumb_img.lazy 的 data-original
        const thumb = item.querySelector(".thumb_img.lazy")
        let cover = thumb?.attributes?.["data-original"] || ""
        cover = this.toAbsoluteUrl(cover)
        
        // 如果没有封面，跳过
        if (!cover) return null
        
        // 标题：.body .title
        const title = item.querySelector(".body .title")?.text?.trim() || baseId
        
        // 作者：.body .row 第一个
        const author = item.querySelector(".body .row:first-child")?.text?.trim() || ""
        
        // 描述：.body .text
        const desc = item.querySelector(".body .text")?.text?.trim() || ""
        
        // 标签：.badge-item
        const tagElements = item.querySelectorAll(".body .badge-item")
        const tags = tagElements.map(el => el.text?.trim()).filter(t => t)

        return {
            id: id,
            title: title,
            cover: cover,
            subTitle: author,
            description: desc,
            tags: tags
        }
    }

    // ============================================
    // ✅ 解析首页漫画
    // ============================================
    parseHomeComic = (item) => {
        const link = item.querySelector("a[href^='/comic/']")
        if (!link) return null
        
        const href = link.attributes?.href || ""
        const baseId = this.safeId(href)
        if (!baseId) return null
        
        const id = `mw_${baseId}`
        
        const thumb = item.querySelector(".thumb_img.lazy")
        let cover = thumb?.attributes?.["data-src"] || ""
        cover = this.toAbsoluteUrl(cover)
        
        if (!cover) return null
        
        const title = item.querySelector(".title")?.text?.trim() || baseId
        const desc = item.querySelector(".desc")?.text?.trim() || ""

        return {
            id: id,
            title: title,
            cover: cover,
            subTitle: "",
            description: desc,
            tags: []
        }
    }

    // ============================================
    // 搜索 - 修正选择器
    // ============================================
    search = {
        load: async (keyword, options, page) => {
            const url = `${this.baseUrl}/search?keyword=${encodeURIComponent(keyword)}&page=${page || 1}`
            const res = await this.requestGet(url, this.baseUrl)
            if (res.status !== 200) throw `搜索页面请求失败: ${res.status}`

            const doc = new HtmlDocument(res.body)
            // ✅ 修正：使用 .books-rows .item
            const items = doc.querySelectorAll(".books-rows .item")
            const comics = []

            for (const item of items) {
                const comic = this.parseSearchResult(item)
                if (comic) {
                    comics.push(comic)
                }
            }
            
            doc.dispose()
            return { comics: comics, maxPage: 1 }
        }
    }

    // ============================================
    // Explore
    // ============================================
    explore = [{
        title: "漫蛙吧",
        type: "singlePageWithMultiPart",
        load: async () => {
            const res = await this.requestGet(this.baseUrl)
            if (res.status !== 200) throw `主页请求失败: ${res.status}`
            
            const doc = new HtmlDocument(res.body)
            const result = {}
            
            const sections = doc.querySelectorAll(".bm-box")
            
            for (const section of sections) {
                const titleEl = section.querySelector(".tl-head .title")
                const title = titleEl?.text?.trim() || "推荐"
                
                const items = section.querySelectorAll(".books-row .item")
                const comics = []
                
                for (const item of items) {
                    const comic = this.parseHomeComic(item)
                    if (comic) {
                        comics.push(comic)
                    }
                }
                
                if (comics.length > 0) {
                    result[title] = comics
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
            let url = `${this.baseUrl}/search?keyword=${encodeURIComponent(category)}&page=${page || 1}`
            if (category === "全部" || !category) {
                url = `${this.baseUrl}/?page=${page || 1}`
            }
            
            try {
                const res = await this.requestGet(url, this.baseUrl)
                if (res.status !== 200) throw `分类页面请求失败: ${res.status}`

                const doc = new HtmlDocument(res.body)
                const items = doc.querySelectorAll(".books-rows .item, .books-row .item")
                const comics = []

                for (const item of items) {
                    const comic = this.parseSearchResult(item) || this.parseHomeComic(item)
                    if (comic) {
                        comics.push(comic)
                    }
                }
                
                doc.dispose()
                return { comics: comics, maxPage: 1 }
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
            const url = `${this.baseUrl}/comic/${realId}`
            const res = await this.requestGet(url, url)
            if (res.status !== 200) throw `详情页请求失败: ${res.status}`

            const doc = new HtmlDocument(res.body)
            
            const title = doc.querySelector("#page-title")?.text?.trim() || realId
            const author = doc.querySelector("#author-container a")?.text?.trim() || "未知"
            const status = doc.querySelector("#status")?.text?.trim() || "连载中"
            const lastChapter = doc.querySelector("#newch")?.text?.trim() || ""

            let cover = doc.querySelector(".comic-cover")?.attributes?.src || ""
            cover = this.toAbsoluteUrl(cover)

            const chapters = new Map()
            const chapterLinks = doc.querySelectorAll("#chapter-grid-container .chapter-item")
            for (const item of chapterLinks) {
                const href = item.attributes?.href || ""
                const cid = href.split("/").pop() || ""
                const name = item.querySelector(".chapter-name")?.text?.trim() || ""
                if (cid && name && cid.length > 0) {
                    chapters.set(cid, name)
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
            
            const url = `${this.baseUrl}/comic/${realComicId}/${epId}`
            const res = await this.requestGet(url, `${this.baseUrl}/comic/${realComicId}`)
            if (res.status !== 200) throw `阅读页请求失败: ${res.status}`

            const doc = new HtmlDocument(res.body)
            const images = []
            
            const imgElements = doc.querySelectorAll("#showimgcontent figure.cImg img.lazy-image")
            for (const img of imgElements) {
                let src = img.attributes?.["data-src"] || img.attributes?.src || ""
                
                src = this.toAbsoluteUrl(src)
                
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
                    !src.includes("blob:") &&
                    !src.includes("data:image")) {
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
            let fullUrl = this.toAbsoluteUrl(url)
            return {
                url: fullUrl,
                headers: {
                    "Referer": `${this.baseUrl}/comic/${comicId.replace(/^mw_/, '')}/${epId}`,
                    "User-Agent": UA,
                    "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
                    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                },
            }
        },

        onThumbnailLoad: (url) => {
            let fullUrl = this.toAbsoluteUrl(url)
            return {
                url: fullUrl,
                headers: {
                    "Referer": this.baseUrl,
                    "User-Agent": UA,
                    "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
                    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                },
            }
        }
    }
}
