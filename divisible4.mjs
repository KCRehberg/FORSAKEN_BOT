import puppeteer from 'puppeteer'

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds) {
      break;
    }
  }
}

export async function getDivBy4Floor() {
  try {
    // Init puppeteer
    // const browser = await puppeteer.launch()
    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })

    // Avoid cloudfare security
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en'
    });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36');

    // Navigate to the page
    const URL = 'https://opensea.io/collection/divineanarchy?search[sortBy]=PRICE&search[sortAscending]=true&search[toggles][0]=BUY_NOW'
    await page.goto(URL)


    // Click on small display
    const options = await page.$('.AssetSearchView--results-header-dropdowns')
    const btn = await options.$('button .material-icons')
    await btn.click()

    // Get min divisible by 4
    prices_for_ids = {}
    const updatePrices = async () => {
      const assets = await page.$$('.Asset--loaded')
      for (let i = 0; i < assets.length; i++) {
        prices_for_ids[await assets[i].$eval('.AssetCardFooter--name', el => el.innerText)] = await assets[i].$eval('.Price--amount', el => el.innerText)
      }
    }

    const scrollDownWaitAndUpdate = async () => {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight)
      })
      await sleep(2000)
      await updatePrices()
    }

    while (Object.keys(prices_for_ids).filter(word => parseInt(word.substring(1)) % 4 === 0).length < 3) {
      await scrollDownWaitAndUpdate()
    }

    const divisible = Object.keys(prices_for_ids).filter(word => parseInt(word.substring(1)) % 4 === 0)
    // divisible.forEach((divID) => {
    //   console.log(divID, prices_for_ids[divID])
    // })
    await browser.close()
    return divisible
  } catch (error) {
    console.error(error)
  }
}