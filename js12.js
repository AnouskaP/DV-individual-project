const margin = { top: 70, right: 60, bottom: 50, left: 80 };
const width = 900 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const xScale = d3.scaleTime().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);

const svg = d3
  .select("#chart-container")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body").append("div").attr("class", "tooltip");
const tooltipRawDate = d3.select("body").append("div").attr("class", "tooltip");

document.getElementById("csv-select").addEventListener("change", function () {
  const selectedCsvFile = this.value;
  const csvFilePath = "./Data/" + selectedCsvFile;
  d3.csv(csvFilePath)
    .then(function (data) {
      svg.selectAll("*").remove();
      d3.select("#slider-range").select("svg").remove();

      const parseDate = d3.timeParse("%Y-%m-%d");
      data.forEach((d) => {
        d.date = parseDate(d.date);
        d.close = +d.close;
      });

      function processData(data) {
        console.log("Data loaded:", data);
      }

      processData(data);

      xScale.domain(d3.extent(data, (d) => d.date));
      yScale.domain([0, d3.max(data, (d) => d.close)]);

      svg
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .style("font-size", "14px")
        .call(
          d3
            .axisBottom(xScale)
            .tickValues(xScale.ticks(d3.timeYear.every(1)))
            .tickFormat(d3.timeFormat("%Y"))
        )
        .selectAll(".tick line")
        .style("stroke-opacity", 1);
      svg.selectAll(".tick text").attr("fill", "#777");

      svg
        .append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${width},0)`)
        .style("font-size", "14px")
        .call(
          d3
            .axisRight(yScale)
            .ticks(10)
            .tickFormat((d) => {
              if (isNaN(d)) return "";
              return `$${d.toFixed(2)}`;
            })
        )
        .selectAll(".tick text")
        .style("fill", "#777");

      const line = d3
        .line()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.close));
      const area = d3
        .area()
        .x((d) => xScale(d.date))
        .y0(height)
        .y1((d) => yScale(d.close));

      svg
        .append("path")
        .datum(data)
        .attr("class", "area")
        .attr("d", area)
        .style("fill", "url(#gradient)")
        .style("opacity", 0.5);

      const path = svg
        .append("path")
        .datum(data)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "#0077b6")
        .attr("stroke-width", 1)
        .attr("d", line);

      const circle = svg
        .append("circle")
        .attr("r", 0)
        .attr("fill", "#0a75ad")
        .style("stroke", "white")
        .attr("opacity", 0.7)
        .style("pointer-events", "none");

      const tooltipLineX = svg
        .append("line")
        .attr("class", "tooltip-line")
        .attr("id", "tooltip-line-x")
        .attr("stroke", "red")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2,2");

      const tooltipLineY = svg
        .append("line")
        .attr("class", "tooltip-line")
        .attr("id", "tooltip-line-y")
        .attr("stroke", "red")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2,2");

      const listeningRect = svg
        .append("rect")
        .attr("width", width)
        .attr("height", height);

      // Mouse move function
      listeningRect.on("mousemove", function (event) {
        const [xCoord] = d3.pointer(event, this);
        const bisectDate = d3.bisector((d) => d.date).left;
        const x0 = xScale.invert(xCoord);
        const i = bisectDate(data, x0, 1);
        const d0 = data[i - 1];
        const d1 = data[i];
        const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        const xPos = xScale(d.date);
        const yPos = yScale(d.close);

        circle.attr("cx", xPos).attr("cy", yPos);

        circle.transition().duration(50).attr("r", 5);

        tooltipLineX
          .style("display", "block")
          .attr("x1", xPos)
          .attr("x2", xPos)
          .attr("y1", 0)
          .attr("y2", height);
        tooltipLineY
          .style("display", "block")
          .attr("y1", yPos)
          .attr("y2", yPos)
          .attr("x1", 0)
          .attr("x2", width);

        tooltip
          .style("display", "block")
          .style("left", `${width + 90}px`)
          .style("top", `${yPos + 68}px`)
          .html(`$${d.close !== undefined ? d.close.toFixed(2) : "N/A"}`);

        tooltipRawDate
          .style("display", "block")
          .style("left", `${xPos + 60}px`)
          .style("top", `${height + 53}px`)
          .html(
            `${
              d.date !== undefined ? d.date.toISOString().slice(0, 10) : "N/A"
            }`
          );
      });

      // Mouse leave function
      listeningRect.on("mouseleave", function () {
        circle.transition().duration(50).attr("r", 0);
        tooltip.style("display", "none");
        tooltipRawDate.style("display", "none");
        tooltipLineX.attr("x1", 0).attr("x2", 0);
        tooltipLineY.attr("y1", 0).attr("y2", 0);
        tooltipLineX.style("display", "none");
        tooltipLineY.style("display", "none");
      });

      // Define the slider
      const sliderRange = d3
        .sliderBottom()
        .min(d3.min(data, (d) => d.date))
        .max(d3.max(data, (d) => d.date))
        .width(300)
        .tickFormat(d3.timeFormat("%Y-%m-%d"))
        .ticks(3)
        .default([d3.min(data, (d) => d.date), d3.max(data, (d) => d.date)])
        .fill("#0077b6"); // Dark blue

      sliderRange.on("onchange", (val) => {
        xScale.domain(val);
        const filteredData = data.filter(
          (d) => d.date >= val[0] && d.date <= val[1]
        );
        svg.select(".line").attr("d", line(filteredData));
        svg.select(".area").attr("d", area(filteredData));
        yScale.domain([0, d3.max(filteredData, (d) => d.close)]);
        svg
          .select(".x-axis")
          .transition()
          .duration(300)
          .call(
            d3
              .axisBottom(xScale)
              .tickValues(xScale.ticks(d3.timeYear.every(1)))
              .tickFormat(d3.timeFormat("%Y"))
          );

        svg
          .select(".y-axis")
          .transition()
          .duration(300)
          .call(
            d3
              .axisLeft(yScale)
              .ticks(10)
              .tickFormat((d) => {
                if (d <= 0) return "";
                return `$${d.toFixed(2)}`;
              })
          );
      });

      const gRange = d3
        .select("#slider-range")
        .append("svg")
        .attr("width", 500)
        .attr("height", 100)
        .append("g")
        .attr("transform", "translate(90,30)");

      gRange.call(sliderRange);

      svg
        .append("text")
        .attr("class", "chart-title")
        .attr("x", margin.left - 115)
        .attr("y", margin.top - 100)
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .style("font-family", "sans-serif");

      svg
        .append("text")
        .attr("class", "source-credit")
        .attr("x", width - 110)
        .attr("y", height + margin.bottom - 7)
        .style("font-size", "12px")
        .style("font-family", "sans-serif");
    })
    .catch(function (error) {
      console.log(error);
    });
});

// Initial load of the first CSV file
document.getElementById("csv-select").dispatchEvent(new Event("change"));
