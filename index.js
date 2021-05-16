const puppeteer = require('puppeteer');

const URL = process.argv[2] || 'https://www.doctolib.fr/vaccination-covid-19/nantes?ref_visit_motive_ids[]=6970&ref_visit_motive_ids[]=7005&force_max_limit=2';

console.log(`URL: ${URL}`);

run();

async function run(cpt = 1) {
  console.log(`checking ${cpt} ...`);
  try {
    const list = await getDoses();
    if (list.length > 0) {
      console.log('\x07', list.map(item => `${item.name}\n${item.url}`).join('\n'));
    }
  } catch (e) {
    console.error(e);
  } finally {
    run(cpt + 1);
  }
}

async function getDoses() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({ width: 1600, height: 5000 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'screen.png' });
  const list = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.dl-search-result'))
      .filter(element => !element.innerHTML.includes('Aucun rendez-vous'))
      .map(element => element.querySelector('.dl-search-result-name'))
      .map(element => ({ name: element.innerText.trim(), url: element.href })));
  await browser.close();
  return list;
}
