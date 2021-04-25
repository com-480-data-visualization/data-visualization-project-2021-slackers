const highResolution = true;
const projector = d3.geoNaturalEarth1(); /*geoNaturalEarth1, geoMercator, geopEquirectangular etc.*/
const chosenTrait = 'extr';


const RES = highResolution ? 50 : 110;

function rowConverter(d) {
	return {
		id: parseInt(d.case_id),
		country: d.country,
		age: parseInt(d.age),
		sex: parseInt(d.sex),
		agre: parseFloat(d.agreeableness),
		extr: parseFloat(d.extraversion),
		open: parseFloat(d.openness),
		cons: parseFloat(d.conscientiousness),
		neur: parseFloat(d.neuroticism)
	}
}

function whenDocumentLoaded(action) {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", action);
	} else {
		action();
	}
}

function makeWorldMap() {
	const svg = d3.select('svg');
	svg.attr("width", 960).attr("height", 500);


	const height = +svg.attr("height");
	const width = +svg.attr("width");
	const projection = projector.scale(Math.min(width/ Math.PI, height/ Math.PI));
	const pathGenerator = d3.geoPath().projection(projection);

	const trait = 'open';


	const g = svg.append('g');
	svg.call(d3.zoom().on('zoom', () => {
		g.attr('transform', d3.event.transform)
	}));

	g.append('path')
		.attr('class', 'sphere')
		.attr('d', pathGenerator({type: 'Sphere'}));

	Promise.all([
		d3.tsv('https://unpkg.com/world-atlas@1.1.4/world/' + RES + 'm.tsv'),
		d3.json('https://unpkg.com/world-atlas@1.1.4/world/' + RES + 'm.json'),
		d3.csv('../clean_data.csv', rowConverter)
	]).then(([tsvData, topoJSONdata, csvData]) => {

		const id_to_name = {};
		const id_to_isoa2 = {};
		const name_to_isoa2 = {};
		tsvData.forEach(d => {
			id_to_name[d.iso_n3] = d.name;
			id_to_isoa2[d.iso_n3] = d.iso_a2;
			name_to_isoa2[d.name] = d.iso_a2;
		});

		var stats = {};
		csvData.forEach((row) => {
			const country = row.country;
		    if (! (country in stats)) {
		        stats[country] = {'count': 1, 'agre': row.agre, 'extr': row.extr, 'open': row.open, 'cons': row.cons, 'neur': row.neur};
			} else {
				stats[country].count += 1;
				stats[country].agre += row.agre;
				stats[country].extr += row.extr;
				stats[country].open += row.open;
				stats[country].cons += row.cons;
				stats[country].neur += row.neur;
			}
		});

		var min = 1;
		var max = 0;

		Object.keys(stats).forEach(key => {
		  stats[key].agre /= stats[key].count;
		  stats[key].extr /= stats[key].count;
		  stats[key].open /= stats[key].count;
		  stats[key].cons /= stats[key].count;
		  stats[key].neur /= stats[key].count;
		  max = Math.max(max, stats[key][chosenTrait])
		  min = Math.min(min, stats[key][chosenTrait])
		});

		console.log(min, max)

		const countries = topojson.feature(topoJSONdata, topoJSONdata.objects.countries);
		const colorScale = d3.scaleSequential(d3.interpolateOranges)
			.domain([min, max])


		g.selectAll('path').data(countries.features)
		  .enter().append('path')
			.attr('class', 'country')
			.attr('fill', d => {
				var color;
				try {
					color = colorScale(stats[id_to_isoa2[d.id]][chosenTrait]);
				} catch(e) {

					color = 'lightgray';
				}
				return color;
			})
			.attr('d', pathGenerator)
			.append('title')
				.text(d => {
					return id_to_name[d.id]})
	});
}


whenDocumentLoaded(() => {
	makeWorldMap();
	  });
