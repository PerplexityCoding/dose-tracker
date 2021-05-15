const puppeteer = require('puppeteer');

const URL = 'https://www.doctolib.fr/vaccination-covid-19/nantes?ref_visit_motive_ids[]=6970&ref_visit_motive_ids[]=7005&force_max_limit=2';

trackDose();

async function trackDose(cpt = 1) {
  console.log(`checking ${cpt} ...\n`);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setCacheEnabled(false);
  await page.setViewport({ width: 1600, height: 5000 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'screen.png' });

  const list = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.dl-search-result'))
      .filter(element => !element.innerHTML.includes('Aucun rendez-vous'))
      .map(element => element.querySelector('.dl-search-result-name'))
      .map(element => ({ name: element.innerText, url: element.href }));
  });

  if (list.length > 0) {
    process.stdout.write('\x07');
    console.log(list.map(item => `${item.name}\n${item.url}\n`).join('\n'));
  }

  await browser.close();

  trackDose(cpt + 1);
}
