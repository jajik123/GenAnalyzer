# This file stores fuctions that are used for sequence alignment
# and use the class Bio.Align.PairwiseAligner from the biopython library

# functions: align_sequences, match_score


from Bio.Align import PairwiseAligner


def align_sequences(
    sequence1,
    sequence2,
    mode="global",
    match_score=2,
    mismatch_score=-1,
    open_gap_score=-5,
    extend_gap_score=-2,
):
    """
    Aligns two sequences with customizable scoring and mode using the PairwiseAligner class from Biopython.
    If there are no parameters specified, it uses the default values.
    """
    aligner = PairwiseAligner()
    aligner.mode = str(mode)

    aligner.match_score = match_score
    aligner.mismatch_score = mismatch_score
    aligner.open_gap_score = open_gap_score
    aligner.extend_gap_score = extend_gap_score

    alignment = aligner.align(sequence1, sequence2)[0]
    return alignment


def match_score(alignment):
    # Calculates the match percentage between two aligned sequences.

    ref_aligned, seq_aligned = alignment[0], alignment[1]

    matches = sum(1 for r, s in zip(ref_aligned, seq_aligned) if r == s)
    total_length = len(ref_aligned)
    match_percentage = round((matches / total_length) * 100, 2)

    return match_percentage
