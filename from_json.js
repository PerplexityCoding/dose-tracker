const bent = require('bent');
const centerIds = [ 5953378, 5879004, 6105840, 6107267, 6106603 ];
const getJSON = bent('json');
const open = require('open');

const doctoUrl = (id) => `https://www.doctolib.fr/search_results/${id}.json?ref_visit_motive_ids%5B%5D=6970&ref_visit_motive_ids%5B%5D=7005&speciality_id=5494&search_result_format=json&force_max_limit=2`;

run();

async function run(cpt = 1) {
    console.log(`checking ${cpt} ...`);
    try {
        const list = await getDoses();
        if (list.length > 0) {
            console.log('\x07', list.map(item => `${item.name}\n${item.url}`).join('\n'));
            list.forEach((item) => {
                open(`https://www.doctolib.fr/${item.url}`);
            });
        }

        await waitFor(1000);
    } catch (e) {
        console.error(e);
    } finally {
        run(cpt + 1);
    }
}

function waitFor(to) {
    return new Promise((success) => {
        setTimeout(() => {
            success();
        }, to);
    });
}

async function getDoses() {
    const doses = [];
    for (const centerId of centerIds) {
        const url = doctoUrl(centerId);
        const data = await getJSON(url);

        if (data) {
			if (data.reason != 'no_availabilities') {
			    console.log(data);
				doses.push(data.search_result);
			}
			
			console.log(data)
			
			if (!data.search_result) {
				console.error(`${centerId} not working`);
			} else {
				console.log(data.search_result.city);
			}
        }

        await waitFor(500);
    }
    return doses;
}