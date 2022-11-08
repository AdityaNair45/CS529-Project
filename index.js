let width = 800;
let height = 750;
let centered;
// let center_x = -87.6298;
// let center_y = 41.8781;
let center_x = -87.7000;
let center_y = 41.8250;
let svg;
let projection = d3
  .geoMercator()
  .scale(width * 75)
  .center([center_x, center_y])
  .translate([width/2, height/2]);

  let path = d3.geoPath(projection);
  let chicagoMap;
  let g;


const loadMap = async () => {
  let chicagoCommunityAreaData = await d3.json('data/communityAreas.geojson');


    svg = d3.select("#chicagoMap");

    chicagoMap = svg.append("g");
    chicagoMap.selectAll("path")
    .data(chicagoCommunityAreaData.features)
    .enter()
    .append("path")
    .attr("fill",'#ADD8E6')
    .attr("stroke",'#000000')
    .attr("d", path)
    .on("click",zoomOnClick)
};


const zoomOnClick = (d) => {
    let x, y, k;

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
    }

    svg.selectAll("path")
    .classed("active", centered && function(d) { return d === centered; });

    chicagoMap.transition()
      .duration(750)
      .attr("transform",`translate(${width/2},${height/2})scale(${k})translate(${-x},${-y})`)
    
}
