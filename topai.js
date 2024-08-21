const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs");
const util = require("./util");

const width = 1024;
const height = 1600;

const data = [];
const categoryList = [];
let count = 0;

const getRandomElement = (array) =>
  array[Math.floor(Math.random() * array.length)];

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:88.0) Gecko/20100101 Firefox/88.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:85.0) Gecko/20100101 Firefox/85.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:83.0) Gecko/20100101 Firefox/83.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 Edge/16.17017",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36",
];

const acceptLanguages = [
  "en-US,en;q=0.9",
  "en-GB,en;q=0.8",
  "fr-FR,fr;q=0.7",
  "de-DE,de;q=0.7",
  "es-ES,es;q=0.8",
  "it-IT,it;q=0.7",
  "pt-BR,pt;q=0.8",
  "ru-RU,ru;q=0.8",
  "ja-JP,ja;q=0.8",
  "zh-CN,zh;q=0.8",
  "ko-KR,ko;q=0.8",
  "nl-NL,nl;q=0.8",
  "sv-SE,sv;q=0.8",
  "no-NO,no;q=0.8",
  "da-DK,da;q=0.8",
];

const productDetailCrawlerRetry = async (browser, crawlerData, i) => {
  const page = await browser.newPage();

  // 랜덤 User-Agent와 Accept-Language 설정
  await page.setUserAgent(getRandomElement(userAgents));
  await page.setExtraHTTPHeaders({
    "accept-language": getRandomElement(acceptLanguages),
  });

  await page.goto(crawlerData[i].url, {
    waitUntil: "load",
    timeout: 0,
  });

  await util.delay(util.getRandomDelay(1000, 4000));

  const content = await page.content();
  const $ = cheerio.load(content);

  const titleSelector =
    "#main > div.page-header.d-flex.align-items-center.bg-dark > div > div > div.col-12.d-md-flex.justify-content-between > h1 > span";
  const overViewSelector =
    "#main > div.page-header.d-flex.align-items-center.bg-dark > div > div > div.row.justify-content-center > div.col-12.col-xl-6.px-0.order-2.order-md-1 > p";
  const tagSelector =
    "#main > div.page-header.d-flex.align-items-center.bg-dark > div > div > div.row.justify-content-center > div.col-12.col-xl-6.px-0.order-2.order-md-1 > div > p.my-2 > span";

  const descriptionsSelector =
    "#tool > div > div.row.gy-4.justify-content-center > div.col-md-9.col-12 > article > div > div";

  const similarProductsSelector = "#alternatives > ul > li";
  const productUrlSelector =
    "#main > div.page-header.d-flex.align-items-center.bg-dark > div > div > div.row.justify-content-center > div.col-12.col-xl-6.px-0.order-2.order-md-1 > div.mt-4.mb-2 > span > a";

  const title = $(titleSelector).text();
  const overView = $(overViewSelector).text();
  const productUrl = $(productUrlSelector).attr("href");
  const tags = [];
  $(tagSelector).each((idx, el) => {
    tags.push($(el).text());
  });

  const similarProductTitles = [];
  $(similarProductsSelector).each((idx, el) => {
    const similarProductTitle = $(el)
      .find("h3")
      .text()
      .replace(/\s+/g, "")
      .trim();
    similarProductTitles.push(similarProductTitle);
  });

  let answer = 0;
  $(descriptionsSelector).each((idx, el) => {
    const divClass = $(el).attr("class");
    if (divClass !== "my") {
      answer++;
      const $descriptionDiv = $(el);
      // div 요소의 전체 텍스트
      const fullText = $descriptionDiv.text();

      const h2Text = $descriptionDiv.find("h2").text();

      if (h2Text === "" && answer === 2) {
        answer--;
        return;
      }

      if (h2Text.includes("Demo Video & screenshots") && answer > 5) {
        return;
      }

      const textWithoutH2 = fullText.replace(h2Text, "").trim();

      switch (answer) {
        case 1:
          data[i] = {
            ...data[i],
            q1: h2Text,
            a1: textWithoutH2,
          };
          break;
        case 2:
          data[i] = {
            ...data[i],
            q2: h2Text,
            a2: textWithoutH2,
          };
          break;
        case 3:
          const replaceAnswer = textWithoutH2.replace(
            "People also search for:",
            ""
          );
          data[i] = {
            ...data[i],
            q3: "People also search for:",
            a3: replaceAnswer,
          };
          break;
        case 4:
          data[i] = {
            ...data[i],
            q4: h2Text,
            a4: textWithoutH2,
          };
          break;
        case 5:
          data[i] = {
            ...data[i],
            q5: h2Text,
            a5: textWithoutH2,
          };
          break;
        case 6:
          data[i] = {
            ...data[i],
            q6: h2Text,
            a6: textWithoutH2,
          };
          break;
        case 7:
          if (h2Text.includes("Find more")) {
            data[i] = {
              ...data[i],
              q7: h2Text,
              a7: textWithoutH2,
            };
          }
          break;
      }
    }
  });

  await util.delay(util.getRandomDelay(1000, 4000));

  if (title === "") {
    await page.close();
    return false;
  }
  data[i] = {
    ...data[i],
    title,
    productUrl,
    overView,
    tags: tags,
    similarProductTitles: similarProductTitles,
  };

  await page.close();

  return true;
};

const productDetailCrawler = async (browser, crawlerData) => {
  for (let i = 0; i < crawlerData.length; i++) {
    // 몇 번의 요청 후 브라우저를 재시작
    const result = await productDetailCrawlerRetry(browser, crawlerData, i);
    if (!result) {
      let retryCount = 0;

      while (true) {
        const result = await productDetailCrawlerRetry(browser, crawlerData, i);
        retryCount++;
        console.log("retryCount", i, retryCount);
        if (result) {
          break;
        }

        if (retryCount > 3) {
          data[i] = {
            ...data[i],
            title: "error",
          };
          break;
        }
      }
    }
  }
};

const pageCategoryCrawler = async (browser) => {
  const url = "https://topai.tools/categories";

  const page = await browser.newPage();

  await page.setUserAgent(getRandomElement(userAgents));
  await page.setExtraHTTPHeaders({
    "accept-language": getRandomElement(acceptLanguages),
  });

  await page.goto(url);
  await util.delay(600);

  const content = await page.content();
  const $ = cheerio.load(content);

  const categoriesSelector = "#gallery > div.container > div.row.my-4 > div";

  $(categoriesSelector).each(async (idx, el) => {
    const linkSelector = "a";
    const categoryUrl = $(el).find(linkSelector).attr("href");

    if (categoryUrl && categoryUrl.includes("http")) {
      return;
    }

    categoryList.push(categoryUrl);
  });
};

const productCountCrawler = async (browser, category) => {
  const url = `https://topai.tools${category}`;
  const page = await browser.newPage();
  await page.setUserAgent(getRandomElement(userAgents));
  await page.setExtraHTTPHeaders({
    "accept-language": getRandomElement(acceptLanguages),
  });

  await page.goto(url);
  await util.delay(600);

  const content = await page.content();
  const $ = cheerio.load(content);

  const countSelector =
    "#gallery > div.container.mt-4 > div > div > h2 > small";

  const countText = $(countSelector).text();
  const countString = countText.replace("AI Tools for:", "").trim();

  await page.close();

  return parseInt(countString);
};

const pageListCrawler = async (browser, i, category) => {
  const url = `https://topai.tools${category}&p=${i}`;
  const page = await browser.newPage();
  let pageListCrawlerCount = 0;

  await page.setUserAgent(getRandomElement(userAgents));
  await page.setExtraHTTPHeaders({
    "accept-language": getRandomElement(acceptLanguages),
  });

  await page.goto(url);
  await util.delay(600);

  const content = await page.content();
  const $ = cheerio.load(content);

  const productsSelector = "#tools_gallery > div > div.col-lg-9.col-12 > div";

  $(productsSelector).each(async (idx, el) => {
    count++;
    pageListCrawlerCount++;
    const linkSelector = "div.col-md-9.col-12 > div > div.d-flex.pt-2 > h3 > a";
    const productUrl = $(el).find(linkSelector).attr("href");

    if (
      productUrl.includes("http") ||
      productUrl.includes("crayo.ai/?ref=topaitools") ||
      productUrl.includes("ramblefix")
    ) {
      return;
    }
    data.push({
      count: count,
      url: "https://topai.tools" + productUrl,
    });
  });

  await page.close();

  return pageListCrawlerCount;
};

const crawler = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: true,
  });

  await pageCategoryCrawler(browser);
  for (category of categoryList) {
    const productCount = await productCountCrawler(browser, category);

    const pageCount = Math.floor(productCount / 30) + 1;
    console.log("productCount", category, productCount, pageCount);
    for (let i = 1; i < pageCount + 1; i++) {
      const pageListCrawlerCount = await pageListCrawler(browser, i, category);

      if (pageListCrawlerCount === 0) {
        while (true) {
          const pageListCrawlerCount = await pageListCrawler(
            browser,
            i,
            category
          );
          console.log("pageListCrawlerCount", i, pageListCrawlerCount);
          if (pageListCrawlerCount > 0) {
            break;
          }
        }
      }
    }
  }

  await productDetailCrawler(browser, data);

  const data2 = data.filter((item) => item.title !== "error");
  const errorData = data.filter((item) => item.title === "error");

  const jsonName = "";

  fs.writeFileSync(
    `./data/${jsonName}-error.json`,
    JSON.stringify(errorData, null, 2)
  );

  fs.writeFileSync(`./data/${jsonName}.json`, JSON.stringify(data2, null, 2));

  // await page.close();
  await browser.close();
};

crawler().then(() => {
  console.log("크롤러 완료", data.length);
});
