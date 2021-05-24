const puppeteer = require('puppeteer');
const open = require('open');

const URL = process.argv[2] || 'https://www.doctolib.fr/vaccination-covid-19/vanves?ref_visit_motive_ids[]=6970&ref_visit_motive_ids[]=7005&force_max_limit=2';

// const URL = process.argv[2] || 'https://www.doctolib.fr/vaccination-covid-19/vanves?ref_visit_motive_ids[]=6970&ref_visit_motive_ids[]=7005&force_max_limit=2';

console.log(`URL: ${URL}`);

let browser = null;

main();

async function main() {
  browser = await puppeteer.launch({
    headless: false,
  });
  
  run();
}

async function run(cpt = 1) {
  console.log(`checking ${cpt} ...`);
  try {
    await getDoses();
  } catch (e) {
    console.error(e);
  } finally {
    run(cpt + 1);
  }
}

function waitFor(to) {
  return new Promise((sucess) => {
    setTimeout(() => {
      sucess();
    }, to);
  });
}

async function getDoses() {
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({ width: 1800, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });

  await page.evaluate(() => new Promise((resolve) => {
    let scrollTop = -1;
    const interval = setInterval(() => {
      window.scrollBy(0, 100);
      if(document.documentElement.scrollTop !== scrollTop) {
        scrollTop = document.documentElement.scrollTop;
        return;
      }
      // window.scrollTo(0, 0);
      clearInterval(interval);
      resolve();
    }, 100);
  }));
  await waitFor(4000);

  const list = await page.evaluate(() => {
    const blacklist = ['Saint-Mandé'];
    const whitelist = ['Porte de Versailles', '7eme', 'Mairie du 6', 'Paris 14', 'Paris 15', 'Malakoff', 'Issy', 'Pasteur', 'Montrouge', 'Dunant'];
    return Array.from(document.querySelectorAll('.dl-search-result'))
      .filter(element => !element.innerHTML.includes('Aucun rendez-vous'))
      .filter(element => !blacklist.some((e) => element.innerHTML.includes(e)))
      .filter(element => whitelist.some((e) => element.innerHTML.includes(e)))
      .map(element => element.querySelector('.dl-search-result-name'))
      .map(element => ({ name: element.innerText.trim(), url: element.href }))
  });

  if (list.length > 0) {
    await page.screenshot({ path: 'screen_found.png' });
	console.log('\x07', list.map(item => `${item.name}\n${item.url}`).join('\n'));
	
	list.forEach(async (item) => {
      await page.goto(item.url, { waitUntil: 'networkidle0' });
	  open(item.url);
    });
	
	await waitFor(600000);
  }

  await page.close();
  return list;
}
