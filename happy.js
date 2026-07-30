class Happy extends ComicSource {
    // ============================================
    // 漫画源基本信息
    // ============================================
    name = "嗨皮漫画"
    key = "happy"
    version = "1.0.1"
    minAppVersion = "1.6.0"
    url = "https://raw.githubusercontent.com/amenoshigure/venera-sources/main/happy.js"

    // 基础URL
    baseUrl = "https://m.happymh.com"

    // ============================================
    // 请求头 - 模拟真实浏览器，防止403
    // ============================================
    getHeaders(referer = this.baseUrl) {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': referer,
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'Connection': 'keep-alive'
        }
    }

    getApiHeaders(referer = this.baseUrl) {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': referer,
            'X-Requested-With': 'XMLHttpRequest',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
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

    async requestApi(url, referer = this.baseUrl) {
        return await Network.get(url, {
            headers: this.getApiHeaders(referer),
            timeout: 30000
        })
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

    // ============================================
    // 分类参数映射（共129个分类）
    // ============================================
    categoryParamMap = {
        "全部": "",
        "热血": "rexue",
        "格斗": "gedou",
        "武侠": "wuxia",
        "魔幻": "mohuan",
        "魔法": "mofa",
        "冒险": "maoxian",
        "爱情": "aiqing",
        "搞笑": "gaoxiao",
        "校园": "xiaoyuan",
        "科幻": "kehuan",
        "后宫": "hougong",
        "励志": "lizhi",
        "职场": "zhichang",
        "美食": "meishi",
        "社会": "shehui",
        "黑道": "heidao",
        "战争": "zhanzheng",
        "历史": "lishi",
        "悬疑": "xuanyi",
        "竞技": "jingji",
        "体育": "tiyu",
        "恐怖": "kongbu",
        "推理": "tuili",
        "生活": "shenghuo",
        "伪娘": "weiniang",
        "治愈": "zhiyu",
        "神鬼": "shengui",
        "四格": "sige",
        "百合": "baihe",
        "耽美": "danmei",
        "舞蹈": "wudao",
        "侦探": "zhentan",
        "宅男": "zhainan",
        "音乐": "yinyue",
        "萌系": "mengxi",
        "古风": "gufeng",
        "恋爱": "lianai",
        "都市": "dushi",
        "性转": "xingzhuan",
        "穿越": "chuanyue",
        "游戏": "youxi",
        "其他": "qita",
        "爱妻": "aiqi",
        "日常": "richang",
        "腹黑": "fuhei",
        "古装": "guzhuang",
        "仙侠": "xianxia",
        "生化": "shenghua",
        "修仙": "xiuxian",
        "情感": "qinggan",
        "改编": "gaibian",
        "纯爱": "chunai",
        "唯美": "weimei",
        "蔷薇": "qiangwei",
        "明星": "mingxing",
        "猎奇": "lieqi",
        "青春": "qingchun",
        "幻想": "huanxiang",
        "惊奇": "jingqi",
        "彩虹": "caihong",
        "奇闻": "qiwen",
        "权谋": "quanmou",
        "宅斗": "zhaidou",
        "限制级": "xianzhiji",
        "装逼": "zhuangbi",
        "浪漫": "langman",
        "偶像": "ouxiang",
        "大女主": "danvzhu",
        "复仇": "fuchou",
        "虐心": "nuexin",
        "恶搞": "egao",
        "灵异": "lingyi",
        "惊险": "jingxian",
        "宠爱": "chongai",
        "逆袭": "nixi",
        "妖怪": "yaoguai",
        "暧昧": "aimei",
        "同人": "tongren",
        "架空": "jiakong",
        "真人": "zhenren",
        "动作": "dongzuo",
        "橘味": "juwei",
        "宫斗": "gongdou",
        "脑洞": "naodong",
        "漫改": "mangai",
        "战斗": "zhandou",
        "丧尸": "sangshi",
        "美少女": "meishaonv",
        "怪物": "guaiwu",
        "系统": "xitong",
        "智斗": "zhidou",
        "机甲": "jijia",
        "高甜": "gaotian",
        "僵尸": "jiangshi",
        "致郁": "zhiyu",
        "电竞": "dianjing",
        "神魔": "shenmo",
        "异能": "yineng",
        "末日": "mori",
        "乙女": "yinv",
        "豪快": "haokuai",
        "奇幻": "qihuan",
        "绅士": "shenshi",
        "正能量": "zhengnengliang",
        "宫廷": "gongting",
        "亲情": "qinqing",
        "养成": "yangcheng",
        "剧情": "juqing",
        "轻小说": "qingxiaoshuo",
        "暗黑": "anhei",
        "长条": "changtiao",
        "玄幻": "xuanhuan",
        "霸总": "bazong",
        "欧皇": "ouhuang",
        "生存": "shengcun",
        "异世界": "yishijie",
        "其它": "qita",
        "C99": "C99",
        "节操": "jiecao",
        "AA": "AA",
        "影视化": "yingshihua",
        "欧风": "oufeng",
        "女神": "nvshen",
        "爽感": "shuanggan",
        "转生": "zhuansheng",
        "异形": "yixing",
        "反套路": "fantaolu",
        "双男主": "shuangnanzhu",
        "无敌流": "wudiliu",
        "重生": "zhongsheng",
        "血腥": "xuexing",
        "奇遇": "qiyu",
        "泛爱": "fanai",
        "软萌": "ruanmeng",
        "邪恶": "xiee",
        "资讯": "zixun",
        "女频": "nvpin",
        "现言": "xianyan",
        "诡异": "guiyi"
    }

    // ============================================
    // 头像映射
    // ============================================
    avatarMap = {
        "0": `${this.baseUrl}/next/bookcase/dist/28c0c017f0c3c6d665ee6b9a71ebc461.png`,
        "1": `${this.baseUrl}/next/bookcase/dist/ebd700fe1b9ee6ac7793786b7e6b2910.png`,
        "2": `${this.baseUrl}/next/bookcase/dist/0a2843f0aa4e0c3e62594670d3c48548.png`,
        "3": `${this.baseUrl}/next/bookcase/dist/bec3031d5dad900b868993510ea623c2.png`,
        "4": `${this.baseUrl}/next/bookcase/dist/c6799b805ca268e73f73eb1e6642905b.png`,
        "5": `${this.baseUrl}/next/bookcase/dist/64dbbd1a81e716b6cd0d227a3cf96ce8.png`,
        "6": `${this.baseUrl}/next/bookcase/dist/9ea59ec786a70bb3f13549ab721e7604.png`,
        "7": `${this.baseUrl}/next/bookcase/dist/0c40a05f21b93364457d221f8f09b975.png`,
        "8": `${this.baseUrl}/next/bookcase/dist/28c0c017f0c3c6d665ee6b9a71ebc461.png`,
        "9": `${this.baseUrl}/next/bookcase/dist/fa323f06704f537c396c7fc2269fe31c.png`,
        "10": `${this.baseUrl}/next/bookcase/dist/9a80d1d72cb1e1e6e7e8178524cc29bd.png`,
        "11": `${this.baseUrl}/next/bookcase/dist/845be1af432b6df590aef786ba692739.png`,
        "12": `${this.baseUrl}/next/bookcase/dist/57336e9f3b941f7f501b353e128cd764.png`,
        "13": `${this.baseUrl}/next/bookcase/dist/02d9fe624cbee696e77b5e8a16bb8980.png`,
        "14": `${this.baseUrl}/next/bookcase/dist/e10824d3bf7a1ef4e1996c053420eeea.png`,
        "15": `${this.baseUrl}/next/bookcase/dist/b3ffe4351a7e6f1e5a5e48932eadf17f.png`,
        "16": `${this.baseUrl}/next/bookcase/dist/cea88102f3bc609f9910851ff15a5105.png`
    }

    // ============================================
    // 工具函数
    // ============================================
    formatAuthor = (authorRaw) => {
        const authorStr = authorRaw?.replace(/[+/?·]/g, ",").replace(/,（/g, "(").replace(/：|:,/g, ":").replace(/（/g, "(").replace(/）/g, ")")
        const authors = authorStr?.split(",").map(a => a.trim()).filter(a => a)
        return authors
    }

    formatUpdateTime = (timeRaw) => {
        if (/^\d{2}-\d{2}$/.test(timeRaw)) {
            return `${new Date().getFullYear()}-${timeRaw}`
        }
        return timeRaw
    }

    // ============================================
    // HTML解析
    // ============================================
    parseHtmlComic = (item) => {
        const id = item.querySelector("a").attributes.href.split("/").pop()
        const title = item.querySelector(".manga-title")?.text.trim()
        const cover = item.querySelector("mip-img").attributes.src
        const lastChapter = item.querySelector(".manga-chapter")?.text.replace("更新至：", "").trim()
        const rank = item.querySelector(".rank-number-small")?.text.trim()
        const categoryElems = item.querySelectorAll(".manga-category")
        const tags = categoryElems[0]?.text.split(/[|、]/).map(a => a.trim()).filter(a => a)
        const authorElem = categoryElems[1]?.text.trim()
        const author = this.formatAuthor(authorElem)?.join(" | ")
        const score = categoryElems.slice(2).map(a => a.text.trim()).filter(a => a).join(" | ")

        return {
            id: id,
            title: rank ? `${rank}. ${title}` : title,
            subTitle: author,
            cover: cover,
            tags: tags,
            description: lastChapter || score || author
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

    parseComment = (item) => {
        let content = item.content
        if (item.reply_to_comment && item.reply_to_comment.user) {
            content = `回复 <b><a>@${item.reply_to_comment.user.username}</a></b>：${content}`
        }
        return {
            userName: item.user.username,
            avatar: this.avatarMap[item.user.cover],
            content: content,
            time: item.reply_to_comment ? item.create_time : `章节：${item.ch_name}\n${item.create_time}`,
            replyCount: item.reply_to_comment ? null : item.sub_comments_count,
            id: item.id
        }
    }

    // ============================================
    // 评论加载
    // ============================================
    loadCommentsCommon = async (comicId, epId, page, replyTo, from) => {
        if (replyTo) {
            const api = `${this.baseUrl}/v2.0/apis/comment/subComments?root_id=${replyTo}&pn=${page}&ps=10`
            const res = await this.requestApi(api)
            if (res.status !== 200) throw `评论接口请求失败: ${res.status}`
            const data = JSON.parse(res.body)
            return {
                comments: data.data.items.map(this.parseComment),
                maxPage: data.data.is_end ? page : null
            }
        } else {
            const order = this.loadSetting("commentOrder")
            const ch_id = epId ? `&ch_id=${epId}` : ""
            const api = `${this.baseUrl}/v2.0/apis/comment?code=${comicId}${ch_id}&pn=${page}&order=${order}&from=${from}`
            const res = await this.requestApi(api)
            if (res.status !== 200) throw `评论接口请求失败: ${res.status}`
            const data = JSON.parse(res.body)
            return {
                comments: data.data.items.map(this.parseComment),
                maxPage: data.data.isEnd ? page : null
            }
        }
    }

    // ============================================
    // 章节缓存
    // ============================================
    loadChaptersWithCache = async (comicId) => {
        const fetchData = async (page) => {
            const api = `${this.baseUrl}/v2.0/apis/manga/chapterByPage?code=${comicId}&page=${page}&lang=cn&order=asc`
            const res = await this.requestApi(api)
            if (res.status !== 200) throw `第${page}页章节接口请求失败: ${res.status}`
            return JSON.parse(res.body).data
        }

        const firstData = await fetchData(1)
        const total = firstData.total
        const cacheKey = `chapters_${comicId}`
        const cacheData = this.loadData(cacheKey)

        if (cacheData && cacheData.total === total) {
            return cacheData.chapters
        }

        const firstItems = firstData.items
        const pageSize = firstItems.length
        const totalPage = Math.ceil(total / pageSize)

        let cachePage = 1
        let chapters = {}

        if (cacheData && cacheData.total > pageSize && cacheData.total < total) {
            cachePage = Math.floor(cacheData.total / pageSize)
            chapters = { ...cacheData.chapters }
        } else {
            for (const item of firstItems) {
                chapters[item.id] = item.chapterName
            }
        }

        const addPage = totalPage - cachePage
        if (addPage > 0) {
            const pages = Array.from({ length: addPage }, (_, i) => cachePage + i + 1)
            const addData = await Promise.all(pages.map(page => fetchData(page)))
            for (const data of addData) {
                for (const item of data.items) {
                    chapters[item.id] = item.chapterName
                }
            }
        }

        this.saveCache(cacheKey, {
            time: Date.now(),
            total: Object.keys(chapters).length,
            chapters: chapters
        })

        return chapters
    }

    saveCache = (key, data) => {
        this.saveData(key, data)
        const keys = this.loadData("cache_keys") || []
        if (!keys.includes(key)) {
            keys.push(key)
            this.saveData("cache_keys", keys)
        }
    }

    cleanCache = (cacheTTL) => {
        const allKeys = this.loadData("cache_keys") || []
        const validKeys = []
        for (const key of allKeys) {
            if (Date.now() - this.loadData(key).time < cacheTTL) {
                validKeys.push(key)
            } else {
                this.deleteData(key)
            }
        }
        this.saveData("cache_keys", validKeys)
    }

    init() {
        this.cleanCache(this.loadSetting("cacheTTL"))
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
                const title = part.querySelector("h3").text.trim()
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
        title: "嗨皮漫画",
        parts: [{
            name: "最近更新",
            type: "fixed",
            categories: Object.keys(this.categoryParamMap),
            categoryParams: Object.values(this.categoryParamMap),
            itemType: "category"
        }],
        enableRankingPage: true
    }

    // ============================================
    // 分类漫画加载
    // ============================================
    categoryComics = {
        load: async (category, param, options, page) => {
            const api = `${this.baseUrl}/apis/c/index?genre=${param}&area=${options[0]}&audience=${options[1]}&series_status=${options[2]}&pn=${page}`
            const res = await this.requestApi(api, `${this.baseUrl}/latest`)
            if (res.status !== 200) throw `分类接口请求失败: ${res.status}`
            const data = JSON.parse(res.body)
            return {
                comics: data.data.items.map(this.parseJsonComic),
                maxPage: data.data.isEnd ? page : null
            }
        },
        optionList: [{
            label: "地区",
            options: [
                "-全部",
                "china-内地",
                "japan-日本",
                "hongkong-港台",
                "europe-欧美",
                "korea-韩国",
                "other-其他"
            ]
        }, {
            label: "受众",
            options: [
                "-全部",
                "shaonian-少年",
                "shaonv-少女",
                "qingnian-青年",
                "BL-BL",
                "GL-GL"
            ]
        }, {
            label: "状态",
            options: [
                "-全部",
                "0-连载中",
                "1-完结"
            ]
        }],
        ranking: {
            options: [
                "day-日阅读",
                "dayBookcasesOne-日收藏",
                "week-周阅读",
                "weekBookcase-周收藏",
                "month-月阅读",
                "monthBookcases-月收藏",
                "voteRank-总评分",
                "voteNumMonthRank-月投票"
            ],
            load: async (option, page) => {
                const url = `${this.baseUrl}/rank/${option}`
                const res = await this.requestGet(url)
                if (res.status !== 200) throw `排行榜页面请求失败: ${res.status}`
                const doc = new HtmlDocument(res.body)
                const comics = doc.querySelectorAll(".manga-rank").map(this.parseHtmlComic)
                doc.dispose()
                return {
                    comics: comics,
                    maxPage: 1
                }
            }
        }
    }

    // ============================================
    // 搜索
    // ============================================
    search = {
        load: async (keyword, options, page) => {
            const api = `${this.baseUrl}/v2.0/apis/manga/ssearch`
            const body = `searchkey=${encodeURIComponent(keyword)}&v=v2.13`
            const res = await this.requestPost(api, `${this.baseUrl}/sssearch`, body)
            if (res.status !== 200) throw `搜索接口请求失败: ${res.status}`
            const data = JSON.parse(res.body)
            return {
                comics: data.data.items.map(this.parseJsonComic),
                maxPage: 1
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

            const jsonInHtml = res.body.match(/<mip-data>\s*<script type="application\/json">\s*([\s\S]*?)<\/script>\s*<\/mip-data>/i)?.[1]
            const comicData = JSON.parse(jsonInHtml)

            const title = doc.querySelector(".mg-title")?.text.trim()
            const subTitle = doc.querySelector(".mg-sub-title")?.text.replace(/,/g, "／").trim()
            const cover = doc.querySelector("mip-img").attributes.src
            const authorRaw = doc.querySelectorAll(".mg-sub-title a").map(a => a.text.trim()).join(",")
            const authors = this.formatAuthor(authorRaw)
            const author = authors.join(" | ")
            const genres = doc.querySelectorAll(".mg-cate a").map(a => a.text.trim()).filter(a => a)
            const descRaw = doc.querySelector("mip-showmore")?.text.trim()
            const description = subTitle ? [descRaw, `别名：${subTitle}`].filter(a => a).join("\n\n") : descRaw
            const updateTimeRaw = doc.querySelector(".update-time .time")?.text.trim()
            const updateTime = this.formatUpdateTime(updateTimeRaw)
            const recommend = doc.querySelectorAll(".manga-cover").map(this.parseHtmlComic)

            const stars = parseFloat(comicData.score) || null
            const status = comicData.serie_status ? "完结" : "连载中"

            const chapters = await this.loadChaptersWithCache(id)

            doc.dispose()

            return new ComicDetails({
                title: title,
                subTitle: author,
                cover: cover,
                description: description,
                tags: {
                    "作者": authors,
                    "题材": genres,
                    "状态": [status]
                },
                chapters: chapters,
                recommend: recommend,
                updateTime: updateTime,
                url: url,
                stars: stars
            })
        },

        loadEp: async (comicId, epId) => {
            const api = `${this.baseUrl}/v2.0/apis/manga/reading?code=${comicId}&cid=${epId}&v=v3.1919111`
            const referer = `${this.baseUrl}/manga/${comicId}`
            const res = await this.requestApi(api, referer)
            if (res.status !== 200) throw `章节图片接口请求失败: ${res.status}`

            const data = JSON.parse(res.body)
            const original = this.loadSetting("originalImage")
            const images = data.data.scans.filter(item => item.n === 0).map(item => original ? item.url.replace(/\?.*$/, "") : item.url)

            if (images.length === 0) {
                throw "本章未找到任何图片，请确认网页来源是否正常"
            }

            return {
                images: images
            }
        },

        // ============================================
        // 图片加载配置 - 关键：防止图片403
        // ============================================
        onImageLoad: (url, comicId, epId) => {
            return {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': `${this.baseUrl}/mangaread/${comicId}/${epId}`,
                    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                    'Sec-Fetch-Dest': 'image',
                    'Sec-Fetch-Mode': 'no-cors',
                    'Sec-Fetch-Site': 'same-origin'
                }
            }
        },

        loadComments: async (comicId, subId, page, replyTo) => {
            return await this.loadCommentsCommon(comicId, null, page, replyTo, "detail")
        },

        loadChapterComments: async (comicId, epId, page, replyTo) => {
            return await this.loadCommentsCommon(comicId, epId, page, replyTo, "read")
        },

        onClickTag: (namespace, tag) => {
            if (namespace === "作者") {
                return {
                    page: "search",
                    attributes: {
                        keyword: tag
                    }
                }
            } else if (namespace === "题材") {
                return {
                    page: "category",
                    attributes: {
                        category: tag,
                        param: this.categoryParamMap[tag]
                    }
                }
            }
        },

        enableTagsTranslate: false
    }

    // ============================================
    // 设置
    // ============================================
    settings = {
        originalImage: {
            title: "阅读显示原图",
            type: "switch",
            default: false
        },
        commentOrder: {
            title: "评论排序方式",
            type: "select",
            options: [
                { value: "hot", text: "最热" },
                { value: "time", text: "最新" }
            ],
            default: "hot"
        },
        cacheTTL: {
            title: "缓存有效时长",
            type: "select",
            options: [
                { value: 0, text: "当次" },
                { value: 604800000, text: "一周" },
                { value: 2592000000, text: "一月" },
                { value: 7776000000, text: "三月" },
                { value: 15552000000, text: "半年" },
                { value: 31104000000, text: "一年" }
            ],
            default: 2592000000
        },
        wipeCache: {
            title: "清除全部缓存",
            type: "callback",
            buttonText: "清除",
            callback: () => {
                this.cleanCache(0)
                this.deleteData("cache_keys")
                UI.showMessage("已清除全部缓存")
            }
        }
    }
}
