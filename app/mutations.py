# This file stores fuctions that are used for identifing the mutations

"""
Functions that identify the mutations:
- identify_substitution
- identify_deletion
- identify_insertion
- identify_extension

Functions that format the mutation info to a dictionary including HGVS notation:
- substitution_output
- single_deletion_output
- multiple_deletion_output
- insertion_output
- n_extension_output
- c_extension_output,

Function that gathers all detected muatations (substitutions, deletions, insertions, extensions):
- get_all_mutations

"""

from app.utils import get_three_letter_symbol


def identify_substitution(ref_aligned, input_aligned):
    substitutions = []
    ref_pos = 0
    for ref, input in zip(ref_aligned, input_aligned):
        if ref != "-":
            ref_pos += 1  # Increment only when reference has an amino acid

        if ref != input and ref != "-" and input != "-":
            # Detect substitution
            substitutions.append(substitution_output(ref_pos, ref, input))
    return substitutions


def substitution_output(ref_pos, ref, input):
    return {
        "type": "substitution",
        "position": ref_pos,
        "change_one": f"{ref} > {input}",
        "change_three": f"{get_three_letter_symbol(ref)} > {get_three_letter_symbol(input)}",
        "hgvs": f"p.{get_three_letter_symbol(ref)}{ref_pos}{get_three_letter_symbol(input)}",
    }


def identify_deletion(ref_aligned, input_aligned):
    deletions = []
    ref_pos = 0
    i = 0

    while i < len(ref_aligned):
        ref = ref_aligned[i]
        input = input_aligned[i]

        if ref != "-":
            ref_pos += 1  # Only count non-gap reference positions

        if ref != input:
            if input == "-":  # Detect deletion
                del_start = ref_pos  # Store deletion start position
                del_residue = ref  # Store first deleted residue
                deletion_seq = [del_residue]

                j = i + 1  # Look ahead to check for consecutive deletions
                while (
                    j < len(ref_aligned)
                    and ref_aligned[j] != "-"
                    and input_aligned[j] == "-"
                ):
                    deletion_seq.append(ref_aligned[j])
                    j += 1

                del_end = (
                    del_start + len(deletion_seq) - 1
                )  # Determine the deletion end position

                # Correct ref_pos after processing the deletion
                ref_pos += len(deletion_seq) - 1

                # Append the deletion
                if len(deletion_seq) == 1:
                    # single position deletion
                    deletions.append(single_deletion_output(del_start, del_residue))
                else:
                    # multiple position deletion
                    deletions.append(
                        multiple_deletion_output(del_start, del_end, deletion_seq)
                    )

                i = j  # Move the index forward to skip over the deletion
                continue

        i += 1  # Move to the next alignment position

    return deletions


def single_deletion_output(del_start, del_residue):
    return {
        "type": "deletion",
        "position": del_start,
        "change_one": f"missing {del_residue}",
        "change_three": f"missing {get_three_letter_symbol(del_residue)}",
        "hgvs": f"p.{get_three_letter_symbol(del_residue)}{del_start}del",
    }


def multiple_deletion_output(del_start, del_end, deletion_seq):
    return {
        "type": "deletion",
        "position": f"{del_start} - {del_end}",
        "change_one": f"missing {deletion_seq[0]} - {deletion_seq[-1]}",
        "change_three": f"missing {get_three_letter_symbol(deletion_seq[0])} - {get_three_letter_symbol(deletion_seq[-1])}",
        "hgvs": f"p.{get_three_letter_symbol(deletion_seq[0])}{del_start}_{get_three_letter_symbol(deletion_seq[-1])}{del_end}del",
    }


def identify_insertion(ref_aligned, input_aligned):
    insertions = []
    ref_seq = ref_aligned.replace("-", "")
    ref_pos = 0  # Position in ref_seq (ignoring gaps)
    i = 0
    # Skip initial "-" in to avoid misidentifying them as insertions
    while i < len(ref_aligned) and ref_aligned[i] == "-":
        i += 1

    while i < len(ref_aligned):
        ref = ref_aligned[i]
        seq = input_aligned[i]

        if ref != "-":
            ref_pos += 1  # Only count non-gap reference positions

        if ref == "-" and seq != "-":  # Detect insertion
            insertion_seq = []
            while (
                i < len(ref_aligned)
                and ref_aligned[i] == "-"
                and input_aligned[i] != "-"
            ):
                insertion_seq.append(input_aligned[i])
                i += 1

            # Find the next non-gap reference character
            while i < len(ref_aligned) and ref_aligned[i] == "-":
                i += 1

            if i < len(ref_aligned):
                ins_end = ref_pos + 1
                insertions.append(
                    insertion_output(ref_pos, ins_end, ref_seq, insertion_seq)
                )
            continue  # Skip incrementing i manually since we already moved forward

        i += 1  # Move to the next position
    return insertions


def insertion_output(ref_pos, ins_end, ref_seq, insertion_seq):
    three_letter_insertion_seq = [
        get_three_letter_symbol(letter) for letter in insertion_seq
    ]
    return {
        "type": "insertion",
        "position": f"between {ref_pos} - {ins_end}",
        "change_one": f"added {''.join(insertion_seq)}",
        "change_three": f"added {''.join(three_letter_insertion_seq)}",
        "hgvs": f"p.{get_three_letter_symbol(ref_seq[ref_pos-1])}{ref_pos}_{get_three_letter_symbol(ref_seq[ins_end-1])}{ins_end}ins{''.join(three_letter_insertion_seq)}",
    }


def identify_extension(ref_aligned, input_aligned):
    extensions = []
    i = 0
    # Detect N-terminal extension
    if ref_aligned[0] == "-":
        inserted_seq = []
        while i < len(ref_aligned) and ref_aligned[i] == "-":
            inserted_seq.append(input_aligned[i])  # Collect inserted amino acids
            i += 1

        if i < len(ref_aligned):  # Found the first non-gap position
            first_aa = ref_aligned[i]
            # Append extension
            extensions.append(n_extension_output(inserted_seq, first_aa, i))

    # Detect C-terminal extension
    if ref_aligned[-1] == "-":
        inserted_seq = []
        extension_length = 0
        last_aa = ""
        last_aa_position = 0
        new_aa_at_that_pos = ""
        new_last_aa = ""

        for j in range(len(ref_aligned) - 1, -1, -1):
            if ref_aligned[j] != "-":
                last_aa = ref_aligned[j]
                last_aa_position = len(ref_aligned[: j + 1].replace("-", ""))
                new_aa_at_that_pos = input_aligned[j]
                break

        for j in range(len(ref_aligned) - 1, -1, -1):
            if ref_aligned[j] == "-":
                inserted_seq.append(input_aligned[j])  # Collect inserted amino acids
                extension_length += 1
            else:
                break

        new_last_aa = input_aligned[-1]
        inserted_seq = inserted_seq[::-1]

        # Append extension

        extensions.append(
            c_extension_output(
                inserted_seq,
                last_aa,
                last_aa_position,
                new_last_aa,
                new_aa_at_that_pos,
                extension_length,
            )
        )
    return extensions


def n_extension_output(inserted_seq, first_aa, i):
    three_letter_inserted_seq = [
        get_three_letter_symbol(letter) for letter in inserted_seq
    ]
    return {
        "type": "extension",
        "position": "before 1",
        "change_one": f"added {''.join(inserted_seq)}",
        "change_three": f"added {''.join(three_letter_inserted_seq)}",
        "hgvs": f"p.{get_three_letter_symbol(first_aa)}1ext-{i}",
    }


def c_extension_output(
    inserted_seq,
    last_aa,
    last_aa_position,
    new_last_aa,
    new_aa_at_that_pos,
    extension_length,
):
    three_letter_inserted_seq = [
        get_three_letter_symbol(letter) for letter in inserted_seq
    ]
    return {
        "type": "extension",
        "position": f"after {last_aa_position}",
        "change_one": f"added {''.join(inserted_seq)}",
        "change_three": f"added {''.join(three_letter_inserted_seq)}",
        "hgvs": f"p.{get_three_letter_symbol(last_aa)}{last_aa_position}{get_three_letter_symbol(new_aa_at_that_pos)}ext{get_three_letter_symbol(new_last_aa)}{extension_length}",
    }


def get_all_mutations(ref_aligned, input_aligned, include_details=True):
    # This fuctions calls all 4 of the functions above.
    substitutions = identify_substitution(ref_aligned, input_aligned)
    deletions = identify_deletion(ref_aligned, input_aligned)
    insertions = identify_insertion(ref_aligned, input_aligned)
    extentions = identify_extension(ref_aligned, input_aligned)

    variants = substitutions + deletions + insertions + extentions

    if not include_details:
        for variant in variants:
            variant.pop("change_three", None)
            variant.pop("hgvs", None)
    return variants
