// This script is linked to aligner.html

document.addEventListener("DOMContentLoaded", function () {
    // Retrieve sequences from localStorage
    const referenceSeq = sessionStorage.getItem("referenceSequence") || "";
    const userSeq = sessionStorage.getItem("userSequence") || "";

    // Populate textareas
    document.getElementById("inputSequence1").value = referenceSeq;
    document.getElementById("inputSequence2").value = userSeq;

    // Clear localStorage after retrieval to prevent persisting data
    sessionStorage.removeItem("referenceSequence");
    sessionStorage.removeItem("userSequence");
});

// the submitSequences func gets users input, sends them to the server for alignment and displays results
async function submitSequences() {
    // Get sequences from input fields
    let sequence1 = document.getElementById("inputSequence1").value;
    let sequence2 = document.getElementById("inputSequence2").value;
    if ((!sequence1) || (!sequence2)) {
        alert("Please enter two sequences.");
        return;
    }

    // Get alignment parameters from the input fields
    let mode = document.getElementById("mode").value;
    let match_score = parseInt(document.getElementById("match_score").value);
    let mismatch_score = parseInt(document.getElementById("mismatch_score").value);
    let open_gap_score = parseInt(document.getElementById("open_gap_score").value);
    let extend_gap_score = parseInt(document.getElementById("extend_gap_score").value);

    // Ensure match score is valid
    if (match_score <= 0) {
        alert("Match score must be greater than 0.");
        return;
    }

    // Display "Loading..." message and clear previous results
    const heading = document.getElementById('alignmentHeading');
    heading.textContent = "Loading...";
    const svg = d3.select("#alignmentD3");
    svg.selectAll("*").remove();
    const tableDiv = document.getElementById('tableDiv');
    tableDiv.innerHTML = '';

    try {
        const response = await fetch('/advanced_aligner', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sequence1, sequence2, mode, match_score, mismatch_score, open_gap_score, extend_gap_score })
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || `Server error: ${response.statusText}`);
        }
        if (result.error) {
            alignmentHeading.textContent = result.error;
        } else {
            // Get aligned sequences from the response
            const aligned_sequence1 = result.aligned_sequence1;
            const aligned_sequence2 = result.aligned_sequence2;
            heading.textContent = "Aligned sequences:";

            // Adjust SVG width based on sequence length
            const svgElement = document.getElementById("alignmentD3");
            const charWidth = 20;
            const totalWidth = aligned_sequence1.length * charWidth;
            svgElement.setAttribute("width", totalWidth);

            // draw the alignment and create table with mutations
            draw(aligned_sequence1, aligned_sequence2);
            scrollToElement('alignmentDiv');
            showTable();
        }
    } catch (error) {
        console.error("ERROR: ", error);
        heading.textContent = error.message;
    }
}

// This function visualizes the aligned sequences using D3.js
function draw(reference, input) {
    const svg = d3.select("#alignmentD3");
    svg.selectAll("*").remove(); // clear previous
    const charWidth = 20;
    const charHeight = 30;
    const verticalPadding = 40;
    const numberFontSize = 10;

    // Map sequence characters to types
    const data = reference.split("").map((char, i) => ({
        pos: i,
        ref: char,
        input: input[i],
        match: input[i] === "-" ? "deletion" : reference[i] === "-" ? "insertion" :
            reference[i] !== input[i] ? "substitution" :
                "match"
    }));

    const colorScale = {
        match: "#ccc", //gray
        deletion: "#f44336", //red
        substitution: "#4287f5", //blue
        insertion: "#4caf50" //green
    };

    // Array for numbering the reference sequence
    let refNumbering = "";
    let num = 1;
    for (let i = 0; i < reference.length; i++) {
        let refChar = reference[i];
        if (refChar !== "-") {
            refNumbering += `${num} `;
            num += 1;
        } else {
            refNumbering += "- "; // gaps
        }
    }

    svg.selectAll("text.numbering")
        .data(refNumbering.split(" "))
        .enter()
        .append("text")
        .attr("x", (d, i) => i * charWidth + charWidth / 2)
        .attr("y", 10 + charHeight)
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .attr("font-size", numberFontSize)
        .text(d => d.trim() === "" ? "" : d)
        .attr("fill", "#000");

    // Rectangles for the reference sequence
    svg.selectAll("rect.ref")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", (d, i) => i * charWidth)
        .attr("y", 10 + verticalPadding)
        .attr("width", charWidth)
        .attr("height", charHeight)
        .attr("fill", d => colorScale[d.match]);

    // Rectangles for the input sequence
    svg.selectAll("rect.input")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", (d, i) => i * charWidth)
        .attr("y", 10 + 2 * verticalPadding)
        .attr("width", charWidth)
        .attr("height", charHeight)
        .attr("fill", d => colorScale[d.match]);

    // Letters for the reference sequence
    svg.selectAll("text.ref")
        .data(data)
        .enter()
        .append("text")
        .attr("x", (d, i) => i * charWidth + charWidth / 2)
        .attr("y", (d, i) => 10 + verticalPadding + charHeight / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .text(d => d.ref)
        .attr("fill", "#000");

    // Letters for the input sequence
    svg.selectAll("text.input")
        .data(data)
        .enter()
        .append("text")
        .attr("x", (d, i) => i * charWidth + charWidth / 2)
        .attr("y", 10 + 2 * verticalPadding + charHeight / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .text(d => d.input)
        .attr("fill", "#000");
}


// This function gets sequence mutation data from the backend and calls a function to displays them in a table
async function showTable() {
    const tableDiv = document.getElementById('tableDiv');
    const tableHeading = document.createElement('h3');
    tableHeading.textContent = "Loading table...";
    tableDiv.appendChild(tableHeading);
    try {
        const response = await fetch('/find_changes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }
        const result = await response.json();
        if (result.error) {
        } else {
            tableHeading.textContent = "Changes:";
            createChangesTable(result.changes);  // Call function to display in table
        }
    } catch (error) {
        tableHeading.textContent = "Error.";
        const preElement = document.createElement('pre');
        preElement.innerHTML = error.message;
        tableDiv.appendChild(preElement);
    }
}

// This function creates the table
function createChangesTable(changes) {
    const tableDiv = document.getElementById('tableDiv');
    let table = document.getElementById('changesTable');
    if (table) { table.innerHTML = ''; } else {
        table = document.createElement('table');
        table.id = "changesTable";
        tableDiv.appendChild(table);
    }
    // Add table headers
    const headerRow = table.insertRow();
    ["Type", "Position", "Change"].forEach(headerText => {
        let th = document.createElement("th");
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    // Add table rows
    changes.forEach(variant => {
        let row = table.insertRow();
        row.insertCell(0).textContent = variant.type;
        row.insertCell(1).textContent = variant.position;
        row.insertCell(2).textContent = variant.change_one;
    });
}

function scrollToElement(id) {
    let element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}
