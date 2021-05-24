const highResolution = true;
const WIDTH = 960;
const HEIGHT = 500;
const MIN_OBS = 10;
const DEFAULTCOUNTRYCOLOR = "green";

const projector = d3.geoNaturalEarth1(); /*geoNaturalEarth1, geoMercator, geopEquirectangular etc.*/
var chosenTrait = "none";

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
    neur: parseFloat(d.neuroticism),
  };
}

function whenDocumentLoaded(action) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", action);
  } else {
    action();
  }
}

var stats = {};
var id_to_name = {};
var id_to_isoa2 = {};
var name_to_isoa2 = {};


class Map {
	constructor (trait) {
	  /*Select Map SVG and set size*/
	  const svg = d3.select("svg");
	  svg.attr("width", WIDTH).attr("height", HEIGHT);

	  /* Define the map projections*/
	  const height = +svg.attr("height");
	  const width = +svg.attr("width");
	  const projection = projector.scale(
	    Math.min(width / Math.PI, height / Math.PI)
	  );
	  const pathGenerator = d3.geoPath().projection(projection);

	  /* Allow zooming*/
	  const g = svg.append("g");
	  svg.call(
	    d3.zoom().on("zoom", () => {
	      g.attr("transform", d3.event.transform);
	    })
	  );
	  this.g = g;
	  /* Draw background earth (i.e. sea)*/
	  g.append("path")
	    .attr("class", "sphere")
	    .attr("d", pathGenerator({ type: "Sphere" }));

	  /* Load country info from world atlas, topojson file and our dataset, execute when all are loaded. */
	  Promise.all([
	    d3.tsv("https://unpkg.com/world-atlas@1.1.4/world/" + RES + "m.tsv"),
	    d3.json("https://unpkg.com/world-atlas@1.1.4/world/" + RES + "m.json"),
	    d3.csv("../data/clean_data.csv", rowConverter),
	  ]).then(([tsvData, topoJSONdata, csvData]) => {
	    /* Create helper objects to convert between full name, iso-alpha 2 name and code used in topjson*/

	    tsvData.forEach((d) => {
	      id_to_name[d.iso_n3] = d.name;
	      id_to_isoa2[d.iso_n3] = d.iso_a2;
	      name_to_isoa2[d.name] = d.iso_a2;
	    });

	    /* Compute stats (i.e. mean of each trait and count) for each country*/

	    csvData.forEach((row) => {
	      const country = row.country;
	      if (!(country in stats)) {
	        stats[country] = {
	          count: 1,
	          agre: row.agre,
	          extr: row.extr,
	          open: row.open,
	          cons: row.cons,
	          neur: row.neur,
	        };
	      } else {
	        stats[country].count += 1;
	        stats[country].agre += row.agre;
	        stats[country].extr += row.extr;
	        stats[country].open += row.open;
	        stats[country].cons += row.cons;
	        stats[country].neur += row.neur;
	      }
	    });
		Object.keys(stats).forEach((key) => {
		  stats[key].agre /= stats[key].count;
		  stats[key].extr /= stats[key].count;
		  stats[key].open /= stats[key].count;
		  stats[key].cons /= stats[key].count;
		  stats[key].neur /= stats[key].count;
		});

		function colorFill(t) {
			var min = 1;
		    var max = 0;

		    Object.keys(stats).forEach((key) => {
		      if (stats[key].count >= MIN_OBS) {
		        max = Math.max(max, stats[key][t]);
		        min = Math.min(min, stats[key][t]);
		      }
		    });

		    const colorScale = d3
		      .scaleSequential(d3.interpolateRdYlGn)
		      .domain([min, max]);


			return (d) => {
			  var color;
			  try {
				color = colorScale(stats[id_to_isoa2[d.id]][t]);
				const n_obs = stats[id_to_isoa2[d.id]].count;
				if (n_obs < MIN_OBS) {
				  color = "lightgray";
				}
			  } catch (e) {
				console.log("Uncaught: ", id_to_isoa2[d.id]); /**/
				color = "lightgray";
			  }
			  return color;
			}
		}

		this.colorFill = colorFill

		/* Draw all topojson countries*/
		const countries = topojson.feature(
		  topoJSONdata,
		  topoJSONdata.objects.countries
		);
		this.features = countries.features


	    this.countries = g.selectAll("path")
	      .data(this.features)
	      .enter()
	      .append("path")
	      .attr("class", "country")
		  .attr("fill", DEFAULTCOUNTRYCOLOR)
	      .attr("d", pathGenerator)
	      .append("title")
	      .text((d) => {
	        var title;
	        try {
	          title =
	            id_to_name[d.id] + " (" + stats[id_to_isoa2[d.id]].count + ")";
	        } catch (e) {
	          title = "Unidentified";
	        }
	        return title;
	      });

	  });
	}


}

var map;

whenDocumentLoaded(() => {
  map = new Map(chosenTrait);
});



const selectElem = document.getElementById("traits");
selectElem.onchange = function (d) {
  chosenTrait = d3.select(this).property("value");
  if (chosenTrait === "none") {
	   map.g.selectAll("path").attr("fill", DEFAULTCOUNTRYCOLOR);
  } else {
	   map.g.selectAll("path").attr("fill", map.colorFill(chosenTrait));
  }
};
