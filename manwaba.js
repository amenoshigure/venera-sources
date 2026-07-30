/** @type {import('./_venera_.js')} */
class ManWaBa extends ComicSource {
  name = "漫蛙吧";
  key = "manwaba";
  version = "1.0.4";
  minAppVersion = "1.4.0";
  url = "https://cdn.jsdelivr.net/gh/amenoshigure/venera-sources@main/manwaba.js";

  // ============================================
  // 【修改点1】尝试更换 API 地址
  // 先试试这几个可能的地址
  // ============================================
  api = "https://manwa.me/api";  // 改成 manwa.me 的 API

  // ============================================
  // 【修改点2】如果 API 不行，改用 HTML 解析
  // 使用 baseUrl 访问网页
  // ============================================
  baseUrl = "https://manwa.me";

  init() {
    // 原有的 fetchJson 方法保持不变
    this.fetchJson = async (url, { method = "GET", params, headers, payload }) => {
      if (params) {
        let params_str = Object.keys(params)
          .map((key) => `${key}=${params[key]}`)
          .join("&");
        url += `?${params_str}`;
      }
      let res = await Network.sendRequest(method, url, headers, payload);
      if (res.status !== 200) {
        throw `Invalid status code: ${res.status}, body: ${res.body}`;
      }
      let json = JSON.parse(res.body);
      return json;
    };

    // 新增 HTML 请求方法
    this.requestGet = async (url, referer = this.baseUrl) => {
      return await Network.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': referer
        }
      });
    };

    this.logger = {
      error: (msg) => { log("error", this.name, msg); },
      info: (msg) => { log("info", this.name, msg); },
      warn: (msg) => { log("warning", this.name, msg); },
    };
  }

  // ============================================
  // 【修改点3】发现页 - 使用 HTML 解析
  // ============================================
  explore = [
    {
      title: this.name,
      type: "singlePageWithMultiPart",
      load: async (page) => {
        // 如果 API 可用，使用 API
        try {
          const url = `${this.api}/home`;
          const data = await this.fetchJson(url, { params: { page: 1, pageSize: 6 } }).then(res => res.data);
          // ... 解析 API 数据
        } catch (e) {
          // API 失败，使用 HTML 解析
          const res = await this.requestGet(this.baseUrl);
          const doc = new HtmlDocument(res.body);
          const parts = doc.querySelectorAll(".manga-area, .comic-list, .update-list");
          const result = {};
          for (const part of parts) {
            const title = part.querySelector("h2, h3, .title")?.text?.trim() || "推荐";
            const items = part.querySelectorAll(".comic-item, .manga-cover, .item");
            const comics = [];
            for (const item of items) {
              const a = item.querySelector("a");
              const href = a?.attributes?.href || "";
              const id = href.split("/").pop() || "";
              const name = item.querySelector(".title, .name, .comic-title")?.text?.trim() || "";
              const cover = item.querySelector("img")?.attributes?.src || "";
              if (id && name) {
                comics.push({ id, title: name, cover });
              }
            }
            if (comics.length > 0) {
              result[title] = comics;
            }
          }
          doc.dispose();
          return result;
        }
      },
    },
  ];

  // ============================================
  // 【修改点4】搜索 - 使用 HTML 解析
  // ============================================
  search = {
    load: async (keyword, options, page) => {
      // 尝试 API 搜索
      try {
        const url = `${this.api}/search`;
        const data = await this.fetchJson(url, {
          params: { keyword, type: "mh", page: page || 1, pageSize: 20 }
        }).then(res => res.data);
        // ... 解析 API 数据
      } catch (e) {
        // API 失败，使用 HTML 解析
        const url = `${this.baseUrl}/search?keyword=${encodeURIComponent(keyword)}&page=${page || 1}`;
        const res = await this.requestGet(url);
        const doc = new HtmlDocument(res.body);
        const items = doc.querySelectorAll(".comic-item, .manga-cover, .item");
        const comics = [];
        for (const item of items) {
          const a = item.querySelector("a");
          const href = a?.attributes?.href || "";
          const id = href.split("/").pop() || "";
          const title = item.querySelector(".title, .name, .comic-title")?.text?.trim() || "";
          const cover = item.querySelector("img")?.attributes?.src || "";
          if (id && title) {
            comics.push({ id, title, cover });
          }
        }
        doc.dispose();
        return { comics, maxPage: 1 };
      }
    }
  };

  // ============================================
  // 【修改点5】漫画详情 - 使用 HTML 解析
  // ============================================
  comic = {
    loadInfo: async (id) => {
      // 尝试 API
      try {
        const url = `${this.api}/comic/${id}`;
        const data = await this.fetchJson(url).then(res => res.data);
        // ... 解析 API 数据
      } catch (e) {
        // API 失败，使用 HTML 解析
        const url = `${this.baseUrl}/comic/${id}`;
        const res = await this.requestGet(url);
        const doc = new HtmlDocument(res.body);
        const title = doc.querySelector(".title, .comic-title, h1")?.text?.trim() || id;
        const cover = doc.querySelector(".cover img, .comic-cover img")?.attributes?.src || "";
        const desc = doc.querySelector(".intro, .description, .desc")?.text?.trim() || "";
        const author = doc.querySelector(".author")?.text?.trim() || "";
        
        const chapterItems = doc.querySelectorAll(".chapter-list li, .chapters a, .list a");
        const chapters = {};
        for (const item of chapterItems) {
          const href = item.attributes?.href || "";
          const cid = href.split("/").pop() || "";
          const name = item.text?.trim() || "";
          if (cid && name) {
            chapters[cid] = name;
          }
        }
        doc.dispose();
        return new ComicDetails({ title, cover, description: desc, subTitle: author, chapters, url });
      }
    },

    loadEp: async (comicId, epId) => {
      // 尝试 API
      try {
        const url = `${this.api}/comic/image/${epId}`;
        const data = await this.fetchJson(url).then(res => res.data);
        // ... 解析 API 数据
      } catch (e) {
        // API 失败，使用 HTML 解析
        const url = `${this.baseUrl}/read/${comicId}/${epId}`;
        const res = await this.requestGet(url);
        const doc = new HtmlDocument(res.body);
        const images = [];
        for (const img of doc.querySelectorAll("img")) {
          const src = img.attributes?.src || "";
          if (src && !src.includes("logo") && !src.includes("icon") && !src.includes("avatar")) {
            images.push(src);
          }
        }
        doc.dispose();
        return { images };
      }
    }
  };

  // ============================================
  // 分类（保持不变，但需要确认 API 地址）
  // ============================================
  category = {
    title: this.name,
    parts: [
      {
        name: "类型",
        type: "fixed",
        categories: ["全部", "热血", "玄幻", "恋爱", "冒险", "古风", "都市", "穿越", "奇幻", "搞笑", "战斗", "重生", "逆袭", "BL", "韩漫", "完整版"],
        categoryParams: ["", "热血", "玄幻", "恋爱", "冒险", "古风", "都市", "穿越", "奇幻", "搞笑", "战斗", "重生", "逆袭", "BL", "韩漫", "完整版"],
        itemType: "category"
      }
    ]
  };

  categoryComics = {
    load: async (category, param, options, page) => {
      // 尝试使用 API
      try {
        const url = `${this.api}/cate`;
        const payload = JSON.stringify({
          page: { page: page, pageSize: 10 },
          category: "comic",
          sort: parseInt(options[2] || 0),
          comic: { status: parseInt(options[0] || 2), day: parseInt(options[1] || 0), tag: param }
        });
        const data = await this.fetchJson(url, { method: "POST", payload }).then(res => res.data);
        // ... 解析
      } catch (e) {
        // API 失败，使用 HTML 解析
        const url = `${this.baseUrl}/category/${param}?page=${page}`;
        const res = await this.requestGet(url);
        const doc = new HtmlDocument(res.body);
        const items = doc.querySelectorAll(".comic-item, .manga-cover, .item");
        const comics = [];
        for (const item of items) {
          const a = item.querySelector("a");
          const href = a?.attributes?.href || "";
          const id = href.split("/").pop() || "";
          const title = item.querySelector(".title, .name, .comic-title")?.text?.trim() || "";
          const cover = item.querySelector("img")?.attributes?.src || "";
          if (id && title) {
            comics.push({ id, title, cover });
          }
        }
        doc.dispose();
        return { comics, maxPage: 100 };
      }
    },
    optionList: [
      { options: ["2-全部", "0-连载中", "1-已完结"] },
      { options: ["0-全部", "1-周一", "2-周二", "3-周三", "4-周四", "5-周五", "6-周六", "7-周日"] },
      { options: ["0-更新", "1-新作", "2-畅销", "3-热门", "4-收藏"] }
    ]
  };
}
