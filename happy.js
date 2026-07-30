class Happy extends ComicSource {
    name = "嗨皮漫画"
    key = "happy"
    version = "1.0.5"
    minAppVersion = "1.6.0"
    url = "https://cdn.jsdelivr.net/gh/amenoshigure/venera-sources@main/happy.js"
    baseUrl = "https://m.happymh.com"

    // ========== 请求头 ==========
    getHeaders(referer = this.baseUrl) {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': referer,
            'Connection': 'keep-alive'
        }
    }

    getApiHeaders(referer = this.baseUrl) {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': referer,
            'Origin': this.baseUrl,
            'X-Requested-With': 'XMLHttpRequest',
            'Connection': 'keep-alive'
        }
    }

    async requestGet(url, referer = this.baseUrl) {
        return await Network.get(url, { headers: this.getHeaders(referer), timeout: 30000 })
    }

    async requestApi(url, referer = this.baseUrl) {
        return await Network.get(url, { headers: this.getApiHeaders(referer), timeout: 30000 })
    }

    async requestPost(url, referer = this.baseUrl, body = '') {
        return await Network.post(url, {
            headers: {
                ...this.getApiHeaders(referer),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 30000
        }, body)
    }

    // ========== 分类映射 ==========
    categoryParamMap = {
        "全部": "", "热血": "rexue", "古风": "gufeng", "战斗": "zhandou",
        "玄幻": "xuanhuan", "恋爱": "lianai", "穿越": "chuanyue", "搞笑": "gaoxiao",
        "校园": "xiaoyuan", "科幻": "kehuan", "冒险": "maoxian", "奇幻": "qihuan",
        "悬疑": "xuanyi", "恐怖": "kongbu", "都市": "dushi", "仙侠": "xianxia",
        "武侠": "wuxia", "历史": "lishi", "治愈": "zhiyu", "百合": "baihe",
        "耽美": "danmei", "纯爱": "chunai", "唯美": "weimei", "漫改": "mangai",
        "同人": "tongren", "日常": "richang", "偶像": "ouxiang", "音乐": "yinyue",
        "体育": "tiyu", "竞技": "jingji", "推理": "tuili", "后宫": "hougong",
        "宫斗": "gongdou", "逆袭": "nixi", "重生": "zhongsheng", "转生": "zhuansheng",
        "异世界": "yishijie", "末日": "mori", "丧尸": "sangshi", "异能": "yineng",
        "神魔": "shenmo", "系统": "xitong", "高甜": "gaotian", "虐心": "nuexin",
        "复仇": "fuchou", "女频": "nvpin", "大女主": "danvzhu", "其他": "qita"
    }

    // ========== 工具函数 ==========
    safeString = (v) => v?.trim() || ""
    safeId = (href) => href?.split("/")?.pop() || ""

    formatAuthor = (raw) => {
        if (!raw) return []
        return raw.replace(/[+/?·]/g, ",").replace(/,（/g, "(").replace(/：|:,/g, ":").replace(/（/g, "(").replace(/）/g, ")")
            .split(",").map(a => a.trim()).filter(a => a)
    }

    parseHtmlComic = (item) => {
        const a = item.querySelector("a")
        const href = a?.attributes?.href || ""
        return {
            id: this.safeId(href),
            title: this.safeString(item.querySelector(".manga-title")?.text),
            cover: a?.querySelector("mip-img")?.attributes?.src || "",
            description: this.safeString(item.querySelector(".manga-chapter")?.text?.replace("更新至：", ""))
        }
    }

    parseJsonComic = (item) => {
        return {
            id: this.safeString(item.manga_code),
            title: this.safeString(item.name),
            cover: this.safeString(item.cover),
            description: this.safeString(item.last_chapter),
            subTitle: this.formatAuthor(item.author)?.join(" | ") || ""
        }
    }

    // ========== 搜索 ==========
    search = {
        load: async (keyword, options, page) => {
            // 方案1：尝试 API
            try {
                const body = `searchkey=${encodeURIComponent(keyword)}&v=v2.13`
                const res = await this.requestPost(
                    `${this.baseUrl}/v2.0/apis/manga/ssearch`,
                    `${this.baseUrl}/sssearch?keyword=${encodeURIComponent(keyword)}`,
                    body
                )
                if (res.status === 200) {
                    const data = JSON.parse(res.body)
                    if (data?.data?.items?.length > 0) {
                        return {
                            comics: data.data.items.map(this.parseJsonComic),
                            maxPage: 1
                        }
                    }
                }
            } catch (e) {
                // API 失败，继续用 HTML
            }

            // 方案2：HTML 解析
            const url = `${this.baseUrl}/sssearch?keyword=${encodeURIComponent(keyword)}&page=${page || 1}`
            const res = await this.requestGet(url)
            if (res.status !== 200) throw `搜索失败: ${res.status}`

            const doc = new HtmlDocument(res.body)
            const items = doc.querySelectorAll(".manga-cover")
            const comics = []
            for (const item of items) {
                const comic = this.parseHtmlComic(item)
                if (comic.id && comic.title) {
                    comics.push(comic)
                }
            }
            doc.dispose()
            return { comics, maxPage: 1 }
        }
    }

    // ========== 发现页 ==========
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
                const comics = part.querySelectorAll(".manga-cover")
                    .map(this.parseHtmlComic)
                    .filter(c => c.id && c.title)
                if (comics.length > 0) result[title] = comics
            }
            doc.dispose()
            return result
        }
    }]

    // ========== 分类 ==========
    category = {
        title: "分类浏览",
        parts: [{
            name: "分类",
            type: "fixed",
            categories: Object.keys(this.categoryParamMap),
            categoryParams: Object.values(this.categoryParamMap),
            itemType: "category"
        }]
    }

    categoryComics = {
        load: async (category, param, options, page) => {
            const api = `${this.baseUrl}/apis/c/index?genre=${param}&pn=${page}`
            const res = await this.requestApi(api, `${this.baseUrl}/latest`)
            if (res.status !== 200) throw `分类接口请求失败: ${res.status}`
            const data = JSON.parse(res.body)
            return {
                comics: (data.data?.items || []).map(this.parseJsonComic).filter(c => c.id && c.title),
                maxPage: data.data?.isEnd ? page : null
            }
        }
    }

    // ========== 详情 ==========
    comic = {
        loadInfo: async (id) => {
            if (!id) throw "ID不能为空"
            const url = `${this.baseUrl}/manga/${id}`
            const res = await this.requestGet(url, url)
            if (res.status !== 200) throw `详情页请求失败: ${res.status}`

            const doc = new HtmlDocument(res.body)
            const title = doc.querySelector(".mg-title")?.text?.trim() || id
            const cover = doc.querySelector("mip-img")?.attributes?.src || ""
            const desc = doc.querySelector("mip-showmore")?.text?.trim() || ""
            const authors = this.formatAuthor(doc.querySelectorAll(".mg-sub-title a").map(a => a.text.trim()).join(","))
            const genres = doc.querySelectorAll(".mg-cate a").map(a => a.text.trim()).filter(a => a)

            const items = doc.querySelectorAll(".css-137zl9h-chapterButton")
            const chapters = {}
            for (const item of items) {
                const cid = this.safeId(item.attributes?.href)
                const name = item.text?.trim() || ""
                if (cid && name) chapters[cid] = name
            }
            doc.dispose()

            return new ComicDetails({
                title, cover, description: desc,
                subTitle: authors.join(" | ") || "",
                tags: { "作者": authors, "题材": genres },
                chapters, url
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
            if (images.length === 0) throw "未找到图片"
            return { images }
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

    settings = {
        originalImage: {
            title: "阅读显示原图",
            type: "switch",
            default: false
        }
    }
}
