const codeInput = document.getElementById("codeInput");
const codeFile = document.getElementById("codeFile");
const analyzeBtn = document.getElementById("analyzeBtn");
const results = document.getElementById("results");

// Git Diff elements
const diffInput = document.getElementById("diffInput");
const analyzeDiffBtn = document.getElementById("analyzeDiffBtn");
const diffResults = document.getElementById("diffResults");

let generatedDocumentation = "";
let approvedDocumentation = "";

// ======================================
// UPLOAD AND READ CODE FILE
// ======================================

codeFile.addEventListener("change", async () => {
    const file = codeFile.files[0];

    if (!file) return;

    const allowedExtensions = [
        ".py", ".java", ".js", ".html",
        ".css", ".c", ".cpp", ".txt"
    ];

    const fileExtension = file.name.substring(
        file.name.lastIndexOf(".")
    ).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
        alert("Unsupported file format. Please select a supported code file.");
        codeFile.value = "";
        return;
    }

    try {
        const fileContent = await file.text();
        codeInput.value = fileContent;
        alert("File uploaded successfully: " + file.name);
    } catch (error) {
        alert("Unable to read the selected file.");
        codeFile.value = "";
    }
});

// ======================================
// ANALYZE SOURCE CODE
// ======================================

analyzeBtn.addEventListener("click", async () => {
    const code = codeInput.value.trim();

    if (!code) {
        alert("Please upload a code file or paste your code first.");
        codeInput.focus();
        return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing...";

    results.innerHTML = `
        <div class="empty-state">
            <h3>Generating Documentation...</h3>
            <p>Gemini AI is analyzing your code. Please wait.</p>
        </div>
    `;

    try {
        const response = await fetch(
            "http://127.0.0.1:8000/api/analyze",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ code: code })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Backend request failed.");
        }

        if (!data.success) {
            throw new Error(data.message || "Documentation generation failed.");
        }

        generatedDocumentation = data.documentation || "";

        results.innerHTML = `
            <div class="section-heading">
                <div>
                    <h2>Generated Documentation</h2>
                    <p>${escapeHTML(data.message)}</p>
                </div>
                <div class="download-actions">
                    <button id="downloadBtn" type="button">
                        ↓ Download
                    </button>
                </div>
            </div>

            <div class="documentation-content">
                ${DOMPurify.sanitize(
                    marked.parse(
                        generatedDocumentation || "No documentation received."
                    )
                )}
            </div>

            <div id="downloadDialog" class="download-dialog">
                <div class="dialog-box">
                    <button
                        id="closeDialogBtn"
                        class="close-dialog"
                        type="button"
                    >
                        &times;
                    </button>

                    <h3>Download Documentation</h3>
                    <p>Choose your preferred download format.</p>

                    <button id="downloadMarkdownBtn" type="button">
                        Download Markdown (.md)
                    </button>

                    <button id="downloadPdfBtn" type="button">
                        Download PDF (.pdf)
                    </button>

                    <button id="downloadTxtBtn" type="button">
                        Download Text File (.txt)
                    </button>
                </div>
            </div>
        `;

        document.getElementById("downloadBtn")
            .addEventListener("click", () => {
                document.getElementById("downloadDialog")
                    .classList.add("show");
            });

        document.getElementById("closeDialogBtn")
            .addEventListener("click", closeDownloadDialog);

        document.getElementById("downloadDialog")
            .addEventListener("click", (event) => {
                if (event.target.id === "downloadDialog") {
                    closeDownloadDialog();
                }
            });

        document.getElementById("downloadMarkdownBtn")
            .addEventListener("click", () => {
                downloadDocumentationMarkdown(generatedDocumentation);
                closeDownloadDialog();
            });

        document.getElementById("downloadPdfBtn")
            .addEventListener("click", () => {
                downloadDocumentationPDF(generatedDocumentation);
                closeDownloadDialog();
            });

        document.getElementById("downloadTxtBtn")
            .addEventListener("click", () => {
                downloadDocumentationTXT(generatedDocumentation);
                closeDownloadDialog();
            });

        results.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {
        generatedDocumentation = "";

        results.innerHTML = `
            <div class="empty-state">
                <h3>Analysis Error</h3>
                <p>${escapeHTML(error.message)}</p>
                <p>Please check your backend and Gemini API connection.</p>
            </div>
        `;

    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "Analyze";
    }
});

// ======================================
// STEP 02: GIT DIFF ANALYSIS
// ======================================

analyzeDiffBtn.addEventListener("click", async () => {
    const diff = diffInput.value.trim();

    if (!diff) {
        alert("Please paste your Git Diff before analyzing.");
        diffInput.focus();
        return;
    }

    analyzeDiffBtn.disabled = true;
    analyzeDiffBtn.textContent = "Analyzing Changes...";

    diffResults.innerHTML = `
        <div class="empty-state">
            <h3>Analyzing Git Diff...</h3>
            <p>Please wait while DocuMind AI processes your changes.</p>
        </div>
    `;

    try {
        const response = await fetch(
            "http://127.0.0.1:8000/api/analyze-diff",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ diff: diff })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Git Diff request failed.");
        }

        if (!data.success) {
            throw new Error(data.message || "Git Diff analysis failed.");
        }

        const analysis = data.analysis;

        displayDiffResults(
            analysis,
            data.message,
            data.ai_analysis
        );

        showDocumentationReview(data.ai_analysis);

        diffResults.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {
        diffResults.innerHTML = `
            <div class="empty-state">
                <h3>Git Diff Analysis Error</h3>
                <p>${escapeHTML(error.message)}</p>
                <p>Please check whether your FastAPI server is running.</p>
            </div>
        `;

    } finally {
        analyzeDiffBtn.disabled = false;
        analyzeDiffBtn.textContent = "Analyze Changes";
    }
});
// ======================================
// DISPLAY GIT DIFF RESULTS
// ======================================

function displayDiffResults(analysis, message, aiAnalysis) {

    const files = analysis.files || [];

    const fileDetails = files.map((file) => {

        const addedLines = file.added_lines || [];
        const deletedLines = file.deleted_lines || [];
        const modifiedLines = file.modified_lines || [];

        const addedHTML = addedLines.length
            ? addedLines.map(line => `
                <div class="diff-added">
                    + ${line.trim() ? escapeHTML(line) : "(blank line)"}
                </div>
            `).join("")
            : "<p>No separate added lines.</p>";

        const deletedHTML = deletedLines.length
            ? deletedLines.map(line => `
                <div class="diff-deleted">
                    - ${line.trim() ? escapeHTML(line) : "(blank line)"}
                </div>
            `).join("")
            : "<p>No separate deleted lines.</p>";

        const modifiedHTML = modifiedLines.length
            ? modifiedLines.map(change => `
                <div class="diff-modified">
                    <p><strong>Old Code:</strong></p>
                    <pre>${escapeHTML(change.old)}</pre>

                    <p><strong>New Code:</strong></p>
                    <pre>${escapeHTML(change.new)}</pre>
                </div>
            `).join("")
            : "<p>No modified lines detected.</p>";

        return `
            <div class="diff-file-card">

                <h3>📄 ${escapeHTML(file.file_name)}</h3>

                <div class="diff-category">
                    <h4>Added Lines</h4>
                    ${addedHTML}
                </div>

                <div class="diff-category">
                    <h4>Deleted Lines</h4>
                    ${deletedHTML}
                </div>

                <div class="diff-category">
                    <h4>Modified Lines</h4>
                    ${modifiedHTML}
                </div>

            </div>
        `;

    }).join("");

    const aiAnalysisHTML = DOMPurify.sanitize(
        marked.parse(aiAnalysis || "AI analysis is not available.")
    );

    diffResults.innerHTML = `

        <div class="section-heading">
            <div>
                <h2>Git Diff Analysis Results</h2>
                <p>${escapeHTML(message)}</p>
            </div>
        </div>

        <div class="diff-summary">

            <div class="diff-summary-card">
                <h3>${analysis.total_files_changed}</h3>
                <p>Files Changed</p>
            </div>

            <div class="diff-summary-card">
                <h3>${analysis.total_added_lines}</h3>
                <p>Added Lines</p>
            </div>

            <div class="diff-summary-card">
                <h3>${analysis.total_deleted_lines}</h3>
                <p>Deleted Lines</p>
            </div>

            <div class="diff-summary-card">
                <h3>${analysis.total_modified_lines}</h3>
                <p>Modified Lines</p>
            </div>

        </div>

        <div class="diff-details">

            <h3>Changed File Details</h3>

            ${fileDetails || "<p>No changed files detected.</p>"}

        </div>

        <div class="ai-analysis-section">

            <div class="section-heading">
                <div>
                    <h2>AI-Powered Change Explanation</h2>
                    <p>
                        Gemini AI analysis and documentation
                        impact suggestions.
                    </p>
                </div>
            </div>

            <div class="documentation-content">
                ${aiAnalysisHTML}
            </div>

        </div>

    `;
}


// ======================================
// DOCUMENTATION REVIEW AND APPROVAL
// ======================================

function showDocumentationReview(aiAnalysis) {

    const reviewContent = document.getElementById("reviewContent");

    approvedDocumentation = "";

    const suggestedDocumentation = aiAnalysis || "";

    reviewContent.innerHTML = `

        <div class="review-editor">

            <div class="review-status" id="reviewStatus">

                <p>Pending Review</p>

                <span>
                    Review and edit the AI-generated suggestions
                    before approving.
                </span>

            </div>

            <label for="documentationEditor">
                Suggested Documentation
            </label>

            <textarea
                id="documentationEditor"
                rows="16"
                placeholder="AI documentation suggestions will appear here..."
            ></textarea>

            <div class="review-actions">

                <button
                    type="button"
                    id="approveDocumentationBtn"
                >
                    Approve Documentation
                </button>

                <button
                    type="button"
                    id="rejectDocumentationBtn"
                >
                    Reject
                </button>

            </div>

            <!-- WHITE DOWNLOAD POPUP -->

            <div id="approvedDownloadDialog" class="download-dialog">

                <div class="dialog-box">

                    <button
                        id="closeApprovedDialog"
                        class="close-dialog"
                        type="button"
                    >
                        &times;
                    </button>

                    <h3>Download Documentation</h3>

                    <p>Choose your preferred download format.</p>

                    <button
                        id="downloadApprovedMarkdown"
                        type="button"
                    >
                        Download Markdown (.md)
                    </button>

                    <button
                        id="downloadApprovedPDF"
                        type="button"
                    >
                        Download PDF (.pdf)
                    </button>

                    <button
                        id="downloadApprovedTXT"
                        type="button"
                    >
                        Download Text File (.txt)
                    </button>

                </div>

            </div>

        </div>

    `;

    // ======================================
    // INSERT AI SUGGESTIONS INTO EDITOR
    // ======================================

    const editor = document.getElementById("documentationEditor");

    editor.value = suggestedDocumentation;

    // Create formatted preview

    const preview = document.createElement("div");

    preview.className = "documentation-content";
    preview.style.marginTop = "20px";

    preview.innerHTML = DOMPurify.sanitize(
        marked.parse(editor.value)
    );

    editor.insertAdjacentElement("afterend", preview);

    // LIVE PREVIEW

    editor.addEventListener("input", () => {

        preview.innerHTML = DOMPurify.sanitize(
            marked.parse(editor.value)
        );

    });

    // ======================================
    // GET BUTTON ELEMENTS
    // ======================================

    const approveBtn = document.getElementById(
        "approveDocumentationBtn"
    );

    const rejectBtn = document.getElementById(
        "rejectDocumentationBtn"
    );

    const status = document.getElementById("reviewStatus");

    const approvedDialog = document.getElementById(
        "approvedDownloadDialog"
    );

    const closeBtn = document.getElementById(
        "closeApprovedDialog"
    );

    // ======================================
    // APPROVE DOCUMENTATION
    // ======================================

    approveBtn.addEventListener("click", () => {

        const editedDocumentation = editor.value.trim();

        if (!editedDocumentation) {

            alert("Please enter documentation before approving.");

            editor.focus();

            return;
        }

        approvedDocumentation = editedDocumentation;

        status.innerHTML = `
            <p>Documentation Approved</p>

            <span>
                Your documentation has been approved.
                You can now download it.
            </span>
        `;

        approvedDialog.classList.add("show");

    });

    // ======================================
    // CLOSE DOWNLOAD POPUP
    // ======================================

    closeBtn.addEventListener("click", () => {

        approvedDialog.classList.remove("show");

    });

    // CLOSE WHEN CLICKING OUTSIDE

    approvedDialog.addEventListener("click", (event) => {

        if (event.target === approvedDialog) {

            approvedDialog.classList.remove("show");

        }

    });

    // ======================================
    // REJECT DOCUMENTATION
    // ======================================

    rejectBtn.addEventListener("click", () => {

        const confirmReject = confirm(
            "Are you sure you want to reject these documentation suggestions?"
        );

        if (!confirmReject) return;

        approvedDocumentation = "";

        editor.value = "";

        preview.innerHTML = "";

        approvedDialog.classList.remove("show");

        status.innerHTML = `
            <p>Documentation Rejected</p>

            <span>
                The suggested documentation was rejected.
                You can analyze another Git Diff.
            </span>
        `;

    });

    // ======================================
    // DOWNLOAD APPROVED MARKDOWN
    // ======================================

    document.getElementById("downloadApprovedMarkdown")
        .addEventListener("click", () => {

            if (approvedDocumentation) {

                downloadDocumentationMarkdown(
                    approvedDocumentation
                );

                approvedDialog.classList.remove("show");

            }

        });

    // ======================================
    // DOWNLOAD APPROVED PDF
    // ======================================

    document.getElementById("downloadApprovedPDF")
        .addEventListener("click", () => {

            if (approvedDocumentation) {

                downloadDocumentationPDF(
                    approvedDocumentation
                );

                approvedDialog.classList.remove("show");

            }

        });

    // ======================================
    // DOWNLOAD APPROVED TEXT
    // ======================================

    document.getElementById("downloadApprovedTXT")
        .addEventListener("click", () => {

            if (approvedDocumentation) {

                downloadDocumentationTXT(
                    approvedDocumentation
                );

                approvedDialog.classList.remove("show");

            }

        });

}
// ======================================
// CLOSE ORIGINAL DOWNLOAD POPUP
// ======================================

function closeDownloadDialog() {

    const dialog = document.getElementById("downloadDialog");

    if (dialog) {
        dialog.classList.remove("show");
    }

}


// ======================================
// DOWNLOAD MARKDOWN FILE
// ======================================

function downloadDocumentationMarkdown(documentation) {

    if (!documentation) {
        alert("No documentation available to download.");
        return;
    }

    const blob = new Blob(
        [documentation],
        { type: "text/markdown;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "DocuMind-AI-Documentation.md";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);

}


// ======================================
// DOWNLOAD TEXT FILE
// ======================================

function downloadDocumentationTXT(documentation) {

    if (!documentation) {
        alert("No documentation available to download.");
        return;
    }

    const html = DOMPurify.sanitize(
        marked.parse(documentation)
    );

    const tempElement = document.createElement("div");

    tempElement.innerHTML = html;

    const plainText =
        tempElement.innerText || tempElement.textContent;

    const blob = new Blob(
        [plainText],
        { type: "text/plain;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "DocuMind-AI-Documentation.txt";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);

}


// ======================================
// DOWNLOAD PROFESSIONALLY FORMATTED PDF
// ======================================

function downloadDocumentationPDF(documentation) {

    if (!documentation) {
        alert("No documentation available to download.");
        return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert(
            "PDF library not loaded. Please check your internet connection and refresh the page."
        );
        return;
    }

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF();

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 6;

    let y = 20;
    let inCodeBlock = false;

    // DOCUMENT HEADER

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(30, 64, 175);

    pdf.text("DocuMind AI", margin, y);

    y += 9;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(90, 90, 90);

    pdf.text(
        "Generated Technical Documentation",
        margin,
        y
    );

    y += 8;

    pdf.setDrawColor(100, 116, 139);

    pdf.line(
        margin,
        y,
        pageWidth - margin,
        y
    );

    y += 12;

    // CHECK PAGE SPACE

    function checkPageSpace(requiredSpace = lineHeight) {

        if (y + requiredSpace > pageHeight - margin - 8) {
            pdf.addPage();
            y = margin;
        }

    }

    // REMOVE MARKDOWN SYMBOLS

    function cleanMarkdown(text) {

        return text
            .replace(/!\[.*?\]\(.*?\)/g, "")
            .replace(/\[(.*?)\]\(.*?\)/g, "$1")
            .replace(/\*\*(.*?)\*\*/g, "$1")
            .replace(/__(.*?)__/g, "$1")
            .replace(/\*(.*?)\*/g, "$1")
            .replace(/_(.*?)_/g, "$1")
            .replace(/`([^`]+)`/g, "$1");

    }

    const lines = documentation.split("\n");

    // PROCESS DOCUMENTATION

    lines.forEach((line) => {

        const trimmed = line.trim();

        if (!trimmed) {
            y += 3;
            return;
        }

        // CODE BLOCK START OR END

        if (trimmed.startsWith("```")) {
            inCodeBlock = !inCodeBlock;
            y += 3;
            return;
        }

        // CODE BLOCK CONTENT

        if (inCodeBlock) {

            const codeLines = pdf.splitTextToSize(
                line,
                maxWidth - 8
            );

            codeLines.forEach((codeLine) => {

                checkPageSpace(9);

                pdf.setFillColor(241, 245, 249);

                pdf.rect(
                    margin,
                    y - 4,
                    maxWidth,
                    8,
                    "F"
                );

                pdf.setFont("courier", "normal");
                pdf.setFontSize(9);
                pdf.setTextColor(51, 65, 85);

                pdf.text(
                    codeLine,
                    margin + 4,
                    y
                );

                y += 7;

            });

            return;
        }

        // HEADINGS

        const headingMatch = trimmed.match(
            /^(#{1,6})\s+(.*)/
        );

        if (headingMatch) {

            const headingLevel = headingMatch[1].length;

            const headingText = cleanMarkdown(
                headingMatch[2]
            );

            y += 4;

            checkPageSpace(14);

            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(30, 64, 175);

            pdf.setFontSize(
                headingLevel === 1 ? 17 :
                headingLevel === 2 ? 14 : 12
            );

            const headingLines = pdf.splitTextToSize(
                headingText,
                maxWidth
            );

            headingLines.forEach((headingLine) => {

                checkPageSpace(9);

                pdf.text(
                    headingLine,
                    margin,
                    y
                );

                y += 8;

            });

            pdf.setTextColor(30, 41, 59);

            y += 2;

            return;
        }

        // BULLET POINTS AND NUMBERED LISTS

        const listMatch = trimmed.match(
            /^([-*+]|\d+\.)\s+(.*)/
        );

        let content = cleanMarkdown(
            listMatch ? listMatch[2] : trimmed
        );

        const indent = listMatch ? 6 : 0;

        if (listMatch) {
            content = "• " + content;
        }

        // NORMAL PARAGRAPHS

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(51, 65, 85);

        const wrappedLines = pdf.splitTextToSize(
            content,
            maxWidth - indent
        );

        wrappedLines.forEach((textLine) => {

            checkPageSpace();

            pdf.text(
                textLine,
                margin + indent,
                y
            );

            y += lineHeight;

        });

    });

    // ADD PAGE NUMBERS

    const totalPages = pdf.internal.getNumberOfPages();

    for (let page = 1; page <= totalPages; page++) {

        pdf.setPage(page);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(120, 120, 120);

        pdf.text(
            `DocuMind AI | Page ${page} of ${totalPages}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" }
        );

    }

    // SAVE PDF

    pdf.save("DocuMind-AI-Documentation.pdf");

}


// ======================================
// ESCAPE HTML
// ======================================

function escapeHTML(text) {

    return String(text).replace(/[&<>"']/g, function (character) {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];

    });

}