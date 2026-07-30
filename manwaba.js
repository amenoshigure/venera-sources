/** @type {import('./_venera_.js')} */
class ManWaBa extends ComicSource {
    name = "漫蛙吧"
    key = "manwaba_final"
    version = "1.0.41"
    minAppVersion = "1.4.0"
    url = "https://cdn.jsdelivr.net/gh/amenoshigure/venera-sources@main/manwaba.js"

    api = "https://mwuu.cc/api"
    baseUrl = "https://manwa.me"
    imageBaseUrl = "https://tu.mwzu.cc"

    get UA() {
        return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    async fetchJson(url, { method = "GET", params, headers, payload } = {}) {
        if (params) {
            let params_str = Object.keys(params)
                .map((key) => `${key}=${params[key]}`)
                .join("&");
            url += `?${params_str}`;
        }
        let res = await Network.sendRequest(method, url, headers, payload);
        if (res.status !== 200) {
            throw `Invalid status code: ${res.status}`;
        }
        let json = JSON.parse(res.body);
        return json;
    }

    // ============================================
    // Explore - 使用API
    // ============================================
    explore = [{
        title: "漫蛙吧",
        type: "singlePageWithMultiPart",
        load: async () => {
            const params = { page: 1, pageSize: 6, type: "", flag: false };
            const data = await this.fetchJson(`${this.api}/home`, { params })
                .then(res => res.data);

            const lists = {
                "推荐": data.comicList || [],
                "最新完整版": data.gufengList || [],
                "最新更新": data.xuanhuanList || [],
                "热门收藏": data.xiaoyuanList || []
            };

            const parseComic = (comic) => ({
                id: `mw_${comic.id}`,
                title: comic.title || "",
                cover: comic.pic || "",
                subTitle: comic.author || "",
                tags: comic.tags ? comic.tags.split(",") : [],
                description: comic.intro || ""
            });

            const result = {};
            for (const [key, list] of Object.entries(lists)) {
                if (list && list.length > 0) {
                    result[key] = list.map(parseComic);
                }
            }
            return result;
        }
    }]

    // ============================================
    // 分类
    // ============================================
    category = {
        title: "漫蛙吧",
        parts: [{
            name: "类型",
            type: "fixed",
            categories: ["全部", "热血", "玄幻", "恋爱", "冒险", "古风", "都市", "穿越", "奇幻", "搞笑", "战斗", "重生", "逆袭", "BL", "韩漫", "完整版", "19r", "台版"],
            categoryParams: ["", "热血", "玄幻", "恋爱", "冒险", "古风", "都市", "穿越", "奇幻", "搞笑", "战斗", "重生", "逆袭", "BL", "韩漫", "完整版", "19r", "台版"],
            itemType: "category"
        }]
    }

    // ============================================
    // 分类漫画
    // ============================================
    categoryComics = {
        load: async (category, param, options, page) => {
            const pathMap = {
                "": "/cate",
                "热血": "/cate/hotblooded",
                "玄幻": "/cate/xuanhuan",
                "恋爱": "/cate/romance",
                "冒险": "/cate/adventure",
                "古风": "/cate/historical",
                "都市": "/cate/urban",
                "穿越": "/cate/transmigration",
                "奇幻": "/cate/fantasy",
                "搞笑": "/cate/comedy",
                "战斗": "/cate/action",
                "重生": "/cate/rebirth",
                "逆袭": "/cate/counterattack",
                "BL": "/cate/bl",
                "韩漫": "/cate/manhwa",
                "完整版": "/cate/fullversion",
                "19r": "/cate/19plus",
                "台版": "/cate/taiwanver",
            };

            const url = this.api + (pathMap[param] || "/cate");
            const payload = JSON.stringify({
                page: { page: page || 1, pageSize: 20 },
                category: "comic",
                sort: parseInt(options?.[2] || 0),
                comic: {
                    status: parseInt(options?.[0] || 2),
                    day: parseInt(options?.[1] || 0),
                    tag: param || ""
                },
                video: { year: 0, typeId: 0, typeId1: 0, area: "", lang: "", status: -1, day: 0 },
                novel: { status: -1, day: 0, sortId: 0 }
            });

            const data = await this.fetchJson(url, { method: "POST", payload })
                .then(res => res.data?.list || []);

            const parseComic = (comic) => ({
                id: `mw_${comic.url?.split("/").pop() || comic.id}`,
                title: comic.title || "",
                cover: comic.pic || "",
                subTitle: comic.author || "",
                tags: comic.tags ? comic.tags.split(",") : [],
                description: comic.intro || "",
                status: comic.status == 0 ? "连载中" : "已完结"
            });

            return {
                comics: data.map(parseComic),
                maxPage: 100
            };
        },
        optionList: [
            { options: ["2-全部", "0-连载中", "1-已完结"] },
            { options: ["0-全部", "1-周一", "2-周二", "3-周三", "4-周四", "5-周五", "6-周六", "7-周日"] },
            { options: ["0-更新", "1-新作", "2-畅销", "3-热门", "4-收藏"] }
        ]
    }

    // ============================================
    // 搜索
    // ============================================
    search = {
        load: async (keyword, options, page) => {
            const pageSize = 20;
            const data = await this.fetchJson(`${this.api}/search`, {
                params: { keyword, type: "mh", page: page || 1, pageSize }
            }).then(res => res.data);

            const comics = (data.list || []).map(item => ({
                id: `mw_${item.id}`,
                title: item.title || "",
                cover: item.cover || "",
                subTitle: item.author || "",
                tags: item.tags ? item.tags.split(",") : [],
                description: item.description || "",
                status: item.status == 0 ? "连载中" : "已完结"
            }));

            return {
                comics: comics,
                maxPage: Math.ceil((data.total || 0) / pageSize)
            };
        }
    }

    // ============================================
    // 漫画详情
    // ============================================
    comic = {
        loadInfo: async (id) => {
            const realId = id.replace(/^mw_/, '');
            const data = await this.fetchJson(`${this.api}/comic/${realId}`)
                .then(res => res.data);

            const chapterApi = `${this.api}/comic/chapter`;
            const totalRes = await this.fetchJson(chapterApi, {
                params: { comicId: realId, page: 1, pageSize: 1 }
            });
            const total = totalRes.pagination?.total || 0;

            const chapterRes = await this.fetchJson(chapterApi, {
                params: { comicId: realId, page: 1, pageSize: total || 1 }
            });
            const chapters = new Map();
            (chapterRes.data || []).forEach(item => {
                chapters.set(item.id.toString(), item.title.toString());
            });

            return new ComicDetails({
                title: data.title?.toString() || realId,
                subTitle: data.author?.toString() || "未知",
                cover: data.cover || "",
                tags: {
                    "类型": data.tags ? data.tags.split(",") : [],
                    "状态": data.status == 0 ? "连载中" : "已完结"
                },
                chapters: chapters,
                description: data.intro || "",
                updateTime: data.editTime ? new Date(data.editTime * 1000).toLocaleDateString() : ""
            });
        },

        // ============================================
        // ✅ 加载章节图片 - 使用HTML解析
        // ============================================
        loadEp: async (comicId, epId) => {
            const realComicId = comicId.replace(/^mw_/, '');
            
            // 直接从阅读页HTML解析图片
            const url = `${this.baseUrl}/comic/${realComicId}/${epId}`
            const res = await Network.get(url, {
                headers: {
                    "User-Agent": this.UA,
                    "Referer": this.baseUrl,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                }
            })
            
            if (res.status !== 200) {
                throw `阅读页请求失败: ${res.status}`
            }

            const doc = new HtmlDocument(res.body)
            const images = []
            
            // 从阅读页提取所有图片 data-src
            const imgElements = doc.querySelectorAll("#showimgcontent figure.cImg img.lazy-image")
            for (const img of imgElements) {
                let src = img.attributes?.["data-src"] || img.attributes?.src || ""
                
                // 只保留有效的图片URL
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

            return { images }
        },

        onImageLoad: (url, comicId, epId) => {
            return {
                url: url,
                headers: {
                    "Referer": `${this.baseUrl}/comic/${comicId.replace(/^mw_/, '')}/${epId}`,
                    "User-Agent": this.UA,
                    "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
                    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                }
            }
        }
    }
}
