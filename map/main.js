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

class Map {
  constructor() {
    /*Select Map SVG and set size*/
    const svg = d3.select("#map");
    svg.attr("width", WIDTH).attr("height", HEIGHT);

    /* Define the map projections*/
    const height = +svg.attr("height");
    const width = +svg.attr("width");
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
        d3.select("#ageTitle").text(`Selected age: ${minAge}-${maxAge}`);
        if (chosenTraitArr.length !== 0) {
          map.g.selectAll("path").attr("fill", map.colorFill());
        }
      });

    ageAxis.call(brush);

    scaleSvg
      .append("text")
      .attr("id", "ageTitle")
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
          .scaleSequential(d3.interpolateRdYlGn)
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
        .on("click", () => {
          // TODO: Add a histogram if clicked
          alert("hi :)");
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
    } else {
      map.g.selectAll("path").attr("fill", map.colorFill());
    }
  };
}
