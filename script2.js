const parseDate = d3.timeParse("%Y-%m-%d");

let company1Data, company2Data;

document.getElementById("csv-select-1").addEventListener("change", function () {
  const selectedCsvFile = this.value;
  loadData(selectedCsvFile, 1);
});

document.getElementById("csv-select-2").addEventListener("change", function () {
  const selectedCsvFile = this.value;
  loadData(selectedCsvFile, 2);
});

loadData(document.getElementById("csv-select-1").value, 1);
loadData(document.getElementById("csv-select-2").value, 2);

function loadData(csvFileName, companyNumber) {
  const csvFilePath = "./Data/" + csvFileName;

  d3.csv(csvFilePath)
    .then(function (data) {
      if (companyNumber === 1) {
        data.forEach(function (d1) {
          d1.date = parseDate(d1.date);
          d1.close = +d1.close;
        });
        company1Data = data;
      } else if (companyNumber === 2) {
        data.forEach(function (d2) {
          d2.date = parseDate(d2.date);
          d2.close = +d2.close;
        });
        company2Data = data;
      }

      createChart(company1Data, company2Data);
    })
    .catch(function (error) {
      console.error(
        "Error loading CSV file for company " + companyNumber + ":",
        error
      );
    });
}

function createChart(company1Data, company2Data) {
  const margin = { top: 20, right: 50, bottom: 50, left: 40 };
  const width = 900 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  const x = d3.scaleUtc(
    d3.extent(company1Data, (d1) => d1.date),
    [margin.top, width - margin.right]
  );

  const maxclose1 = company1Data ? d3.max(company1Data, (d1) => d1.close) : 0;
  const maxclose2 = company2Data ? d3.max(company2Data, (d2) => d2.close) : 0;
  const maxclose = d3.max([maxclose1, maxclose2]);

  const y = d3.scaleLinear([0, maxclose], [height - margin.bottom, margin.top]);

  const line1 = d3
    .line()
    .x((d1) => x(d1.date))
    .y((d1) => y(d1.close));

  const line2 = d3
    .line()
    .x((d2) => x(d2.date))
    .y((d2) => y(d2.close));

  d3.select("#chart-container svg").remove();

  const svgChart = d3
    .select("#chart-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svgChart
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );

  const legend = svgChart
    .append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + (width / 2 - 100) + ", 10)");

  legend
    .append("rect")
    .attr("width", 200)
    .attr("height", 40)
    .attr("fill", "none")
    .attr("stroke", "black")
    .style("opacity", 0.8);

  legend
    .append("rect")
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", "blue")
    .attr("transform", "translate(10, 15)");

  legend
    .append("text")
    .attr("x", 25)
    .attr("y", 25)
    .style("fill", "blue")
    .text("Company 1");

  legend
    .append("rect")
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", "orange")
    .attr("transform", "translate(110, 15)");

  legend
    .append("text")
    .attr("x", 125)
    .attr("y", 25)
    .style("fill", "orange")
    .text("Company 2");

  svgChart
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("x2", width - margin.left - margin.right)
        .attr("stroke-opacity", 0.1)
    )
    .call((g) =>
      g
        .append("text")
        .attr("x", -margin.left)
        .attr("y", 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text("↑ Daily close ($)")
    );

  svgChart
    .append("path")
    .attr("stroke", "blue")
    .attr("stroke-width", 1.5)
    .attr("class", "line company1-line")
    .attr("d", line1(company1Data));

  svgChart
    .append("path")
    .attr("stroke", "orange")
    .attr("stroke-width", 1.5)
    .attr("class", "line company2-line")
    .attr("d", line2(company2Data));

  const pointer1 = svgChart
    .append("circle")
    .attr("r", 5)
    .style("fill", "blue")
    .style("opacity", 0);

  const pointer2 = svgChart
    .append("circle")
    .attr("r", 5)
    .style("fill", "orange")
    .style("opacity", 0);

  const box1 = svgChart
    .append("rect")
    .attr("width", 100)
    .attr("height", 30)
    .attr("fill", "white")
    .attr("stroke", "blue")
    .attr("stroke-width", 1)
    .style("opacity", 0);

  const box2 = svgChart
    .append("rect")
    .attr("width", 100)
    .attr("height", 30)
    .attr("fill", "white")
    .attr("stroke", "orange")
    .attr("stroke-width", 1)
    .style("opacity", 0);

  const text1 = svgChart
    .append("text")
    .attr("class", "close-text")
    .attr("x", 0)
    .attr("y", 0)
    .style("fill", "blue")
    .style("opacity", 0);

  const text2 = svgChart
    .append("text")
    .attr("class", "close-text")
    .attr("x", 0)
    .attr("y", 0)
    .style("fill", "orange")
    .style("opacity", 0);

  svgChart
    .append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mousemove", mousemove)
    .on("mouseover", () => {
      pointer1.style("opacity", 1);
      pointer2.style("opacity", 1);
      box1.style("opacity", 1);
      box2.style("opacity", 1);
      text1.style("opacity", 1);
      text2.style("opacity", 1);
    })
    .on("mouseout", () => {
      pointer1.style("opacity", 0);
      pointer2.style("opacity", 0);
      box1.style("opacity", 0);
      box2.style("opacity", 0);
      text1.style("opacity", 0);
      text2.style("opacity", 0);
    });

  function mousemove(event) {
    const bisectDate = d3.bisector((d) => d.date).left;
    const x0 = x.invert(d3.pointer(event)[0]);
    const i1 = bisectDate(company1Data, x0, 1);
    const i2 = bisectDate(company2Data, x0, 1);
    const d1 = company1Data[i1];
    const d2 = company2Data[i2];

    pointer1.attr("cx", x(d1.date)).attr("cy", y(d1.close));
    box1.attr("x", x(d1.date) + 10).attr("y", y(d1.close) - 30);
    text1
      .attr("x", x(d1.date) + 15)
      .attr("y", y(d1.close) - 10)
      .text("$" + d1.close.toFixed(2));

    pointer2.attr("cx", x(d2.date)).attr("cy", y(d2.close));
    box2.attr("x", x(d2.date) + 10).attr("y", y(d2.close) - 30);
    text2
      .attr("x", x(d2.date) + 15)
      .attr("y", y(d2.close) - 10)
      .text("$" + d2.close.toFixed(2));
  }
}
