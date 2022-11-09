let mapWidth = 800;
let mapHeight = 750;
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
let projection = d3
  .geoMercator()
  .scale(mapWidth * 75)
  .center([center_x, center_y])
  .translate([mapWidth / 2, mapHeight / 2]);

let path = d3.geoPath(projection);
let chicagoMap;
let g;

let selectedRace = "White";

let chicagoCommunityAreaData;
let chicagoRaceData;
let busStopsData;
let hospitalsData;
let schoolsData;
let trainsData;

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

  loadMap();
};

const loadMap = async () => {
  let mapColorScale = d3
    .scaleLinear()
    .interpolate(() => d3.interpolateBlues)
    .domain([
      chicagoRaceData[78][selectedRace],
      chicagoRaceData[77][selectedRace],
    ]);

  svg = d3.select("#chicagoMap");
  svg.selectAll("*").remove();
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
      return mapColorScale(chicagoRaceData[community_area - 1][selectedRace]);
    });
};

const zoomOnClick = (d) => {
  let x, y, k;
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

  const selectedCommunityId = d.properties.area_numbe;

  if (addResources) {
    addResourcesToMap(selectedCommunityId, x, y, k);
    renderRaceDistribution(selectedCommunityId);
    renderResourceDistribution(selectedCommunityId);
  }
};

const addResourcesToMap = (selectedCommunityId, x, y, k) => {
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

  // Adding Train Stations
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

  // Adding Schools
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

  // Adding Hospitals
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
};

const onCategoryChange = () => {
  selectedRace = document.getElementById("raceDropdown").value;
  loadMap();
};

const renderRaceDistribution = (selectedCommunityId) => {
  let selectedCommunity = chicagoRaceData.filter(
    (d) => d.COMMAREA == selectedCommunityId
  );
  selectedCommunity = selectedCommunity[0];
  const max = Math.max(
    selectedCommunity["White"],
    selectedCommunity["Asian"],
    selectedCommunity["Black"],
    selectedCommunity["Hispanic"],
    selectedCommunity["Pacific Islander"],
    selectedCommunity["Native"],
    selectedCommunity["Other"]
  );

  const keys = [
    "White",
    "Asian",
    "Black",
    "Hispanic",
    "Pacific Islander",
    "Native",
    "Other",
  ];

  let scale = d3
    .scaleLinear()
    .domain([0, max * 1.1])
    .range([0, 2 * PI]);

  let ticks = scale.ticks(numTicks).slice(0, -1);

  numArcs = keys.length;
  arcWidth = (chartRadius - arcMinRadius - numArcs * arcPadding) / numArcs;

  let arc = d3
    .arc()
    .innerRadius((d, i) => getInnerRadius(i))
    .outerRadius((d, i) => getOuterRadius(i))
    .startAngle(0)
    .endAngle((d, i) => scale(d));

  if (raceSvg) {
    raceSvg.selectAll("*").remove();
  }
  raceSvg = d3
    .select("#raceVisualization")
    .attr("width", raceVizWidth)
    .attr("height", raceVizHeight)
    .append("g")
    .attr(
      "transform",
      "translate(" + raceVizWidth / 2 + "," + raceVizHeight / 2 + ")"
    );

  let radialAxis = raceSvg
    .append("g")
    .attr("class", "r axis")
    .selectAll("g")
    .data(keys)
    .enter()
    .append("g");

  radialAxis
    .append("circle")
    .attr("r", (d, i) => getOuterRadius(i) + arcPadding)
    .attr("fill-opacity", 0.2);

  radialAxis
    .append("text")
    .attr("x", labelPadding)
    .attr("y", (d, i) => -getOuterRadius(i) + arcPadding)
    .text((d) => d);

  let axialAxis = raceSvg
    .append("g")
    .attr("class", "a axis")
    .selectAll("g")
    .data(ticks)
    .enter()
    .append("g")
    .attr("transform", (d) => "rotate(" + (rad2deg(scale(d)) - 90) + ")");

  axialAxis
    .append("line")
    .attr("x2", chartRadius)
    .attr("stroke-width", 2)
    .attr("stroke", "black");

  axialAxis
    .append("text")
    .attr("x", chartRadius + 10)
    .style("text-anchor", (d) =>
      scale(d) >= PI && scale(d) < 2 * PI ? "end" : null
    )
    .attr(
      "transform",
      (d) =>
        "rotate(" + (90 - rad2deg(scale(d))) + "," + (chartRadius + 10) + ",0)"
    )
    .text((d) => d);

  let arcs = raceSvg
    .append("g")
    .attr("class", "data")
    .selectAll("path")
    .data(keys)
    .enter()
    .append("path")
    .attr("class", "arc")
    .style("fill", (d, i) => raceVizColor(i));

  arcs
    .transition()
    .delay((d, i) => i * 200)
    .duration(1000)
    .attrTween("d", (d, i) => {
      let interpolate = d3.interpolate(0, selectedCommunity[d]);
      return (t) => arc(interpolate(t), i);
    });
};

const getInnerRadius = (index) => {
  return arcMinRadius + (numArcs - (index + 1)) * (arcWidth + arcPadding);
};

const getOuterRadius = (index) => {
  return getInnerRadius(index) + arcWidth;
};

const rad2deg = (angle) => {
  return (angle * 180) / PI;
};

const renderResourceDistribution = (selectedCommunityId) => {
    let selectedCommunity = chicagoRaceData.filter(
      (d) => d.COMMAREA == selectedCommunityId
    );

    data = selectedCommunity[0];

    temp = Object.values(data).slice(11,15)
    min = Math.min.apply(Math, temp)   
    max = Math.max.apply(Math, temp)
    keys = ['Hospital','School','Train','Bus']

   const r = 200
  const margin = { left: 30, top: 30, right: 30, bottom: 30 }

  svg = d3.select('#resourceVisualization');
    svg.attr('viewBox',
      `-${margin.left},
      -${margin.top},
      ${r * 2 + margin.left + margin.right},
      ${r * 2 + margin.bottom + margin.top}`)
  
  const dimensions = keys
  

  const radialLine = d3.lineRadial()
  

  const yScale = d3.scaleLinear()
    .range([0, r])
    .domain([min, max])
  

  const ticks = [2.5, 5, 7.5, 10]

  dimensions.forEach((dimension, i) => {

    const g = svg.append('g')
      .attr('transform', `translate(${r}, ${r}) rotate(${i * 90})`)


    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat('').tickValues(ticks))
    g.append('g')
      .call(d3.axisRight(yScale).tickFormat('').tickValues(ticks))

    g.append('text')
      .text(dimension)
      .attr('text-anchor', 'middle')
      .attr('transform', `translate(0, -${r + 10})`)
  })
  

  svg.append('g')
    .selectAll('path')
    .data([data])
    .enter()
    .append('path')
      .attr('d', d =>
        radialLine([
          d.Hospitals,
          d.Schools,
          d.Trains,
          d.Buses
        ].map((v, i) => [Math.PI * 2 * i / 4, yScale(v)])) 
      )
      .attr('transform', `translate(${r}, ${r})`)
      .attr('stroke', 'SteelBlue')
      .attr('stroke-width', 5)
      .attr('fill', 'rgba(70, 130, 180, 0.3)')
  
  svg.append('g')
    .selectAll('path')
    .data(ticks)
    .enter()
    .append('path')
      .attr('d', d => radialLine(_.range(7).map((v, i) => [Math.PI * 2 * i / 4, yScale(d)])))
      .attr('transform', `translate(${r}, ${r})`)
      .attr('stroke', 'grey')
      .attr('opacity', 0.5)
      .attr('fill', 'none')


    };
