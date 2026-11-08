import re


# Git Diff validation patterns
FILE_HEADER_PATTERN = re.compile(
    r"^diff --git a/(.*?) b/(.*)$"
)

HUNK_HEADER_PATTERN = re.compile(
    r"^@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@(?:.*)?$"
)


def analyze_git_diff(diff_text: str):
    """
    Analyze Git diff content and identify changed files,
    added lines, deleted lines, and modified lines.

    Validates Git Diff structure before processing.

    Changes are grouped by Git diff hunks and contiguous
    blocks of additions and deletions.
    """

    # Step 1: Check empty input
    if not diff_text or not diff_text.strip():
        raise ValueError(
            "Git diff input cannot be empty."
        )

    files = []
    current_file = None

    added_lines = []
    deleted_lines = []

    in_hunk = False
    valid_hunks = 0

    # Step 2: Save changes from the current block
    def save_change_block():

        nonlocal added_lines, deleted_lines

        if current_file is None:
            return

        paired_count = min(
            len(added_lines),
            len(deleted_lines)
        )

        # Pair deleted and added lines as modifications
        for index in range(paired_count):

            current_file["modified_lines"].append({
                "old": deleted_lines[index],
                "new": added_lines[index]
            })

        # Remaining added lines
        current_file["added_lines"].extend(
            added_lines[paired_count:]
        )

        # Remaining deleted lines
        current_file["deleted_lines"].extend(
            deleted_lines[paired_count:]
        )

        added_lines = []
        deleted_lines = []

    # Step 3: Process each line
    for line in diff_text.splitlines():

        # Detect a new Git file
        if line.startswith("diff --git "):

            save_change_block()

            current_file = None
            in_hunk = False

            match = FILE_HEADER_PATTERN.match(line)

            if not match:
                raise ValueError(
                    "Invalid Git Diff file header."
                )

            current_file = {
                "file_name": match.group(2),
                "added_lines": [],
                "deleted_lines": [],
                "modified_lines": []
            }

            files.append(current_file)

            continue

        # Ignore content before a valid file header
        if current_file is None:
            continue

        # Detect Git Diff hunk
        if line.startswith("@@"):

            save_change_block()

            if not HUNK_HEADER_PATTERN.match(line):
                raise ValueError(
                    "Invalid Git Diff hunk format."
                )

            in_hunk = True
            valid_hunks += 1

            continue

        # Ignore metadata outside a hunk
        if not in_hunk:
            continue

        # Ignore no-newline markers
        if line.startswith("\\"):
            continue

        # Added line
        if line.startswith("+"):

            added_lines.append(line[1:])

        # Deleted line
        elif line.startswith("-"):

            deleted_lines.append(line[1:])

        # Context line
        elif line.startswith(" "):

            save_change_block()

    # Step 4: Save remaining changes
    save_change_block()

    # Step 5: Validate Git Diff structure
    if not files or valid_hunks == 0:

        raise ValueError(
            "Invalid Git Diff. Please paste a valid Git Diff "
            "containing file headers and change sections."
        )

    # Step 6: Calculate totals
    total_added = sum(
        len(file["added_lines"])
        for file in files
    )

    total_deleted = sum(
        len(file["deleted_lines"])
        for file in files
    )

    total_modified = sum(
        len(file["modified_lines"])
        for file in files
    )

    # Reject valid-looking headers without actual changes
    if total_added + total_deleted + total_modified == 0:

        raise ValueError(
            "No code changes detected. Please provide a "
            "Git Diff containing added or deleted lines."
        )

    # Step 7: Return analysis results
    return {
        "total_files_changed": len(files),
        "total_added_lines": total_added,
        "total_deleted_lines": total_deleted,
        "total_modified_lines": total_modified,
        "files": files
    }