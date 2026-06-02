/**
 * Interlink 2026 — Evaluation Form Backend
 * Deploys as a Google Apps Script Web App.
 *
 * Receives POST requests from the evaluation form,
 * validates fields, checks for duplicate submissions,
 * and appends evaluation data to the spreadsheet.
 *
 * NO email sending is performed.
 */

// ============================================================
// CONFIGURATION
// ============================================================

// Name of the sheet tab where evaluations will be stored.
const SHEET_NAME = "Evaluation";

// ============================================================


/**
 * Entry point: Handles POST requests from the evaluation form.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockError) {
    return createJsonResponse(false, "The server is currently busy. Please try again in a few seconds.");
  }

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    // Dynamic Sheet Initialization
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      sheet.appendRow([
        "Submission Date",
        "Email",
        "Full Name",
        "Registration (system and procedure, organization and orderliness, services of the committee.",
        "Objective of the activity were achieved.",
        "Relevance of the activity to college mission, Vision and Objectives.",
        "Time allotment of the activity.",
        "Methods and procedure of the activity (orderliness and sequencing of the activity).",
        "Venue (facilities, equipment, multimedia etc.).",
        "Effectiveness of the activity.",
        "General rating of the activity conducted.",
        "Comments / Recommendations"
      ]);
      const headerRange = sheet.getRange(1, 1, 1, 12);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f1f5f9");
      headerRange.setFontColor("#0f172a");
      sheet.setFrozenRows(1);
    }

    // Parse JSON payload from POST request
    const data = JSON.parse(e.postData.contents);

    // Backend validation
    const email = (data.email || "").trim().toLowerCase();
    const fullName = (data.fullName || "").trim();

    if (!email || !fullName) {
      return createJsonResponse(false, "Required fields are missing. Please fill in your name and email.");
    }

    // Validate all rating fields are present (1-5)
    const ratingFields = [
      'q1_registration', 'q2_objective', 'q3_relevance', 'q4_time',
      'q5_methods', 'q6_venue', 'q7_effectiveness', 'q8_general'
    ];

    for (let i = 0; i < ratingFields.length; i++) {
      const val = parseInt(data[ratingFields[i]], 10);
      if (isNaN(val) || val < 1 || val > 5) {
        return createJsonResponse(false, "All evaluation criteria must be rated between 1 and 5.");
      }
    }

    // Duplicate check — prevent the same email from submitting twice
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      const existingEmail = rows[i][1].toString().trim().toLowerCase();
      if (existingEmail === email) {
        return createJsonResponse(false, `The email address "${data.email}" has already submitted an evaluation.`);
      }
    }

    // Write row to sheet
    sheet.appendRow([
      new Date(),
      data.email || "",
      data.fullName || "",
      data.q1_registration || "",
      data.q2_objective || "",
      data.q3_relevance || "",
      data.q4_time || "",
      data.q5_methods || "",
      data.q6_venue || "",
      data.q7_effectiveness || "",
      data.q8_general || "",
      data.commentRecommendation || ""
    ]);

    // Flush changes to disk before releasing the lock
    SpreadsheetApp.flush();

  } catch (error) {
    return createJsonResponse(false, "Server Error: " + error.toString());
  } finally {
    lock.releaseLock();
  }

  return createJsonResponse(true, "Evaluation submitted successfully. Thank you for your feedback!");
}


/**
 * Helper function to generate JSON output.
 * Google Apps Script Web Apps automatically handle CORS headers.
 */
function createJsonResponse(success, message) {
  return ContentService
    .createTextOutput(
      JSON.stringify({
        success: success,
        message: message
      })
    )
    .setMimeType(ContentService.MimeType.JSON);
}
