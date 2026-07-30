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

/**
 * Check if response is a Cloudflare challenge page
 */
function isCloudflareChallenge(status, body) {
    if (status === 403 || status === 503) {
        if (body && (body.indexOf("challenge-platform") !== -1 ||
            body.indexOf("cf-browser-verification") !== -1 ||
            body.indexOf("Just a moment") !== -1 ||
            body.indexOf("__cf_chl_") !== -1)) {
            return true;
        }
        return true;
    }
    if (body && body.indexOf("challenge-platform") !== -1) {
        return true;
    }
    return false;
}

/**
 * Wrapper for Network.get that detects Cloudflare challenges
 */
async function fetchWithCFCheck(url, referer = BASE_URL) {
    const headers = {
        ...HEADERS,
        "Referer": referer,
    };
    const resp = await Network.get(url, headers);
    if (isCloudflareChallenge(resp.status, resp.body)) {
        throw "Cloudflare 验证拦截：请在漫画源设置中点击「登录」，通过内置浏览器完成一次 Cloudflare 验证后即可正常使用。";
    }
    return resp;
}

/**
 * Extract meta tag content from HTML
 */
function getMetaContent(html, name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    let m = new RegExp(
        "<meta[^>]*?(?:name|property)=['\"]" + escaped + "['\"][^>]*?content=['\"]([^'\"]*)['\"]",
        "i"
    ).exec(html);
    if (m) return m[1];
    m = new RegExp(
        "<meta[^>]*?content=['\"]([^'\"]*)['\"][^>]*?(?:name|property)=['\"]" + escaped + "['\"]",
        "i"
    ).exec(html);
    if (m) return m[1];
    return null;
}

/**
 * Fix image URL to absolute HTTPS
 */
function fixImageUrl(url) {
    if (!url) return "";
    if (typeof url !== 'string') return "";
    url = url.trim();
    if (!url) return "";
    if (url.startsWith('https://')) return url;
    if (url.startsWith('http://')) return url.replace('http://', 'https://');
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return `https://${CDN_URL}${url}`;
    return `https://${CDN_URL}/${url}`;
}

class ManWaBa extends ComicSource {
    name = "漫蛙吧"
    key = "manwaba_final"
    version = "1.0.30"
    minAppVersion = "1.4.6"
    url = "https://cdn.jsdelivr.net/gh/amenoshigure/venera-sources@main/manwaba.js"

    // ============================================
    // ✅ Settings - 用户可配置
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
    // ✅ Account - Cloudflare验证
    // ============================================
    account = {
        loginWithWebview: {
            url: "https://manwa.me",
            checkStatus: (url, title) => {
                if (!url || !title) return false;
                if (title.indexOf("moment") !== -1) return false;
                if (title.indexOf("Cloudflare") !== -1) return false;
                if (title.indexOf("challenge") !== -1) return false;
                if (url.indexOf("manwa.me") !== -1) return true;
                return false;
            },
            onLoginSuccess: () => {
                const cookies = Network.getCookies("https://manwa.me");
                console.log("[漫蛙吧] Login success. Cookies: " + (cookies ? cookies.length : 0));
            },
        },
        logout: () => {
            Network.deleteCookies("https://manwa.me");
        },
        registerWebsite: null,
    }

    // ============================================
    // 工具方法
    // ============================================
    async requestGet(url, referer = this.baseUrl) {
        return await fetchWithCFCheck(url, referer);
    }

    toAbsoluteUrl = (url) => {
        return fixImageUrl(url);
    }

    fixImageUrl = (url) => {
        let fixed = this.toAbsoluteUrl(url);
        // WebP转JPG
        if (this.fixWebp && fixed.includes('.webp')) {
            fixed = fixed.replace(/\.webp(\?.*)?$/, '.jpg$1');
        }
        return fixed;
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
    // 探索页
    // ============================================
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
                    const link = item.querySelector("a[href^='/book/']")
                    const href = link?.attributes?.href || ""
                    const baseId = href.split("/").pop() || ""
                    const id = `mw_${baseId}`
                    const title = item.querySelector(".book-title, .comic-title, .name")?.text?.trim() || ""
                    const img = item.querySelector("img")
                    let cover = img?.attributes?.["data-original"] || img?.attributes?.src || ""
                    cover = this.fixImageUrl(cover)
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

            const html = res.body
            const doc = new HtmlDocument(html)
            
            // ✅ 使用meta标签提取
            let title = getMetaContent(html, "og:title") || 
                        getMetaContent(html, "title") || 
                        realId
            title = title.replace(/-漫蛙漫画.*$/, "").trim()
            
            const author = doc.querySelector(".detail-main-info-author")?.text?.replace("作者：", "").trim() || "未知"
            const status = doc.querySelector(".detail-main-info-status")?.text?.replace("更新状态：", "").trim() || "连载中"
            const lastChapter = doc.querySelector(".detail-main-info-chapter")?.text?.replace("最新章节：", "").trim() || ""

            let cover = getMetaContent(html, "og:image") || 
                        doc.querySelector(".book-cover-img")?.attributes?.src || 
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
