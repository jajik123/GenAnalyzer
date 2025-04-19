# This file stores fuctions that for querying the UniProt API to get protein-related information
# Functions: get_search_results, get_disease_involvement, get_protein_fasta

import requests
from app.utils import extract_the_sequence

UNIPROT_URL = "https://rest.uniprot.org/uniprotkb"


def get_search_results(name):
    """
    This function calls the UniProt database for proteins that match the given name. It filters onyl human reviewed proteins that have disease involvement.

    Returns list of dictionaries {accession, protein_name, disease_involvement}.
    """
    # API URL, filters only human proteins and reviewed proteins
    url = f"{UNIPROT_URL}/search?query={name}+AND+organism_id:9606+AND+reviewed:true&fields=accession,id,protein_name&format=json"

    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        results = []
        for entry in data.get("results", []):
            accession = entry.get("primaryAccession")
            disease_data = get_disease_involvement(accession)

            # Only append to results if disease_involvement is not empty
            if disease_data:
                results.append(
                    {
                        "accession": accession,
                        "protein_name": entry.get("proteinDescription", {})
                        .get("recommendedName", {})
                        .get("fullName", {})
                        .get("value"),
                        "disease_involvement": disease_data,
                    }
                )
        return results
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Failed to fetch data from UniProt API: {str(e)}")


def get_disease_involvement(accession):
    """
    This function fetches detailed data for given protein accession from UniProt and extracts disease involvement information.
    """
    url = f"{UNIPROT_URL}/{accession}.json"
    try:
        response = requests.get(url)
        response.raise_for_status()
        detailed_data = response.json()

        # Extract disease IDs from comments of type "DISEASE"
        disease_ids = []
        for comment in detailed_data.get("comments", []):
            if comment.get("commentType") == "DISEASE":
                disease_info = comment.get("disease", {})
                if "diseaseId" in disease_info:
                    disease_ids.append(disease_info["diseaseId"])

        return disease_ids
    except requests.exceptions.RequestException as e:
        return [f"Failed to fetch detailed data: {str(e)}"]



def get_protein_fasta(accession):
    """
    Gets the protein sequence for a given accession.
    Returns it in FASTA format without the header line.
    """
    fasta_url = f"{UNIPROT_URL}/{accession}.fasta"
    try:
        response = requests.get(fasta_url)
        response.raise_for_status()
        fasta_data = response.text

        reference_sequence = extract_the_sequence(fasta_data)

        return reference_sequence
    except requests.exceptions.RequestException as e:
        return f"Error fetching FASTA data: {str(e)}", 500
