# this file stores all the routes

from flask import Blueprint, render_template, request, session, jsonify
from app.utils_uniprot import get_search_results, get_protein_fasta
from app.utils_alignment import align_sequences, match_score
from app.utils_mutations import get_all_mutations
from app.utils_clinvar import fetch_clinvar_variant_id, fetch_clinvar_variant_info
from app.utils import (
    extract_the_sequence,
    validate_protein_sequence,
    validate_sequences,
)


bp = Blueprint("main", __name__)  # blueprints are used to organize the app routes


@bp.route("/")
def home():
    return render_template("index.html")


@bp.route("/about")
def about():
    return render_template("about.html")


@bp.route("/analyse")
def analyse():
    protein_id = request.args.get("protein_id")
    if protein_id:
        session["protein_id"] = protein_id
        fasta_sequence = get_protein_fasta(protein_id)
        return (
            fasta_sequence  # If there is a protein ID return the the proteins sequence
        )
    return render_template("analyse.html")  # Else return just the page with search


@bp.route("/aligner")
def aligner():
    return render_template("aligner.html")


# Route function for searching a gene in the UniProt database
@bp.route("/search_gene", methods=["GET"])
def search_gene():
    gene_name = request.args.get("gene")
    if not gene_name:
        return jsonify({"error": "Please provide a gene name."}), 400
    try:
        results = get_search_results(gene_name)
        if not results:
            return jsonify({"message": "No results found for the given gene name."})
        return jsonify({"results": results})
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500


# Route function that aligns the users sequence with the refernece protein sequence
@bp.route("/align_sequence", methods=["POST"])
def handle_input_sequence():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON data received."}), 400

    reference_sequence = data.get("referenceSequence", "").strip()
    input_sequence = data.get("inputSequence", "").strip()

    if not reference_sequence or not input_sequence:
        return jsonify({"error": "Sequence and reference sequence are required."}), 400

    input_sequence = extract_the_sequence(input_sequence)

    reference_sequence = reference_sequence.upper()
    input_sequence = input_sequence.upper()

    # ensure the sequence contains only valid amino acids
    if not validate_protein_sequence(input_sequence):
        return (
            jsonify(
                {
                    "error": "Invalid protein sequence. The sequence must contain only valid amino acids."
                }
            ),
            400,
        )

    alignment = align_sequences(reference_sequence, input_sequence)
    aligned_reference_sequence = str(alignment[0])
    aligned_input_sequence = str(alignment[1])
    match_percentage = match_score(alignment)

    alignment_data = {
        "aligned_reference_sequence": aligned_reference_sequence,
        "aligned_input_sequence": aligned_input_sequence,
        "match_percentage": match_percentage,
    }

    # store alignment in session
    session["alignment"] = {
        "aligned_reference_sequence": aligned_reference_sequence,
        "aligned_input_sequence": aligned_input_sequence,
    }

    return jsonify(alignment_data)


# Route function writes the mutations in the aligned users sequence compared to the aligned reference one
@bp.route("/find_variants", methods=["POST"])
def find_variants():
    alignment_data = session.get("alignment")

    if alignment_data is None:
        return jsonify({"error": "No alignment data found in session."}), 400

    ref_aligned = alignment_data.get("aligned_reference_sequence", "")
    input_aligned = alignment_data.get("aligned_input_sequence", "")

    if not ref_aligned or not input_aligned:
        return jsonify({"error": "Alignment data is incomplete."}), 400

    variants = get_all_mutations(ref_aligned, input_aligned)
    # print(variants)

    return jsonify({"message": "Variants found", "variants": variants})


# Route function for searching a protein variant in the ClinVar database
@bp.route("/find_association", methods=["POST"])
def find_association():
    protein_id = session.get("protein_id")
    if protein_id is None:
        return jsonify({"error": "No protein ID found in session."}), 400

    data = request.get_json()
    if not data or "variant" not in data:
        return jsonify({"error": "Variant is required"}), 400
    variant = data["variant"].strip()

    try:
        variation_ids = fetch_clinvar_variant_id(protein_id, variant)
        # print("variation_ids: ", variation_ids)

        if not isinstance(variation_ids, list):  # No known variant found
            response = {"hgvs": variant, "variants": str(variation_ids)}
            print("THIS IS BEING RETURNED:", response)
            return jsonify(response)

        all_variants_info = []
        for var_id in variation_ids:
            variant_info = fetch_clinvar_variant_info(var_id)
            if variant_info:
                all_variants_info.append(variant_info)

        response = {"hgvs": variant, "variants": all_variants_info}

        # print("THIS IS BEING RETURNED:", response)
        return jsonify(response)

    except Exception as exception:
        return jsonify({"error": str(exception)}), 400


# Route function that aligns the two imputed sequence
@bp.route("/advanced_aligner", methods=["POST"])
def advanced_aligner():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON data received."}), 400

    sequence1 = data.get("sequence1", "").strip()
    sequence2 = data.get("sequence2", "").strip()
    mode = data.get("mode", "").strip()

    match_score = data.get("match_score", "")
    mismatch_score = data.get("mismatch_score", "")
    open_gap_score = data.get("open_gap_score", "")
    extend_gap_score = data.get("extend_gap_score", "")

    if not sequence1 or not sequence2:
        return jsonify({"error": "Two sequences are required."}), 400

    sequence1 = extract_the_sequence(sequence1).upper()
    sequence2 = extract_the_sequence(sequence2).upper()

    # Ensure the sequence contains only valid nucleotides or amino acids
    is_valid, error_message = validate_sequences(sequence1, sequence2)
    if not is_valid:
        return jsonify({"error": error_message}), 400

    try:
        alignment = align_sequences(
            sequence1,
            sequence2,
            mode,
            match_score,
            mismatch_score,
            open_gap_score,
            extend_gap_score,
        )
        print(alignment)

        aligned_sequence1 = str(alignment[0])
        aligned_sequence2 = str(alignment[1])

        alignment_data = {
            "aligned_sequence1": aligned_sequence1,
            "aligned_sequence2": aligned_sequence2,
        }

        session["advanced_alignment"] = {
            "aligned_sequence1": aligned_sequence1,
            "aligned_sequence2": aligned_sequence2,
        }
        return jsonify(alignment_data)

    except Exception as e:
        return jsonify({"error": f"Alignment failed: {str(e)}"}), 500


# Route function that identifies the changes between the two aligned sequences
@bp.route("/find_changes", methods=["POST"])
def find_changes():
    alignment_data = session.get("advanced_alignment")

    if alignment_data is None:
        return jsonify({"error": "No advanced alignment data found in session."}), 400

    ref_aligned = alignment_data.get("aligned_sequence1", "")
    input_aligned = alignment_data.get("aligned_sequence2", "")

    if not ref_aligned or not input_aligned:
        return jsonify({"error": "Alignment data is incomplete."}), 400

    changes = get_all_mutations(ref_aligned, input_aligned, False)
    print(changes)

    return jsonify({"message": "Changes found", "changes": changes})
