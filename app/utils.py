# This file stores helper functions
# Functions: extract_the_sequence, validate_protein_sequence, validate_sequences, get_three_letter_symbol

def extract_the_sequence(sequence):
    """
    This function extracts the protein sequence from FASTA data.
    It removes the header line and returns the sequence without spaces.
    """
    lines = sequence.splitlines()
    if lines and lines[0].startswith(">"):
        sequence = "".join(lines[1:])
    else:
        sequence = "".join(lines)
    return "".join(sequence.split())


def validate_protein_sequence(sequence):
    """
    This function validates if a protein sequence contains only valid amino acids.
    Returns: bool
    """
    valid_amino_acids = set("ABCDEFGHIKLMNPQRSTVWXYZ")
    return all(char in valid_amino_acids for char in sequence)

def validate_sequences(sequence1, sequence2):
    """
    This function validates if both sequences contain only valid nucleotides (ATCG) or amino acids.
    Retruns: bool and string with or without error message.
    """
    valid_nucleotides = set("ATCG")
    valid_amino_acids = set("ABCDEFGHIKLMNPQRSTVWXYZ")
    valid_chars = valid_nucleotides.union(valid_amino_acids)

    invalid_chars_seq1 = {char for char in sequence1 if char not in valid_chars}
    invalid_chars_seq2 = {char for char in sequence2 if char not in valid_chars}

    if invalid_chars_seq1 or invalid_chars_seq2:
        error_detail = []
        if invalid_chars_seq1:
            error_detail.append(
                f"Sequence1 includes invalid characters ({', '.join(sorted(invalid_chars_seq1))})."
            )
        if invalid_chars_seq2:
            error_detail.append(
                f"Sequence2 includes invalid characters ({', '.join(sorted(invalid_chars_seq2))})."
            )
        return (False, " ".join(error_detail) + " The sequence can only include valid one-letter nucleotide or amino acid symbols.")
    return (True, "")

amino_acid_map = {
        "A": "Ala",
        "B": "Asx",
        "C": "Cys",
        "D": "Asp",
        "E": "Glu",
        "F": "Phe",
        "G": "Gly",
        "H": "His",
        "I": "Ile",
        "K": "Lys",
        "L": "Leu",
        "M": "Met",
        "N": "Asn",
        "P": "Pro",
        "Q": "Gln",
        "R": "Arg",
        "S": "Ser",
        "T": "Thr",
        "V": "Val",
        "W": "Trp",
        "X": "Xaa",
        "Y": "Tyr",
        "Z": "Glx",
    }

def get_three_letter_symbol(one_letter_symbol):
    """
    Convert a one-letter amino acid symbol to its three-letter symbol.
    Reference: https://publications.iupac.org/pac/1984/pdf/5605x0595.pdf (Table on page 24)
    """    
    return amino_acid_map.get(
        one_letter_symbol.upper(), "Unknown"
    )  # Returns "Unknown" if not found



