// This script is linked to analyse.html

// the script runs after the html is loaded
document.addEventListener('DOMContentLoaded', function () {
    // DOM element references
    const aboutTheToolDiv = document.getElementById('aboutTheToolDiv');
    const searchSection = document.getElementById('searchSection');
    const geneForm = document.getElementById('geneForm');
    const resultHeading = document.getElementById("resultHeading")
    const resultCountDiv = document.getElementById('resultCount');
    const resultsDiv = document.getElementById('results');
    const diseaseFilter = document.getElementById('diseaseFilter');
    const filterDiv = document.getElementById('filterDiv');
    const alignmentSection = document.getElementById('alignmentSection');
    const selectedProteinName = document.getElementById("selectedProteinName");
    const backToSearchButton = document.getElementById("backToSearchButton");
    
    // Show the about and search sections, hide the alignment section and back to search button
    aboutTheToolDiv.style.display = "block";
    searchSection.style.display = "block";
    alignmentSection.style.display = "none";
    document.getElementById('backToSearchLink').style.display = 'none';

    // Event listener for the search form submission
    geneForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const geneName = document.getElementById('gene').value.trim();
        if (!geneName) {
            resultsDiv.innerHTML = `<p>Please enter a valid search term.</p>`;
            return;
        }
        try {
            resultHeading.textContent = "Loading...";
            resultHeading.style.display = "block";
            resultsDiv.innerHTML = '';
            resultCountDiv.innerHTML = '';
            
            // Reset disease filter
            diseaseFilter.innerHTML = '<option value="all">All</option>';
            diseaseFilter.disabled = true;
            filterDiv.style.display = "none";

            // Get search results from the server
            const response = await fetch(`/search_gene?gene=${geneName}`);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (data.results && data.results.length > 0) {
                resultHeading.textContent = "Choose a protein for further analysis:";
                displayResults(data.results); // Call function to display results
                scrollToElement('resultSection');
            } else {
                resultHeading.textContent = "No results found. Please try again.";
                resultCountDiv.innerHTML = '';
                filterDiv.style.display = 'none';
            }
        } catch (error) {
            console.error("Fetch error:", error);
            resultHeading.textContent = "Failed to fetch results. Please try again.";
            resultCountDiv.innerHTML = '';
            filterDiv.style.display = 'none';
        }
    });

    function displayResults(results) {
        resultCountDiv.innerHTML = `<p>Number of results found: ${results.length}</p>`;

        const diseasesSet = new Set();
        // Go over results and display each protein's information
        results.forEach(result => {
            result.disease_involvement.forEach(disease => diseasesSet.add(disease));
            // Create a container for each protein result
            const proteinDiv = document.createElement('div');
            proteinDiv.className = 'protein-container';
            proteinDiv.dataset.disease = JSON.stringify(result.disease_involvement);

            const proteinHeader = document.createElement('div');
            proteinHeader.className = 'protein-header';

            const proteinHeading = document.createElement('h4');
            const link = document.createElement('a');
            link.textContent = result.protein_name;
            link.href = "#";
            // When clicking protein name show alignment section
            link.onclick = function () {
                showAlignmentSection(result.protein_name, result.accession);
            }            
            proteinHeading.appendChild(link);
            proteinHeader.appendChild(proteinHeading);
            proteinDiv.appendChild(proteinHeader);
            resultsDiv.appendChild(proteinDiv);

            // Link to UniProt
            const linkUniProt = document.createElement('a');
            linkUniProt.textContent = 'UniProt';
            linkUniProt.href = `https://www.uniprot.org/uniprotkb/${result.accession}/entry`;
            linkUniProt.target = "_blank";
            proteinHeader.appendChild(linkUniProt);

            // Diseases
            const diseaseList = document.createElement('ul');
            result.disease_involvement.forEach(disease => {
                const listItem = document.createElement('li');
                listItem.textContent = disease;
                diseaseList.appendChild(listItem);
            });
            proteinDiv.appendChild(diseaseList);

            resultsDiv.appendChild(proteinDiv);
        });
        populateDiseaseFilter(Array.from(diseasesSet).sort());
    }

    // Function to populate the disease filter dropdown
    function populateDiseaseFilter(diseases) {
        diseases.forEach(disease => {
            const option = document.createElement('option');
            option.value = disease;
            option.textContent = disease;
            diseaseFilter.appendChild(option);
        });

        diseaseFilter.disabled = false;
        filterDiv.style.display = 'block';
    }

    // Function to filter the results based on the selected disease
    function filterResults() {
        const selectedDisease = diseaseFilter.value;
        let visibleResults = 0;

        document.querySelectorAll('.protein-container').forEach(container => {
            const diseases = JSON.parse(container.dataset.disease); // Get diseases from the container's data
            const isVisible = selectedDisease === 'all' || diseases.includes(selectedDisease);
            container.style.display = isVisible ? 'block' : 'none';
            if (isVisible) visibleResults++;
        });

        resultCountDiv.innerHTML = `<p>Number of results found: ${visibleResults}</p>`;
    }

    // When disease filter dropdown changes filterResults func is called
    diseaseFilter.addEventListener('change', filterResults);


    // Function to show the alignment section when a protein is selected
    function showAlignmentSection(proteinName, proteinID) {
        alignmentSection.style.display = "block";
        aboutTheToolDiv.style.display = "none";
        searchSection.style.display = "none";

        selectedProteinName.textContent = proteinName;

        window.scrollTo({ top: 0, behavior: "smooth" });
        document.getElementById('backToSearchButton').style.display = 'block';
        const proteinInfoDiv = document.getElementById('proteinInfo');
        proteinInfoDiv.innerHTML = `<p>UniProt ID: ${proteinID} (<a href="https://www.uniprot.org/uniprotkb/${proteinID}/entry" target="_blank">UniProt</a>)</p>`;

        // Create a div to display the reference sequence
        const referenceSequenceDiv = document.createElement('div');
        referenceSequenceDiv.id = "referenceSequence";
        proteinInfoDiv.appendChild(referenceSequenceDiv);

        // Get the reference sequence of the protein
        fetchFastaSequence(proteinID)
    }

    backToSearchButton.addEventListener("click", function () {
        alignmentSection.style.display = "none";
        aboutTheToolDiv.style.display = "block";
        searchSection.style.display = "block";
    });
});

window.referenceSequence = ""; // This is a global variable

// Function to fetch the reference sequence for a given protein
async function fetchFastaSequence(proteinID) {
    try {
        const response = await fetch(`/analyse?protein_id=${proteinID}`);
        window.referenceSequence = await response.text(); // Store the sequence globally
        document.getElementById('referenceSequence').innerHTML = `<p>Reference sequence:</p><pre>${window.referenceSequence}</pre>`;
    } catch (error) {
        document.getElementById('referenceSequence').innerHTML = `<p>Couldn't find the reference sequence.</p>`;
    }
}

function scrollToElement(id) {
    let element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}