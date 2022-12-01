let mapWidth = 800;
let mapHeight = 600;
let raceVizWidth = 650;
let raceVizHeight = 600;
let chartRadius = raceVizHeight / 2 - 40;
let centered;
// let center_x = -87.6298;
// let center_y = 41.8781;
let center_x = -87.7;
let center_y = 41.825;
let svg;
let raceSvg;
let resourceSvg;
let projection = d3
  .geoMercator()
  .scale(mapWidth * 75)
  .center([center_x, center_y])
  .translate([mapWidth / 2, mapHeight / 2]);

let path = d3.geoPath(projection);
let chicagoMap;
let g;
let selectedCommunityAreas = [];

let selectedRace = "White";

let chicagoCommunityAreaData;
let chicagoRaceData;
let busStopsData;
let hospitalsData;
let schoolsData;
let trainsData;

let busStopsCount = new Map();
let trainsCount = new Map();
let schoolsCount = new Map();
let hospitalsCount = new Map();

const allCategories = [
  {
    value: "White",
    text: "White",
  },

  {
    value: "Asian",
    text: "Asian",
  },

  {
    value: "Black",
    text: "Black",
  },

  {
    value: "Hispanic",
    text: "Hispanic",
  },

  {
    value: "Pacific Islander",
    text: "Pacific Islander",
  },

  {
    value: "Native",
    text: "Native American",
  },
  {
    value: "Other",
    text: "Other",
  },
  {
    value: "Population",
    text: "Total Population",
  },
];
let x, y, k;
let selectedCommunityId;
let mapColorScale;

const PI = Math.PI,
  arcMinRadius = 10,
  arcPadding = 20,
  labelPadding = -5,
  numTicks = 10;

let numOfArcs, arcWidth;
const raceVizColor = d3.scaleOrdinal(d3.schemeCategory10);

const loadAllFiles = async () => {
  chicagoCommunityAreaData = await d3.json("data/communityAreas.geojson");

  chicagoRaceData = await d3.csv("Datasets/Comm_area_aggregations.csv");

  busStopsData = await d3.csv("Datasets/Bus_Preprocessed.csv");
  hospitalsData = await d3.csv("Datasets/Hospitals_Processed.csv");
  schoolsData = await d3.csv("Datasets/Schools_Preprocessed.csv");
  trainsData = await d3.csv("Datasets/Train_Preprocessed.csv");

  calculateResources();
  loadMap();

  $(document).ready(function () {
    $(".resourceDropdown").select2({ width: "40%" });
  });

  $(".resourceDropdown").on("change", function (event) {
    addResourcesToMap();
  });

  $(".resourceDropdown").val(["Bus", "Train", "School", "Hospital"]);
};

const loadMap = async () => {
  mapColorScale = d3
    .scaleLinear()
    .interpolate(() => d3.interpolatePurples)
    .domain([
      chicagoRaceData[78][selectedRace],
      chicagoRaceData[77][selectedRace],
    ]);
  let labels = d3.range(
    chicagoRaceData[78][selectedRace],
    chicagoRaceData[77][selectedRace],
    (chicagoRaceData[77][selectedRace] - chicagoRaceData[78][selectedRace]) / 5
  );
  labels = labels.map((l) => Math.round(l));
  svg = d3.select("#chicagoMap");
  svg.selectAll("*").remove();
  // svg.style("background", 'url("Images/chicago.png") no-repeat');
  // svg.style("background-size", `${mapWidth}px ${mapHeight}px`);

  const foreign = svg
    .append("foreignObject")
    .attr("width", 150)
    .attr("height", 100)
    .append("xhtml:body");

  // const dropdown = foreign
  //   // .append("label")
  //   // .text("Categories")
  //   .append("select")
  //   .attr("id", "categoriesDropDown")
  //   .attr("class", "form-control")
  //   .selectAll("option")
  //   .data(allCategories)
  //   .enter()
  //   .append("option")
  //   .text((d) => d.text)
  //   .attr("value", (d) => d.value)
  //   .on("change",(d) => {
  //     console.log(d);
  //   });

  // const dropdownElement = document.getElementById("categoriesDropDown");
  // dropdownElement.value = selectedRace;
  // dropdownElement.addEventListener("change", (e) => {selectedRace = dropdownElement.value; loadMap() });

  const mapToolTip = d3
    .tip()
    .attr("class", "d3-tip")
    // .html("<p>This is a SVG inside a tooltip:</p><div id='tipDiv'></div>");
    .html(function (d) {
      return `<div class = 'd3-tip' style='background:#E5E8E8;font-size: small; border-width: 2px; border-style: solid; border-color: black;'><span style='color:black; margin-top: 10px; margin-left: 10px; margin-right: 5px;'><strong>Community Area:</strong> 
  ${d.communityArea}</span><br/>
  <span style='color:black; margin-top: 5px; margin-left: 10px; margin-right: 10px'><strong>Population:</strong> 
  ${d.population}</span><br/>
      </div>
          `;
    });
  svg.call(mapToolTip);
  chicagoMap = svg.append("g");
  chicagoMap
    .selectAll("path")
    .data(chicagoCommunityAreaData.features)
    .enter()
    .append("path")
    // .attr("fill", "#ADD8E6")
    .attr("stroke", "#000000")
    .attr("d", path)
    .on("click", zoomOnClick)
    .attr("fill", (d) => {
      const community_area = d.properties.area_numbe;
      return communityAreaColor(community_area);
    })
    .on("mouseover", (d) => {
      const toolTipObj = {
        communityArea: d.properties.community,
        population: chicagoRaceData[d.properties.area_numbe - 1][selectedRace],
        areaNumber: d.properties.area_numbe,
      };
      mapToolTip.show(toolTipObj);
    })
    .on("mouseout", () => mapToolTip.hide());

  let legendGroup = svg
    .append("g")
    .attr("class", "legendThreshold")
    .attr("transform", "translate(650,450)");
  legendGroup
    .append("text")
    .attr("class", "caption")
    .attr("x", 0)
    .attr("y", -6)
    .style("font-weight", "bold")
    .text("Population")
    .style("font-size", "20px");

  var legend = d3
    .legendColor()
    .labels(function (d) {
      return labels[d.i];
    })
    .shapePadding(0)
    .orient("vertical")
    .shapeWidth(40)
    .scale(mapColorScale);
  svg.select(".legendThreshold").call(legend);
};

const zoomOnClick = (d) => {
  // let x, y, k;
  let addResources = true;
  if (d && centered !== d) {
    let centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 8;
    centered = d;
  } else {
    x = mapWidth / 2;
    y = mapHeight / 2;
    k = 1;
    centered = null;
    svg.selectAll("image").remove();
    addResources = false;
    console.log(d);
  }

  svg.selectAll("path").classed(
    "active",
    centered &&
      function (d) {
        return d === centered;
      }
  );

  chicagoMap
    .transition()
    .duration(750)
    .attr(
      "transform",
      `translate(${mapWidth / 2},${
        mapHeight / 2
      })scale(${k})translate(${-x},${-y})`
    );

  selectedCommunityId = d.properties.area_numbe;
  selectedCommunityArea = d.properties.community;
  if (addResources) {
    if (selectedCommunityAreas.length == 3) {
      selectedCommunityAreas.shift();
    }
    const index = selectedCommunityAreas.findIndex(
      (a) => a.area_numbe == selectedCommunityId
    );
    if (index == -1) {
      selectedCommunityAreas.push(d.properties);
    }
    console.log(selectedCommunityAreas);
    addResourcesToMap();
    renderRaceDistribution(selectedCommunityAreas);
    renderResourceDistribution(selectedCommunityId, selectedCommunityArea);
  } else {
    svg.selectAll("path").attr("fill", (d) => {
      const community_area = d.properties.area_numbe;
      return communityAreaColor(community_area);
    });
  }
};

const addResourcesToMap = () => {
  console.log($(".resourceDropdown").val());
  const selectedResources = $(".resourceDropdown").val();
  svg.selectAll("image").remove();

  // Get all resources of selected community
  const busStopsOfSelectedCommunity = busStopsData.filter(
    (stop) => stop.COMM_AREA == selectedCommunityId
  );

  const trainStationsOfSelectedCommunity = trainsData.filter(
    (stop) => stop.Comm_Area == selectedCommunityId
  );

  const schoolsOfSelectedCommunity = schoolsData.filter(
    (stop) => stop.Comm_Area == selectedCommunityId
  );

  const hospitalsOfSelectedCommunity = hospitalsData.filter(
    (stop) => stop.Comm_Area == selectedCommunityId
  );

  // Adding Bus Stops
  if (selectedResources.indexOf("Bus") != -1) {
    busStopsLocations = svg.append("g");

    busStopsLocations
      .selectAll("images")
      .data(busStopsOfSelectedCommunity)
      .enter()
      .append("svg:image")
      .attr("width", 5)
      .attr("height", 5)
      .attr("xlink:href", "Images/busIcon.JPG")
      .attr("x", (d) => projection([d.LONGITUDE, d.LATITUDE])[0])
      .attr("y", (d) => projection([d.LONGITUDE, d.LATITUDE])[1]);

    busStopsLocations
      .transition()
      .duration(750)
      .attr(
        "transform",
        `translate(${mapWidth / 2},${mapHeight / 2})scale(${
          k - 2
        })translate(${-x},${-y})`
      );
  }
  // Adding Train Stations
  if (selectedResources.indexOf("Train") != -1) {
    trainStationLocations = svg.append("g");

    trainStationLocations
      .selectAll("images")
      .data(trainStationsOfSelectedCommunity)
      .enter()
      .append("svg:image")
      .attr("width", 5)
      .attr("height", 5)
      .attr("xlink:href", "Images/trainIcon.JPG")
      .attr("x", (d) => projection([d.Long, d.Lat])[0])
      .attr("y", (d) => projection([d.Long, d.Lat])[1]);

    trainStationLocations
      .transition()
      .duration(750)
      .attr(
        "transform",
        `translate(${mapWidth / 2},${mapHeight / 2})scale(${
          k - 2
        })translate(${-x},${-y})`
      );
  }
  // Adding Schools
  if (selectedResources.indexOf("School") != -1) {
    schoolLocations = svg.append("g");

    schoolLocations
      .selectAll("images")
      .data(schoolsOfSelectedCommunity)
      .enter()
      .append("svg:image")
      .attr("width", 5)
      .attr("height", 5)
      .attr("xlink:href", "Images/schoolIcon.JPG")
      .attr("x", (d) => projection([d.Long, d.Lat])[0])
      .attr("y", (d) => projection([d.Long, d.Lat])[1]);

    schoolLocations
      .transition()
      .duration(750)
      .attr(
        "transform",
        `translate(${mapWidth / 2},${mapHeight / 2})scale(${
          k - 2
        })translate(${-x},${-y})`
      );
  }
  // Adding Hospitals
  if (selectedResources.indexOf("Hospital") != -1) {
    hospitalLocations = svg.append("g");

    hospitalLocations
      .selectAll("images")
      .data(hospitalsOfSelectedCommunity)
      .enter()
      .append("svg:image")
      .attr("width", 5)
      .attr("height", 5)
      .attr("border-radius", 5)
      .attr("xlink:href", "Images/hospitalIcon.JPG")
      .attr("x", (d) => projection([d.Longitude, d.Latitude])[0])
      .attr("y", (d) => projection([d.Longitude, d.Latitude])[1]);

    hospitalLocations
      .transition()
      .duration(750)
      .attr(
        "transform",
        `translate(${mapWidth / 2},${mapHeight / 2})scale(${
          k - 2
        })translate(${-x},${-y})`
      );
  }
};

const onCategoryChange = () => {
  selectedRace = document.getElementById("raceDropdown").value;
  loadMap();
};

function renderRaceDistribution(array) {
  if (raceSvg) {
    raceSvg.selectAll("*").remove();
  }

  raceSvg = d3.select("#raceVisualization");

  const height = 600;
  const width = 650;
  var data1, data2, data3;
  const margin = { left: 65, top: 10, right: 10, bottom: 50 };
  var race = [
    "White",
    "Asian",
    "Black",
    "Hispanic",
    "Pacific Islander",
    "Native",
    "Other",
  ];
  var max,
    min = 0;
  var maxes = [];
  var xScale = d3
    .scaleBand()
    .domain(race)
    .range([margin.left, width - margin.right]);

  console.log(array);

  if (array.length > 0) {
    var area1 = parseInt(array[0]["area_num_1"]);
    data1 = Object.values(chicagoRaceData[area1 - 1]).slice(3, 10);
    maxes.push(Math.max(...data1));
  }

  if (array.length > 1) {
    var area2 = parseInt(array[1]["area_num_1"]);
    data2 = Object.values(chicagoRaceData[area2 - 1]).slice(3, 10);
    maxes.push(Math.max(...data2));
  }

  if (array.length == 3) {
    var area3 = parseInt(array[2]["area_num_1"]);
    data3 = Object.values(chicagoRaceData[area3 - 1]).slice(3, 10);
    maxes.push(Math.max(...data3));
  }

  max = Math.max(...maxes);

  var yScale = d3
    .scaleLinear()
    .domain([min, max])
    .range([height - margin.bottom, margin.top]);

  let tooltip = d3.tip().html(function (d) {
    return `
            <div class = 'd3-tip' style='background:#E5E8E8;font-size: small; border-width: 2px; border-style: solid; border-color: black;'><span style='color:black; margin-top: 10px; margin-left: 10px; margin-right: 5px;'><strong>Community Area:</strong> 
            ${d.z}</span><br/>
            <span style='color:black; margin-top: 5px; margin-left: 10px; margin-right: 10px'><strong>Population:</strong> 
            ${d.y}</span><br/>
                </div>
                `;
  });

  svg.call(tooltip);

  if (array.length > 0) {
    var race1_xy = [];
    for (var i = 0; i < data1.length; i++) {
      race1_xy.push({ x: race[i], y: data1[i], z: array[0]["community"] });
    }

    raceSvg
      .append("g")
      .call(d3.axisBottom(xScale).ticks(8))
      .attr("transform", `translate(0,${height - margin.bottom})`);

    var g1 = raceSvg
      .append("g")
      .selectAll("rect")
      .data(race1_xy)
      .join((enter) =>
        enter
          .append("rect")
          .attr(
            "x",
            (d, i) =>
              margin.left +
              i * ((width - margin.right - margin.left) / data1.length) +
              15
          )
          .attr("y", (d) => yScale(d.y))
          .attr("width", 15)
          .attr("height", (d) => yScale(0) - yScale(d.y))
          .attr("fill", (d, i) => "#3182bd")
          .on("mouseover", function (d, i) {
            tooltip.show(d, this);
            d3.select(this).attr("opacity", 0.5);
          })
          .on("mouseout", function (d, i) {
            tooltip.hide(d, this);
            d3.select(this).attr("opacity", 1);
          })
      );
  }

  if (array.length > 1) {
    var race2_xy = [];
    for (var i = 0; i < data2.length; i++) {
      race2_xy.push({ x: race[i], y: data2[i], z: array[1]["community"] });
    }

    var g2 = raceSvg
      .append("g")
      .selectAll("rect")
      .data(race2_xy)
      .join((enter) =>
        enter
          .append("rect")
          .attr(
            "x",
            (d, i) =>
              margin.left +
              i * ((width - margin.right - margin.left) / data2.length) +
              30
          )
          .attr("y", (d) => yScale(d.y))
          .attr("width", 15)
          .attr("height", (d) => yScale(0) - yScale(d.y))
          .attr("fill", (d, i) => "#dd1c77")
          .on("mouseover", function (d, i) {
            tooltip.show(d, this);
            d3.select(this).attr("opacity", 0.5);
          })
          .on("mouseout", function (d, i) {
            tooltip.hide(d, this);
            d3.select(this).attr("opacity", 1);
          })
      );
  }

  if (array.length == 3) {
    var race3_xy = [];
    for (var i = 0; i < data3.length; i++) {
      race3_xy.push({ x: race[i], y: data3[i], z: array[2]["community"] });
    }

    var g3 = raceSvg
      .append("g")
      .selectAll("rect")
      .data(race3_xy)
      .join((enter) =>
        enter
          .append("rect")
          .attr(
            "x",
            (d, i) =>
              margin.left +
              i * ((width - margin.right - margin.left) / data3.length) +
              45
          )
          .attr("y", (d) => yScale(d.y))
          .attr("width", 15)
          .attr("height", (d) => yScale(0) - yScale(d.y))
          .attr("fill", (d, i) => "tomato")
          .on("mouseover", function (d, i) {
            tooltip.show(d, this);
            d3.select(this).attr("opacity", 0.5);
          })
          .on("mouseout", function (d, i) {
            tooltip.hide(d, this);
            d3.select(this).attr("opacity", 1);
          })
      );
  }

  raceSvg
    .append("g")
    .call(d3.axisLeft(yScale))
    .attr("transform", `translate(${margin.left},0)`);

  raceSvg
    .append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width - 300)
    .attr("y", height - 10)
    .text("Race");

  raceSvg
    .append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("x", 0 - 250)
    .attr("y", 5)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Population of Race");

  let legend_x = 400;
  let legend_y = 70;
  selectedCommunityAreas.forEach((community) => {
    console.log(community);
    raceSvg
      .append("circle")
      .attr("cx", legend_x)
      .attr("cy", legend_y)
      .attr("r", 6)
      .style("fill", communityAreaColor(community.area_numbe));
    raceSvg
      .append("text")
      .attr("x", legend_x + 20)
      .attr("y", legend_y)
      .text(community.community)
      .style("font-size", "15px")
      .attr("alignment-baseline", "middle");
    legend_y += 30;
  });
}

const getInnerRadius = (index) => {
  return arcMinRadius + (numArcs - (index + 1)) * (arcWidth + arcPadding);
};

const getOuterRadius = (index) => {
  return getInnerRadius(index) + arcWidth;
};

const rad2deg = (angle) => {
  return (angle * 180) / PI;
};

const renderResourceDistribution = (
  selectedCommunityId,
  selectedCommunityArea
) => {
  if (resourceSvg) {
    resourceSvg.selectAll("*").remove();
  }

  const resourceTooltip = d3
    .tip()
    .attr("class", "d3-tip")
    // .html("<p>This is a SVG inside a tooltip:</p><div id='tipDiv'></div>");
    .html(function (d) {
      return `<div class = 'd3-tip' style='background:#E5E8E8;font-size: small; border-width: 2px; border-style: solid; border-color: black;'><span style='color:black; margin-top: 10px; margin-left: 10px; margin-right: 5px;'><strong>No. of Hospital:</strong> 
${d.Hospitals.toFixed(2)}</span><br/>
<span style='color:black; margin-top: 5px; margin-left: 10px; margin-right: 10px'><strong>No. of Bus Stops:</strong> 
${d.Buses.toFixed(2)}</span><br/>
<span style='color:black; margin-top: 5px; margin-left: 10px; margin-right: 10px'><strong>No. of Train Stations:</strong> 
${d.Trains.toFixed(2)}</span><br/>
<span style='color:black; margin-top: 5px; margin-left: 10px; margin-right: 10px'><strong>No. of Schools:</strong> 
${d.Schools.toFixed(2)}</span><br/>
    </div>
        `;
    });

  let selectedCommunity = chicagoRaceData.filter(
    (d) => d.COMMAREA == selectedCommunityId
  );
  console.log(selectedCommunityId);
  console.log(selectedCommunity);
  data = selectedCommunity[0];

  const resourceObj = {
    Hospitals: hospitalsCount.get(parseInt(selectedCommunityId)),
    Schools: schoolsCount.get(parseInt(selectedCommunityId)),
    Buses: busStopsCount.get(parseInt(selectedCommunityId)),
    Trains: trainsCount.get(parseInt(selectedCommunityId)),
  };

  const cityAverage = {
    Hospitals: hospitalsCount.get("Average"),
    Schools: schoolsCount.get("Average"),
    Buses: busStopsCount.get("Average"),
    Trains: trainsCount.get("Average"),
  };

  let resourceMin = Math.min.apply(Math, Object.values(resourceObj));
  let resourceMax = Math.max.apply(Math, Object.values(resourceObj));

  let cityMin = Math.min.apply(Math, Object.values(cityAverage));
  let cityMax = Math.max.apply(Math, Object.values(cityAverage));

  var temp = Object.values(cityAverage);
  var min = Math.min(resourceMin, cityMin);
  var max = Math.max(resourceMax, cityMax);
  keys = ["Hospital", "School", "Bus", "Train"];
  console.log(data);
  const r = 200;
  const margin = { left: 30, top: 30, right: 30, bottom: 30 };

  console.log(resourceObj);

  resourceSvg = d3.select("#resourceVisualization");
  resourceSvg.attr(
    "viewBox",
    `-${margin.left},
      -${margin.top},
      ${r * 2 + margin.left + margin.right},
      ${r * 2 + margin.bottom + margin.top}`
  );

  const dimensions = keys;

  const radialLine = d3.lineRadial();
  const yScale = d3.scaleLinear().range([0, r]).domain([min, max]);

  // const ticks = [2.5, 5, 7.5, 10];
  let ticks = d3.range(min, max, (max - min) / 3);
  ticks = [...ticks, max];
  dimensions.forEach((dimension, i) => {
    const g = resourceSvg
      .append("g")
      .attr("transform", `translate(${r}, ${r}) rotate(${i * 90})`);

    g.append("g").call(d3.axisLeft(yScale).tickFormat("").tickValues(ticks));
    g.append("g").call(d3.axisRight(yScale).tickFormat("").tickValues(ticks));

    g.append("text")
      .text(dimension)
      .attr("text-anchor", "middle")
      .attr("transform", `translate(0, -${r + 10})`);
  });

  resourceSvg.call(resourceTooltip);
  resourceSvg
    .append("g")
    .selectAll("path")
    .data([resourceObj])
    .enter()
    .append("path")
    .attr("id", "communityRadar")
    .attr("d", (d) =>
      radialLine(
        [d.Hospitals, d.Schools, d.Buses, d.Trains].map((v, i) => [
          (Math.PI * 2 * i) / 4,
          yScale(v),
        ])
      )
    )
    .attr("transform", `translate(${r}, ${r})`)
    .attr("stroke", "SteelBlue")
    .attr("stroke-width", 5)
    .attr("fill", "rgba(70, 130, 180, 0.3)")
    .on("mouseover", (d) => {
      d3.select("#cityRadar").style("opacity", 0.2);
      resourceTooltip.show(d);
    })
    .on("mouseout", (d) => {
      d3.select("#cityRadar").style("opacity", 0.8);
      resourceTooltip.hide();
    });

  resourceSvg
    .append("g")
    .selectAll("path")
    .data([cityAverage])
    .enter()
    .append("path")
    .attr("id", "cityRadar")
    .attr("d", (d) =>
      radialLine(
        [d.Hospitals, d.Schools, d.Buses, d.Trains].map((v, i) => [
          (Math.PI * 2 * i) / 4,
          yScale(v),
        ])
      )
    )
    .attr("transform", `translate(${r}, ${r})`)
    .attr("stroke", "#de2d26")
    .attr("stroke-width", 5)
    .attr("fill", "#fee0d2")
    .attr("opacity", 0.8)
    .on("mouseover", (d) => {
      d3.select("#cityRadar").style("opacity", 1);
      d3.select("#communityRadar").style("opacity", 0.5);
      resourceTooltip.show(d);
    })
    .on("mouseout", (d) => {
      d3.select("#cityRadar").style("opacity", 0.8);
      d3.select("#communityRadar").style("opacity", 1);
      resourceTooltip.hide();
    });

  resourceSvg
    .append("g")
    .selectAll("path")
    .data(ticks)
    .enter()
    .append("path")
    .attr("d", (d) =>
      radialLine(
        _.range(5).map((v, i) => {
          console.log([(Math.PI * 2 * (i + 1)) / 4, yScale(d)]);
          return [(Math.PI * 2 * (i + 1)) / 4, yScale(d)];
        })
      )
    )
    .attr("transform", `translate(${r}, ${r})`)
    .attr("stroke", "grey")
    .attr("opacity", 0.5)
    .attr("fill", "none");

  resourceSvg
    .append("circle")
    .attr("cx", -15)
    .attr("cy", 0)
    .attr("r", 6)
    .style("fill", "SteelBlue");
  resourceSvg
    .append("text")
    .attr("x", 0)
    .attr("y", 0)
    .text(selectedCommunityArea)
    .style("font-size", "12px")
    .attr("alignment-baseline", "middle");

  resourceSvg
    .append("circle")
    .attr("cx", -15)
    .attr("cy", 20)
    .attr("r", 6)
    .style("fill", "#de2d26");
  resourceSvg
    .append("text")
    .attr("x", 0)
    .attr("y", 20)
    .text("City Average")
    .style("font-size", "12px")
    .attr("alignment-baseline", "middle");
};

const communityAreaColor = (community_area) => {
  const index = selectedCommunityAreas.findIndex(
    (a) => a.area_numbe == community_area
  );
  if (index == -1) {
    return mapColorScale(chicagoRaceData[community_area - 1][selectedRace]);
  } else {
    return index == 0 ? "#3182bd" : index == 1 ? "#dd1c76" : "tomato";
  }
};

const calculateResources = () => {
  for (let i = 1; i <= 77; i++) {
    busStopsCount.set(i, 0);
    trainsCount.set(i, 0);
    schoolsCount.set(i, 0);
    hospitalsCount.set(i, 0);
  }

  busStopsData.forEach((stop) => {
    const Id = parseInt(stop.COMM_AREA);
    busStopsCount.set(Id, busStopsCount.get(Id) + 1);
  });
  busStopsCount.set("Average", busStopsData.length / 77);

  trainsData.forEach((stop) => {
    const Id = parseInt(stop.Comm_Area);
    trainsCount.set(Id, trainsCount.get(Id) + 1);
  });
  trainsCount.set("Average", trainsData.length / 77);

  schoolsData.forEach((stop) => {
    const Id = parseInt(stop.Comm_Area);
    schoolsCount.set(Id, schoolsCount.get(Id) + 1);
  });
  schoolsCount.set("Average", schoolsData.length / 77);

  hospitalsData.forEach((stop) => {
    const Id = parseInt(stop.Comm_Area);
    hospitalsCount.set(Id, hospitalsCount.get(Id) + 1);
  });
  hospitalsCount.set("Average", hospitalsData.length / 77);
};
