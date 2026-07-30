class Happy extends ComicSource {
    name = "嗨皮漫画"
    key = "happy"
    version = "1.0.7"
    minAppVersion = "1.6.0"
    url = "https://cdn.jsdelivr.net/gh/amenoshigure/venera-sources@main/happy.js"
    baseUrl = "https://m.happymh.com"

    // ============================================
    // 请求头
    // ============================================
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
    // 解析函数
    // ============================================
    parseJsonComic = (item) => {
        return {
            id: item.manga_code || "",
            title: item.name || "",
            cover: item.cover || "",
            description: item.last_chapter || "",
            subTitle: item.author || ""
        }
    }

    // ============================================
    // 搜索 - 使用 API
    // ============================================
    search = {
        load: async (keyword, options, page) => {
            const body = `searchkey=${encodeURIComponent(keyword)}&v=v2.13`
            const res = await this.requestPost(
                `${this.baseUrl}/v2.0/apis/manga/ssearch`,
                `${this.baseUrl}/sssearch`,
                body
            )
            if (res.status !== 200) {
                throw `搜索接口请求失败: ${res.status}`
            }
            const data = JSON.parse(res.body)
            const comics = (data.data?.items || []).map(this.parseJsonComic)
            return {
                comics: comics,
                maxPage: 1
            }
        }
    }

    // ============================================
    // 发现页
    // ============================================
    explore = [{
        title: "嗨皮漫画",
        type: "singlePageWithMultiPart",
        load: async () => {
            const res = await Network.get(this.baseUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': this.baseUrl
                }
            })
            if (res.status !== 200) throw `主页请求失败: ${res.status}`
            const doc = new HtmlDocument(res.body)
            const parts = doc.querySelectorAll(".manga-area")
            const result = {}
            for (const part of parts) {
                const title = part.querySelector("h3")?.text?.trim() || "推荐"
                const items = part.querySelectorAll(".manga-cover")
                const comics = []
                for (const item of items) {
                    const a = item.querySelector("a")
                    const id = a?.attributes?.href?.split("/").pop() || ""
                    const name = item.querySelector(".manga-title")?.text?.trim() || ""
                    const cover = item.querySelector("mip-img")?.attributes?.src || ""
                    if (id && name) {
                        comics.push({ id, title: name, cover })
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
    // 分类
    // ============================================
    category = {
        title: "分类浏览",
        parts: [{
            name: "分类",
            type: "fixed",
            categories: ["全部", "热血", "古风", "战斗", "玄幻", "恋爱", "穿越", "搞笑", "校园", "科幻"],
            categoryParams: ["", "rexue", "gufeng", "zhandou", "xuanhuan", "lianai", "chuanyue", "gaoxiao", "xiaoyuan", "kehuan"],
            itemType: "category"
        }]
    }

    categoryComics = {
        load: async (category, param, options, page) => {
            const api = `${this.baseUrl}/apis/c/index?genre=${param}&pn=${page}`
            const res = await Network.get(api, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': `${this.baseUrl}/latest`,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            if (res.status !== 200) throw `分类接口请求失败: ${res.status}`
            const data = JSON.parse(res.body)
            const comics = (data.data?.items || []).map(this.parseJsonComic)
            return {
                comics: comics,
                maxPage: data.data?.isEnd ? page : null
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
            const res = await Network.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': this.baseUrl
                }
            })
            if (res.status !== 200) throw `详情页请求失败: ${res.status}`

            const doc = new HtmlDocument(res.body)
            const title = doc.querySelector(".mg-title")?.text?.trim() || id
            const cover = doc.querySelector("mip-img")?.attributes?.src || ""
            const desc = doc.querySelector("mip-showmore")?.text?.trim() || ""

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
                chapters: chapters,
                url: url
            })
        },

        loadEp: async (comicId, epId) => {
            if (!comicId || !epId) throw "参数不能为空"
            
            // 使用 API 获取图片
            const api = `${this.baseUrl}/v2.0/apis/manga/reading?code=${comicId}&cid=${epId}`
            const res = await Network.get(api, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': `${this.baseUrl}/manga/${comicId}`,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            if (res.status !== 200) throw `图片接口请求失败: ${res.status}`

            const data = JSON.parse(res.body)
            const images = (data.data?.scans || [])
                .filter(item => item.n === 0)
                .map(item => item.url || "")
                .filter(url => url)

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
