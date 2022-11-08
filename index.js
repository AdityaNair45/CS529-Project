let width = 800;
let height = 750;
let centered;
// let center_x = -87.6298;
// let center_y = 41.8781;
let center_x = -87.7;
let center_y = 41.825;
let svg;
let projection = d3
  .geoMercator()
  .scale(width * 75)
  .center([center_x, center_y])
  .translate([width / 2, height / 2]);

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
    x = width / 2;
    y = height / 2;
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
      `translate(${width / 2},${height / 2})scale(${k})translate(${-x},${-y})`
    );

  const selectedCommunityId = d.properties.area_numbe;

  if (addResources) {
    addResourcesToMap(selectedCommunityId, x, y, k);
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
      `translate(${width / 2},${height / 2})scale(${
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
      `translate(${width / 2},${height / 2})scale(${
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
      `translate(${width / 2},${height / 2})scale(${
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
    .attr("border-radius",5)
    .attr("xlink:href", "Images/hospitalIcon.JPG")
    .attr("x", (d) => projection([d.Longitude, d.Latitude])[0])
    .attr("y", (d) => projection([d.Longitude, d.Latitude])[1]);

  hospitalLocations
    .transition()
    .duration(750)
    .attr(
      "transform",
      `translate(${width / 2},${height / 2})scale(${
        k - 2
      })translate(${-x},${-y})`
    );
};

const onCategoryChange = () => {
  selectedRace = document.getElementById("raceDropdown").value;
  loadMap();
};
