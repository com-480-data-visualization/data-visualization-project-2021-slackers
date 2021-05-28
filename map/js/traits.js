const WIDTH = 960;
const HEIGHT = 50;
var chosenTrait = "Openness";

const buttonX0 = 10;
const buttonY = 10;
const buttonH = 40;
const buttonW = 160;
const buttonSpace = 10;

const fontSize = 20;

const textX = 10;
const textY = 100;

var svg = d3.select("svg").attr("width", WIDTH).attr("height", HEIGHT);

var textArea = d3.select("body").append("text").attr("x", 0).attr("y", 0);

const traits = [
  "Openness",
  "Extraversion",
  "Agreeableness",
  "Conscientiousness",
  "Neuroticism",
];

buttons = svg.selectAll("rect").append("g").data(traits).enter();

function handleClick(d) {
  updateSelection(d);
  d3.selectAll("rect").classed("highlight", false);
  d3.select("rect." + d).classed("highlight", true);
}

buttons
  .append("rect")
  .attr("x", (d, i) => (buttonW + buttonSpace) * i + buttonX0)
  .attr("y", buttonY)
  .attr("width", buttonW)
  .attr("height", buttonH)
  .attr("fill", "purple")
  .attr("rx", 5)
  .attr("class", (d) => d)
  .on("click", handleClick);

d3.selectAll("rect." + chosenTrait).classed("highlight", true);

buttons
  .append("text")
  .attr("x", (d, i) => (buttonW + buttonSpace) * i + buttonX0 + buttonW / 2)
  .attr("y", buttonY + buttonH / 2)
  .attr("font-size", fontSize)
  .text((d) => d)
  .attr("class", (d) => d)
  .attr("fill", "black")
  .attr("text-anchor", "middle")
  .on("click", handleClick);

function updateSelection(trait) {
  var old = document.querySelectorAll("div." + chosenTrait);
  for (x of old) {
    console.log(x);
    x.style.display = "none";
  }

  chosenTrait = trait;
  var neww = document.querySelectorAll("div." + chosenTrait);
  for (x of neww) {
    x.style.display = "block";
  }
}
