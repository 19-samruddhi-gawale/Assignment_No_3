
const form = document.getElementById("resultForm");
const resultTable = document.getElementById("resultTable");
const searchInput = document.getElementById("searchInput");

const subjects = [
    "maths",
    "science",
    "english",
    "computer",
    "social"
];

// Load saved student records
let students = [];

try {
    const savedData = localStorage.getItem("studentResults");
    students = savedData ? JSON.parse(savedData) : [];

    if (!Array.isArray(students)) {
        students = [];
    }

    // Validate saved records before using them
    students = students.filter(student =>
        student &&
        typeof student.name === "string" &&
        typeof student.roll === "string" &&
        typeof student.department === "string" &&
        Array.isArray(student.marks) &&
        student.marks.length === 5 &&
        student.marks.every(mark =>
            Number.isInteger(mark) && mark >= 0 && mark <= 100
        )
    ).map(student => {
        const result = calculateResult(student.marks);

        return {
            ...student,
            total: result.total,
            percentage: result.percentage,
            passed: result.passed
        };
    });
} catch (error) {
    students = [];
}

// Save records in browser local storage
function saveStudents() {
    try {
        localStorage.setItem(
            "studentResults",
            JSON.stringify(students)
        );
    } catch (error) {
        alert("Unable to save records in browser storage.");
    }
}

// Calculate total, percentage and pass/fail result
function calculateResult(marks) {
    const total = marks.reduce(
        (sum, mark) => sum + mark,
        0
    );

    const percentage = (total / 500) * 100;

    // A student must score at least 35 in every subject
    const passed = marks.every(mark => mark >= 35);

    return {
        total,
        percentage,
        passed
    };
}

// Add a student result
form.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const roll = document.getElementById("roll").value.trim();
    const department =
        document.getElementById("department").value;

    const marks = subjects.map(subject => {
        const input = document.getElementById(subject);
        return input.value.trim() === "" ? NaN : Number(input.value);
    });

    if (!name || !roll || !department) {
        alert("Please fill in all student details.");
        return;
    }

    // Validate marks
    const validMarks = marks.every(mark =>
        Number.isInteger(mark) &&
        mark >= 0 &&
        mark <= 100
    );

    if (!validMarks) {
        alert("Enter whole-number marks between 0 and 100.");
        return;
    }

    // Check for duplicate roll numbers
    const duplicate = students.some(student =>
        student.roll.toLowerCase() === roll.toLowerCase()
    );

    if (duplicate) {
        alert("This roll number already exists!");
        return;
    }

    const result = calculateResult(marks);

    const student = {
        name,
        roll,
        department,
        marks,
        total: result.total,
        percentage: result.percentage,
        passed: result.passed
    };

    students.push(student);

    saveStudents();
    form.reset();
    renderStudents();

    alert("Student result added successfully!");
});

// Find the student with the highest percentage
function getTopper() {
    if (students.length === 0) {
        return null;
    }

    return students.reduce((topper, student) =>
        student.percentage > topper.percentage
            ? student
            : topper
    );
}

// Update dashboard statistics and topper card
function updateDashboard() {
    const count = students.length;

    const average = count > 0
        ? students.reduce(
            (sum, student) => sum + student.percentage,
            0
        ) / count
        : 0;

    const topper = getTopper();

    document.getElementById("studentCount").textContent = count;

    document.getElementById("classAverage").textContent =
        average.toFixed(2) + "%";

    document.getElementById("highestPercentage").textContent =
        topper ? topper.percentage.toFixed(2) + "%" : "0%";

    document.getElementById("topperName").textContent =
        topper ? topper.name : "No results yet";

    document.getElementById("topperDetails").textContent =
        topper
            ? `Roll No. ${topper.roll} | ${topper.department} | Total: ${topper.total}/500`
            : "Add student results to identify the topper.";

    document.getElementById("topperPercentage").textContent =
        topper ? topper.percentage.toFixed(2) + "%" : "--";
}

// Safely display text in the HTML table
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Display all student records and search results
function renderStudents() {
    updateDashboard();

    const query = searchInput.value.trim().toLowerCase();

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(query) ||
        student.roll.toLowerCase().includes(query) ||
        student.department.toLowerCase().includes(query)
    );

    const topper = getTopper();

    if (filteredStudents.length === 0) {
        resultTable.innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    ${students.length === 0
                        ? "No student records found. Add your first student above."
                        : "No matching student records found."}
                </td>
            </tr>
        `;
    } else {
        resultTable.innerHTML = filteredStudents.map(student => {
            const isTopper = topper &&
                student.roll.toLowerCase() ===
                topper.roll.toLowerCase();

            return `
                <tr>
                    <td>
                        <strong>${escapeHTML(student.roll)}</strong>
                    </td>

                    <td>
                        <div class="student-name">
                            ${escapeHTML(student.name)}
                            ${isTopper
                                ? '<span class="topper-badge">TOPPER</span>'
                                : ""}
                        </div>
                        <div class="roll-number">
                            Marks: ${student.marks.join(" / ")}
                        </div>
                    </td>

                    <td>${escapeHTML(student.department)}</td>

                    <td>
                        <strong>${student.total} / 500</strong>
                    </td>

                    <td>
                        <span class="percentage">
                            ${student.percentage.toFixed(2)}%
                        </span>
                    </td>

                    <td>
                        <span class="result-badge ${
                            student.passed ? "pass" : "fail"
                        }">
                            ${student.passed ? "PASS" : "FAIL"}
                        </span>
                    </td>

                    <td>
                        <button
                            class="delete-btn"
                            data-roll="${encodeURIComponent(student.roll)}"
                            type="button">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    document.getElementById("recordCount").textContent =
        `Showing ${filteredStudents.length} of ${students.length} records`;
}

// Search by name, roll number or department
searchInput.addEventListener("input", renderStudents);

// Delete an individual student record
resultTable.addEventListener("click", function (event) {
    const button = event.target.closest(".delete-btn");

    if (!button) {
        return;
    }

    const roll = decodeURIComponent(button.dataset.roll);

    if (confirm(`Delete the result for roll number ${roll}?`)) {
        students = students.filter(student =>
            student.roll.toLowerCase() !== roll.toLowerCase()
        );

        saveStudents();
        renderStudents();
    }
});

// Delete all student records
document.getElementById("clearAllBtn").addEventListener(
    "click",
    function () {
        if (students.length === 0) {
            alert("There are no records to clear.");
            return;
        }

        if (confirm(
            "Are you sure you want to delete all student records?"
        )) {
            students = [];
            saveStudents();
            renderStudents();
        }
    }
);

// Show saved records when the page opens
saveStudents();
renderStudents();
