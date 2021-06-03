const highResolution = false;
const RES = highResolution ? 50 : 110;

const WIDTH = 960;
const HEIGHT = 500;
const MIN_OBS = 10; // Countries with less than MIN_OBS answers are not counted
const scaleH = 100;
const DEFAULTCOUNTRYCOLOR = "gray"; // When not colored
const nameMap = {
  open: "openness",
  extr: "extraversion",
  agre: "agreeableness",
  cons: "conscientiousness",
  neur: "neuroticism",
};

//Countries in the JSON file with no respondent in the dataset
const mapUnidentified = {
  AX: "Aland Islands",
  AM: "American Samoa",
  TF: "French Southern Territories",
  BL: "Saint-Barthélemy",
  CD: "Democratic Republic of the Congo",
  CW: "Curaçao",
  GG: "Guernesey",
  HM: "Heard Island and McDonald Islands",
  IM: "Isle of Man",
  JE: "Jersey",
  KI: "Kiribati",
  MF: "Saint-Martin",
  ME: "Montenegro",
  MP: "Northern Mariana Islands",
  NR: "Nauru",
  PS: "Palestine",
  EH: "Western Sahara",
  SS: "South Sudan",
  GS: "South Georgia",
  PM: "Saint-Pierre-et-Miquelon",
  ST: "Sao Tome and Principe",
  SX: "Sint Maarten",
  TJ: "Tajikistan",
};

const projector = d3.geoNaturalEarth1();
let chosenTrait = "None";
let minAge = 0;
let maxAge = 99;
let chosenSex = "Both";
let selectedCountry = "none";


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
  if (chosenTrait !== "None") {
	// Update colouring
    const t = d3.transition().duration(1000).ease(d3.easeLinear);
    map.g.selectAll("path").transition(t).attr("fill", map.colorFill());
	map.addPlot(); // Update the plots
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
const legendRes = 100; // Number of rectangles in the color legend

var legendContainer = d3
  .select("#map")
  .append("g")
  .attr("id", "legend")
  .attr("transform", `translate(${legendX},${legendY})`);

var grayRectContainer = d3
  .select("#map")
  .append("g")
  .attr("id", "gray-rect")
  .attr("transform", `translate(${legendX - legendW - 20},${legendY})`);

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

  const t = d3.transition().duration(1000).ease(d3.easeLinear);

  // Draw the color legend
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
    .transition(t)
    .attr("fill", (d) => cScale(d));

  // Upper description
  legendContainer
    .append("text")
    .attr("x", 0)
    .attr("y", -5)
    .text("High")
    .style("fill", cScale(legendRes-1))
    .style("stroke", cScale(legendRes-1));

  // Lower description
  legendContainer
    .append("text")
    .attr("x", 0)
    .attr("y", legendH + 20)
    .text("Low")
    .style("fill", cScale(0))
    .style("stroke", cScale(0));

	// Draw the gray legend
   grayRectContainer
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", legendW)
      .attr("height", 18)
      .transition(t)
      .attr("fill", "lightgray");

    // Add the description to the gray legend
    grayRectContainer
      .append("text")
      .attr("x", 0)
      .attr("y", -5)
      .text(`< ${MIN_OBS}`)
      .style("fill", "lightgray")
      .style("stroke", "lightgray");
}

class Map {
  constructor() {
    //Select Map SVG and set size
    const svg = d3.select("#map");
    svg.attr("width", WIDTH).attr("height", HEIGHT);

    // Define the map projections
    const height = +svg.attr("height");
    const width = +svg.attr("width") - 2 * legendW;
    const projection = projector
      .scale(width / 1.8 / Math.PI)
      .rotate([0, 0])
      .center([0, 0])
      .translate([width / 2, height / 2]);
    const pathGenerator = d3.geoPath().projection(projection);

    // Scale for age
    var xScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([0, WIDTH / 2]);
    // Select the svg element to draw the age scale
    var scaleSvg = d3
      .select("#ageScale")
      .attr("width", WIDTH)
      .attr("height", scaleH);

	// Draw the axis
    var ageAxis = scaleSvg
      .append("g")
      .attr("id", "axis")
      .attr("transform", `translate(250,${scaleH / 2})`) // This controls the vertical position of the Axis
      .call(d3.axisBottom(xScale));

	// Define a brush to select the age to filter
    const brush = d3
      .brushX()
      .extent([
        [0, -30],
        [WIDTH / 2, 0],
      ])
      .on("end", function () {
        const ext = d3.brushSelection(this);
        if (Array.isArray(ext)) {
          minAge = parseInt(xScale.invert(ext[0]));
          maxAge = parseInt(xScale.invert(ext[1]));
        } else {
          return;
        }

		// Reflect the change to min and max age
        d3.select("#age-title").text(`Selected age: ${minAge}-${maxAge}`);
        if (chosenTrait !== "None") {
          const t = d3.transition().duration(1000).ease(d3.easeLinear);
		  // Update the map
          map.g.selectAll("path").transition(t).attr("fill", map.colorFill());
		  // Update the plots
		  map.addPlot();
        }
      });

	// Add the brush
    ageAxis.call(brush);

	// Draw text to show age selection
    scaleSvg
      .append("text")
      .attr("id", "age-title")
      .attr("x", 10)
      .attr("y", 20)
      .text(`Selected age: ${minAge}-${maxAge}`);


    // Draw background earth (i.e. sea)
	const g = svg.append("g");
    this.g = g;
    g.append("path")
      .attr("class", "sphere")
      .attr("d", pathGenerator({ type: "Sphere" }));

    // Load country info from world atlas, topojson file and our dataset, execute when all are loaded.
    Promise.all([
      d3.tsv("https://unpkg.com/world-atlas@1.1.4/world/" + RES + "m.tsv"),
      d3.json("https://unpkg.com/world-atlas@1.1.4/world/" + RES + "m.json"),
      d3.csv("../data/clean_data.csv", rowConverter),
    ]).then(([tsvData, topoJSONdata, csvData]) => {
      // Create helper objects to convert between full name, iso-alpha 2 name and code used in topjson
      tsvData.forEach((d) => {
        id_to_name[d.iso_n3] = d.name;
        id_to_isoa2[d.iso_n3] = d.iso_a2;
        name_to_isoa2[d.name] = d.iso_a2;
      });


      this.rawCSV = csvData; // Save the loaded personality dataset
	  // Compute stats (i.e. mean of each trait and count) for each country
      this.computeStats = function () {
        stats = {};
        var data = this.rawCSV;

		// Filter the current age selection
        const byAge = crossfilter(map.rawCSV).dimension((d) => d.age);
        data = byAge.filter([minAge, maxAge]).top(Infinity);

		// Filter the sex selection
        if (chosenSex !== "Both") {
          const bySex = crossfilter(data).dimension((d) => d.sex);
          data = bySex.filter(chosenSex).top(Infinity);
        }

        data.forEach((row) => {
          const country = row.country;
          if (!(country in stats)) { // Add a new country to stats
            stats[country] = {
              count: 1,
              agre: row.agre,
              extr: row.extr,
              open: row.open,
              cons: row.cons,
              neur: row.neur,
            };
		} else { // Update the stats of a country already in stats
            stats[country].count += 1;
            stats[country].agre += row.agre;
            stats[country].extr += row.extr;
            stats[country].open += row.open;
            stats[country].cons += row.cons;
            stats[country].neur += row.neur;
          }
        });
		// Go from sum to mean
        Object.keys(stats).forEach((key) => {
          stats[key].agre /= stats[key].count;
          stats[key].extr /= stats[key].count;
          stats[key].open /= stats[key].count;
          stats[key].cons /= stats[key].count;
          stats[key].neur /= stats[key].count;
        });

        return stats;
      };

	  /* The function uses the current parameters to create a new function
	  that is used to color the countries. */
      this.colorFill = function () {
		// First, re-compute stats with current parameters
        stats = this.computeStats();

		// Determine the min and max (average in a country) for the chosen trait
        let min = 1;
        let max = 0;
        Object.keys(stats).forEach((key) => {
          if (stats[key].count >= MIN_OBS) {
            max = Math.max(max, stats[key][chosenTrait]);
            min = Math.min(min, stats[key][chosenTrait]);
          }
        });

		// Define the color scale
        const colorScale = d3
          .scaleSequential(colorInterpolator)
          .domain([min, max]);

        return (d) => {
          var color;
          try {
            const val = stats[id_to_isoa2[d.id]][chosenTrait];

            color = colorScale(val);
            const n_obs = stats[id_to_isoa2[d.id]].count;
            if (n_obs < MIN_OBS) {
              color = "lightgray";
            }
          } catch (e) {
            color = "lightgray";
          }
          return color;
        };
      };

      // Define the div for the tooltip
      const div = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("display", "none");

	  // Function to add the bar plot and histogram
      this.addPlot = function () {
        let data = this.rawCSV;

		// Select the current country
        let byCountry = crossfilter(data).dimension((d) => d.country);
        data = byCountry.filter(id_to_isoa2[selectedCountry]).top(Infinity);
		// Select the current sex selection
        if (chosenSex !== "Both") {
          const bySex = crossfilter(data).dimension((d) => d.sex);
          data = bySex.filter(chosenSex).top(Infinity);
        }
        const byAge = {};

		// List all scores according to the age froup
        const ages = [
          "teenagers (<20)",
          "young adults (20-39)",
          "middle-aged adults (40-59)",
          "senior (60+)",
        ];
        ages.forEach((d) => {
          byAge[d] = [];
        });
        data.forEach((d) => {
          const score = d[chosenTrait];
          if (d.age < 20) {
            byAge["teenagers (<20)"].push(score);
          } else if (d.age < 40) {
            byAge["young adults (20-39)"].push(score);
          } else if (d.age < 60) {
            byAge["middle-aged adults (40-59)"].push(score);
          } else {
            byAge["senior (60+)"].push(score);
          }
        });

		// Take the mean for each age group
        let means = [];
        ages.forEach((age) => {
          let L = byAge[age].length;
          let score = 0;
          if (L > 0) {
            score = byAge[age].reduce((a, b) => a + b, 0);
            score /= L;
          }
          means.push(score);
        });

        var margin = { top: 30, right: 30, bottom: 100, left: 60 },
          width = WIDTH - margin.left - margin.right,
          height = HEIGHT - margin.top - margin.bottom;

        // append the svg object to the body of the page
        d3.select("#bar-chart").selectAll("g").remove();
        var svg = d3
          .select("#bar-chart")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom + 80)
          .append("g")
          .attr(
            "transform",
            "translate(" + margin.left + "," + margin.top + ")"
          );

		// Scale for the x axis
        var x = d3.scaleBand().range([0, width]).domain(ages).padding(0.2);

		// Draw the x scale
        svg
          .append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x))
          .selectAll("text")
          .style("font-size", "24px")
          .attr("transform", "translate(0,20)rotate(-8)");

		// Add a title to the bar plot
        let title = "Mean " + nameMap[chosenTrait];
        title += " in " + id_to_name[selectedCountry];
        if (chosenSex === "Male") {
          title += " (men)";
        }
        if (chosenSex === "Female") {
          title += " (women)";
        }
        svg
          .append("text")
          .attr("x", 30)
          .attr("y", -10)
          .text(title)
          .style("font-size", "24px");

        // Define and draw the Y axis
        var y = d3.scaleLinear().domain([0, 1]).range([height, 0]);
        svg.append("g").call(d3.axisLeft(y));
		svg.append("text")
		    .attr("text-anchor", "middle")
			.attr("x", -height/2)
		    .attr("y", -60)
		    .attr("dy", "1.5em")
		    .attr("transform", "rotate(-90)")
		    .text("Score");

        // Draw the bars
        svg.selectAll("rect").remove(); // Remove all the old ones
        svg
          .selectAll("rect")
          .data(means)
          .enter()
          .append("rect")
          .attr("x", function (d, i) {
            return x(ages[i]);
          })
          .attr("y", function (d, i) {
            return y(d);
          })
          .attr("class", function (d, i) {
            return "hist-rect-" + i;
          })
          .attr("width", x.bandwidth())
          .attr("height", function (d) {
            return height - y(d);
          })
          .on("mouseover", function (d) { // Show count upon mouseover
            let L = byAge[ages[this.className.animVal.slice(-1)]].length;
            div.style("display", "block");
            div
              .html("Count: " + L)
              .style("left", d3.event.pageX + 15 + "px")
              .style("top", d3.event.pageY + "px");
          })
          .on("mouseout", function () {
            div.style("display", "none");
          });

        // Histogram logic
        var margin = { top: 100, right: 30, bottom: 10, left: 60 },
          width = WIDTH - margin.left - margin.right,
          height = HEIGHT - margin.top - margin.bottom;

        data = this.rawCSV;
        byCountry = crossfilter(data).dimension((d) => d.country);
        data = byCountry.filter(id_to_isoa2[selectedCountry]).top(Infinity);
        if (chosenSex !== "Both") {
          const bySex = crossfilter(data).dimension((d) => d.sex);
          data = bySex.filter(chosenSex).top(Infinity);
        }
        // Filter by age
        const byAge2 = crossfilter(data).dimension((d) => d.age);
        data = byAge2.filter([minAge, maxAge]).top(Infinity);
        const nBins = 20;
        const intervals = [];
        for (let i = 1; i <= nBins; i++) {
          if (i === 1) {
            intervals.push(`[${(i - 1) / nBins}-${i / nBins}]`);
            continue;
          }
          intervals.push(`(${(i - 1) / nBins}-${i / nBins}]`);
	  }
        // Keep the count for each interval
        const counts = [];
        intervals.forEach((d, i) => {
          counts.push(0);
        });
        data.forEach((d) => {
          const score = d[chosenTrait];

          for (let i = 0; i < intervals.length; i++) {
            if (score <= (i + 1) / nBins) {
              counts[i] += 1;
              break;
            }
          }
        });

        // Normalize so the bars sum to 100%
        const sumCounts = counts.reduce((a, b) => a + b, 0);
        counts.forEach((d, i) => {
          counts[i] *= 100/sumCounts;
        });

        // append the svg object to the body of the page
        d3.select("#histogram").selectAll("g").remove();
        var svg = d3
          .select("#histogram")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom + 80)
          .append("g")
          .attr(
            "transform",
            "translate(" + margin.left + "," + margin.top + ")"
          );
		var x2 = d3.scaleLinear().range([0, width]).domain([0, 1]);

        svg
          .append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x2))
          .selectAll("text")
          .attr("transform", "translate(0,10)");

	   svg.append("text")
  		  .attr("text-anchor", "middle")
		  .attr("x", width/2)
  		  .attr("y", height + 20)
  		  .attr("dy", "1.5em")
  		  .text("Score");

        title = "Distribution of " + nameMap[chosenTrait];
        title += " scores in " + id_to_name[selectedCountry];
        title += " (" + minAge.toString() + "-" + maxAge.toString() + " years old";
		if (chosenSex === "Male") {
          title += " men";
        } else if (chosenSex === "Female") {
          title += " women";
        }
		title += ")";

        svg
          .append("text")
          .attr("x", 30)
          .attr("y", -10)
          .text(title)
          .style("font-size", "24px");

        // Add Y axis
        var y = d3.scaleLinear().domain([0, Math.max(...counts)]).range([height, 0]);
        svg.append("g").call(d3.axisLeft(y));

		svg.append("text")
		    .attr("text-anchor", "middle")
			.attr("x", -height/2)
		    .attr("y", -60)
		    .attr("dy", "1.5em")
		    .attr("transform", "rotate(-90)")
		    .text("Fraction of the population (%)");

        const colorArr = [
          "rgba(220,220,220,0.5)",
          "rgba(220,220,220,0.8)",
          "rgba(220,220,220,0.75)",
          "rgba(220,220,220,1)",
        ];

        // Bars
        svg.selectAll("rect").remove();
        svg
          .selectAll("rect")
          .data(counts)
          .enter()
          .append("rect")
          .attr("x", function (d, i) {
            return x2(i/nBins) + 1;
          })
          .attr("y", function (d, i) {
            return y(d);
          })
          .attr("class", function (d, i) {
            return "hist-rect-" + i;
          })
          .attr("fill", function (d, i) {
            return colorArr[i % colorArr.length];
          })
          .attr("width", width/nBins - 2)
          .attr("height", function (d) {
            return height - y(d);
          })
          .on("mouseover", function (d) {
            const class_name = d3.select(this).attr("class").split("-");
            let L = Math.round(
              counts[class_name[class_name.length - 1]] * sumCounts/100
            );
            d3.select(this).attr("fill", "orange");

            div.style("display", "block");
            div
              .html("Count: " + L)
              .style("left", d3.event.pageX + 15 + "px")
              .style("top", d3.event.pageY + "px");
          })
          .on("mouseout", function () {
            d3.select(this).attr(
              "fill",
              colorArr[this.className.animVal.slice(-1) % colorArr.length]
            );
            div.style("display", "none");
          });
      };

      // Draw all topojson countries
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
          if (chosenTrait === "None") {
            alert("Please activate one trait!");
            return;
          }
          selectedCountry = e.id;
          this.addPlot();
          const elem = document.getElementById("hist-container");
          elem.style.display = "block";
          elem.scrollIntoView();
        })
        .on("mouseover", (d) => {
          let title;
          try {
            title =
              id_to_name[d.id] + " (" + stats[id_to_isoa2[d.id]].count + ")";
          } catch (e) {
            if (d.id == "-99") {
              title = "Unidentified";
            } else {
              title = mapUnidentified[id_to_isoa2[d.id]] + " (0)";
            }
          }

          div.style("display", "block");
          div
            .html(title)
            .style("left", d3.event.pageX + 50 + "px")
            .style("top", d3.event.pageY - 50 + "px");
        })
        .on("mouseout", function () {
          div.style("display", "none");
        })
        .attr("fill", DEFAULTCOUNTRYCOLOR)
        .attr("d", pathGenerator);

      drawLegend(colorInterpolator);
      legendContainer.attr("display", "none");
      grayRectContainer.attr("display", "none");
    });
  }
}

let map;

whenDocumentLoaded(() => {
  map = new Map();
});

const selectElem = document.getElementsByClassName("flipswitch");

for (let elem of selectElem) {
  elem.onclick = function () {
    chosenTrait = elem.value;
    const t = d3.transition().duration(1000).ease(d3.easeLinear);

    if (chosenTrait === "None") {
      map.g.selectAll("path").transition(t).attr("fill", DEFAULTCOUNTRYCOLOR);
      legendContainer.attr("display", "none");
      grayRectContainer.attr("display", "none");
    } else {
      map.g.selectAll("path").transition(t).attr("fill", map.colorFill());
      legendContainer.attr("display", "block");
      grayRectContainer.attr("display", "block");
    }
  };
}

const buttons = document.getElementsByClassName("next-section");
const buttonsPrev = document.getElementsByClassName("prev-section");
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
for (const button of buttonsPrev) {
  button.onclick = function () {
    const index = sectionNames.indexOf(this.parentElement);
    if (index > -1) {
      if (index === 0) {
        const elem = document.getElementById("main-page");
        elem.scrollIntoView();
      } else {
        const elem = sectionNames[(index - 1) % sectionNames.length];
        elem.scrollIntoView();
      }
    } else {
      console.log("Sorry something went wrong. Are you sure the code is OK?");
    }
  };
}

const histButton = document.getElementById("hist-button");
histButton.onclick = function () {
  const elem = document.getElementById("main-page");
  elem.scrollIntoView();
  // Disable the histogram section
  setTimeout(() => {
    document.getElementById("hist-container").style.display = "none";
  }, 1000);
};
