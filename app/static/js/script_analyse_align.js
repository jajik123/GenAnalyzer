// This script is linked to analyse.html


//When user selects file its content is set as value of the textarea
document.getElementById('sequenceFile').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('sequenceInput').value = e.target.result;
        };
        reader.readAsText(file);
    } else {
        alert('No file selected.');
    }
});


//Function that submits the sequence for alignment
async function submitSequence() {
    const textarea = document.getElementById("sequenceInput");
    let inputSequence = textarea.value;
    if (!inputSequence) {
        alert("Please enter or upload a sequence.");
        return;
    }
    document.getElementById('backToSearchButton').style.display = 'none';
    document.getElementById('backToSearchLink').style.display = 'block';

    // Clear previous results
    const alignmentSection = document.getElementById('alignmentSection');
    let alignmentDiv = document.getElementById('alignmentDiv');
    if (alignmentDiv) { alignmentDiv.innerHTML = ''; } else {
        alignmentDiv = document.createElement('div');
        alignmentDiv.id = "alignmentDiv";
        alignmentSection.appendChild(alignmentDiv);
    }
    let mutTableDiv = document.getElementById('mutTableDiv');
    if (mutTableDiv) { mutTableDiv.innerHTML = ''; }
    let diseaseAssociationDiv = document.getElementById('diseaseAssociationDiv');
    if (diseaseAssociationDiv) { diseaseAssociationDiv.innerHTML = ''; }
    document.getElementById('showDiseaseAssociationButton')?.remove();
    // Display a loading message
    const alignmentHeading = document.createElement('h4');
    alignmentHeading.textContent = "Loading...";
    alignmentDiv.appendChild(alignmentHeading);

    try {
        // Send the input sequence and reference sequence to the server for alignment
        const response = await fetch('/align_sequence', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ referenceSequence, inputSequence })
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || `Server error: ${response.statusText}`);
        }
        if (result.error) {
            alignmentHeading.textContent = result.error;
        } else {
            const alignedReferenceSequence = result.aligned_reference_sequence;
            const alignedInputSequence = result.aligned_input_sequence;
            const matchPercentage = result.match_percentage

            // Display matchPercentage
            const matchPercentageParagraph = document.createElement('p');
            matchPercentageParagraph.textContent = `Match Score Percentage: ${matchPercentage}%`;
            alignmentDiv.appendChild(matchPercentageParagraph);

            // Check the match percentage and continue accordingly
            if (matchPercentage == 100) {
                alignmentHeading.textContent = "Your input sequence is exactly the same as the reference.";
                drawAlignment(alignedReferenceSequence, alignedInputSequence); // draw alignment
                scrollToElement('alignmentDiv');
            }
            else if (matchPercentage < 50) {
                alignmentHeading.textContent = "The match score percentage is very low. Please verify that you have entered the correct sequence.";
                // Provide an option to show the alignment
                const showAlignmentLink = document.createElement('a');
                showAlignmentLink.textContent = 'Show the alignment anyways.';
                showAlignmentLink.href = '#';

                showAlignmentLink.addEventListener('click', function (event) {
                    event.preventDefault();
                    // display Warning
                    alignmentHeading.textContent = "Warning: The match score percentage is very low. The alignment may not be reliable.";
                    alignmentDiv.removeChild(showAlignmentLink);
                    drawAlignment(alignedReferenceSequence, alignedInputSequence);
                });
                alignmentDiv.appendChild(showAlignmentLink);
            } else {
                alignmentHeading.textContent = "Aligned sequences";
                drawAlignment(alignedReferenceSequence, alignedInputSequence); // draw the alignment
                showMutationExplanation();
                applyEventListeners(); // this is so the modal woeks
                showLinkToAligner();
                scrollToElement('alignmentDiv');
                showMutationsTableButton(); // Show button for mutations table
            }
        }
    } catch (error) {
        console.error("ERROR: ", error);
        alignmentHeading.textContent = error.message;
    }
}

// Function to visualize the alignment between the reference and input sequence
function drawAlignment(alignedReferenceSequence, alignedInputSequence) {
    let formattedAlignedReferenceSequence = "";
    let formattedAlignedInputSequence = "";
    // Go through each character of the aligned sequences
    for (let i = 0; i < alignedReferenceSequence.length; i++) {
        let refChar = alignedReferenceSequence[i];
        let inputChar = alignedInputSequence[i];
        // Highlight insertions, deletions, and substitutions
        if (inputChar === "-") {
            formattedAlignedReferenceSequence += `<span style="color: red;">${refChar}</span>`;
            formattedAlignedInputSequence += `<span style="color: red;">${inputChar}</span>`; // Deletion
        } else if (refChar === "-") {
            formattedAlignedReferenceSequence += `<span style="color: green;">${refChar}</span>`;
            formattedAlignedInputSequence += `<span style="color: green;">${inputChar}</span>`; // Insertion
        } else if (refChar !== inputChar) {
            formattedAlignedReferenceSequence += `<span style="color: blue;">${refChar}</span>`;
            formattedAlignedInputSequence += `<span style="color: blue;">${inputChar}</span>`; // Substitution
        } else {
            formattedAlignedReferenceSequence += refChar;
            formattedAlignedInputSequence += inputChar;
        }
    }
    const alignmentDiv = document.getElementById('alignmentDiv');

    const alignmentFlexBoxDiv = document.createElement('div');
    alignmentFlexBoxDiv.classList.add("flex_container")
    alignmentFlexBoxDiv.id = "alignmentFlexBoxDiv";
    alignmentDiv.appendChild(alignmentFlexBoxDiv);


    const alignmentBoxLabelDiv = document.createElement('div');
    alignmentBoxLabelDiv.id = "alignmentBoxLabelDiv";
    alignmentFlexBoxDiv.appendChild(alignmentBoxLabelDiv);

    const alignmentBoxDiv = document.createElement('div');
    alignmentBoxDiv.id = "alignmentBoxDiv";
    alignmentFlexBoxDiv.appendChild(alignmentBoxDiv);


    const refParagraph = document.createElement('p');
    refParagraph.textContent = "Reference Sequence:"; // Text for Reference Sequence
    const inputParagraph = document.createElement('p');
    inputParagraph.textContent = "Your Input Sequence:"; // Text for Input Sequence

    const refPreElement = document.createElement('pre');
    refPreElement.innerHTML = formattedAlignedReferenceSequence; // Add the formatted reference sequence
    const inputPreElement = document.createElement('pre');
    inputPreElement.innerHTML = formattedAlignedInputSequence; // Add the formatted input sequence

    alignmentBoxLabelDiv.appendChild(refParagraph);
    alignmentBoxDiv.appendChild(refPreElement);
    alignmentBoxLabelDiv.appendChild(inputParagraph);
    alignmentBoxDiv.appendChild(inputPreElement);
}

/*function showLinkToAligner() {
    const p = document.createElement("p");
    p.innerHTML = 'Want to explore how alignment works or customize your own parameters? Try the <a href="/aligner" target="_blank">Advanced Sequence Aligner</a>.';
    document.getElementById("alignmentDiv").appendChild(p);
}*/

function showLinkToAligner() {
    const p = document.createElement("p");
    p.innerHTML = 'Want to explore how alignment works or customize your own parameters? Try the <a href="#" id="alignerLink">Advanced Sequence Aligner</a>.';
    document.getElementById("alignmentDiv").appendChild(p);

    document.getElementById("alignerLink").addEventListener("click", function () {
        const referenceSeq = document.querySelector("#referenceSequence pre")?.textContent;
        const userSeq = document.getElementById("sequenceInput")?.value;        
        sessionStorage.setItem("referenceSequence", referenceSeq);
        sessionStorage.setItem("userSequence", userSeq);
        window.open("/aligner", "_blank");
    });
}

function showMutationExplanation() {
    const explanationDiv = document.createElement('div');
    explanationDiv.classList.add('explanation');

    const questionButton = document.createElement('button');
    questionButton.classList.add('question');
    questionButton.textContent = 'Explanation';

    const answerDiv = document.createElement('div');
    answerDiv.classList.add('answer', 'modal');

    const modalContentDiv = document.createElement('div');
    modalContentDiv.classList.add('modal-content');

    const closeButton = document.createElement('span');
    closeButton.classList.add('close');
    closeButton.textContent = '×';

    const modalTitle = document.createElement('p');
    modalTitle.classList.add('modal-title');
    modalTitle.textContent = 'Aligned sequences - explanation';

    const explanationText = document.createElement('p');
    explanationText.innerHTML = `
        The sequences are shown in two columns:<br>
        <ul>
        <li>Reference Sequence - the sequence you're comparing your input to.</li>
        <li>Your Input Sequence - the sequence you submitted for comparison.</li>
        </ul>
        <br>
        Colours are used to highlight the differences between the sequences:<br>
        <ul>
            <li><span style="color: red;">Red</span> indicates deletions in your input sequence (characters that are missing compared to the reference)</li>
            <li><span style="color: green;">Green</span> indicates insertions in your input sequence (extra characters that aren't in the reference)</li>
            <li><span style="color: blue;">Blue</span> indicates substitutions (characters that are different between the reference and input sequences)</li>
        </ul><br>
        The Match Score Percentage shows how closely your input sequence matches the reference sequence.
    `;

    modalContentDiv.appendChild(closeButton);
    modalContentDiv.appendChild(modalTitle);
    modalContentDiv.appendChild(explanationText);
    answerDiv.appendChild(modalContentDiv);
    explanationDiv.appendChild(questionButton);
    explanationDiv.appendChild(answerDiv);
    document.getElementById("alignmentDiv").appendChild(explanationDiv);
}

function showMutationsTableButton() {
    if (!document.getElementById("showMutationsTableButton")) {
        const button = document.createElement("button");
        button.textContent = "View Mutation Table";
        button.id = "showMutationsTableButton";
        button.onclick = showMutationsTable;

        document.getElementById("alignmentSection").appendChild(button);
    }
}

// Function to display the mutation table
async function showMutationsTable() {
    const button = document.getElementById("showMutationsTableButton");
    if (button) { button.remove(); } //remove the button

    const alignmentSection = document.getElementById('alignmentSection');
    let mutTableDiv = document.getElementById('mutTableDiv');
    if (mutTableDiv) { mutTableDiv.innerHTML = ''; } else {
        mutTableDiv = document.createElement('div');
        mutTableDiv.id = "mutTableDiv";
        alignmentSection.appendChild(mutTableDiv);
    }

    const mutTableHeading = document.createElement('h4');
    mutTableHeading.textContent = "Loading table...";
    mutTableDiv.appendChild(mutTableHeading);

    try {
        // Make a POST request to the server to fetch mutation data (variants)
        const response = await fetch('/find_variants', {
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
            console.error("Error from server:", result.error);
        } else {
            mutTableHeading.textContent = "Variants found";
            const mutTableFilter = document.createElement('div');
            mutTableFilter.id = "mutTableFilter";
            mutTableDiv.appendChild(mutTableFilter);

            addTypeFilter(result.variants); // Add a filter for variant types (e.g., "all", "substitution", "insertion", etc.)
            addSortButton(result.variants); // Add a button for sorting the variants
            createVariantsTable(result.variants);  // Create and display the variants table with the fetched data
            addDownloadButtons(mutTableDiv, variantsTable, "variants table", downloadVariantsTable);
            scrollToElement('mutTableDiv');

            // Collect variant types and positions for disease association purposes
            const variantstype = result.variants.map(variant => variant.type);
            const variantspos = result.variants.map(variant => variant.position);
            const hgvsvariants = result.variants.map(variant => variant.hgvs);

            showDiseaseAssociationButton(variantstype, variantspos, hgvsvariants);
        }

    } catch (error) {
        mutTableHeading.textContent = "Error.";
        const preElement = document.createElement('pre');
        preElement.innerHTML = error.message;
        mutTableDiv.appendChild(preElement);
    }
}

// Function to create a filter for mutation types (e.g., "substitution", "deletion", etc.)
function addTypeFilter(variants) {
    const mutTableFilter = document.getElementById('mutTableFilter');
    const label = document.createElement('label');
    label.setAttribute('for', 'typeFilter');
    label.textContent = 'Filter by Type: ';
    const select = document.createElement('select');
    select.id = 'typeFilter';

    // Extract unique types from variants
    const options = ["all"].concat(Array.from(new Set(variants.map(variant => variant.type))));
    // Create options based on the types
    options.forEach(type => {
        const option = document.createElement('option');
        option.value = option.textContent = type;
        select.appendChild(option);
    });

    mutTableFilter.appendChild(label);
    mutTableFilter.appendChild(select);

    select.addEventListener('change', (event) => filterVariants(event, variants)); // when changed filterVariants

}

// Function to filter the variants based on the selected type
function filterVariants(event, variants) {
    const selectedType = event.target.value; // Get the selected type from dropdown
    if (!Array.isArray(variants)) {
        console.error("variants is not an array", variants);
        return;
    }
    const filteredVariants = selectedType === "all"
        ? variants
        : variants.filter(variant => variant.type === selectedType);
    createVariantsTable(filteredVariants); // Create and display the table with filtered variants
}

// Adds sort button to the mutations table
function addSortButton(variants) {
    const mutTableFilter = document.getElementById('mutTableFilter');
    const sortButton = document.createElement('button');
    sortButton.textContent = 'Sort by Position';
    sortButton.id = 'sortButton';
    mutTableFilter.appendChild(sortButton);

    let ascending = true; // Tracking the sorting order (ascending/descending)

    // Event listener for sorting
    sortButton.addEventListener('click', () => {
        variants.sort((a, b) => {
            // Sort the variants based on their position using the parsePosition function
            let posA = parsePosition(a.position);
            let posB = parsePosition(b.position);
            return ascending ? posA - posB : posB - posA;
        });

        // On the next click the order will be the other way round
        ascending = !ascending;
        createVariantsTable(variants); // Recreate the table 
    });
}


// Function to parse the position of a variant and convert it into a number
function parsePosition(pos) {
    if (typeof pos === "number") return pos;
    let match = pos.match(/\d+/); // Find the first number if string
    return match ? parseInt(match[0], 10) : Number.MAX_VALUE; // If there is no number it will be at the bottom of the table (or at the top if descending)
}


// Function to create and display the variants table
function createVariantsTable(variants) {
    const mutTableDiv = document.getElementById('mutTableDiv');
    let tableContainer1 = document.querySelector('.table-container') || document.createElement('div');

    if (!tableContainer1.classList.contains('table-container')) {
        tableContainer1.classList.add('table-container');
        mutTableDiv.appendChild(tableContainer1);
    }

    let table = document.getElementById('variantsTable');
    if (table) { table.innerHTML = ''; } else {

        table = document.createElement('table');
        table.id = "variantsTable";
        tableContainer1.appendChild(table);
    }

    // Add table headers
    const headerRow = table.insertRow();
    ["Type", "Position", "Change (one-letter)", "Change (three-letter)", "HGVS"].forEach(headerText => {
        let th = document.createElement("th");
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    // Add table rows
    variants.forEach(variant => {
        let row = table.insertRow();
        row.insertCell(0).textContent = variant.type;
        row.insertCell(1).textContent = variant.position;
        row.insertCell(2).textContent = variant.change_one;
        row.insertCell(3).textContent = variant.change_three;
        row.insertCell(4).textContent = variant.hgvs;
    });
}

// Adds download buttons for different formats (CSV, TSV, Markdown)
function addDownloadButtons(container, table, name, funct) {
    downloadParagraph = document.createElement('p');
    container.appendChild(downloadParagraph);
    downloadParagraph.innerHTML = `Download ${name} as `;

    const csvButtonComma = document.createElement("button");
    csvButtonComma.textContent = "comma-separated CSV";
    csvButtonComma.addEventListener("click", () => funct(table, ",", "csv"));

    const csvButtonSemicolon = document.createElement("button");
    csvButtonSemicolon.textContent = "semicolon-separated CSV";
    csvButtonSemicolon.addEventListener("click", () => funct(table, ";", "csv"));

    const tsvButton = document.createElement("button");
    tsvButton.textContent = "TSV";
    tsvButton.addEventListener("click", () => funct(table, "\t", "tsv"));

    const mdButton = document.createElement("button");
    mdButton.textContent = "Markdown Table";
    mdButton.addEventListener("click", () => funct(table, " | ", "md"));

    downloadParagraph.appendChild(csvButtonComma);
    downloadParagraph.appendChild(document.createTextNode(", "));
    downloadParagraph.appendChild(csvButtonSemicolon);
    downloadParagraph.appendChild(document.createTextNode(", "));
    downloadParagraph.appendChild(tsvButton);
    downloadParagraph.appendChild(document.createTextNode(" or "));
    downloadParagraph.appendChild(mdButton);
}

// Function to handle the download of the variants table in different formats
function downloadVariantsTable(table, delimiter, extension) {
    const filter = document.getElementById("typeFilter").value;
    if (filter !== "all") {
        alert("Only filtred data will be downloaded.");
    }

    let content = "";
    const rows = table.querySelectorAll("tr");

    if (extension === "md") {
        rows.forEach((row, index) => {
            let rowData = [];
            row.querySelectorAll("th, td").forEach(cell => {
                rowData.push(cell.textContent); // Each cell's text
            });
            content += `| ${rowData.join(delimiter)} |\n`;
            if (index === 0) {
                content += `| ${rowData.map(() => "---").join(delimiter)} |\n`; // Separator after the header
            }
        });
    } else {
        // For CSV and TSV
        rows.forEach(row => {
            let rowData = [];
            row.querySelectorAll("th, td").forEach(cell => {
                rowData.push(cell.textContent);
            });
            content += rowData.join(delimiter) + "\n";
        });
    }


    const type = extension === "tsv" ? "text/tab-separated-values" : extension === "md" ? "text/markdown" : "text/csv";
    const blob = new Blob([content], { type: `${type};charset=utf-8;` }); // Blob (Binary Large Object) is used to create a downloadable file
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob); // Create URL for the Blob object
    link.download = `variantstable.${extension}`; // File name
    link.click(); // Trigger download
}

// Function to handle the download of the disease association table in different formats
function downloadDiseaseTable(table, delimiter, extension) {
    let content = "";
    const rows = table.querySelectorAll("tr");

    if (extension === "md") {
        rows.forEach((row, index) => {
            let rowData = [];
            row.querySelectorAll("th, td").forEach(cell => {
                let cellText = cell.textContent.trim();
                // Replace <br> with semicolons
                if (cell.innerHTML.includes("<br>")) {
                    cellText = cell.innerHTML.replace(/<br\s*\/?>/g, "; ");
                }
                rowData.push(cellText);
            });
            content += `| ${rowData.join(delimiter)} |\n`;
            if (index === 0) {
                content += `| ${rowData.map(() => "---").join(delimiter)} |\n`;
            }
        });
    } else {
        // this is for csv and tsv
        rows.forEach(row => {
            let rowData = [];
            row.querySelectorAll("th, td").forEach(cell => {
                let cellText = cell.textContent.trim()
                if (cell.innerHTML.includes("<br>")) {
                    cellText = cell.innerHTML.replace(/<br\s*\/?>/g, "; ");
                    if (extension === "csv") {
                        cellText = `"${cellText}"`;
                    }
                }
                rowData.push(cellText);
            });
            content += rowData.join(delimiter) + "\n";
        });
    }

    // Blob (Binary Large Object) is used to create a downloadable file
    const type = extension === "tsv" ? "text/tab-separated-values" : extension === "md" ? "text/markdown" : "text/csv";
    const blob = new Blob([content], { type: `${type};charset=utf-8;` });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `diseaseassociationstable.${extension}`;
    link.click();
}

function showDiseaseAssociationButton(variantstype, variantspos, hgvsvariants) {
    if (!document.getElementById("showDiseaseAssociationButton")) {
        const button = document.createElement("button");
        button.textContent = "View Disease Associations";
        button.id = "showDiseaseAssociationButton";

        button.onclick = () => showDiseaseAssociation(variantstype, variantspos, hgvsvariants);

        document.getElementById("alignmentSection").appendChild(button);
    }
}

// This function tries to get the disease associations and displays the results in a table
async function showDiseaseAssociation(variantstype, variantspos, hgvsvariants) {
    const button = document.getElementById("showDiseaseAssociationButton");
    if (button) { button.remove(); }
    const alignmentSection = document.getElementById('alignmentSection');
    let diseaseAssociationDiv = document.getElementById('diseaseAssociationDiv');
    if (diseaseAssociationDiv) { diseaseAssociationDiv.innerHTML = ''; } else {
        diseaseAssociationDiv = document.createElement('div');
        diseaseAssociationDiv.id = "diseaseAssociationDiv";
        alignmentSection.appendChild(diseaseAssociationDiv);
    }
    const diseaseAssociationHeading = document.createElement('h4');
    diseaseAssociationHeading.textContent = "Loading disease associations...";
    diseaseAssociationDiv.appendChild(diseaseAssociationHeading);

    const disTableFilter = document.createElement('div');
    disTableFilter.id = "disTableFilter";
    diseaseAssociationDiv.appendChild(disTableFilter);

    const tableContainer2 = document.createElement('div');
    tableContainer2.classList.add('table-container');
    diseaseAssociationDiv.appendChild(tableContainer2);

    const diseaseAssociationTable = document.createElement('table');
    diseaseAssociationTable.id = "diseaseAssociationTable";
    tableContainer2.appendChild(diseaseAssociationTable);

    // *Table heading
    const headerRow = diseaseAssociationTable.insertRow();
    ["Type", "Position", "HGVS", "Variant identifier", "ClinVar ID", "Significance", "Disease Associations",].forEach(headerText => {
        let th = document.createElement("th");
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    // For each varianta request to the server is made
    for (let i = 0; i < hgvsvariants.length; i++) {
        const variant = hgvsvariants[i];
        try {
            const response = await fetch('/find_association', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ variant: variant }),
            });
            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }
            const result = await response.json();
            if (result.error) {
                console.error("Error from server:", result.error);
            } else {
                // dislay the results one by one
                if (typeof result.variants === "string") {
                    const row = diseaseAssociationTable.insertRow();
                    row.insertCell(0).textContent = variantstype[i];  // Type from the hgvsvariant
                    row.insertCell(1).textContent = variantspos[i];  // Position from the hgvsvariant
                    row.insertCell(2).textContent = result.hgvs;
                    row.insertCell(3).textContent = result.variants;
                    row.insertCell(4).textContent = "-";
                    row.insertCell(5).textContent = "-";
                    row.insertCell(6).textContent = "-";
                } else {
                    result.variants.forEach((variantInfo) => {
                        const row = diseaseAssociationTable.insertRow();
                        row.insertCell(0).textContent = variantstype[i];  // Type from the hgvsvariant
                        row.insertCell(1).textContent = variantspos[i];  // Position from the hgvsvariant
                        row.insertCell(2).textContent = result.hgvs;
                        row.insertCell(3).textContent = variantInfo.title;
                        row.insertCell(4).innerHTML = `<a href="https://www.ncbi.nlm.nih.gov/clinvar/variation/${variantInfo.id}/" target="_blank">${variantInfo.id}</a>`;
                        row.insertCell(5).textContent = variantInfo.germline_classification || "N/A";
                        row.insertCell(6).innerHTML = variantInfo.disease_associations.join("<br>") || "N/A";
                    });
                }

            }

        } catch (error) {
            console.log("Error:", error.message);
        }
    }
    diseaseAssociationHeading.textContent = "Disease associations";

    addDiseaseTableKnownFilter(); // filter variants according to Variant identifier
    addDiseaseTableColumnFilter(); // make the user choose which columns to show
    addDownloadButtons(diseaseAssociationDiv, diseaseAssociationTable, "disease associations table", downloadDiseaseTable);
    scrollToElement('diseaseAssociationDiv');
}

//This function adds a dropdown filter to the page (options: "all", "known", and "not known")
function addDiseaseTableKnownFilter() {
    const disTableFilter = document.getElementById('disTableFilter');
    const label = document.createElement('label');
    label.setAttribute('for', 'knownVariantFilter');
    label.textContent = 'Filter by Variant Status:';

    // Create Select Dropdown
    const select = document.createElement('select');
    select.id = 'knownVariantFilter';

    // Add options for filtering by "Known" or "Not Known"
    const options = ["all", "known", "not known"];
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        select.appendChild(optionElement);
    });

    disTableFilter.appendChild(label);
    disTableFilter.appendChild(select);

    select.addEventListener('change', (event) => filterKnownVariants(event)); // filterKnownVariants function is called
}

// This function filters the rows of the disease association table based on the selected filter value ("all", "known", "not known")
function filterKnownVariants(event) {
    const selectedStatus = event.target.value;
    // Get the disease association table
    const diseaseAssociationTable = document.getElementById('diseaseAssociationTable');
    const rows = diseaseAssociationTable.querySelectorAll('tr');

    // Iterate over rows and hide those that don't match the selected status
    rows.forEach((row, index) => {
        if (index === 0) return;  // Skip header row
        const variantIdentifier = row.cells[3].textContent;  // Get the value from the "Variant identifier" column
        const isKnownVariant = !variantIdentifier.includes("Not known variant");  // If it doesn't contain "Not known variant", it's considered "Known"

        if (selectedStatus === "all" || (selectedStatus === "known" && isKnownVariant) || (selectedStatus === "not known" && !isKnownVariant)) {
            row.style.display = '';  // Show the row
        } else {
            row.style.display = 'none';  // Hide the row
        }
    });
}

// This function adds a dropdown menu for showing or hiding columns in the disease association table
function addDiseaseTableColumnFilter() {
    const disTableFilter = document.getElementById('disTableFilter');

    const dropdownContainer = document.createElement('div');
    dropdownContainer.classList.add('dropdown-container');

    // Create the dropdown button
    const dropdownButton = document.createElement('button');
    dropdownButton.textContent = "Show/Hide Columns ▼";
    dropdownButton.classList.add('dropdown-button');

    // Create the dropdown menu
    const dropdownMenu = document.createElement('div');
    dropdownMenu.classList.add('dropdown-menu');
    dropdownMenu.style.display = "none";

    // Column names and corresponding indexes
    const columns = ["Type", "Position", "HGVS", "Variant identifier", "ClinVar ID", "Significance", "Disease Associations",];

    columns.forEach((colName, index) => {
        const label = document.createElement('label');
        label.style.display = "block";
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true; // Default: all columns visible
        checkbox.dataset.columnIndex = index;
        // Add event listener to toggle column visibility
        checkbox.addEventListener('change', toggleColumnVisibility); // when changed call the toggleColumnVisibility function
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${colName}`));
        dropdownMenu.appendChild(label);
    });

    // Append elements
    dropdownContainer.appendChild(dropdownButton);
    dropdownContainer.appendChild(dropdownMenu);
    disTableFilter.appendChild(dropdownContainer);

    // Toggle dropdown visibility when clicking the button
    dropdownButton.addEventListener('click', () => {
        dropdownMenu.style.display = dropdownMenu.style.display === "none" ? "block" : "none";
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        if (!dropdownContainer.contains(event.target)) {
            dropdownMenu.style.display = "none";
        }
    });
}

// This function hides or shows columns based the "Show/Hide Columns" dropdown
function toggleColumnVisibility(event) {
    const columnIndex = event.target.dataset.columnIndex;
    const table = document.getElementById('diseaseAssociationTable');
    if (!table) return;
    // Loop through all rows
    table.querySelectorAll('tr').forEach(row => {
        const cell = row.cells[columnIndex];
        if (cell) {
            cell.style.display = event.target.checked ? "" : "none";
        }
    });
}

function scrollToElement(id) {
    let element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}