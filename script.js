/**
 * ============================================
 * HOME DEFECT INSPECTION REPORT GENERATOR
 * JavaScript Controller
 * ============================================
 * 
 * This script handles:
 * 1. Defect management (add, remove, preview images)
 * 2. PDF generation using jsPDF library
 * 
 * PDF Generation Overview:
 * - We use the jsPDF library to create PDFs programmatically
 * - Images are converted to base64 and embedded in the PDF
 * - The PDF is structured with proper headers, sections, and page breaks
 * - Each defect gets its own section with image and description
 */

// ============================================
// GLOBAL STATE
// ============================================

// Array to store all defect entries
let defects = [];

// Counter for unique defect IDs
let defectCounter = 0;

// ============================================
// DOM ELEMENT REFERENCES
// ============================================

// Defect form elements
const defectTypeSelect = document.getElementById('defectType');
const customDefectInput = document.getElementById('customDefectInput');
const customDefectTypeInput = document.getElementById('customDefectType');
const defectImageInput = document.getElementById('defectImage');
const defectDescriptionInput = document.getElementById('defectDescription');
const imagePreview = document.getElementById('imagePreview');
const addDefectBtn = document.getElementById('addDefectBtn');
const defectsContainer = document.getElementById('defectsContainer');
const defectCountSpan = document.getElementById('defectCount');
const noDefectsMessage = document.getElementById('noDefectsMessage');

// PDF generation elements
const generatePdfBtn = document.getElementById('generatePdfBtn');
const generationStatus = document.getElementById('generationStatus');

// ============================================
// IMAGE PREVIEW FUNCTIONALITY
// ============================================

/**
 * Handles image file selection and displays preview
 */
defectImageInput.addEventListener('change', function (e) {
    const file = e.target.files[0];

    if (file) {
        // Validate file type
        if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
            alert('Please select a JPEG or PNG image file.');
            this.value = '';
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = function (e) {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Defect image preview">`;
        };
        reader.readAsDataURL(file);
    } else {
        // Reset preview
        imagePreview.innerHTML = '<span class="preview-placeholder">Image preview will appear here</span>';
    }
});

// ============================================
// DEFECT TYPE SELECTION
// ============================================

/**
 * Handles defect type selection - shows/hides custom input for "Other"
 */
defectTypeSelect.addEventListener('change', function () {
    if (this.value === 'Other') {
        customDefectInput.style.display = 'block';
        customDefectTypeInput.focus();
    } else {
        customDefectInput.style.display = 'none';
        customDefectTypeInput.value = '';
    }
});

// ============================================
// DEFECT MANAGEMENT
// ============================================

/**
 * Adds a new defect to the list
 */
addDefectBtn.addEventListener('click', function () {
    const file = defectImageInput.files[0];
    const description = defectDescriptionInput.value.trim();
    const selectedType = defectTypeSelect.value;
    const customType = customDefectTypeInput.value.trim();

    // Determine defect type
    let defectType = '';
    if (selectedType === 'Other') {
        defectType = customType;
    } else {
        defectType = selectedType;
    }

    // Validation
    if (!defectType) {
        alert('Please select or enter a defect type.');
        return;
    }

    if (!file) {
        alert('Please select an image for the defect.');
        return;
    }

    if (!description) {
        alert('Please enter a description for the defect.');
        return;
    }

    // Read the image as base64
    const reader = new FileReader();
    reader.onload = function (e) {
        // Create defect object
        const defect = {
            id: ++defectCounter,
            defectType: defectType,
            imageData: e.target.result,
            imageName: file.name,
            description: description
        };

        // Add to array
        defects.push(defect);

        // Update UI
        renderDefects();

        // Clear form
        defectTypeSelect.value = '';
        customDefectInput.style.display = 'none';
        customDefectTypeInput.value = '';
        defectImageInput.value = '';
        defectDescriptionInput.value = '';
        imagePreview.innerHTML = '<span class="preview-placeholder">Image preview will appear here</span>';
    };
    reader.readAsDataURL(file);
});

/**
 * Removes a defect from the list
 * @param {number} id - The defect ID to remove
 */
function removeDefect(id) {
    if (confirm('Are you sure you want to remove this defect?')) {
        defects = defects.filter(d => d.id !== id);
        renderDefects();
    }
}

/**
 * Renders all defects in the UI
 */
function renderDefects() {
    // Update count
    defectCountSpan.textContent = `(${defects.length})`;

    // Show/hide no defects message
    if (defects.length === 0) {
        noDefectsMessage.style.display = 'block';
        defectsContainer.innerHTML = '';
        defectsContainer.appendChild(noDefectsMessage);
        return;
    }

    noDefectsMessage.style.display = 'none';

    // Build HTML for all defects
    let html = '';
    defects.forEach((defect, index) => {
        html += `
            <div class="defect-card" data-id="${defect.id}">
                <img src="${defect.imageData}" alt="Defect ${index + 1}" class="defect-card-image">
                <div class="defect-card-content">
                    <div class="defect-card-number">Defect #${index + 1}</div>
                    <div class="defect-card-type"><strong>Type:</strong> ${escapeHtml(defect.defectType)}</div>
                    <p class="defect-card-description">${escapeHtml(defect.description)}</p>
                </div>
                <div class="defect-card-actions">
                    <button class="btn btn-danger" onclick="removeDefect(${defect.id})">Remove</button>
                </div>
            </div>
        `;
    });

    defectsContainer.innerHTML = html;
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// PDF GENERATION
// ============================================

/**
 * Updates the generation status display
 * @param {string} message - Status message
 * @param {string} type - Status type (loading, success, error)
 */
function updateStatus(message, type) {
    generationStatus.textContent = message;
    generationStatus.className = 'generation-status show ' + type;
}

/**
 * Hides the generation status
 */
function hideStatus() {
    generationStatus.className = 'generation-status';
}

/**
 * Gets the value of a form field by ID
 * @param {string} id - Element ID
 * @returns {string} Field value
 */
function getFieldValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
}

/**
 * Generates the PDF report
 * 
 * How PDF Generation Works:
 * 1. We use jsPDF library which creates PDF documents in JavaScript
 * 2. We manually position text and images using x,y coordinates
 * 3. Images are embedded as base64 data URLs
 * 4. We track the Y position and add new pages when needed
 * 5. The PDF is then downloaded to the user's computer
 */
generatePdfBtn.addEventListener('click', async function () {
    try {
        updateStatus('Generating PDF report...', 'loading');

        // Get jsPDF from the global scope (loaded via CDN)
        const { jsPDF } = window.jspdf;

        // Create new PDF document (A4 size, portrait orientation)
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // PDF dimensions
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);

        // Current Y position tracker
        let yPos = margin;

        // ----------------------------------------
        // HELPER FUNCTIONS
        // ----------------------------------------

        /**
         * Checks if we need a new page and adds one if necessary
         * @param {number} requiredSpace - Space needed in mm
         */
        function checkNewPage(requiredSpace) {
            if (yPos + requiredSpace > pageHeight - margin) {
                doc.addPage();
                yPos = margin;
                return true;
            }
            return false;
        }

        /**
         * Adds a horizontal line
         */
        function addLine() {
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 5;
        }

        /**
         * Adds wrapped text and returns the new Y position
         * @param {string} text - Text to add
         * @param {number} fontSize - Font size
         * @param {boolean} isBold - Whether text is bold
         */
        function addText(text, fontSize = 10, isBold = false) {
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', isBold ? 'bold' : 'normal');

            const lines = doc.splitTextToSize(text, contentWidth);
            const lineHeight = fontSize * 0.5;

            lines.forEach(line => {
                checkNewPage(lineHeight + 2);
                doc.text(line, margin, yPos);
                yPos += lineHeight;
            });

            yPos += 2;
        }

        /**
         * Adds a section header
         * @param {string} title - Header title
         */
        function addSectionHeader(title) {
            checkNewPage(20);
            yPos += 5;
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, yPos - 5, contentWidth, 10, 'F');
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text(title, margin + 3, yPos + 2);
            yPos += 12;
            doc.setTextColor(0, 0, 0);
        }

        // ----------------------------------------
        // DOCUMENT HEADER
        // ----------------------------------------

        const companyName = getFieldValue('companyName') || 'Inspection Company';
        const companyPhone = getFieldValue('companyPhone');
        const companyEmail = getFieldValue('companyEmail');
        const reportTitle = getFieldValue('reportTitle') || 'Home Defect Inspection Report';

        // Company name (large, centered)
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(companyName, pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        // Contact info (centered)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        let contactInfo = [];
        if (companyPhone) contactInfo.push(companyPhone);
        if (companyEmail) contactInfo.push(companyEmail);
        if (contactInfo.length > 0) {
            doc.text(contactInfo.join(' | '), pageWidth / 2, yPos, { align: 'center' });
            yPos += 8;
        }

        // Report title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(reportTitle, pageWidth / 2, yPos + 5, { align: 'center' });
        yPos += 15;

        addLine();

        // ----------------------------------------
        // CLIENT & PROPERTY DETAILS
        // ----------------------------------------

        addSectionHeader('Property & Client Details');

        const clientName = getFieldValue('clientName');
        const clientAddress = getFieldValue('clientAddress');
        const inspectionDate = getFieldValue('inspectionDate');
        const inspectorName = getFieldValue('inspectorName');
        const inspectorCredentials = getFieldValue('inspectorCredentials');

        doc.setFontSize(10);

        if (clientName) {
            doc.setFont('helvetica', 'bold');
            doc.text('Client Name:', margin, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(clientName, margin + 35, yPos);
            yPos += 6;
        }

        if (clientAddress) {
            doc.setFont('helvetica', 'bold');
            doc.text('Property Address:', margin, yPos);
            doc.setFont('helvetica', 'normal');
            const addressLines = doc.splitTextToSize(clientAddress, contentWidth - 40);
            doc.text(addressLines, margin + 35, yPos);
            yPos += addressLines.length * 5 + 2;
        }

        if (inspectionDate) {
            doc.setFont('helvetica', 'bold');
            doc.text('Inspection Date:', margin, yPos);
            doc.setFont('helvetica', 'normal');
            // Format date nicely
            const dateObj = new Date(inspectionDate);
            const formattedDate = dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            doc.text(formattedDate, margin + 35, yPos);
            yPos += 6;
        }

        if (inspectorName) {
            doc.setFont('helvetica', 'bold');
            doc.text('Inspector:', margin, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(inspectorName, margin + 35, yPos);
            yPos += 6;
        }

        if (inspectorCredentials) {
            doc.setFont('helvetica', 'bold');
            doc.text('Credentials:', margin, yPos);
            doc.setFont('helvetica', 'normal');
            const credLines = doc.splitTextToSize(inspectorCredentials, contentWidth - 40);
            doc.text(credLines, margin + 35, yPos);
            yPos += credLines.length * 5 + 2;
        }

        yPos += 5;

        // ----------------------------------------
        // INSPECTION DETAILS TABLE
        // ----------------------------------------

        addSectionHeader('Inspection Details');

        const attendance = getFieldValue('attendance');
        const occupancy = getFieldValue('occupancy');
        const buildingType = getFieldValue('buildingType');
        const weatherCondition = getFieldValue('weatherCondition');

        // Create a simple table
        const tableData = [
            ['Attendance', attendance || 'N/A'],
            ['Occupancy', occupancy || 'N/A'],
            ['Type of Building', buildingType || 'N/A'],
            ['Weather Condition', weatherCondition || 'N/A']
        ];

        doc.setFontSize(10);
        const colWidth = contentWidth / 2;

        tableData.forEach((row, index) => {
            checkNewPage(8);

            // Alternate row background
            if (index % 2 === 0) {
                doc.setFillColor(248, 248, 248);
                doc.rect(margin, yPos - 4, contentWidth, 8, 'F');
            }

            doc.setFont('helvetica', 'bold');
            doc.text(row[0], margin + 2, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(row[1], margin + colWidth, yPos);
            yPos += 8;
        });

        yPos += 5;

        // ----------------------------------------
        // DISCLAIMER SECTION
        // ----------------------------------------

        addSectionHeader('General Disclaimer');

        const disclaimer = getFieldValue('disclaimer');
        if (disclaimer) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(80, 80, 80);

            const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth);
            disclaimerLines.forEach(line => {
                checkNewPage(5);
                doc.text(line, margin, yPos);
                yPos += 4.5;
            });

            doc.setTextColor(0, 0, 0);
        }

        yPos += 5;

        // ----------------------------------------
        // DEFECTS SECTION
        // ----------------------------------------

        if (defects.length > 0) {
            // Start defects on a new page for cleaner layout
            doc.addPage();
            yPos = margin;

            addSectionHeader(`Identified Defects (${defects.length} Total)`);

            // Process each defect
            for (let i = 0; i < defects.length; i++) {
                const defect = defects[i];

                // Check if we need a new page (need space for image + description)
                checkNewPage(100);

                // Defect header with type
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(44, 82, 130);
                doc.text(`Defect #${i + 1}: ${defect.defectType}`, margin, yPos);
                doc.setTextColor(0, 0, 0);
                yPos += 8;

                // Add image
                try {
                    // Calculate image dimensions (max width: contentWidth, max height: 80mm)
                    const maxImgWidth = contentWidth;
                    const maxImgHeight = 80;

                    // Get original image dimensions
                    const img = new Image();
                    img.src = defect.imageData;

                    // Wait for image to load to get dimensions
                    await new Promise((resolve) => {
                        img.onload = resolve;
                        img.onerror = resolve;
                    });

                    let imgWidth = img.width;
                    let imgHeight = img.height;

                    // Scale image to fit
                    const ratio = Math.min(maxImgWidth / imgWidth, maxImgHeight / imgHeight);
                    imgWidth = imgWidth * ratio;
                    imgHeight = imgHeight * ratio;

                    // Check if image fits on current page
                    if (yPos + imgHeight + 20 > pageHeight - margin) {
                        doc.addPage();
                        yPos = margin;

                        // Re-add defect header on new page
                        doc.setFontSize(11);
                        doc.setFont('helvetica', 'bold');
                        doc.setTextColor(44, 82, 130);
                        doc.text(`Defect #${i + 1}: ${defect.defectType} (continued)`, margin, yPos);
                        doc.setTextColor(0, 0, 0);
                        yPos += 8;
                    }

                    // Add image to PDF
                    doc.addImage(defect.imageData, 'JPEG', margin, yPos, imgWidth, imgHeight);
                    yPos += imgHeight + 5;

                } catch (imgError) {
                    console.error('Error adding image:', imgError);
                    doc.setFontSize(10);
                    doc.setTextColor(150, 0, 0);
                    doc.text('[Image could not be loaded]', margin, yPos);
                    doc.setTextColor(0, 0, 0);
                    yPos += 8;
                }

                // Add description
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');

                const descLines = doc.splitTextToSize(defect.description, contentWidth);
                descLines.forEach(line => {
                    checkNewPage(6);
                    doc.text(line, margin, yPos);
                    yPos += 5;
                });

                yPos += 10;

                // Add separator between defects (except for the last one)
                if (i < defects.length - 1) {
                    checkNewPage(15);
                    doc.setDrawColor(220, 220, 220);
                    doc.setLineWidth(0.3);
                    doc.line(margin, yPos, pageWidth - margin, yPos);
                    yPos += 10;
                }
            }
        }

        // ----------------------------------------
        // FOOTER ON ALL PAGES
        // ----------------------------------------

        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(150, 150, 150);

            // Page number
            doc.text(
                `Page ${i} of ${totalPages}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );

            // Report generation timestamp
            const timestamp = new Date().toLocaleString();
            doc.text(
                `Report generated: ${timestamp}`,
                pageWidth / 2,
                pageHeight - 6,
                { align: 'center' }
            );
        }

        // ----------------------------------------
        // SAVE THE PDF
        // ----------------------------------------

        // Generate filename with date
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const filename = `Inspection_Report_${dateStr}.pdf`;

        // Download the PDF
        doc.save(filename);

        updateStatus(`PDF report generated successfully! File: ${filename}`, 'success');

        // Hide status after 5 seconds
        setTimeout(hideStatus, 5000);

    } catch (error) {
        console.error('PDF Generation Error:', error);
        updateStatus('Error generating PDF: ' + error.message, 'error');
    }
});

// ============================================
// INITIALIZATION
// ============================================

// Set default inspection date to today
document.addEventListener('DOMContentLoaded', function () {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('inspectionDate').value = today;
});
