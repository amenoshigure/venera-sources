class Happy extends ComicSource {
    name = "嗨皮漫画"
    key = "happy"
    version = "1.0.8"
    minAppVersion = "1.6.0"
    url = "https://cdn.jsdelivr.net/gh/amenoshigure/venera-sources@main/happy.js"
    baseUrl = "https://m.happymh.com"

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
    // 解析函数
    // ============================================
    parseHtmlComic = (item) => {
        const a = item.querySelector("a")
        const href = a?.attributes?.href || ""
        const id = href.split("/").pop() || ""
        const title = item.querySelector(".manga-title")?.text?.trim() || ""
        const cover = item.querySelector("mip-img")?.attributes?.src || ""
        const chapter = item.querySelector(".manga-chapter")?.text?.replace("更新至：", "").trim() || ""
        return { id, title, cover, description: chapter }
    }

    // ============================================
    // 发现页（首页）
    // ============================================
    explore = [{
        title: "嗨皮漫画",
        type: "singlePageWithMultiPart",
        load: async () => {
            const res = await this.requestGet(this.baseUrl)
            if (res.status !== 200) throw `主页请求失败: ${res.status}`
            const doc = new HtmlDocument(res.body)
            const parts = doc.querySelectorAll(".manga-area")
            const result = {}
            for (const part of parts) {
                const title = part.querySelector("h3")?.text?.trim() || "推荐"
                const comics = part.querySelectorAll(".manga-cover").map(this.parseHtmlComic).filter(c => c.id && c.title)
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
            categories: ["全部", "热血", "古风", "战斗", "玄幻", "恋爱", "穿越", "搞笑", "校园", "科幻", "冒险"],
            categoryParams: ["", "rexue", "gufeng", "zhandou", "xuanhuan", "lianai", "chuanyue", "gaoxiao", "xiaoyuan", "kehuan", "maoxian"],
            itemType: "category"
        }]
    }

    // ============================================
    // 分类漫画加载
    // ============================================
    categoryComics = {
        load: async (category, param, options, page) => {
            const url = `${this.baseUrl}/latest?genre=${param}&page=${page || 1}`
            const res = await this.requestGet(url, `${this.baseUrl}/latest`)
            if (res.status !== 200) throw `分类页面请求失败: ${res.status}`
            
            const doc = new HtmlDocument(res.body)
            const items = doc.querySelectorAll(".manga-cover")
            const comics = items.map(this.parseHtmlComic).filter(c => c.id && c.title)
            doc.dispose()
            
            // 简单分页：如果返回的漫画数量为0，说明没有下一页
            const maxPage = comics.length > 0 ? page + 1 : page
            return {
                comics: comics,
                maxPage: comics.length > 0 ? page + 1 : page
            }
        }
    }

    // ============================================
    // 漫画详情
    // ============================================
    comic = {
        loadInfo: async (id) => {
            if (!id) throw "漫画ID不能为空"
            const url = `${this.baseUrl}/manga/${id}`
            const res = await this.requestGet(url, url)
            if (res.status !== 200) throw `详情页请求失败: ${res.status}`

            const doc = new HtmlDocument(res.body)
            const title = doc.querySelector(".mg-title")?.text?.trim() || id
            const cover = doc.querySelector("mip-img")?.attributes?.src || ""
            const desc = doc.querySelector("mip-showmore")?.text?.trim() || ""
            const authorElems = doc.querySelectorAll(".mg-sub-title a")
            const authors = authorElems.map(a => a.text.trim()).join(", ")

            // 获取章节列表
            const items = doc.querySelectorAll(".css-137zl9h-chapterButton")
            const chapters = {}
            for (const item of items) {
                const href = item.attributes?.href || ""
                const cid = href.split("/").pop() || ""
                const name = item.text?.trim() || ""
                if (cid && name) {
                    chapters[cid] = name
                }
            }
            doc.dispose()

            return new ComicDetails({
                title: title,
                cover: cover,
                description: desc,
                subTitle: authors || "",
                chapters: chapters,
                url: url
            })
        },

        loadEp: async (comicId, epId) => {
            if (!comicId || !epId) throw "参数不能为空"
            
            const url = `${this.baseUrl}/mangaread/${comicId}/${epId}`
            const res = await this.requestGet(url, `${this.baseUrl}/manga/${comicId}`)
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
                    'Referer': `${this.baseUrl}/mangaread/${comicId}/${epId}`,
                    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
                }
            }
        }
    }
}
