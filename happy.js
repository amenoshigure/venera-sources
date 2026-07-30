class Happy extends ComicSource {
    // ============================================
    // 漫画源基本信息
    // ============================================
    name = "嗨皮漫画"
    key = "happy"
    version = "1.0.3"
    minAppVersion = "1.6.0"
    url = "https://cdn.jsdelivr.net/gh/amenoshigure/venera-sources@main/happy.js"

    // 基础URL
    baseUrl = "https://m.happymh.com"

    // ============================================
    // 请求头 - 模拟真实浏览器
    // ============================================
    getHeaders(referer = this.baseUrl) {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': referer,
            'Connection': 'keep-alive'
        }
    }

    // ============================================
    // 封装的请求方法
    // ============================================
    async requestGet(url, referer = this.baseUrl) {
        return await Network.get(url, {
            headers: this.getHeaders(referer),
            timeout: 30000
        })
    }

    // ============================================
    // 分类参数映射
    // ============================================
    categoryParamMap = {
        "全部": "",
        "热血": "rexue",
        "古风": "gufeng",
        "战斗": "zhandou",
        "玄幻": "xuanhuan",
        "恋爱": "lianai",
        "穿越": "chuanyue",
        "搞笑": "gaoxiao",
        "校园": "xiaoyuan",
        "科幻": "kehuan",
        "冒险": "maoxian",
        "奇幻": "qihuan",
        "悬疑": "xuanyi",
        "恐怖": "kongbu",
        "推理": "tuili",
        "都市": "dushi",
        "仙侠": "xianxia",
        "武侠": "wuxia",
        "历史": "lishi",
        "战争": "zhanzheng",
        "励志": "lizhi",
        "治愈": "zhiyu",
        "百合": "baihe",
        "耽美": "danmei",
        "纯爱": "chunai",
        "唯美": "weimei",
        "漫改": "mangai",
        "同人": "tongren",
        "美食": "meishi",
        "职场": "zhichang",
        "日常": "richang",
        "偶像": "ouxiang",
        "音乐": "yinyue",
        "舞蹈": "wudao",
        "体育": "tiyu",
        "电竞": "dianjing",
        "竞技": "jingji",
        "侦探": "zhentan",
        "后宫": "hougong",
        "宅斗": "zhaidou",
        "宫斗": "gongdou",
        "权谋": "quanmou",
        "逆袭": "nixi",
        "重生": "zhongsheng",
        "转生": "zhuansheng",
        "异世界": "yishijie",
        "末日": "mori",
        "丧尸": "sangshi",
        "怪物": "guaiwu",
        "异能": "yineng",
        "神魔": "shenmo",
        "系统": "xitong",
        "无敌流": "wudiliu",
        "装逼": "zhuangbi",
        "爽感": "shuanggan",
        "高甜": "gaotian",
        "虐心": "nuexin",
        "复仇": "fuchou",
        "女频": "nvpin",
        "大女主": "danvzhu",
        "乙女": "yinv",
        "其他": "qita"
    }

    // ============================================
    // 工具函数
    // ============================================
    formatAuthor = (authorRaw) => {
        const authorStr = authorRaw?.replace(/[+/?·]/g, ",").replace(/,（/g, "(").replace(/：|:,/g, ":").replace(/（/g, "(").replace(/）/g, ")")
        const authors = authorStr?.split(",").map(a => a.trim()).filter(a => a)
        return authors
    }

    parseHtmlComic = (item) => {
        const a = item.querySelector("a")
        const id = a?.attributes?.href?.split("/").pop()
        const title = item.querySelector(".manga-title")?.text.trim()
        const cover = item.querySelector("mip-img")?.attributes?.src
        const lastChapter = item.querySelector(".manga-chapter")?.text.replace("更新至：", "").trim()
        return {
            id: id,
            title: title,
            cover: cover,
            description: lastChapter || ""
        }
    }

    parseJsonComic = (item) => {
        const author = this.formatAuthor(item.author)?.join(" | ")
        return {
            id: item.manga_code,
            title: item.name,
            subTitle: author,
            cover: item.cover,
            tags: item.genre_ids?.split("、").map(a => a.trim()).filter(a => a),
            description: item.last_chapter || author
        }
    }

    // ============================================
    // 搜索 - 纯 HTML 解析
    // ============================================
    search = {
        load: async (keyword, options, page) => {
            const url = `${this.baseUrl}/sssearch?keyword=${encodeURIComponent(keyword)}&page=${page || 1}`
            const res = await this.requestGet(url, `${this.baseUrl}/sssearch`)
            
            if (res.status !== 200) {
                throw `搜索页面请求失败: ${res.status}`
            }

            const doc = new HtmlDocument(res.body)
            const items = doc.querySelectorAll(".manga-cover")
            const comics = []

            for (const item of items) {
                const a = item.querySelector("a")
                const id = a?.attributes?.href?.split("/").pop()
                const title = item.querySelector(".manga-title")?.text.trim()
                const cover = item.querySelector("mip-img")?.attributes?.src
                const chapter = item.querySelector(".manga-chapter")?.text.replace("更新至：", "").trim()
                
                if (id && title) {
                    comics.push({ 
                        id: id, 
                        title: title, 
                        cover: cover, 
                        description: chapter || ""
                    })
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
        title: "嗨皮漫画",
        type: "singlePageWithMultiPart",
        load: async () => {
            const res = await this.requestGet(this.baseUrl)
            if (res.status !== 200) throw `主页请求失败: ${res.status}`
            const doc = new HtmlDocument(res.body)
            const parts = doc.querySelectorAll(".manga-area")
            const result = {}
            for (const part of parts) {
                const title = part.querySelector("h3")?.text.trim() || "推荐"
                const comics = part.querySelectorAll(".manga-cover").map(this.parseHtmlComic)
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
            categories: Object.keys(this.categoryParamMap),
            categoryParams: Object.values(this.categoryParamMap),
            itemType: "category"
        }]
    }

    // ============================================
    // 分类漫画加载 - 使用 API
    // ============================================
    categoryComics = {
        load: async (category, param, options, page) => {
            const api = `${this.baseUrl}/apis/c/index?genre=${param}&pn=${page}`
            const res = await this.requestGet(api, `${this.baseUrl}/latest`)
            if (res.status !== 200) throw `分类接口请求失败: ${res.status}`
            const data = JSON.parse(res.body)
            return {
                comics: data.data.items.map(this.parseJsonComic),
                maxPage: data.data.isEnd ? page : null
            }
        }
    }

    // ============================================
    // 漫画详情
    // ============================================
    comic = {
        loadInfo: async (id) => {
            const url = `${this.baseUrl}/manga/${id}`
            const res = await this.requestGet(url, url)
            if (res.status !== 200) throw `漫画详情页请求失败: ${res.status}`

            const doc = new HtmlDocument(res.body)

            const title = doc.querySelector(".mg-title")?.text.trim() || id
            const cover = doc.querySelector("mip-img")?.attributes?.src
            const desc = doc.querySelector("mip-showmore")?.text.trim()
            const authorRaw = doc.querySelectorAll(".mg-sub-title a").map(a => a.text.trim()).join(",")
            const authors = this.formatAuthor(authorRaw)
            const genres = doc.querySelectorAll(".mg-cate a").map(a => a.text.trim()).filter(a => a)

            // 获取章节列表 - 从 CSS 类名 .css-137zl9h-chapterButton 提取
            const items = doc.querySelectorAll(".css-137zl9h-chapterButton")
            const chapters = {}
            for (const item of items) {
                const href = item.attributes.href
                const cid = href?.split("/").pop()
                const name = item.text.trim()
                if (cid && name) {
                    chapters[cid] = name
                }
            }

            doc.dispose()

            return new ComicDetails({
                title: title,
                cover: cover,
                description: desc,
                subTitle: authors?.join(" | ") || "",
                tags: { 
                    "作者": authors || [], 
                    "题材": genres || [] 
                },
                chapters: chapters,
                url: url
            })
        },

        loadEp: async (comicId, epId) => {
            // 直接访问阅读页 HTML 解析图片
            const url = `${this.baseUrl}/mangaread/${comicId}/${epId}`
            const res = await this.requestGet(url, `${this.baseUrl}/manga/${comicId}`)
            if (res.status !== 200) throw `阅读页请求失败: ${res.status}`

            const doc = new HtmlDocument(res.body)
            // 提取所有图片
            const images = []
            const imgElements = doc.querySelectorAll("img")
            for (const img of imgElements) {
                const src = img.attributes.src
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

        // 图片加载时设置正确的 Referer
        onImageLoad: (url, comicId, epId) => {
            return {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': `${this.baseUrl}/mangaread/${comicId}/${epId}`,
                    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
                }
            }
        }
    }

    // ============================================
    // 设置
    // ============================================
    settings = {
        originalImage: {
            title: "阅读显示原图",
            type: "switch",
            default: false
        }
    }
}
