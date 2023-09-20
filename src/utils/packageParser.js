const puppeteer = require('puppeteer');
const axios = require('axios');
const request_client = require('request-promise-native');
fs = require('fs');

const minimal_args = [
  '--autoplay-policy=user-gesture-required',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-breakpad',
  '--disable-client-side-phishing-detection',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-dev-shm-usage',
  '--disable-domain-reliability',
  '--disable-extensions',
  '--disable-features=AudioServiceOutOfProcess',
  '--disable-hang-monitor',
  '--disable-ipc-flooding-protection',
  '--disable-notifications',
  '--disable-offer-store-unmasked-wallet-cards',
  '--disable-popup-blocking',
  '--disable-print-preview',
  '--disable-prompt-on-repost',
  '--disable-renderer-backgrounding',
  '--disable-setuid-sandbox',
  '--disable-speech-api',
  '--disable-sync',
  '--hide-scrollbars',
  '--ignore-gpu-blacklist',
  '--metrics-recording-only',
  '--mute-audio',
  '--no-default-browser-check',
  '--no-first-run',
  '--no-pings',
  '--no-zygote',
  '--password-store=basic',
  '--use-gl=swiftshader',
  '--use-mock-keychain',
  '--no-sandbox',
  '--disabled-setupid-sandbox',
  `--window-size=1920,1080`,
];
async function packageParser(url) {
  return new Promise(async (resolve, reject) => {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: false,
        args: minimal_args,
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
      });
      console.log('Start brows');
      const page = await browser.newPage();
      console.log('Start page');
      //   await page.setRequestInterception(true);

      await page
        .goto(url, {
          waitUntil: 'networkidle0',
          timeout: 0,
        })
        .catch(() => {
          reject();
        });
      console.log('Open page');
      await sleep(1000);
      const text = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.pack-wrapper > div'), (element) => {
          let dataObj = {};
          dataObj.imageName = element.querySelector('img').src.split('/cover/')[1];
          dataObj.imageFull = element.querySelector('img').src;
          dataObj.name = element.querySelector('.pack-name')?.innerHTML;
          dataObj.price = element.querySelector('.pack-prices_actual')?.innerHTML?.split(' ')[0];
          if (dataObj.price) {
            dataObj.price = parseInt(dataObj.price);
          }

          dataObj.priceDiscount = element.querySelector('.pack-prices_old.price-old')?.innerHTML?.split(' ')[0];
          if (dataObj.priceDiscount) {
            dataObj.priceDiscount = parseInt(dataObj.priceDiscount);
          } else {
            dataObj.priceDiscount = 0;
          }

          dataObj.disabled = !!element.querySelector('.outofstock-banner_label');

          return dataObj;
        }),
      );
      resolve(text);
    } catch (error) {
      console.log(error);
      reject([]);
    } finally {
      await browser?.close()?.catch((er) => {
        reject([]);
      });
    }
  })
    .then((resultData) => resultData)
    .catch((er) => {
      console.log('ERROR SCRIPT', er);
      return [];
    });
}
module.exports = { packageParser };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
