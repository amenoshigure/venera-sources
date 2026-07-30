class HappymhComicSource extends ComicSource {
    name = "嗨皮漫画"
    key = "happymh"
    version = "1.0.1"
    minAppVersion = "1.0.0"
    url = "https://m.happymh.com/"

    // 统一的请求头，模拟真实浏览器
    getHeaders(referer = 'https://m.happymh.com/') {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': referer,
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        };
    }

    // 如果需要Cookie，可以在这里设置
    getCookies() {
        // 从设置中读取Cookie，或使用默认值
        const cookie = this.loadSetting('cookie') || '';
        return cookie;
    }

    // 封装网络请求，自动添加headers和cookies
    async request(url, referer = 'https://m.happymh.com/') {
        const headers = this.getHeaders(referer);
        const cookie = this.getCookies();
        if (cookie) {
            headers['Cookie'] = cookie;
        }
        
        return await Network.get(url, {
            headers: headers,
            timeout: 30000,
            retry: 3
        });
    }

    /**
     * 搜索功能
     */
    search = {
        load: async (keyword, options, page) => {
            const url = `https://m.happymh.com/sssearch?keyword=${encodeURIComponent(keyword)}&page=${page}`;
            const response = await this.request(url);
            
            const html = response.data;
            const comics = [];
            
            // 解析搜索结果
            const items = html.match(/<div[^>]*class="[^"]*manga-cover[^"]*"[^>]*>[\s\S]*?<a[^>]*href="\/manga\/([^"]+)"[^>]*>[\s\S]*?<mip-img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<p[^>]*class="[^"]*manga-title[^"]*"[^>]*>([^<]+)<\/p>/g);
            if (items) {
                for (const item of items) {
                    const idMatch = item.match(/href="\/manga\/([^"]+)"/);
                    const imgMatch = item.match(/src="([^"]+)"/);
                    const titleMatch = item.match(/<p[^>]*class="[^"]*manga-title[^"]*"[^>]*>([^<]+)<\/p>/);
                    if (idMatch && titleMatch) {
                        comics.push({
                            id: idMatch[1],
                            title: titleMatch[1].trim(),
                            cover: imgMatch ? imgMatch[1] : '',
                            url: `https://m.happymh.com/manga/${idMatch[1]}`
                        });
                    }
                }
            }
            
            return {
                comics: comics,
                maxPage: 1
            };
        },
        optionList: []
    }

    /**
     * 漫画详情
     */
    comic = {
        loadInfo: async (id) => {
            const url = `https://m.happymh.com/manga/${id}`;
            const response = await this.request(url);
            
            const html = response.data;
            
            // 提取漫画标题
            const titleMatch = html.match(/<h2[^>]*class="[^"]*mg-title[^"]*"[^>]*>([^<]+)<\/h2>/);
            const title = titleMatch ? titleMatch[1].trim() : '';
            
            // 提取封面
            const coverMatch = html.match(/<mip-img[^>]*src="([^"]+)"[^>]*>/);
            const cover = coverMatch ? coverMatch[1] : '';
            
            // 提取简介
            const descMatch = html.match(/<mip-showmore[^>]*>([\s\S]*?)<\/mip-showmore>/);
            const description = descMatch ? descMatch[1].trim() : '';
            
            // 提取作者
            const authorMatch = html.match(/<p[^>]*class="[^"]*mg-sub-title[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/);
            const author = authorMatch ? authorMatch[1].trim() : '';
            
            // 提取状态
            const statusMatch = html.match(/<div[^>]*class="[^"]*onGoingStatus[^"]*"[^>]*>([^<]+)<\/div>/);
            const status = statusMatch ? statusMatch[1].trim() : '连载中';
            
            // 提取章节列表
            const chapters = [];
            const chapterLinks = html.match(/<a[^>]*class="[^"]*chapterButton[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g);
            if (chapterLinks) {
                for (const link of chapterLinks) {
                    const hrefMatch = link.match(/href="([^"]+)"/);
                    const titleMatch = link.match(/>([^<]+)<\/a>/);
                    if (hrefMatch && titleMatch) {
                        const chapterId = hrefMatch[1].split('/').pop();
                        chapters.push({
                            id: chapterId,
                            title: titleMatch[1].trim(),
                            url: `https://m.happymh.com${hrefMatch[1]}`
                        });
                    }
                }
            }
            
            return {
                id: id,
                title: title,
                cover: cover,
                author: author,
                description: description,
                status: status,
                chapters: chapters
            };
        },

        loadEp: async (comicId, epId) => {
            const url = `https://m.happymh.com/mangaread/${comicId}/${epId}`;
            // 使用漫画详情页作为Referer
            const referer = `https://m.happymh.com/manga/${comicId}`;
            const response = await this.request(url, referer);
            
            const html = response.data;
            const images = [];
            
            // 提取所有图片（过滤掉logo、icon等）
            const imgMatches = html.match(/<img[^>]*src="([^"]+)"[^>]*>/g);
            if (imgMatches) {
                for (const img of imgMatches) {
                    const srcMatch = img.match(/src="([^"]+)"/);
                    if (srcMatch) {
                        const src = srcMatch[1];
                        // 过滤非漫画图片
                        if (!src.includes('logo') && 
                            !src.includes('icon') && 
                            !src.includes('avatar') &&
                            !src.includes('favicon') &&
                            !src.includes('google') &&
                            !src.includes('edge') &&
                            !src.includes('firefox')) {
                            images.push(src);
                        }
                    }
                }
            }
            
            return {
                images: images
            };
        },

        // 图片加载配置 - 关键：添加Referer
        onImageLoad: (url, comicId, epId) => {
            return {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': `https://m.happymh.com/mangaread/${comicId}/${epId}`,
                    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
                }
            };
        }
    }

    /**
     * 探索/首页
     */
    explore = [
        {
            title: "最新更新",
            type: "multiPageComicList",
            load: async (page) => {
                const url = `https://m.happymh.com/latest?page=${page}`;
                const response = await this.request(url);
                
                const html = response.data;
                const comics = [];
                
                const items = html.match(/<div[^>]*class="[^"]*manga-cover[^"]*"[^>]*>[\s\S]*?<a[^>]*href="\/manga\/([^"]+)"[^>]*>[\s\S]*?<mip-img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<p[^>]*class="[^"]*manga-title[^"]*"[^>]*>([^<]+)<\/p>/g);
                if (items) {
                    for (const item of items) {
                        const idMatch = item.match(/href="\/manga\/([^"]+)"/);
                        const imgMatch = item.match(/src="([^"]+)"/);
                        const titleMatch = item.match(/<p[^>]*class="[^"]*manga-title[^"]*"[^>]*>([^<]+)<\/p>/);
                        if (idMatch && titleMatch) {
                            comics.push({
                                id: idMatch[1],
                                title: titleMatch[1].trim(),
                                cover: imgMatch ? imgMatch[1] : ''
                            });
                        }
                    }
                }
                
                return {
                    comics: comics,
                    maxPage: 10
                };
            }
        }
    ]

    /**
     * 设置选项 - 让用户自定义Cookie
     */
    settings = {
        cookie: {
            title: "Cookie (可选)",
            type: "input",
            default: "",
            description: "如果网站需要登录，在此粘贴Cookie"
        }
    }
}