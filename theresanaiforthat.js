const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs");
const util = require("./util");

const data = [];

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

const productDetailCrawlerBoolean = async (browser, crawlerData, i) => {
  try {
    const page = await browser.newPage();

    // 랜덤 User-Agent와 Accept-Language 설정
    await page.setUserAgent(getRandomElement(userAgents));
    await page.setExtraHTTPHeaders({
      "accept-language": getRandomElement(acceptLanguages),
    });

    await page.goto(crawlerData[i].url, {
      waitUntil: "load",
      timeout: 500,
    });

    await util.delay(util.getRandomDelay(1000, 4000));

    const content = await page.content();
    const $ = cheerio.load(content);

    const titleSelector =
      "#overview > div.header_row > div.left > div.column > div > h1";
    const averageRatingSelector =
      "#overview > div.header_row > div.left > div.column > span > a.rating_top > span:nth-child(2)";
    const bookmarkCountSelector =
      "#overview > div.header_row > div.left > div.column > span > div";
    const productLinkSelector = "#ai_top_link";
    const simpleDescriptionSelector = "#use_case";
    const alternativeProductCountSelector = "#rank > div.nobg";

    const descriptionSelector =
      "#data_cont > div.rright > div > div.description";
    const categorySelector = "#rank > a.rank_inner > span.task_label";
    const tagSelector = "#rank > div.tags > a";
    const tagList = [];
    const priceSelector = "#rank > div > span";

    const title = $(titleSelector).text().replace(",", "");
    const averageRating = $(averageRatingSelector).text().replace(",", "");
    const bookmarkCount = $(bookmarkCountSelector).text().replace(",", "");
    const productLink = $(productLinkSelector).attr("href");
    const simpleDescription = $(simpleDescriptionSelector).text();
    let alternativeProductCount = $(alternativeProductCountSelector).text();

    // 괄호 안의 숫자 추출 (쉼표가 있는 경우와 없는 경우 모두 처리)
    const matchCount = alternativeProductCount.match(/\(([\d,]+)\s+saves\)/);

    let extractedCount = matchCount ? matchCount[1].replace(/,/g, "") : 0; // 쉼표 제거

    let description = $(descriptionSelector).text();
    description = description.replace(/\s+/g, " ").trim();
    const category = $(categorySelector).text();
    $(tagSelector).each((idx, el) => {
      tagList.push($(el).text());
    });
    const price = $(priceSelector).text();
    if (title === "") {
      await page.close();
      return false;
    }
    crawlerData[i] = {
      ...crawlerData[i],
      title: title,
      averageRating: averageRating || 0,
      bookmarkCount: bookmarkCount || 0,
      productLink: productLink || "",
      simpleDescription: simpleDescription,
      alternativeProductCount: extractedCount,
      description: description,
      category: category,
      tagList: tagList,
      price: price,
    };

    await util.delay(util.getRandomDelay(1000, 3000));

    await page.close();

    return true;
  } catch (e) {
    console.log("error", e, crawlerData[i].url);

    await page.close();
    return false;
  }
};

const productDetailCrawler = async (browser, crawlerData) => {
  // for (let i = 0; i < 10; i++) {
  for (let i = 0; i < crawlerData.length; i++) {
    const result = await productDetailCrawlerBoolean(browser, crawlerData, i);

    if (!result) {
      let retryCount = 0;

      while (true) {
        const result = await productDetailCrawlerBoolean(
          browser,
          crawlerData,
          i
        );
        retryCount++;
        if (result) {
          break;
        }

        if (retryCount > 1) {
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

const crawler = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: true,
  });

  for (let i = 1; i <= 19; i++) {
    const page = await browser.newPage();
    await page.setUserAgent(getRandomElement(userAgents));
    await page.setExtraHTTPHeaders({
      "accept-language": getRandomElement(acceptLanguages),
    });

    await page.goto(`https://theresanaiforthat.com/period/2024/page/${i}/`);
    await util.delay(500);

    const content = await page.content();
    const $ = cheerio.load(content);

    // #data_hist > div.letter > div > div > li.li.m.active
    const productsSelector = "#data_hist > div.letter > div > div > li.li.m";

    $(productsSelector).each(async (idx, el) => {
      const linkSelector = "div.ai_link_wrap > a.ai_link.new_tab";
      const productUrl = $(el).find(linkSelector).attr("href");

      if (productUrl.includes("https")) {
        return;
      }
      data.push({
        ranking: idx + 1,
        url: "https://theresanaiforthat.com" + productUrl,
      });
    });
    console.log("data count ", data.length);
    await util.delay(util.getRandomDelay(1000, 3000));

    await page.close();
  }

  // console.log("data count", data.length);

  await productDetailCrawler(browser, data);

  const data2 = data.filter((item) => item.title !== "error");
  const errorData = data.filter((item) => item.title === "error");

  const jsonName = "2024";

  fs.writeFileSync(
    `./data/${jsonName}-error.json`,
    JSON.stringify(errorData, null, 2)
  );
  fs.writeFileSync(`./data/${jsonName}.json`, JSON.stringify(data2, null, 2));

  // await page.close();
  await browser.close();
};

crawler().then(() => {
  console.log("크롤러 완료");
});
