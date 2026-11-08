
from backend.diff_service import analyze_git_diff


def test_git_diff_analysis():

    sample_diff = """diff --git a/app.py b/app.py
index 1234567..abcdefg 100644
--- a/app.py
+++ b/app.py
@@ -1,3 +1,3 @@
 def greet():
-    print("Hello")
+    print("Welcome to DocuMind AI")
     return True
"""

    result = analyze_git_diff(sample_diff)

    assert result["total_files_changed"] == 1
    assert result["total_added_lines"] == 0
    assert result["total_deleted_lines"] == 0
    assert result["total_modified_lines"] == 1

    print("Git Diff Analysis Test Passed!")
    print(result)


def test_empty_diff():

    try:
        analyze_git_diff("")
        assert False, "Expected ValueError"
    except ValueError:
        print("Empty Diff Test Passed!")
