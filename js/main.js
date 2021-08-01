const width = d3.min([window.innerWidth * 0.9, window.innerHeight * 0.9]);
const height = 600;

let dimensions = {
	width: width,
	height: width,
	margin: { top: 100, right: 20, bottom: 50, left: 50 },
};

dimensions.boundedWidth =
	dimensions.width - dimensions.margin.left - dimensions.margin.right;
dimensions.boundedHeight =
	dimensions.height - dimensions.margin.top - dimensions.margin.bottom;
const groups = [
	{
		key: "nominees_caucasian",
		label: "caucasian or another",
		color: "#EFC7C2",
	},
	{
		key: "nominees_afro_descendant",
		label: "afrodescendant",
		color: "#68A691",
	},
	{ key: "nominees_hispanic", label: "hispanic", color: "#694F5D" },
	{ key: "nominees_asian", label: "asian", color: "#BFD3C1" },
];

// Load the data here
let data = [];
d3.csv("./data/academy_awards_nominees.csv").then((data) => {
	// console.log("original data", data)

	//total nominees, for each year, with a breakdown per ethnic group.

	const formattedData = [];

	data.forEach((d) => {
		let current_year = Number(d.year);
		if (!formattedData.find((ceremony) => ceremony.year === current_year)) {
			const ceremony = {
				year: current_year,
				nominees_total: 1,
				nominees_caucasian: d.ethnic_background === "" ? 1 : 0,
				nominees_afro_descendant: d.ethnic_background === "black" ? 1 : 0,
				nominees_hispanic: d.ethnic_background === "hispanic" ? 1 : 0,
				nominees_asian: d.ethnic_background === "asian" ? 1 : 0,
			};
			formattedData.push(ceremony);
		} else {
			const ceremony = formattedData.find(
				(ceremony) => ceremony.year == d.year
			);
			ceremony.nominees_total += 1;
			switch (d.ethnic_background) {
				case "":
					ceremony.nominees_caucasian += 1;
					break;
				case "black":
					ceremony.nominees_afrodescendant += 1;
					break;
				case "hispanic":
					ceremony.nominees_hispanic += 1;
					break;
				case "asian":
					ceremony.nominees_asian += 1;
					break;
			}
		}
	});

	const createViz = (data) => {
		console.log(data);
		const groupKeys = groups.map((d) => d.key);
		const groupColors = groups.map((d) => d.color);
		const yAccessor = (d) => d.nominees_total;
		const xAccessor = (d) => d.year;

		const colorScale = d3.scaleOrdinal().domain(groupKeys).range(groupColors);

		const wrapper = d3
			.select("#viz")
			.append("svg")
			.attr("width", dimensions.width)
			.attr("height", dimensions.height);

		const bounds = wrapper
			.append("g")
			.style(
				"transform",
				`translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
			);
		const stack = d3
			.stack()
			.keys(groupKeys)
			.order(d3.stackOrderAscending) //smallest areas at bottom
			.offset(d3.stackOffsetNone); //areas at a zero baseline

		let series = stack(formattedData);

		const xScale = d3
			.scaleLinear()
			.domain(d3.extent(data, (d) => xAccessor(d)))
			.range([dimensions.margin.left, dimensions.boundedWidth]);

		const yScale = d3
			.scaleLinear()
			.domain([0, d3.max(data, (d) => yAccessor(d))])
			.range([dimensions.boundedHeight, dimensions.margin.top]);

		console.log(yScale.range());
		const xAxisGenerator = d3
			.axisBottom()
			.scale(xScale)
			.tickFormat(d3.format(""))
			.tickSizeOuter(0);
		const yAxisGenerator = d3.axisLeft().scale(yScale);
		// .attr("transform", `translate(0, ${height})`);

		const areaGenerator = d3
			.area()
			.x((d) => xScale(d.data.year))
			.y0((d) => yScale(d[0]))
			.y1((d) => yScale(d[1]))
			.curve(d3.curveCatmullRom);

		let pathGroup = bounds
			.append("g")
			.attr("class", "stream-paths")
			.selectAll("path")
			.data(series)
			.join("path")
			.attr("d", areaGenerator)
			.attr("fill", (d) => colorScale(d));

		const xAxis = bounds
			.append("g")
			.call(xAxisGenerator)
			.style("transform", `translateY(${dimensions.boundedHeight}px)`);

		const yAxis = bounds
			.append("g")
			.call(yAxisGenerator)
			.style("transform", `translateX(${dimensions.margin.left}px)`);

		bounds
			.append("text")
			.attr("class", "axis-label axis-label-x")
			.attr("x", dimensions.boundedWidth / 2)
			.attr("y", dimensions.boundedHeight + dimensions.margin.bottom)
			.style("font-size", "1.4em")
			.text("Number of Nominees");

		bounds
			.append("text")
			.attr("class", "axis-label axis-label-y")
			.attr("x", -dimensions.boundedHeight / 2 - 50)
			.attr("y", -dimensions.margin.left + 50)
			.text("Year")
			.style("transform", "rotate(-90deg)")
			.style("text-anchor", "middle")
			.style("font-size", "1.4em");

		//figure out position within
		const legend = d3
			.select(".legend")
			.append("ul")
			.selectAll("li")
			.data(groups)
			.join("li");

		legend
			.append("span")
			.attr("class", "legend-color")
			.style("background-color", (d) => d.color);

		legend
			.append("span")
			.attr("class", "legend-label")
			.text((d) => d.label);
	};

	createViz(formattedData);
});
