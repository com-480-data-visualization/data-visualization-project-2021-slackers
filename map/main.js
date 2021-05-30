const highResolution = true;
const WIDTH = 960;
const HEIGHT = 500;
const MIN_OBS = 10;
const scaleH = 100;
const DEFAULTCOUNTRYCOLOR = "gray";
const nameMap = {
  open: "openness",
  extr: "extraversion",
  agre: "agreeableness",
  cons: "conscientiousness",
  neur: "neuroticism",
};

const projector =
  d3.geoNaturalEarth1(); /*geoNaturalEarth1, geoMercator, geopEquirectangular etc.*/
const chosenTraitArr = [];
let minAge = 0;
let maxAge = 99;
let chosenSex = "Both";

const RES = highResolution ? 50 : 110;

function rowConverter(d) {
  return {
    id: parseInt(d.case_id),
    country: d.country,
    age: parseInt(d.age),
    sex: d.sex,
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

function selectSex(s) {
  chosenSex = s;
  if (chosenTraitArr.length !== 0) {
    map.g.selectAll("path").attr("fill", map.colorFill());
  }
}

var stats = {};
var id_to_name = {};
var id_to_isoa2 = {};
var name_to_isoa2 = {};

const colorInterpolator = d3.interpolateRdYlGn;
const legendW = 40;
const legendX = WIDTH - legendW;
const legendY = 30;
const legendH = 450;
const legendRes = 100;

var legendContainer = d3
  .select("#map")
  .append("g")
  .attr("id", "legend")
  .attr("transform", `translate(${legendX},${legendY})`);

function drawLegend(interpolator) {
  var data = Array.from(Array(legendRes).keys());

  var cScale = d3
    .scaleSequential()
    .interpolator(interpolator)
    .domain([0, legendRes - 1]);

  var xScale = d3
    .scaleLinear()
    .domain([0, legendRes - 1])
    .range([0, legendH]);

  legendContainer
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d) => legendH - Math.floor(xScale(d)))
    .attr("width", legendW)
    .attr("id", (d, i) => `minirect${i}`)
    .attr("height", (d) => {
      if (d == legendRes - 1) {
        return 6;
      }
      return Math.floor(xScale(d + 1)) - Math.floor(xScale(d)) + 1;
    })
    .attr("fill", (d) => cScale(d));

  legendContainer
    .append("text")
    .attr("x", 0)
    .attr("y", -5)
    .text("High")
    .style("stroke", "green");
  legendContainer
    .append("text")
    .attr("x", 0)
    .attr("y", legendH + 20)
    .text("Low")
    .style("stroke", "red");
}

class Map {
  constructor() {
    /*Select Map SVG and set size*/
    const svg = d3.select("#map");
    svg.attr("width", WIDTH).attr("height", HEIGHT);

    /* Define the map projections*/
    const height = +svg.attr("height");
    const width = +svg.attr("width") - 2 * legendW;
    const projection = projector
      .scale(width / 1.8 / Math.PI)
      .rotate([0, 0])
      .center([0, 0])
      .translate([width / 2, height / 2]);
    const pathGenerator = d3.geoPath().projection(projection);

    /*Scale for age*/
    var xScale = d3
      .scaleLinear()
      .domain([0, 100]) // This is what is written on the Axis: from 0 to 100
      .range([0, WIDTH / 2]); // This is where the axis is placed: from 100px to 800px
    // Draw the axis
    var scaleSvg = d3
      .select("#ageScale")
      .attr("width", WIDTH)
      .attr("height", scaleH);

    var ageAxis = scaleSvg
      .append("g")
      .attr("id", "axis")
      .attr("transform", `translate(250,${scaleH / 2})`) // This controls the vertical position of the Axis
      .call(d3.axisBottom(xScale));

    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [WIDTH / 2, 20],
      ])
      .on("brush end", function brushended() {
        const ext = d3.brushSelection(this);
        minAge = parseInt(xScale.invert(ext[0]));
        maxAge = parseInt(xScale.invert(ext[1]));
        d3.select("#age-title").text(`Selected age: ${minAge}-${maxAge}`);
        if (chosenTraitArr.length !== 0) {
          map.g.selectAll("path").attr("fill", map.colorFill());
        }
      });

    ageAxis.call(brush);

    scaleSvg
      .append("text")
      .attr("id", "age-title")
      .attr("x", 10)
      .attr("y", 20)
      .text(`Selected age: ${minAge}-${maxAge}`);

    /* Allow zooming*/
    const g = svg.append("g");
    /*svg.call(
      d3.zoom().on("zoom", () => {
        g.attr("transform", d3.event.transform);
      })
    );*/

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
      this.rawCSV = csvData;

      this.computeStats = function () {
        stats = {};
        var data = this.rawCSV;

        const byAge = crossfilter(map.rawCSV).dimension((d) => d.age);
        data = byAge.filter([minAge, maxAge]).top(Infinity);

        if (chosenSex !== "Both") {
          const bySex = crossfilter(data).dimension((d) => d.sex);
          data = bySex.filter(chosenSex).top(Infinity);
        }

        data.forEach((row) => {
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

        return stats;
      };

      this.colorFill = function () {
        stats = this.computeStats();

        let min = 1;
        let max = 0;

        Object.keys(stats).forEach((key) => {
          if (stats[key].count >= MIN_OBS) {
            let totalStats = 0;
            chosenTraitArr.forEach((trait) => {
              totalStats += stats[key][trait];
            });
            totalStats /= chosenTraitArr.length;
            max = Math.max(max, totalStats);
            min = Math.min(min, totalStats);
          }
        });

        const colorScale = d3
          .scaleSequential(colorInterpolator)
          .domain([min, max]);

        return (d) => {
          var color;
          try {
            let val = 0;

            chosenTraitArr.forEach((trait) => {
              val += stats[id_to_isoa2[d.id]][trait];
            });

            val /= chosenTraitArr.length;

            color = colorScale(val);
            const n_obs = stats[id_to_isoa2[d.id]].count;
            if (n_obs < MIN_OBS) {
              color = "lightgray";
            }
          } catch (e) {
            //console.log("Uncaught: ", id_to_isoa2[d.id]); /**/
            color = "lightgray";
          }
          return color;
        };
      };

	  this.addPlot = function (e) {
		  let data = this.rawCSV;
		  const byCountry = crossfilter(data).dimension((d) => d.country);
		  data = byCountry.filter(id_to_isoa2[e["id"]]).top(Infinity);
		  let byAge = {};
		  var ages = Array.from(Array(100).keys()); /* All ages: 0-99*/
		  ages.forEach(d => {
			  byAge[d] = [];
		  });
		  data.forEach(d => {
			  let score = 0;
			  chosenTraitArr.forEach((trait) => {
				  score += d[trait]
			  });
			  score /= chosenTraitArr.length;
			  byAge[d.age].push(score);
		  });

		  let means = [];
		  ages.forEach(age => {
			  let L = byAge[age].length
			  let score = 0;
			  if (L > 0) {
				  score = byAge[age].reduce((a, b) => a + b, 0);
				  score /= L;
			  }
			  means.push(score);
		  });

		  var margin = { top: 10, right: 30, bottom: 30, left: 40 },
		      width = 460 - margin.left - margin.right,
			  height = 400 - margin.top - margin.bottom;

		  // append the svg object to the body of the page
		  d3.select("#histogram").selectAll("g").remove()
		  var svg = d3
		      .select("#histogram")
			  .attr("width", width + margin.left + margin.right)
			  .attr("height", height + margin.top + margin.bottom)
			  .append("g")
			  .attr(
				"transform",
				"translate(" + margin.left + "," + margin.top + ")"
			  );
		  var x = d3.scaleBand()
			  .range([ 0, 600 ])
			  .domain(ages)
			  .padding(0.2);

		  svg.append("g")
		      .attr("transform", "translate(0," + height + ")")
		      .call(d3.axisBottom(x))
		      .selectAll("text")
		      .attr("transform", "translate(-10,0)rotate(-45)")
			  .style("text-anchor", "end");

			// Add Y axis
		  var y = d3.scaleLinear()
		      .domain([0, 1])
			  .range([height, 0]);
		  svg.append("g")
		     .call(d3.axisLeft(y));

			// Bars

			svg.selectAll("rect").remove();
			svg.selectAll("rect")
				.data(means)
				.enter()
				.append("rect")
				.attr("x", function(d, i) {
					return x(i); })
				.attr("y", function(d, i) { return y(d); })
				.attr("width", x.bandwidth())
				.attr("height", function(d) { return height - y(d); })
				.attr("fill", "black")

	  };


      /* Draw all topojson countries*/
      const countries = topojson.feature(
        topoJSONdata,
        topoJSONdata.objects.countries
      );
      this.features = countries.features;

      this.computeStats();

      this.countries = g
        .selectAll("path")
        .data(this.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .on("click", (e) => {
          this.addPlot(e);
        })
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

      drawLegend(colorInterpolator);
      legendContainer.attr("display", "none");
    });
  }
}

let map;

whenDocumentLoaded(() => {
  map = new Map();
});

const selectElem = document.getElementsByClassName("flipswitch");

for (let elem of selectElem) {
  elem.onchange = function () {
    if (elem.checked) {
      chosenTraitArr.push(elem.name);
    } else {
      const index = chosenTraitArr.indexOf(elem.name);
      if (index > -1) {
        chosenTraitArr.splice(index, 1);
      } else {
        console.log("Element not found in array, what?");
      }
    }

    if (chosenTraitArr.length === 0) {
      map.g.selectAll("path").attr("fill", DEFAULTCOUNTRYCOLOR);
      legendContainer.attr("display", "none");
    } else {
      map.g.selectAll("path").attr("fill", map.colorFill());
      legendContainer.attr("display", "block");
    }
  };
}

const buttons = document.getElementsByClassName("next-section");
const sectionNames = [];
for (const button of buttons) {
  sectionNames.push(button.parentElement);
}
for (const button of buttons) {
  button.onclick = function () {
    const index = sectionNames.indexOf(this.parentElement);
    if (index > -1) {
      if (index === sectionNames.length - 1) {
        const elem = document.getElementById("main-page");
        elem.scrollIntoView();
      } else {
        const elem = sectionNames[(index + 1) % sectionNames.length];
        elem.scrollIntoView();
      }
    } else {
      console.log("Sorry something went wrong. Are you sure the code is OK?");
    }
  };
}
