/** @type {import('./_venera_.js')} */
class ManWaBa extends ComicSource {
    name = "漫蛙吧"
    key = "manwaba_base64"
    version = "1.0.47"
    minAppVersion = "1.4.0"
    url = "https://cdn.jsdelivr.net/gh/amenoshigure/venera-sources@main/manwaba.js"

    api = "https://mwuu.cc/api"
    baseUrl = "https://manwa.me"

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

    // ✅ 下载图片并转为Base64
    async downloadImageAsBase64(url) {
        try {
            // 使用 Network.get 获取图片二进制数据
            const response = await Network.get(url, {
                headers: {
                    "User-Agent": this.UA,
                    "Referer": this.baseUrl,
                    "Accept": "image/*,*/*;q=0.8",
                },
                responseType: "bytes"
            });
            
            if (response.status !== 200) {
                throw `下载失败: ${response.status}`;
            }
            
            // 将二进制数据转为Base64
            const base64 = Convert.encodeBase64(response.body);
            // 检测图片类型
            let mimeType = "image/jpeg";
            // 简单检测：检查前几个字节
            const bytes = response.body;
            if (bytes.length > 0) {
                if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
                    mimeType = "image/png";
                } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
                    mimeType = "image/gif";
                } else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
                    mimeType = "image/webp";
                }
                // 默认保持 image/jpeg
            }
            
            return `data:${mimeType};base64,${base64}`;
        } catch (e) {
            console.log(`图片下载失败: ${url}`, e);
            return null;
        }
    }

    // ============================================
    // Explore
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
        // ✅ 核心：下载图片转为Base64
        // ============================================
        loadEp: async (comicId, epId) => {
            const imgApi = `${this.api}/comic/image/${epId}`;
            
            // 获取图片URL列表
            const result = await this.fetchJson(imgApi, {
                params: {
                    page: 1,
                    page_size: 200,
                    imageSource: "https://tu.mwzu.cc"
                }
            });

            const imageUrls = (result?.data?.images || [])
                .map(item => item.url)
                .filter(url => url && url.length > 0);

            if (imageUrls.length === 0) {
                throw "本章未找到任何图片";
            }

            // ✅ 逐个下载图片并转为Base64
            const base64Images = [];
            for (const url of imageUrls) {
                // 修复URL：mhttu.cc -> mwzu.cc
                let fixedUrl = url;
                if (fixedUrl.includes('mhttu.cc')) {
                    fixedUrl = fixedUrl.replace('mhttu.cc', 'mwzu.cc');
                }
                if (fixedUrl.startsWith('http://')) {
                    fixedUrl = fixedUrl.replace('http://', 'https://');
                }
                
                const base64 = await this.downloadImageAsBase64(fixedUrl);
                if (base64) {
                    base64Images.push(base64);
                }
            }

            if (base64Images.length === 0) {
                throw "无法下载任何图片";
            }

            return { images: base64Images };
        },

        onImageLoad: (url, comicId, epId) => {
            // 如果已经是Base64，直接返回
            if (url.startsWith('data:image/')) {
                return { url: url };
            }
            return {
                url: url,
                headers: {
                    "Referer": this.baseUrl,
                    "User-Agent": this.UA,
                    "Accept": "image/*,*/*;q=0.8",
                }
            }
        }
    }
}
