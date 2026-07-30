class TestSource extends ComicSource {
    name = "测试源"
    key = "test"
    version = "1.0.0"
    minAppVersion = "1.0.0"
    url = "https://example.com/"

    search = {
        load: async (keyword, options, page) => {
            return { comics: [], maxPage: 1 }
        }
    }

    comic = {
        loadInfo: async (id) => {
            return new ComicDetails({
                title: "测试漫画",
                chapters: { "1": "第1话" }
            })
        },
        loadEp: async (comicId, epId) => {
            return { images: [] }
        }
    }
}
