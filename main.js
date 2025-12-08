// main.js - FinalGrade.io
/* globals document, localStorage, setInterval */

let draggedCategory = null;
let modalMode = 'create';
let currentCategoryElement = null;
let categoryToRemove = null;
let selectedDecimalPlaces = 2;
let currentAssignmentElement = null;
let classNameValue = "";
let currentCategoryComment = "";
const STORAGE_KEY = "gradeCalculatorData_v2";
const STUDENT_EXPANSIONS_KEY = "studentCategoryExpansions_v1";
const TEACHER_EXPANSIONS_KEY = "teacherCategoryExpansions_v1";
let maxGradeCapacity = 100;

// DOM refs
const categoryModal = document.getElementById("categoryModal");
const modalTitle = document.getElementById("modalTitle");
const categoryNameInput = document.getElementById("categoryNameInput");
const categoryWeightInput = document.getElementById("categoryWeightInput");
const modalCreateBtn = document.getElementById("modalCreateBtn");
const modalCancelBtn = document.getElementById("modalCancelBtn");

const classNameInput = document.getElementById("classNameInput");
const studentClassName = document.getElementById("studentClassName");

const removeModal = document.getElementById("removeModal");
const removeModalText = document.getElementById("removeModalText");
const removeAllBtn = document.getElementById("removeAllBtn");
const removeAssignmentsOnlyBtn = document.getElementById("removeAssignmentsOnlyBtn");
const removeCancelBtn = document.getElementById("removeCancelBtn");

const commentModal = document.getElementById("commentModal");
const commentModalTitle = document.getElementById("commentModalTitle");
const commentAssignmentName = document.getElementById("commentAssignmentName");
const commentText = document.getElementById("commentText");
const commentCharCount = document.getElementById("commentCharCount");
const saveCommentBtn = document.getElementById("saveCommentBtn");
const cancelCommentBtn = document.getElementById("cancelCommentBtn");

const categoriesContainer = document.getElementById("categoriesContainer");
const overallResult = document.getElementById("overallResult");
const uncappedOverallGrade = document.getElementById("uncappedOverallGrade");
const maxGradeCapacityInput = document.getElementById("maxGradeCapacity");

const tabLinks = document.querySelectorAll(".tab-link");
const viewContents = document.querySelectorAll(".view-content");

const studentOverallGradeDiv = document.getElementById("studentOverallGrade");
const studentCategoriesSummaryDiv = document.getElementById("studentCategoriesSummary");
const refreshStudentGradeBtn = document.getElementById("refreshStudentGradeBtn");

const assignmentDetailsModal = document.getElementById("assignmentDetailsModal");
const detailsAssignmentNameH2 = document.getElementById("detailsAssignmentName");
const detailsCategoryNameSpan = document.getElementById("detailsCategoryName");
const detailsAssignmentGradeSpan = document.getElementById("detailsAssignmentGrade");
const detailsAssignmentPointsSpan = document.getElementById("detailsAssignmentPoints");
const detailsAssignmentMultiplierSpan = document.getElementById("detailsAssignmentMultiplier");
const detailsAssignmentStatusSpan = document.getElementById("detailsAssignmentStatus");
const detailsAssignmentCommentP = document.getElementById("detailsAssignmentComment");
const detailsCloseBtn = document.getElementById("detailsCloseBtn");

// helpers
function warn(msg) { console.warn("[FG] " + msg); }
function error(msg) { console.error("[FG] " + msg); }
function escapeHtml(str) {
    return ("" + str).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
function formatNumberTrim(raw) {
    const n = parseFloat(raw);
    if (isNaN(n)) return raw;
    if (Number.isInteger(n)) return String(n);
    return String(n).replace(/\.?0+$/, '');
}

/* Rounding / formatting */
function safeNumber(v) {
    const n = Number(v);
    return (isNaN(n) || !isFinite(n)) ? NaN : n;
}
function roundHalfUp(value, places) {
    const v = safeNumber(value);
    if (isNaN(v)) return NaN;
    places = Math.max(0, Math.floor(Number(places) || 0));
    const sign = v < 0 ? -1 : 1;
    const absV = Math.abs(v);
    const factor = Math.pow(10, places);
    const shifted = Math.floor(absV * factor + 0.5 + 1e-12);
    const result = shifted / factor;
    return sign * result;
}

function formatWithDecimals(num, decimals) {
    const n = safeNumber(num);
    if (isNaN(n)) return " ";
    decimals = Math.max(0, Math.floor(Number(decimals) || 0));
    const rounded = roundHalfUp(n, decimals);

    if (decimals === 0) {
        const intVal = Math.round(rounded);
        return String(intVal);
    }

    return Number(rounded).toFixed(decimals);
}

function formatPercent(num, decimals) {
    const s = formatWithDecimals(num, decimals);
    if (s === " ") return " ";
    if (s === "0") return " ";
    return s + "%";
}

/* Normalize status label for display */
function normalizeStatusLabel(status) {
    if (!status && status !== "") return "";
    let s = (status || "").toString().trim();
    if (!s) return "";
    const compact = s.replace(/\s+/g, '').toLowerCase();
    if (compact === 'turnedin') return 'TURNED IN';
    s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
    return s.toUpperCase();
}

/* Teacher expansions localStorage helpers */
function loadTeacherExpansions() {
    try { const raw = localStorage.getItem(TEACHER_EXPANSIONS_KEY); return raw ? JSON.parse(raw) : {}; } catch (e) { return {}; }
}
function saveTeacherExpansions(obj) {
    try { localStorage.setItem(TEACHER_EXPANSIONS_KEY, JSON.stringify(obj)); } catch (e) { }
}

/* Student expansions helpers */
function loadStudentExpansions() {
    try {
        const raw = localStorage.getItem(STUDENT_EXPANSIONS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
}
function saveStudentExpansions(obj) {
    try { localStorage.setItem(STUDENT_EXPANSIONS_KEY, JSON.stringify(obj)); } catch (e) { }
}

/* Grade-input parser */
function parseGradedToken(raw) {
    if (!raw) return { numStr: "", numVal: NaN, letters: "", statuses: [], wasOnlyLetters: false };
    const s = raw.toString().trim();
    const m = /^\s*([0-9]*\.?[0-9]+)?\s*([A-Za-z]{1,4})?\s*$/.exec(s);
    if (!m) return { numStr: s, numVal: parseFloat(s) || NaN, letters: "", statuses: [], wasOnlyLetters: false };
    const numStr = m[1] ? m[1] : "";
    const letters = m[2] ? m[2].toUpperCase() : "";
    const numVal = numStr !== "" ? parseFloat(numStr) : NaN;
    const statuses = [];

    if (letters) {
        switch (letters) {
            case "LTE": statuses.push("Late", "TurnedIn", "Excused"); break;
            case "LTD": statuses.push("Late", "TurnedIn", "Dropped"); break;
            case "LT": statuses.push("Late", "TurnedIn"); break;
            case "L": statuses.push("Late"); break;
            case "T": statuses.push("TurnedIn"); break;
            case "E": statuses.push("Excused"); break;
            case "I": statuses.push("Incomplete"); break;
            case "D": statuses.push("Dropped"); break;
            case "M": statuses.push("Missing"); break;
            case "CH": statuses.push("Cheated"); break;
            case "CHT": statuses.push("Cheated"); break;
            default:
                for (let c of letters) {
                    const uc = c.toUpperCase();
                    if (uc === "L") { if (!statuses.includes("Late")) statuses.push("Late"); }
                    else if (uc === "T") { if (!statuses.includes("TurnedIn")) statuses.push("TurnedIn"); }
                    else if (uc === "E") { if (!statuses.includes("Excused")) statuses.push("Excused"); }
                    else if (uc === "D") { if (!statuses.includes("Dropped")) statuses.push("Dropped"); }
                    else if (uc === "I") { if (!statuses.includes("Incomplete")) statuses.push("Incomplete"); }
                    else if (uc === "M") { if (!statuses.includes("Missing")) statuses.push("Missing"); }
                }
                break;
        }
    }

    return { numStr, numVal, letters, statuses, wasOnlyLetters: (numStr === "" && letters !== "") };
}

/* Apply parsed statuses to an assignment's selects */
function applyParsedStatusToSelects(assignmentEl, statuses) {
    if (!assignmentEl) return;
    const main = assignmentEl.querySelector(".status-dropdown-main");
    const sec = assignmentEl.querySelector(".status-dropdown-secondary");
    const ter = assignmentEl.querySelector(".status-dropdown-tertiary");
    if (!main) return;

    if (!statuses || statuses.length === 0) return;

    if (main) main.value = "";
    if (sec) { sec.value = ""; sec.style.display = "none"; }
    if (ter) { ter.value = ""; ter.style.display = "none"; }

    if (statuses[0] === "Late") {
        main.value = "Late";
        if (sec) sec.style.display = "inline-block";
        if (statuses[1]) {
            if (statuses[1] === "TurnedIn") sec.value = "TurnedIn";
            else sec.value = statuses[1];
        }
        if (sec && sec.value === "TurnedIn" && statuses[2]) {
            if (ter) ter.style.display = "inline-block";
            if (ter) ter.value = statuses[2];
        }
    } else {
        main.value = statuses[0];
    }
    const s1 = main.value || "";
    const s2 = sec ? sec.value : "";
    const s3 = ter ? ter.value : "";
    updateAssignmentLineColor(assignmentEl, s1, s2, s3);
}

/* Modal utilities */
function showModal(modalElement, mode = null, element = null) {
    if (!modalElement) return;
    modalElement.style.display = "block";
    const content = modalElement.querySelector(".modal-content");
    if (content) content.classList.remove("move-up");

    // category modal (create/edit)
    if (modalElement === categoryModal) {
        modalMode = mode;
        currentCategoryElement = element;
        if (mode === 'create') {
            if (modalTitle) modalTitle.textContent = "Create Category";
            if (modalCreateBtn) modalCreateBtn.textContent = "Create";
            if (categoryNameInput) categoryNameInput.value = "";
            if (categoryWeightInput) categoryWeightInput.value = "";
        } else if (mode === 'edit' && element) {
            if (modalTitle) modalTitle.textContent = "Edit Category";
            if (modalCreateBtn) modalCreateBtn.textContent = "Save";
            if (categoryNameInput) categoryNameInput.value = element.getAttribute("data-name") || "";
            if (categoryWeightInput) categoryWeightInput.value = element.getAttribute("data-weight") || "";
        }
    }
    // remove modal
    else if (modalElement === removeModal) {
        categoryToRemove = element;
        const catName = element ? (element.getAttribute("data-name") || "") : "";
        if (removeModalText) removeModalText.textContent = `For category "${catName}", choose an option:`;
    }
    // assignment comment modal
    else if (modalElement === commentModal) {
        currentAssignmentElement = element;
        const assignmentName = (element && element.querySelector(".assn-name-input")) ? element.querySelector(".assn-name-input").value : "Unnamed Assignment";
        if (commentModalTitle) commentModalTitle.textContent = "Comment for";
        if (commentAssignmentName) commentAssignmentName.textContent = assignmentName;
        if (commentText) commentText.value = element ? (element.getAttribute("data-comment") || "") : "";
        updateCharCount();
    }
}

function hideModal(modalElement) {
    if (!modalElement) return;
    const modalContent = modalElement.querySelector(".modal-content");
    if (modalContent) modalContent.classList.add("move-up");
    setTimeout(() => {
        modalElement.style.display = "none";
        if (modalContent) modalContent.classList.remove("move-up");
        if (modalElement === categoryModal) currentCategoryElement = null;
        if (modalElement === removeModal) categoryToRemove = null;
        if (modalElement === commentModal) currentAssignmentElement = null;
    }, 220);
}

/* Category & Assignment logic */
function createCategory(name, weight) {
    const catDiv = document.createElement("div");
    catDiv.className = "category";
    catDiv.setAttribute("data-name", name);
    catDiv.setAttribute("data-weight", weight);
    catDiv.setAttribute("draggable", "true");
    catDiv.setAttribute("data-enabled", "true");

    catDiv.addEventListener("dragstart", (e) => {
        draggedCategory = catDiv;
        e.dataTransfer.effectAllowed = "move";
    });
    catDiv.addEventListener("dragover", (e) => e.preventDefault());
    catDiv.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedCategory && draggedCategory !== catDiv) {
            const rect = catDiv.getBoundingClientRect();
            const offset = e.clientY - rect.top;
            if (offset < rect.height / 2) catDiv.parentNode.insertBefore(draggedCategory, catDiv);
            else catDiv.parentNode.insertBefore(draggedCategory, catDiv.nextSibling);
            saveData();
        }
        draggedCategory = null;
    });
    catDiv.addEventListener("dragend", () => draggedCategory = null);

    const assignmentsDiv = document.createElement("div");
    assignmentsDiv.className = "assignments";

    const headerDiv = document.createElement("div");
    headerDiv.className = "category-header";

    const leftContainer = document.createElement("div");
    leftContainer.style.display = "flex";
    leftContainer.style.alignItems = "center";

    const toggleIcon = document.createElement("span");
    toggleIcon.className = "material-icons";
    toggleIcon.style.cursor = "pointer";
    toggleIcon.style.marginRight = "8px";
    toggleIcon.title = "Hide Assignments";
    toggleIcon.textContent = "expand_less";

    const infoSpan = document.createElement("span");
    infoSpan.className = "cat-info";

    const weightDisplay = (weight === "" || weight === null || weight === undefined) ? " " : formatNumberTrim(weight);
    infoSpan.innerHTML = `${escapeHtml(name)} <span class="cat-percentage"> </span>`;

    leftContainer.appendChild(toggleIcon);
    leftContainer.appendChild(infoSpan);

    const weightInfo = document.createElement("div");
    weightInfo.className = "cat-weight-info";
    if (weight && weight !== "" && weight !== "0") {
        weightInfo.textContent = `Weight: ${formatNumberTrim(weight)}`;
        weightInfo.classList.add("visible");
    }
    infoSpan.appendChild(weightInfo);

    const controlsSpan = document.createElement("span");
    controlsSpan.className = "cat-controls";

    const switchIcon = document.createElement("span");
    switchIcon.className = "material-icons";
    switchIcon.style.cursor = "pointer";
    switchIcon.style.marginRight = "10px";
    switchIcon.textContent = "toggle_on";
    switchIcon.title = "Disable category";
    switchIcon.addEventListener("click", (e) => {
        if (catDiv.getAttribute("data-enabled") === "false") {
            catDiv.setAttribute("data-enabled", "true");
            switchIcon.textContent = "toggle_on";
            catDiv.style.opacity = "1";
        } else {
            catDiv.setAttribute("data-enabled", "false");
            switchIcon.textContent = "toggle_off";
            catDiv.style.opacity = "0.5";
        }
        saveData();
        e.stopPropagation();
    });

    const editIcon = document.createElement("span");
    editIcon.className = "material-icons";
    editIcon.title = "Edit Category";
    editIcon.textContent = "edit";
    editIcon.addEventListener("click", (e) => {
        showModal(categoryModal, 'edit', catDiv);
        e.stopPropagation();
    });

    const removeIcon = document.createElement("span");
    removeIcon.className = "material-icons";
    removeIcon.title = "Remove Category";
    removeIcon.textContent = "delete";
    removeIcon.style.color = "#f44336";
    removeIcon.addEventListener("click", (e) => {
        showModal(removeModal, null, catDiv);
        e.stopPropagation();
    });

    controlsSpan.appendChild(switchIcon);
    controlsSpan.appendChild(editIcon);
    controlsSpan.appendChild(removeIcon);

    headerDiv.appendChild(leftContainer);
    headerDiv.appendChild(controlsSpan);

    const addAssignmentBtn = document.createElement("button");
    addAssignmentBtn.className = "add-assignment-btn";
    addAssignmentBtn.innerHTML = '<span class="material-icons">add</span> Add Assignment';
    addAssignmentBtn.addEventListener("click", () => {
        addAssignmentRow(assignmentsDiv);
    });

    catDiv.appendChild(headerDiv);
    catDiv.appendChild(assignmentsDiv);
    catDiv.appendChild(addAssignmentBtn);
    
    categoriesContainer.appendChild(catDiv);

    const teacherExp = loadTeacherExpansions();
    const isOpen = (teacherExp[name] === undefined) ? true : !!teacherExp[name];
    if (!isOpen) {
        assignmentsDiv.style.display = "none";
        addAssignmentBtn.style.display = "none";
        toggleIcon.textContent = "expand_more";
        toggleIcon.title = "Show Assignments";
    } else {
        assignmentsDiv.style.display = "block";
        addAssignmentBtn.style.display = "block";
        toggleIcon.textContent = "expand_less";
        toggleIcon.title = "Hide Assignments";
    }

    toggleIcon.addEventListener("click", (e) => {
        const teacherExpLocal = loadTeacherExpansions();
        if (assignmentsDiv.style.display === "none" || assignmentsDiv.style.display === "") {
            assignmentsDiv.style.display = "block";
            addAssignmentBtn.style.display = "block";
            toggleIcon.textContent = "expand_less";
            toggleIcon.title = "Hide Assignments";
            teacherExpLocal[name] = true;
        } else {
            assignmentsDiv.style.display = "none";
            addAssignmentBtn.style.display = "none";
            toggleIcon.textContent = "expand_more";
            toggleIcon.title = "Show Assignments";
            teacherExpLocal[name] = false;
        }
        saveTeacherExpansions(teacherExpLocal);
        e.stopPropagation();
    });

    attachInputListeners(catDiv);
    saveData();
}

function addAssignmentRow(assignmentsDiv, assignmentData = {}) {
    const assignmentDiv = document.createElement("div");
    assignmentDiv.className = "assignment status-gray";
    if (assignmentData.comment) assignmentDiv.setAttribute("data-comment", assignmentData.comment);

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Assignment Name";
    nameInput.className = "assn-name-input";
    nameInput.value = assignmentData.name || "";

    const gradedPtsInput = document.createElement("input");
    gradedPtsInput.type = "text";
    gradedPtsInput.placeholder = "Graded Pts.";
    gradedPtsInput.className = "graded-pts-input";
    gradedPtsInput.value = assignmentData.gradedPts !== undefined ? assignmentData.gradedPts : "";

    const totalPtsInput = document.createElement("input");
    totalPtsInput.type = "number";
    totalPtsInput.placeholder = "Total Pts.";
    totalPtsInput.className = "total-pts-input";
    totalPtsInput.step = "0.01";
    totalPtsInput.min = "0";
    totalPtsInput.value = assignmentData.totalPts !== undefined ? assignmentData.totalPts : 100;

    const multiplierPtsInput = document.createElement("input");
    multiplierPtsInput.type = "number";
    multiplierPtsInput.placeholder = "Multiplier";
    multiplierPtsInput.className = "multiplier-pts-input";
    multiplierPtsInput.step = "0.1";
    multiplierPtsInput.min = "0";
    multiplierPtsInput.value = assignmentData.multiplierPts !== undefined ? assignmentData.multiplierPts : 1;

    const statusDropdownMain = document.createElement("select");
    statusDropdownMain.className = "status-dropdown-main";
    statusDropdownMain.innerHTML = `
        <option value="" selected>Select Status</option>
        <option value="TurnedIn">Turned in</option>
        <option value="Missing">Missing</option>
        <option value="Late">Late</option>
        <option value="Incomplete">Incomplete</option>
        <option value="Excused">Excused</option>
        <option value="Dropped">Dropped</option>
        <option value="Cheated">Cheated</option>
        <option value="Exempt">Exempt</option>
    `;

    const statusDropdownSecondary = document.createElement("select");
    statusDropdownSecondary.className = "status-dropdown-secondary";
    statusDropdownSecondary.innerHTML = `
        <option value="">(none)</option>
        <option value="TurnedIn">Turned in</option>
        <option value="Dropped">Dropped</option>
        <option value="Excused">Excused</option>
    `;
    statusDropdownSecondary.style.display = "none";

    const statusDropdownTertiary = document.createElement("select");
    statusDropdownTertiary.className = "status-dropdown-tertiary";
    statusDropdownTertiary.innerHTML = `
        <option value="">(none)</option>
        <option value="Dropped">Dropped</option>
        <option value="Excused">Excused</option>
    `;
    statusDropdownTertiary.style.display = "none";

    if (assignmentData.status1) statusDropdownMain.value = assignmentData.status1;
    if (assignmentData.status2) statusDropdownSecondary.value = assignmentData.status2;
    if (assignmentData.status3) statusDropdownTertiary.value = assignmentData.status3;

    const duplicateIcon = document.createElement("span");
    duplicateIcon.className = "material-icons duplicate-assignment";
    duplicateIcon.textContent = "content_copy";

    const removeIcon = document.createElement("span");
    removeIcon.className = "material-icons remove-assignment";
    removeIcon.textContent = "remove_circle";
    removeIcon.style.color = "#f44336";

    const commentIcon = document.createElement("span");
    commentIcon.className = "material-icons comment-assignment";
    commentIcon.textContent = "comment";
    if (assignmentData.comment && assignmentData.comment.trim() !== "") commentIcon.style.color = "#9e9e9e";
    else commentIcon.style.color = "#555";

    assignmentDiv.appendChild(nameInput);
    assignmentDiv.appendChild(gradedPtsInput);
    assignmentDiv.appendChild(totalPtsInput);
    assignmentDiv.appendChild(multiplierPtsInput);
    assignmentDiv.appendChild(statusDropdownMain);
    assignmentDiv.appendChild(statusDropdownSecondary);
    assignmentDiv.appendChild(statusDropdownTertiary);
    assignmentDiv.appendChild(duplicateIcon);
    assignmentDiv.appendChild(removeIcon);
    assignmentDiv.appendChild(commentIcon);

    const preview = document.createElement("div");
    preview.className = "teacher-comment-preview";
    preview.textContent = assignmentData.comment ? assignmentData.comment.split('\n')[0] : "";
    if (!assignmentData.comment || assignmentData.comment.trim() === "") preview.style.display = "none";
    assignmentDiv.appendChild(preview);

    assignmentsDiv.appendChild(assignmentDiv);

    attachInputListeners(assignmentDiv);
    setupAssignmentEvents(assignmentDiv, assignmentsDiv);

    if (gradedPtsInput.value && gradedPtsInput.value.toString().trim() !== "") {
        const parsed = parseGradedToken(gradedPtsInput.value.toString());
        if (parsed.statuses && parsed.statuses.length) {
            applyParsedStatusToSelects(assignmentDiv, parsed.statuses);
        }
    }

    updatePreviewAndStatus(assignmentDiv);
    saveData();
}

function setupAssignmentEvents(assignmentDiv, assignmentsDiv) {
    const commentIcon = assignmentDiv.querySelector(".comment-assignment");
    if (commentIcon) {
        commentIcon.onclick = null;
        commentIcon.addEventListener("click", (e) => {
            showModal(commentModal, null, assignmentDiv);
            e.stopPropagation();
        });
    }

    const duplicateIcon = assignmentDiv.querySelector(".duplicate-assignment");
    if (duplicateIcon) {
        duplicateIcon.onclick = null;
        duplicateIcon.addEventListener("click", (e) => {
            const clone = assignmentDiv.cloneNode(true);
            if (assignmentDiv.nextSibling) assignmentsDiv.insertBefore(clone, assignmentDiv.nextSibling);
            else assignmentsDiv.appendChild(clone);
            attachInputListeners(clone);
            setupAssignmentEvents(clone, assignmentsDiv);
            updatePreviewAndStatus(clone);
            saveData();
            e.stopPropagation();
        });
    }

    const removeIcon = assignmentDiv.querySelector(".remove-assignment");
    if (removeIcon) {
        removeIcon.onclick = null;
        removeIcon.addEventListener("click", (e) => {
            if (assignmentDiv.parentNode === assignmentsDiv) assignmentsDiv.removeChild(assignmentDiv);
            else if (assignmentDiv.parentNode) assignmentDiv.parentNode.removeChild(assignmentDiv);
            saveData();
            e.stopPropagation();
        });
    }

    const statusMain = assignmentDiv.querySelector(".status-dropdown-main");
    const statusSec = assignmentDiv.querySelector(".status-dropdown-secondary");
    const statusTer = assignmentDiv.querySelector(".status-dropdown-tertiary");

    if (statusMain) {
        statusMain.onchange = null;
        statusMain.addEventListener("change", () => {
            if (statusMain.value === "Late") {
                statusSec.style.display = "inline-block";
                statusSec.style.animation = "dropdownOpen 0.3s ease forwards";
            } else {
                if (statusSec.style.display !== "none") {
                    statusSec.style.animation = "dropdownClose 0.3s ease forwards";
                    setTimeout(() => {
                        statusSec.value = "";
                        statusSec.style.display = "none";
                        statusSec.style.animation = "";
                    }, 300);
                }
                statusTer.value = "";
                statusTer.style.display = "none";
                statusTer.style.animation = "";
            }
            updateAssignmentLineColor(assignmentDiv, statusMain.value, statusSec.value, statusTer.value);
            saveData();
        });
    }
    if (statusSec) {
        statusSec.onchange = null;
        statusSec.addEventListener("change", () => {
            if (statusSec.value === "TurnedIn") {
                statusTer.style.display = "inline-block";
                statusTer.style.animation = "dropdownOpen 0.3s ease forwards";
            } else {
                if (statusTer.style.display !== "none") {
                    statusTer.style.animation = "dropdownClose 0.3s ease forwards";
                    setTimeout(() => {
                        statusTer.value = "";
                        statusTer.style.display = "none";
                        statusTer.style.animation = "";
                    }, 300);
                }
            }
            updateAssignmentLineColor(assignmentDiv, statusMain ? statusMain.value : "", statusSec.value, statusTer.value);
            saveData();
        });
    }
    if (statusTer) {
        statusTer.onchange = null;
        statusTer.addEventListener("change", () => {
            updateAssignmentLineColor(assignmentDiv, statusMain ? statusMain.value : "", statusSec ? statusSec.value : "", statusTer.value);
            saveData();
        });
    }

    const gradedInput = assignmentDiv.querySelector(".graded-pts-input");
    if (gradedInput) {
        gradedInput.oninput = null;
        gradedInput.addEventListener("input", () => {
            const parsed = parseGradedToken(gradedInput.value.toString());
            if (parsed.statuses && parsed.statuses.length) {
                applyParsedStatusToSelects(assignmentDiv, parsed.statuses);
            } else {
                const statusMain = assignmentDiv.querySelector(".status-dropdown-main");
                const statusSec = assignmentDiv.querySelector(".status-dropdown-secondary");
                const statusTer = assignmentDiv.querySelector(".status-dropdown-tertiary");
                if (statusMain) statusMain.value = "";
                if (statusSec) { statusSec.value = ""; statusSec.style.display = "none"; statusSec.style.animation = ""; }
                if (statusTer) { statusTer.value = ""; statusTer.style.display = "none"; statusTer.style.animation = ""; }
                updateAssignmentLineColor(assignmentDiv, "", "", "");
            }
            saveData();
        });
    }
}

function updatePreviewAndStatus(assignmentDiv) {
    const preview = assignmentDiv.querySelector(".teacher-comment-preview");
    const comment = assignmentDiv.getAttribute("data-comment") || "";
    if (preview) {
        if (comment && comment.trim() !== "") {
            preview.textContent = comment.split('\n')[0];
            preview.style.display = "block";
        } else {
            preview.textContent = "";
            preview.style.display = "none";
        }
    }
    const s1 = assignmentDiv.querySelector(".status-dropdown-main") ? assignmentDiv.querySelector(".status-dropdown-main").value : "";
    const s2 = assignmentDiv.querySelector(".status-dropdown-secondary") ? assignmentDiv.querySelector(".status-dropdown-secondary").value : "";
    const s3 = assignmentDiv.querySelector(".status-dropdown-tertiary") ? assignmentDiv.querySelector(".status-dropdown-tertiary").value : "";
    updateAssignmentLineColor(assignmentDiv, s1, s2, s3);
}

function updateAssignmentLineColor(assignmentDiv, status1, status2, status3) {
    assignmentDiv.classList.remove('status-gray', 'status-red', 'status-green', 'status-blue');
    const effective = (status3 && status3.trim() !== "") ? status3 :
        (status2 && status2.trim() !== "") ? status2 :
            (status1 && status1.trim() !== "") ? status1 : "";
    if (!effective) { assignmentDiv.classList.add('status-gray'); return; }
    const s = effective.toLowerCase();
    if (["missing", "cheated", "incomplete", "late"].includes(s)) assignmentDiv.classList.add('status-red');
    else if (["turnedin", "turned in"].includes(s)) assignmentDiv.classList.add('status-green');
    else if (["dropped", "excused", "exempt"].includes(s)) assignmentDiv.classList.add('status-blue');
    else assignmentDiv.classList.add('status-gray');
}

function attachInputListeners(node) {
    const inputs = node.querySelectorAll("input");
    inputs.forEach(i => {
        i.addEventListener("input", () => saveData());
        i.addEventListener("change", () => saveData());
    });
    const selects = node.querySelectorAll("select");
    selects.forEach(s => s.addEventListener("change", () => saveData()));
}

function updateCharCount() {
    if (!commentText || !commentCharCount) return;
    const len = commentText.value.length;
    const max = commentText.getAttribute('maxlength') || 1000;
    commentCharCount.textContent = `${len}/${max}`;
}

/* Calculation */
function calculateAll() {
    let totalWeighted = 0;
    let totalWeights = 0;
    const categories = document.querySelectorAll(".category");
    categories.forEach(cat => {
        if (cat.getAttribute("data-enabled") === "false") {
            const pctSpan = cat.querySelector(".cat-percentage");
            if (pctSpan) pctSpan.textContent = ` `;
            return;
        }

        const weightRaw = cat.getAttribute("data-weight");
        const weight = (weightRaw === "" || weightRaw === null || weightRaw === undefined) ? 0 : parseFloat(weightRaw);
        const assignments = cat.querySelectorAll(".assignment");
        let categoryNumerator = 0;
        let categoryMultiplierSum = 0;

        assignments.forEach(a => {
            const status1Dom = a.querySelector(".status-dropdown-main");
            const status2Dom = a.querySelector(".status-dropdown-secondary");
            const status3Dom = a.querySelector(".status-dropdown-tertiary");
            let status1 = status1Dom ? status1Dom.value : "";
            let status2 = status2Dom ? status2Dom.value : "";
            let status3 = status3Dom ? status3Dom.value : "";

            const gradedRawInput = a.querySelector(".graded-pts-input");
            const gradedRaw = gradedRawInput ? (gradedRawInput.value || "").toString().trim() : "";
            const totalRaw = (a.querySelector(".total-pts-input") ? a.querySelector(".total-pts-input").value : "").toString().trim();
            const multRaw = a.querySelector(".multiplier-pts-input") ? a.querySelector(".multiplier-pts-input").value : "1";

            const parsed = parseGradedToken(gradedRaw);
            if (parsed.statuses && parsed.statuses.length) {
                applyParsedStatusToSelects(a, parsed.statuses);
                status1 = status1Dom ? status1Dom.value : status1;
                status2 = status2Dom ? status2Dom.value : status2;
                status3 = status3Dom ? status3Dom.value : status3;
            }

            const gradedNum = parsed.numVal;
            const total = parseFloat(totalRaw);
            const mult = parseFloat(multRaw) || 1;

            const excludeSet = ["Dropped", "Excused", "Exempt"];
            if (excludeSet.includes(status1) || excludeSet.includes(status2) || excludeSet.includes(status3)) return;
            if (parsed.statuses && parsed.statuses.some(s => excludeSet.includes(s))) return;

            let percent = NaN;

            if (parsed.statuses && parsed.statuses.some(s => ["Missing", "Cheated"].includes(s))) {
                percent = 0;
            } else if (!isNaN(total) && total > 0 && !isNaN(gradedNum)) {
                percent = (gradedNum / total) * 100;
            } else if (!isNaN(total) && total === 0 && !isNaN(gradedNum)) {
                if (gradedNum === 0) return;
                percent = gradedNum + 100;
            } else {
                return;
            }

            const zeroSet = ["Missing", "Cheated"];
            if (zeroSet.includes(status1) || zeroSet.includes(status2) || zeroSet.includes(status3)) percent = 0;

            categoryNumerator += percent * mult;
            categoryMultiplierSum += mult;
        });

        const pctSpan = cat.querySelector(".cat-percentage");
        if (categoryMultiplierSum > 0) {
            const catAvg = categoryNumerator / categoryMultiplierSum;
            if (pctSpan) {
                const pctValue = formatWithDecimals(catAvg, selectedDecimalPlaces);
                pctSpan.textContent = pctValue === "0" ? " " : pctValue + "%";
            }

            if (weight > 0) {
                totalWeighted += catAvg * (weight / 100);
                totalWeights += (weight / 100);
            }
        } else {
            if (pctSpan) pctSpan.textContent = ` `;
        }
    });

    const uncapped = (totalWeights > 0) ? (totalWeighted / totalWeights) : 0;
    const cap = parseFloat(maxGradeCapacityInput.value || maxGradeCapacity) || maxGradeCapacity;
    const final = Math.min(uncapped, cap);

    if (overallResult) overallResult.textContent = "Overall Grade: " + (totalWeights > 0 ? formatWithDecimals(final, selectedDecimalPlaces) + "%" : " ");
    if (uncappedOverallGrade) uncappedOverallGrade.textContent = "Uncapped Overall Grade: " + (totalWeights > 0 ? formatWithDecimals(uncapped, selectedDecimalPlaces) + "%" : " ");

    if (document.getElementById("studentView").classList.contains("active")) populateStudentView();
}

/* Save / Load */
function saveData() {
    const categoriesData = [];
    const cats = document.querySelectorAll(".category");
    cats.forEach(cat => {
        const name = cat.getAttribute("data-name");
        const weight = cat.getAttribute("data-weight");
        const enabled = cat.getAttribute("data-enabled");
        const assignments = [];
        cat.querySelectorAll(".assignment").forEach(a => {
            const nameInput = a.querySelector(".assn-name-input");
            const graded = a.querySelector(".graded-pts-input");
            const total = a.querySelector(".total-pts-input");
            const mult = a.querySelector(".multiplier-pts-input");
            const status1 = a.querySelector(".status-dropdown-main");
            const status2 = a.querySelector(".status-dropdown-secondary");
            const status3 = a.querySelector(".status-dropdown-tertiary");
            const assignmentComment = a.getAttribute("data-comment") || "";
            assignments.push({
                name: nameInput ? nameInput.value : "",
                gradedPts: graded ? graded.value : "",
                totalPts: total ? total.value : "",
                multiplierPts: mult ? mult.value : "",
                status1: status1 ? status1.value : "",
                status2: status2 ? status2.value : "",
                status3: status3 ? status3.value : "",
                comment: assignmentComment
            });
        });
        categoriesData.push({ name, weight, enabled, assignments });
    });
    const settings = {
        decimalPlaces: selectedDecimalPlaces,
        maxCapacity: maxGradeCapacityInput.value || maxGradeCapacity,
        className: classNameInput ? (classNameInput.value || "") : ""
    };

    const expansions = loadStudentExpansions() || {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ categories: categoriesData, settings, expansions }));
}

function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        // Create default categories with assignments
        const defaultCategories = [
            { name: "4.5 Week Progress", weight: "", assignments: [{ name: "In Progress", gradedPts: "", totalPts: 100, multiplierPts: 1, status1: "", status2: "", status3: "", comment: "" }] },
            { name: "9 Week Progress", weight: "", assignments: [{ name: "In Progress", gradedPts: "", totalPts: 100, multiplierPts: 1, status1: "", status2: "", status3: "", comment: "" }] },
            { name: "13.5 Week Progress", weight: "", assignments: [{ name: "In Progress", gradedPts: "", totalPts: 100, multiplierPts: 1, status1: "", status2: "", status3: "", comment: "" }] },
            { name: "18 Week Progress", weight: "", assignments: [{ name: "In Progress", gradedPts: "", totalPts: 100, multiplierPts: 1, status1: "", status2: "", status3: "", comment: "" }] },
            { name: "Final Avg.", weight: "", assignments: [{ name: "Final Avg.", gradedPts: "", totalPts: 100, multiplierPts: 1, status1: "", status2: "", status3: "", comment: "" }] },
            { name: "Final", weight: 10, assignments: [{ name: "Example Assignment", gradedPts: 100, totalPts: 100, multiplierPts: 1, status1: "", status2: "", status3: "", comment: "Well Done!" }] },
            { name: "Formative", weight: 40, assignments: [{ name: "Example Assignment", gradedPts: 100, totalPts: 100, multiplierPts: 1, status1: "", status2: "", status3: "", comment: "Well Done!" }] },
            { name: "Summative", weight: 50, assignments: [{ name: "Example Assignment", gradedPts: 100, totalPts: 100, multiplierPts: 1, status1: "", status2: "", status3: "", comment: "Well Done!" }] },
            { name: "Uncategorized Assignment", weight: 0, assignments: [{ name: "Example Assignment", gradedPts: 100, totalPts: 100, multiplierPts: 1, status1: "", status2: "", status3: "", comment: "Well Done!" }] }
        ];

        defaultCategories.forEach(cat => {
            createCategory(cat.name, cat.weight);
            const latest = categoriesContainer.lastElementChild;
            if (latest) {
                const assignmentsDiv = latest.querySelector(".assignments");
                if (assignmentsDiv) {
                    assignmentsDiv.innerHTML = '';
                    (cat.assignments || []).forEach(asn => addAssignmentRow(assignmentsDiv, asn));
                }
            }
        });

        saveData();
        return;
    }
    try {
        const parsed = JSON.parse(raw);
        const settings = parsed.settings || {};
        selectedDecimalPlaces = (settings.decimalPlaces !== undefined) ? (parseInt(settings.decimalPlaces, 10) || 0) : 2;
        document.querySelectorAll('.decimal-btn').forEach(b => b.classList.remove('active'));
        const dpBtn = document.querySelector(`.decimal-btn[data-decimals="${selectedDecimalPlaces}"]`);
        if (dpBtn) dpBtn.classList.add('active');
        if (maxGradeCapacityInput) maxGradeCapacityInput.value = settings.maxCapacity !== undefined ? settings.maxCapacity : maxGradeCapacity;
        if (classNameInput) classNameInput.value = settings.className || "";
        classNameValue = settings.className || "";
        if (categoriesContainer) categoriesContainer.innerHTML = '';
        (parsed.categories || []).forEach(cat => {
            createCategory(cat.name, cat.weight);
            const latest = categoriesContainer ? categoriesContainer.lastElementChild : null;
            if (latest) {
                const savedEnabled = cat.enabled !== undefined ? cat.enabled : "true";
                latest.setAttribute("data-enabled", savedEnabled);
                
                if (savedEnabled === "false") {
                    latest.style.opacity = "0.5";
                    const switchIcon = latest.querySelector(".material-icons[title='Disable category']");
                    if (switchIcon) switchIcon.textContent = "toggle_off";
                }
                
                const assignmentsDiv = latest.querySelector(".assignments");
                if (assignmentsDiv) {
                    assignmentsDiv.innerHTML = '';
                    (cat.assignments || []).forEach(asn => addAssignmentRow(assignmentsDiv, asn));
                }
            }
        });

        const expansions = (parsed.expansions) ? parsed.expansions : {};
        localStorage.setItem(STUDENT_EXPANSIONS_KEY, JSON.stringify(expansions));
    } catch (e) {
        console.error("Failed to load saved data:", e);
        localStorage.removeItem(STORAGE_KEY);
    }
}

/* Student view population */
function populateStudentView() {
    if (!studentCategoriesSummaryDiv) return;
    studentCategoriesSummaryDiv.innerHTML = '';
    const className = classNameInput ? classNameInput.value : "";
    if (studentClassName) {
        studentClassName.textContent = className ? className : "";
        studentClassName.style.display = className ? "block" : "none";
    }
    const expansions = loadStudentExpansions();
    const categoryElements = document.querySelectorAll(".category");
    if (!categoryElements || categoryElements.length === 0) {
        studentCategoriesSummaryDiv.innerHTML = "<p style='text-align:center;'>No categories available.</p>";
        return;
    }

    categoryElements.forEach(catElement => {
        const categoryName = catElement.getAttribute("data-name");
        const weightRaw = catElement.getAttribute("data-weight");
        const categoryWeight = (weightRaw === "" || weightRaw === null || weightRaw === undefined) ? "" : formatNumberTrim(weightRaw);
        const categoryAverageText = catElement.querySelector(".cat-percentage") ? catElement.querySelector(".cat-percentage").textContent : " ";
        const isEnabled = catElement.getAttribute("data-enabled") !== "false";

        if (!isEnabled) return;

        const assignmentElements = catElement.querySelectorAll(".assignment");
        if (!assignmentElements || assignmentElements.length === 0) return;

        const studentCategoryDiv = document.createElement("div");
        studentCategoryDiv.className = "student-category";

        const header = document.createElement("div");
        header.className = "student-category-header";
        
        const headerLeftContent = document.createElement("div");
        headerLeftContent.style.display = "flex";
        headerLeftContent.style.alignItems = "center";
        headerLeftContent.style.gap = "8px";
        
        const headerText = document.createElement("span");
        headerText.innerHTML = `${escapeHtml(categoryName)} (${escapeHtml(categoryWeight)}%) <span class="cat-percentage">${categoryAverageText}</span>`;
        headerLeftContent.appendChild(headerText);

        header.appendChild(headerLeftContent);

        const headerRightContent = document.createElement("div");
        headerRightContent.style.display = "flex";
        headerRightContent.style.alignItems = "center";
        headerRightContent.style.gap = "8px";

        const expandIcon = document.createElement("span");
        expandIcon.className = "material-icons expand-icon";
        expandIcon.textContent = "expand_more";
        headerRightContent.appendChild(expandIcon);

        header.appendChild(headerRightContent);

        const content = document.createElement("div");
        content.className = "student-assignments";

        const expanded = expansions[categoryName];
        if (expanded) {
            content.style.display = "block";
            studentCategoryDiv.classList.add("expanded");
            const ic = header.querySelector(".material-icons.expand-icon");
            if (ic) ic.textContent = "expand_less";
        }

        header.addEventListener("click", () => {
            const isOpen = content.style.display === "block";
            if (isOpen) {
                content.style.display = "none";
                studentCategoryDiv.classList.remove("expanded");
                const ic = header.querySelector(".material-icons.expand-icon");
                if (ic) ic.textContent = "expand_more";
                expansions[categoryName] = false;
            } else {
                content.style.display = "block";
                studentCategoryDiv.classList.add("expanded");
                const ic = header.querySelector(".material-icons.expand-icon");
                if (ic) ic.textContent = "expand_less";
                expansions[categoryName] = true;
            }
            saveStudentExpansions(expansions);
        });

        assignmentElements.forEach(a => {
            const assnName = a.querySelector(".assn-name-input") ? a.querySelector(".assn-name-input").value : "Unnamed Assignment";
            const gradedRaw = a.querySelector(".graded-pts-input") ? a.querySelector(".graded-pts-input").value.toString().trim() : "";
            const totalRaw = a.querySelector(".total-pts-input") ? a.querySelector(".total-pts-input").value.toString().trim() : "";
            const multiplier = a.querySelector(".multiplier-pts-input") ? a.querySelector(".multiplier-pts-input").value : "1";
            const status1 = a.querySelector(".status-dropdown-main") ? a.querySelector(".status-dropdown-main").value : "";
            const status2 = a.querySelector(".status-dropdown-secondary") ? a.querySelector(".status-dropdown-secondary").value : "";
            const status3 = a.querySelector(".status-dropdown-tertiary") ? a.querySelector(".status-dropdown-tertiary").value : "";
            const comment = a.getAttribute("data-comment") || "";

            const parsed = parseGradedToken(gradedRaw);

            const row = document.createElement("div");
            row.className = "student-assignment-row";

            let statusClass = "gray";
            const key = (status3 && status3.trim() !== "") ? status3.replace(/\s+/g, '').toLowerCase() :
                (status2 && status2.trim() !== "") ? status2.replace(/\s+/g, '').toLowerCase() :
                    (status1 && status1.trim() !== "") ? status1.replace(/\s+/g, '').toLowerCase() : "";
            if (["missing", "cheated", "incomplete", "late"].includes(key)) statusClass = "missing";
            else if (["turnedin", "turned in"].includes(key)) statusClass = "turnedin";
            else if (["dropped", "excused", "exempt"].includes(key)) statusClass = "dropped";
            row.classList.add(`status-${statusClass}`);

            row.setAttribute("data-name", assnName);
            row.setAttribute("data-graded", gradedRaw);
            row.setAttribute("data-total", totalRaw);
            row.setAttribute("data-multiplier", multiplier);
            row.setAttribute("data-status1", status1);
            row.setAttribute("data-status2", status2);
            row.setAttribute("data-status3", status3);
            row.setAttribute("data-comment", comment);
            row.setAttribute("data-category", categoryName);

            const icon = document.createElement("span");
            icon.className = "material-icons student-assignment-icon";
            icon.textContent = "assignment";
            row.appendChild(icon);

            const nameMult = document.createElement("div");
            nameMult.className = "student-name-multiplier";
            const nameSpan = document.createElement("span");
            nameSpan.className = "student-assignment-name";
            nameSpan.textContent = assnName;
            nameMult.appendChild(nameSpan);

            const parsedMult = parseFloat((multiplier || "").toString());
            if (!isNaN(parsedMult) && parsedMult !== 1) {
                const multSpan = document.createElement("span");
                multSpan.className = "student-assignment-multiplier";
                multSpan.textContent = `Multiplier ${parsedMult}`;
                nameMult.appendChild(multSpan);
            }
            row.appendChild(nameMult);

            const preview = document.createElement("div");
            preview.className = "student-teacher-comment-preview";
            if (comment && comment.trim() !== "") preview.textContent = comment.split('\n')[0];
            else preview.textContent = "";
            row.appendChild(preview);

            const statusContainer = document.createElement("div");
            statusContainer.style.display = "flex";
            statusContainer.style.flexDirection = "row";
            statusContainer.style.alignItems = "center";

            if (status1 && status1.trim() !== "") {
                const pill1 = document.createElement("span");
                const key1 = status1.replace(/\s+/g, '').toLowerCase();
                pill1.className = `student-assignment-status status-${key1}`;
                pill1.textContent = normalizeStatusLabel(status1);
                statusContainer.appendChild(pill1);
            }

            if (status1 === "Late" && status2 && status2.trim() !== "") {
                const pill2 = document.createElement("span");
                const key2 = status2.replace(/\s+/g, '').toLowerCase();
                pill2.className = `student-assignment-status status-${key2}`;
                pill2.textContent = normalizeStatusLabel(status2);
                statusContainer.appendChild(pill2);
                if (status2 === "TurnedIn" && status3 && status3.trim() !== "") {
                    const pill3 = document.createElement("span");
                    const key3 = status3.replace(/\s+/g, '').toLowerCase();
                    pill3.className = `student-assignment-status status-${key3}`;
                    pill3.textContent = normalizeStatusLabel(status3);
                    statusContainer.appendChild(pill3);
                }
            }

            row.appendChild(statusContainer);

            let gradeDisplay = " ";
            const gNumStr = parsed.numStr;
            const tVal = totalRaw;
            const tNum = parseFloat(tVal);

            if (parsed.statuses && parsed.statuses.some(s => ["Missing", "Cheated"].includes(s))) {
                if (tVal !== "" && !isNaN(tNum) && tNum !== 0) gradeDisplay = `0 / ${tVal}`;
                else if (tVal !== "" && !isNaN(tNum) && tNum === 0) gradeDisplay = "0 / 0";
                else gradeDisplay = " ";
            } else if (gNumStr === "" || gNumStr === null) {
                gradeDisplay = " ";
            } else {
                if (tVal !== "" && !isNaN(tNum)) {
                    if (tNum === 0) gradeDisplay = `${gNumStr} / 0`;
                    else gradeDisplay = `${gNumStr} / ${tVal}`;
                } else {
                    gradeDisplay = " ";
                }
            }

            const gradeSpan = document.createElement("span");
            gradeSpan.className = "student-assignment-grade";
            gradeSpan.textContent = gradeDisplay;
            row.appendChild(gradeSpan);

            row.addEventListener("click", () => {
                const assnData = {
                    name: row.getAttribute("data-name"),
                    gradedPts: row.getAttribute("data-graded"),
                    totalPts: row.getAttribute("data-total"),
                    multiplierPts: row.getAttribute("data-multiplier"),
                    status1: row.getAttribute("data-status1"),
                    status2: row.getAttribute("data-status2"),
                    status3: row.getAttribute("data-status3"),
                    comment: row.getAttribute("data-comment")
                };
                populateAssignmentDetailsModal(assnData, categoryName);
            });

            content.appendChild(row);
        });

        studentCategoryDiv.appendChild(header);
        studentCategoryDiv.appendChild(content);
        studentCategoriesSummaryDiv.appendChild(studentCategoryDiv);
    });

    if (studentOverallGradeDiv && overallResult) studentOverallGradeDiv.textContent = overallResult.textContent;
}

/* Assignment details modal */
function populateAssignmentDetailsModal(assignmentData, categoryName) {
    if (detailsAssignmentNameH2) detailsAssignmentNameH2.textContent = assignmentData.name || "Assignment Details";
    if (detailsCategoryNameSpan) detailsCategoryNameSpan.textContent = categoryName || "N/A";
    const gradedRaw = (assignmentData.gradedPts || "").toString().trim();
    const totalRaw = (assignmentData.totalPts || "").toString().trim();

    const parsed = parseGradedToken(gradedRaw);
    const graded = parsed.numVal;
    const total = parseFloat(totalRaw);

    let gradePercentageDisplay = " ";
    if (!isNaN(graded) && !isNaN(total) && total > 0) {
        const pct = (graded / total) * 100;
        gradePercentageDisplay = formatNumberTrim(String(pct)) + "%";
    } else if (!isNaN(graded) && (isNaN(total) || total === 0)) {
        if (isNaN(total)) {
            gradePercentageDisplay = " ";
        } else {
            if (graded === 0) gradePercentageDisplay = " ";
            else gradePercentageDisplay = formatNumberTrim(String(graded + 100)) + "%";
        }
    }

    let gradePointsLeft = "--";
    if (parsed.statuses && parsed.statuses.some(s => ["Missing", "Cheated"].includes(s))) {
        gradePointsLeft = "0";
    } else if (parsed.numStr && parsed.numStr !== "") {
        gradePointsLeft = parsed.numStr;
    } else {
        gradePointsLeft = " ";
    }

    let gradePointsRight = (isNaN(total) || total < 0) ? " " : (total === 0 ? "0" : totalRaw);

    const fullGradeDisplay = `${gradePointsLeft} / ${gradePointsRight} (${gradePercentageDisplay})`;
    if (detailsAssignmentGradeSpan) detailsAssignmentGradeSpan.textContent = fullGradeDisplay;
    if (detailsAssignmentPointsSpan) detailsAssignmentPointsSpan.textContent = `${gradePointsLeft} / ${gradePointsRight}`;
    if (detailsAssignmentMultiplierSpan) detailsAssignmentMultiplierSpan.innerHTML = `<strong>${assignmentData.multiplierPts || '--'}</strong>`;

    const s1 = assignmentData.status1 || '';
    const s2 = assignmentData.status2 || '';
    const s3 = assignmentData.status3 || '';
    const statusParts = [];
    if (s1) statusParts.push(normalizeStatusLabel(s1));
    if (s1 === "Late" && s2) statusParts.push(normalizeStatusLabel(s2));
    if (s2 === "TurnedIn" && s3) statusParts.push(normalizeStatusLabel(s3));
    if (detailsAssignmentStatusSpan) detailsAssignmentStatusSpan.textContent = statusParts.length ? statusParts.join(" / ") : "NOT SET";

    const multiplierValue = parseFloat(assignmentData.multiplierPts || 1);
    const multiplierSection = document.getElementById("multiplierSection");
    if (multiplierSection && multiplierValue === 1) {
        multiplierSection.style.display = "none";
    } else if (multiplierSection) {
        multiplierSection.style.display = "block";
    }

    if (detailsAssignmentCommentP) detailsAssignmentCommentP.textContent = (assignmentData.comment && assignmentData.comment.trim() !== "") ? assignmentData.comment : "No comment left.";
    const commentSection = assignmentDetailsModal ? assignmentDetailsModal.querySelector(".assignment-details-comment") : null;
    if (commentSection) commentSection.style.display = (assignmentData.comment && assignmentData.comment.trim() !== "") ? 'block' : 'none';
    showModal(assignmentDetailsModal);
}

/* Modal & UI wiring */
function setDecimalPlaces(dec) {
    dec = Math.max(0, Math.floor(Number(dec) || 0));
    selectedDecimalPlaces = dec;
    document.querySelectorAll('.decimal-btn').forEach(b => {
        const bdec = parseInt(b.dataset.decimals, 10);
        if (bdec === dec) b.classList.add('active');
        else b.classList.remove('active');
    });
    saveData();
    reformatAllDisplays();
}

function updateCategoryCommentDisplay(catDiv) {
    if (!catDiv) return;
    const commentIcon = catDiv.querySelector(".material-icons[title='Edit Category Comment']");
    
    if (commentIcon) {
        commentIcon.style.color = "#555";
    }
}

function showAssignmentsMultiselect() {
    const container = document.getElementById("assignmentsMultiselectContainer");
    container.innerHTML = "";
    
    const categories = document.querySelectorAll(".category");
    let assignmentCount = 0;
    
    categories.forEach(cat => {
        const catName = cat.getAttribute("data-name");
        const assignments = cat.querySelectorAll(".assignment");
        
        assignments.forEach((asn, idx) => {
            const assnName = asn.querySelector(".assn-name-input") ? asn.querySelector(".assn-name-input").value : "Unnamed";
            
            const item = document.createElement("div");
            item.className = "multiselect-item";
            item.innerHTML = `
                <input type="checkbox" class="assignment-checkbox" data-category-name="${catName}" data-assignment-index="${idx}">
                <label>${escapeHtml(assnName)} (${escapeHtml(catName)})</label>
            `;
            container.appendChild(item);
            assignmentCount++;
        });
    });
    
    if (assignmentCount === 0) {
        container.innerHTML = "<p style='text-align: center; padding: 20px; color: #999;'>No assignments available</p>";
    }
    
    const selectAllCheckbox = document.getElementById("selectAllAssignmentsCheckbox");
    selectAllCheckbox.checked = false;
    selectAllCheckbox.addEventListener("change", () => {
        const checkboxes = document.querySelectorAll(".assignment-checkbox");
        checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
    });
    
    document.getElementById("removeAssignmentsModal").style.display = "block";
}

function showCategoriesMultiselect() {
    const container = document.getElementById("categoriesMultiselectContainer");
    container.innerHTML = "";
    
    const categories = document.querySelectorAll(".category");
    let catCount = 0;
    
    categories.forEach((cat, idx) => {
        const catName = cat.getAttribute("data-name");
        
        const item = document.createElement("div");
        item.className = "multiselect-item";
        item.innerHTML = `
            <input type="checkbox" class="category-checkbox" data-category-index="${idx}">
            <label>${escapeHtml(catName)}</label>
        `;
        container.appendChild(item);
        catCount++;
    });
    
    if (catCount === 0) {
        container.innerHTML = "<p style='text-align: center; padding: 20px; color: #999;'>No categories available</p>";
    }
    
    const selectAllCheckbox = document.getElementById("selectAllCategoriesCheckbox");
    selectAllCheckbox.checked = false;
    selectAllCheckbox.addEventListener("change", () => {
        const checkboxes = document.querySelectorAll(".category-checkbox");
        checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
    });
    
    document.getElementById("removeCategoriesModal").style.display = "block";
}

function deleteSelectedAssignments() {
    const checkboxes = document.querySelectorAll(".assignment-checkbox:checked");
    const toDelete = [];
    
    checkboxes.forEach(cb => {
        toDelete.push({
            categoryName: cb.getAttribute("data-category-name"),
            assignmentIndex: parseInt(cb.getAttribute("data-assignment-index"))
        });
    });
    
    if (toDelete.length === 0) {
        warn("No assignments selected");
        return;
    }
    
    toDelete.sort((a, b) => b.assignmentIndex - a.assignmentIndex);
    
    toDelete.forEach(item => {
        const cat = Array.from(document.querySelectorAll(".category")).find(c => c.getAttribute("data-name") === item.categoryName);
        if (cat) {
            const assignments = cat.querySelectorAll(".assignment");
            if (assignments[item.assignmentIndex]) {
                assignments[item.assignmentIndex].remove();
            }
        }
    });
    
    saveData();
    document.getElementById("removeAssignmentsModal").style.display = "none";
}

function deleteSelectedCategories() {
    const checkboxes = document.querySelectorAll(".category-checkbox:checked");
    const categories = Array.from(document.querySelectorAll(".category"));
    const indices = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute("data-category-index"))).sort((a, b) => b - a);
    
    if (indices.length === 0) {
        warn("No categories selected");
        return;
    }
    
    indices.forEach(idx => {
        if (categories[idx]) {
            categories[idx].remove();
        }
    });
    
    saveData();
    document.getElementById("removeCategoriesModal").style.display = "none";
}

function setupModalControls() {
    document.querySelectorAll('.close-modal-btn').forEach(btn => btn.addEventListener('click', (e) => {
        const modal = btn.closest('.modal');
        if (modal) hideModal(modal);
    }));
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', () => hideModal(categoryModal));
    if (removeCancelBtn) removeCancelBtn.addEventListener('click', () => hideModal(removeModal));
    if (cancelCommentBtn) cancelCommentBtn.addEventListener('click', () => hideModal(commentModal));
    if (detailsCloseBtn) detailsCloseBtn.addEventListener('click', () => hideModal(assignmentDetailsModal));

    // Bulk delete handlers
    const removeSelectedAssignmentsBtn = document.getElementById("removeSelectedAssignmentsBtn");
    const removeSelectedCategoriesBtn = document.getElementById("removeSelectedCategoriesBtn");
    const confirmDeleteAssignmentsBtn = document.getElementById("confirmDeleteAssignmentsBtn");
    const confirmDeleteCategoriesBtn = document.getElementById("confirmDeleteCategoriesBtn");

    if (removeSelectedAssignmentsBtn) {
        removeSelectedAssignmentsBtn.addEventListener('click', showAssignmentsMultiselect);
    }
    if (removeSelectedCategoriesBtn) {
        removeSelectedCategoriesBtn.addEventListener('click', showCategoriesMultiselect);
    }
    if (confirmDeleteAssignmentsBtn) {
        confirmDeleteAssignmentsBtn.addEventListener('click', deleteSelectedAssignments);
    }
    if (confirmDeleteCategoriesBtn) {
        confirmDeleteCategoriesBtn.addEventListener('click', deleteSelectedCategories);
    }

    if (removeAllBtn) removeAllBtn.addEventListener('click', () => {
        if (categoryToRemove && categoryToRemove.parentNode) categoryToRemove.parentNode.removeChild(categoryToRemove);
        saveData();
        hideModal(removeModal);
    });
    if (removeAssignmentsOnlyBtn) removeAssignmentsOnlyBtn.addEventListener('click', () => {
        if (categoryToRemove) {
            const assignmentsDiv = categoryToRemove.querySelector('.assignments');
            if (assignmentsDiv) assignmentsDiv.innerHTML = '';
            saveData();
        }
        hideModal(removeModal);
    });

    const removeGradeInAssignmentsBtn = document.getElementById("removeGradeInAssignmentsBtn");
    if (removeGradeInAssignmentsBtn) removeGradeInAssignmentsBtn.addEventListener('click', () => {
        if (categoryToRemove) {
            const assignments = categoryToRemove.querySelectorAll('.assignment');
            assignments.forEach(asn => {
                const gradedInput = asn.querySelector('.graded-pts-input');
                if (gradedInput) gradedInput.value = '';
            });
            saveData();
        }
        hideModal(removeModal);
    });

    if (modalCreateBtn) modalCreateBtn.addEventListener('click', () => {
        const name = (categoryNameInput.value || "").trim();
        const weightVal = categoryWeightInput.value;
        const weight = weightVal !== "" ? weightVal : "";
        if (!name) { warn("Category name cannot be empty."); return; }

        if (modalMode === 'create') {
            createCategory(name, weight);
        } else if (modalMode === 'edit' && currentCategoryElement) {
            const prevName = currentCategoryElement.getAttribute('data-name');
            currentCategoryElement.setAttribute('data-name', name);
            currentCategoryElement.setAttribute('data-weight', weight);

            const infoSpan = currentCategoryElement.querySelector('.cat-info');
            if (infoSpan) {
                const catPct = infoSpan.querySelector(".cat-percentage");
                const weightDisplay = (weight === "" || weight === null || weight === undefined) ? " " : formatNumberTrim(weight);
                const weightText = (weight === "" || weight === null || weight === undefined) ? "" : `(<span class="cat-weight">${escapeHtml(weightDisplay)}</span>%)`;
                infoSpan.innerHTML = `${escapeHtml(name)} ${weightText} `;
                if (catPct) infoSpan.appendChild(catPct);
            }

            try {
                const tExp = loadTeacherExpansions();
                if (prevName && tExp.hasOwnProperty(prevName)) {
                    tExp[name] = tExp[prevName];
                    delete tExp[prevName];
                    saveTeacherExpansions(tExp);
                }
            } catch (e) { }
        }
        hideModal(categoryModal);
        saveData();
    });

    if (saveCommentBtn) saveCommentBtn.addEventListener('click', () => {
        if (currentAssignmentElement) {
            const txt = commentText.value.trim();
            if (txt.length > 0) {
                currentAssignmentElement.setAttribute('data-comment', txt);
                const preview = currentAssignmentElement.querySelector(".teacher-comment-preview");
                if (preview) { preview.textContent = txt.split('\n')[0]; preview.style.display = "block"; }
                const commentIcon = currentAssignmentElement.querySelector(".comment-assignment");
                if (commentIcon) commentIcon.style.color = "#9e9e9e";
            } else {
                currentAssignmentElement.removeAttribute('data-comment');
                const preview = currentAssignmentElement.querySelector(".teacher-comment-preview");
                if (preview) { preview.textContent = ""; preview.style.display = "none"; }
                const commentIcon = currentAssignmentElement.querySelector(".comment-assignment");
                if (commentIcon) commentIcon.style.color = "#555";
            }
            saveData();
            if (document.getElementById("studentView").classList.contains("active")) populateStudentView();
        }
        hideModal(commentModal);
    });

    const calculateBtn = document.getElementById("calculateBtn");
    if (calculateBtn) calculateBtn.addEventListener("click", () => calculateAll());
    if (refreshStudentGradeBtn) refreshStudentGradeBtn.addEventListener("click", () => { calculateAll(); populateStudentView(); });

    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) addCategoryBtn.addEventListener('click', () => showModal(categoryModal, 'create', null));

    const resetEverythingBtn = document.getElementById('resetEverythingBtn');
    if (resetEverythingBtn) {
        resetEverythingBtn.addEventListener('click', () => {
            const resetModal = document.getElementById('resetConfirmModal');
            resetModal.style.display = 'block';
        });
    }

    const confirmResetBtn = document.getElementById('confirmResetBtn');
    if (confirmResetBtn) {
        confirmResetBtn.addEventListener('click', () => {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(STUDENT_EXPANSIONS_KEY);
            localStorage.removeItem(TEACHER_EXPANSIONS_KEY);
            location.reload();
        });
    }

    const cancelResetBtn = document.getElementById('cancelResetBtn');
    if (cancelResetBtn) {
        cancelResetBtn.addEventListener('click', () => {
            document.getElementById('resetConfirmModal').style.display = 'none';
        });
    }

    document.getElementById('resetConfirmModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('resetConfirmModal')) {
            document.getElementById('resetConfirmModal').style.display = 'none';
        }
    });

    const decimalButtons = Array.from(document.querySelectorAll('.decimal-btn') || []);
    decimalButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const dec = parseInt(this.dataset.decimals, 10);
            setDecimalPlaces(isNaN(dec) ? 2 : dec);
        });
    });

    setTimeout(() => {
        setDecimalPlaces(selectedDecimalPlaces);
    }, 0);

    if (commentText) commentText.addEventListener('input', updateCharCount);
}

function reformatAllDisplays() {
    calculateAll();
    if (document.getElementById("studentView").classList.contains("active")) populateStudentView();
}

/* Init */
window.onload = function() {
    loadData();
    setupModalControls();
    setInterval(saveData, 2000);

    if (classNameInput) {
        classNameInput.addEventListener("input", () => {
            saveData();
        });
    }

    tabLinks.forEach(link => {
        link.addEventListener("click", function() {
            const view = this.getAttribute("data-view");
            tabLinks.forEach(l => l.classList.remove("active"));
            viewContents.forEach(v => v.classList.remove("active"));
            this.classList.add('active');
            const viewEl = document.getElementById(view + "View");
            if (viewEl) viewEl.classList.add("active");
            if (view === 'student') {
                populateStudentView();
            }
        });
    });

    reformatAllDisplays();
};