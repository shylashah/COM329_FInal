d3.dsv(",", "netflix_final.csv", (d) => {
    if (!(d.director === "Not Given")) {
        return {
            name: d['title'],
            director: d['director'],
            country: d['country'],
            latitude: +d['latitude'], // Convert to number
            longitude: +d['longitude'], // Convert to number
            genre: d.listed_in
        };
    }
}).then((data) => {
    // Create a Leaflet map
    var map = L.map('map').setView([20, 0], 2); // Initial view (global)

    // Add OpenStreetMap tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // store the count of movies for each country
    var movieCount = {}
    data.forEach((entry) => {
        if (entry.country in movieCount) {
            movieCount[entry.country]++;
        } else {
            movieCount[entry.country] = 1;
        }
    })

    // scale of radius
    const rScale = d3.scaleLinear().domain([1, 2500]).range([50000, 1000000]);

    // store directors for each country
    var directorCount = {}
    data.forEach((entry) => {
        if (entry.country in directorCount) {
            if (entry.director in directorCount[entry.country]) {
                directorCount[entry.country][entry.director]++;
            } else {
                directorCount[entry.country][entry.director] = 1;
            }
        } else {
            directorCount[entry.country] = {};
            directorCount[entry.country][entry.director] = 1;
        }
    })
    // console.log(directorCount);



    // Loop through the data to create circles
    data.forEach((entry) => {
        if (!isNaN(entry.latitude) && !isNaN(entry.longitude)) { // Ensure valid coordinates
            const countryMovieCount = movieCount[entry.country]; // Get the count of movies for the current country
            const radius = rScale(countryMovieCount); // Scale the radius based on the count

            const values = Object.values(directorCount[entry.country]);
            const maxVal = Math.max(...values);
            const mostPopularDirector =  Object.keys(directorCount[entry.country]).find(key => directorCount[entry.country][key] === maxVal);

            var circle = L.circle([entry.latitude, entry.longitude], {
                color: 'blue', // Circle border color
                fillColor: 'blue', // Circle fill color
                fillOpacity: 1, // Transparency
                radius: radius, // Radius in meters
            })
                .bindPopup(`Country: ${entry.country}<br>Number of movies: ${countryMovieCount}<br>Most popular director: ${mostPopularDirector}`)
                .addTo(map);

            circle.on("mouseover", function() {
                this.setStyle({
                    color: "red",
                    fillColor: "red",
                    fillOpacity: 1, // Transparency
                })
            })

            circle.on("mouseout", function() {
                this.setStyle({
                    color: "blue",
                    fillColor: "blue",
                    fillOpacity: 1,
                })
            })

        }
    });

    // floating info box
    var legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info');
        div.innerHTML = '<h4>Netflix Movies Visualization</h4></br>Data Source: Kaggle</br>Team Members: Marta, Michelle, Shyla</br>';

        return div;
    };

    legend.addTo(map);

    ///////////// second visualization
    // store counts for each genre
    var genreCount = {}
    data.forEach((entry) => {
        var genres = entry['genre'].split(",");
        genres.forEach((genre) => {
                genre = genre.trim();
                if (genre in genreCount) {
                    genreCount[genre]++;
                } else {
                    genreCount[genre] = 1;
                }
            }
        )
    })

    console.log(genreCount);

    // Chart dimensions and margins
    const width = 800;
    const height = 600;
    const margin = { top: 40, right: 20, bottom: 150, left: 60 };

// Convert `genreCount` (object) into an array of key-value pairs
    const genreData = Object.entries(genreCount).map(([genre, count]) => ({ genre, count }));

// Create an SVG container
    const svg = d3.select("#div")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("background-color", "#f4f4f4");

// Create scales
    const xScale = d3.scaleBand()
        .domain(genreData.map(d => d.genre))
        .range([margin.left, width - margin.right])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(genreData, d => d.count)]) // Domain from 0 to max count
        .range([height - margin.bottom, margin.top]);

// Draw the bars
    svg.selectAll(".bar")
        .data(genreData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.genre))
        .attr("y", d => yScale(d.count))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - margin.bottom - yScale(d.count))
        .attr("fill", "steelblue");

// Add x-axis
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)") // Rotate labels if they overlap
        .style("text-anchor", "end")
        .style("font-size", "12px");

// Add y-axis
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale))
        .style("font-size", "12px");

// Add axis labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Genre");

    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .style("font-size", "14px")
        .text("Number of Movies");




}).catch((error) => {
    console.error("Error loading or processing the data:", error);
});
