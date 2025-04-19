# This file stores fuctions that for querying the ClinVar API through NCBI eUtils (Entrez Programming Utilities)
# Functions: fetch_clinvar_variant_id, fetch_clinvar_variant_info

import requests

CLINVAR_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
API_KEY = ""


def fetch_clinvar_variant_id(protein_id, variant):
    """
    Fetches the ClinVar variant ID(s) for a given protein variant.

    Returns list of variant IDs if found
    """
    search_url = f"{CLINVAR_URL}esearch.fcgi"
    search_params = {
        "db": "clinvar",
        "term": f"{protein_id}:{variant}",
        "retmode": "json",
        "api_key": API_KEY,
    }
    try:
        search_response = requests.get(search_url, params=search_params)
        search_response.raise_for_status()
        search_data = search_response.json()

        # Extract the list of variant IDs from the JSON response
        variation_ids = search_data.get("esearchresult", {}).get("idlist", [])

        if not variation_ids:
            return "Not known variant"
        return variation_ids
    except requests.exceptions.RequestException as e:
        print("Error fetching data from ClinVar:", e)
        return "Error fetching data"


def fetch_clinvar_variant_info(variant_id):
    """
    Fetches detailed information for a given ClinVar variant ID.
    Returns dictionary containing variant title, classification, and disease associations, or None if an error occurs.
    """
    summary_url = f"{CLINVAR_URL}esummary.fcgi"
    params = {"db": "clinvar", "id": variant_id, "retmode": "json", "api_key": API_KEY}
    try:
        response = requests.get(summary_url, params=params)
        response.raise_for_status()
        summary_data = response.json()

        # Extract detailed variant information from the response
        result = summary_data.get("result", {})
        variant_data = result.get(variant_id, {})

        variant_title = variant_data.get("title", "N/A")

        # "germline_classification" contains the classification of the variant (e.g., pathogenic, benign).
        germline_info = variant_data.get("germline_classification", {})
        classification_description = germline_info.get("description", "N/A")

        # "trait_set" contains associated diseases
        disease_associations = [
            trait.get("trait_name", "Unknown")
            for trait in germline_info.get("trait_set", [])
            if trait.get("trait_name") and trait["trait_name"].lower() != "not provided"
        ]
        disease_associations = list(set(disease_associations))

        return {
            "title": variant_title,
            "id": variant_id,
            "germline_classification": classification_description,
            "disease_associations": disease_associations,
        }

    except requests.RequestException as e:
        print(f"Request failed: {e}")
        return None
