/*
=========================================================
 CLOUDTRANSCODE
 Serverless Video Transcoder Frontend
=========================================================

 AWS ARCHITECTURE:

 Browser
    |
    | Upload
    v
 Amazon S3
    |
    | ObjectCreated Event
    v
 AWS Lambda
    |
    | CreateJob()
    v
 MediaConvert
    |
    | Output
    v
 Amazon S3
    |
    | Job completed
    v
 Amazon SNS
    |
    v
 User Notification


 IMPORTANT:
 The functions below currently simulate the AWS workflow.

 When connecting your AWS backend, replace:
    uploadToAWS()
    startTranscoding()

 with API Gateway / Lambda calls or AWS SDK calls.

=========================================================
*/


// -------------------------------------------------------
// DOM ELEMENTS
// -------------------------------------------------------

const videoInput = document.getElementById("videoInput");
const browseBtn = document.getElementById("browseBtn");

const dropzone = document.getElementById("dropzone");

const selectedFile = document.getElementById("selectedFile");

const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");

const removeBtn = document.getElementById("removeBtn");

const transcodeBtn = document.getElementById("transcodeBtn");

const formatSelect = document.getElementById("formatSelect");

const jobsList = document.getElementById("jobsList");

const refreshBtn = document.getElementById("refreshBtn");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");


// -------------------------------------------------------
// APPLICATION STATE
// -------------------------------------------------------

let currentFile = null;

let jobs = [];


// -------------------------------------------------------
// OPEN FILE SELECTOR
// -------------------------------------------------------

browseBtn.addEventListener("click", function (event) {

    event.stopPropagation();

    videoInput.click();

});


// Clicking anywhere on dropzone opens file picker
dropzone.addEventListener("click", function () {

    videoInput.click();

});


// -------------------------------------------------------
// FILE SELECTED
// -------------------------------------------------------

videoInput.addEventListener("change", function () {

    if (videoInput.files.length > 0) {

        handleFile(videoInput.files[0]);

    }

});


// -------------------------------------------------------
// DRAG AND DROP
// -------------------------------------------------------

dropzone.addEventListener("dragover", function (event) {

    event.preventDefault();

    dropzone.classList.add("dragover");

});


dropzone.addEventListener("dragleave", function () {

    dropzone.classList.remove("dragover");

});


dropzone.addEventListener("drop", function (event) {

    event.preventDefault();

    dropzone.classList.remove("dragover");

    const file = event.dataTransfer.files[0];

    if (!file) {
        return;
    }

    handleFile(file);

});


// -------------------------------------------------------
// HANDLE FILE
// -------------------------------------------------------

function handleFile(file) {

    // Make sure the selected file is a video
    if (!file.type.startsWith("video/")) {

        showToast("Please select a video file.");

        return;

    }


    currentFile = file;


    // Display file information
    fileName.textContent = file.name;

    fileSize.textContent = formatFileSize(file.size);


    selectedFile.classList.remove("hidden");


    // Enable transcoding button
    transcodeBtn.disabled = false;


    showToast("Video selected successfully.");

}


// -------------------------------------------------------
// REMOVE FILE
// -------------------------------------------------------

removeBtn.addEventListener("click", function () {

    currentFile = null;

    videoInput.value = "";

    selectedFile.classList.add("hidden");

    transcodeBtn.disabled = true;

});


// -------------------------------------------------------
// FORMAT FILE SIZE
// -------------------------------------------------------

function formatFileSize(bytes) {

    if (bytes === 0) {
        return "0 Bytes";
    }

    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB",
        "TB"
    ];

    const index = Math.floor(
        Math.log(bytes) / Math.log(1024)
    );

    return (
        (bytes / Math.pow(1024, index)).toFixed(2)
        + " "
        + units[index]
    );

}


// -------------------------------------------------------
// GET SELECTED RESOLUTIONS
// -------------------------------------------------------

function getSelectedResolutions() {

    const checkboxes =
        document.querySelectorAll(
            ".check-option input:checked"
        );

    return Array.from(checkboxes)
        .map(checkbox => checkbox.value);

}


// -------------------------------------------------------
// START TRANSCODING
// -------------------------------------------------------

transcodeBtn.addEventListener(
    "click",
    async function () {

        if (!currentFile) {

            showToast("Please select a video first.");

            return;

        }


        const resolutions =
            getSelectedResolutions();


        if (resolutions.length === 0) {

            showToast(
                "Select at least one resolution."
            );

            return;

        }


        const format =
            formatSelect.value;


        // Create a local job ID
        const jobId =
            "JOB-" +
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();


        const job = {

            id: jobId,

            fileName: currentFile.name,

            status: "processing",

            outputs: resolutions.join(", "),

            format: format,

            time: new Date()
                .toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                })

        };


        jobs.unshift(job);

        renderJobs();


        showToast(
            "Uploading video to Amazon S3..."
        );


        /*
        =====================================================
        REAL AWS CONNECTION
        =====================================================

        In production, you could call your backend:

        const response = await fetch(
            "YOUR_API_GATEWAY_URL/upload",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    fileName:
                        currentFile.name,

                    fileType:
                        currentFile.type
                })
            }
        );

        Your Lambda function can return a
        pre-signed S3 upload URL.

        Then:

        await fetch(uploadUrl, {
            method: "PUT",
            body: currentFile
        });

        S3 ObjectCreated can trigger
        another Lambda function.

        That Lambda creates the
        MediaConvert job.

        =====================================================
        */


        try {

            await uploadToAWS(
                currentFile,
                job
            );


            job.status = "processing";

            renderJobs();


            showToast(
                "Video uploaded. Transcoding started."
            );


            /*
            In a real implementation, the frontend
            should NOT directly run MediaConvert
            using secret AWS credentials.

            Instead:

            S3
             ↓
            Lambda
             ↓
            MediaConvert

            The backend handles this securely.
            */


            simulateCompletion(job);


        } catch (error) {

            console.error(error);

            job.status = "failed";

            renderJobs();

            showToast(
                "Upload failed. Please try again."
            );

        }

    }
);


// -------------------------------------------------------
// AWS UPLOAD PLACEHOLDER
// -------------------------------------------------------

async function uploadToAWS(file, job) {

    /*
    =====================================================
    REPLACE THIS FUNCTION WITH REAL AWS UPLOAD
    =====================================================

    Recommended architecture:

    React
       |
       | POST /upload
       v
    API Gateway
       |
       v
    Lambda
       |
       | Generate pre-signed URL
       v
    React
       |
       | PUT video
       v
    S3

    Example:

    const response = await fetch(
        "YOUR_API_GATEWAY_URL/upload",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                fileName: file.name,
                contentType: file.type
            })
        }
    );

    const data = await response.json();

    await fetch(data.uploadUrl, {
        method: "PUT",
        headers: {
            "Content-Type": file.type
        },
        body: file
    });

    =====================================================
    */


    // Demo delay
    await new Promise(resolve => {

        setTimeout(resolve, 1500);

    });


    return {

        success: true,

        jobId: job.id

    };

}


// -------------------------------------------------------
// SIMULATE TRANSCODING
// -------------------------------------------------------

function simulateCompletion(job) {

    /*
    This is ONLY for frontend demonstration.

    In the real AWS system, the status should
    come from your backend.

    Example:

    MediaConvert
        ↓
    EventBridge
        ↓
    Lambda
        ↓
    DynamoDB / API
        ↓
    React frontend

    SNS can separately notify users.
    */


    setTimeout(function () {

        job.status = "completed";

        renderJobs();

        showToast(
            "Transcoding completed successfully."
        );

    }, 7000);

}


// -------------------------------------------------------
// RENDER JOBS
// -------------------------------------------------------

function renderJobs() {

    if (jobs.length === 0) {

        jobsList.innerHTML = `

            <div class="empty-jobs">

                <div class="empty-icon">
                    ◌
                </div>

                <h3>
                    No transcoding jobs yet
                </h3>

                <p>
                    Upload a video to create
                    your first job.
                </p>

            </div>

        `;

        return;

    }


    jobsList.innerHTML = jobs.map(job => {

        return `

            <div class="job-item">

                <div class="job-video">

                    <div class="job-video-icon">
                        ▶
                    </div>

                    <div>

                        <div class="job-name">
                            ${escapeHTML(job.fileName)}
                        </div>

                        <div class="job-id">
                            ${job.id}
                        </div>

                    </div>

                </div>


                <div>

                    <span
                        class="status ${job.status}"
                    >
                        ${capitalize(job.status)}
                    </span>

                </div>


                <div>
                    ${escapeHTML(job.outputs)}
                </div>


                <div>
                    ${job.time}
                </div>

            </div>

        `;

    }).join("");

}


// -------------------------------------------------------
// REFRESH JOBS
// -------------------------------------------------------

refreshBtn.addEventListener(
    "click",
    function () {

        /*
        =====================================================
        REAL AWS VERSION
        =====================================================

        Replace this with:

        fetch(
            "YOUR_API_GATEWAY_URL/jobs"
        )

        Your backend could query DynamoDB
        for transcoding job information.

        =====================================================
        */

        showToast("Jobs refreshed.");

        renderJobs();

    }
);


// -------------------------------------------------------
// TOAST MESSAGE
// -------------------------------------------------------

function showToast(message) {

    toastMessage.textContent = message;

    toast.classList.add("show");


    setTimeout(function () {

        toast.classList.remove("show");

    }, 3000);

}


// -------------------------------------------------------
// CAPITALIZE
// -------------------------------------------------------

function capitalize(text) {

    return text.charAt(0).toUpperCase()
        + text.slice(1);

}


// -------------------------------------------------------
// HTML ESCAPE
// -------------------------------------------------------

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


// -------------------------------------------------------
// INITIAL RENDER
// -------------------------------------------------------

renderJobs();
