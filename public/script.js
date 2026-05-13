document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadSection = document.getElementById('upload-section');
    const uploadProgress = document.getElementById('upload-progress');
    const fileNameDisplay = document.getElementById('file-name');
    const progressBar = document.getElementById('progressBar'); // Will animate width
    const statusText = document.getElementById('status-text');
    const resultsSection = document.getElementById('results-section');
    const scoreCircle = document.getElementById('score-circle');
    const scoreText = document.getElementById('score-text');
    const submitAnotherBtn = document.getElementById('submit-another-btn');
    const submitAssignmentBtn = document.getElementById('submit-assignment-btn');
    const selectedFileDisplay = document.getElementById('selected-file-display');
    let selectedFile = null;

    if (submitAssignmentBtn) {
        submitAssignmentBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const studentIdInput = document.getElementById('student-id');
            const studentEmailInput = document.getElementById('student-email');
            const studentId = studentIdInput.value.trim();
            const studentEmail = studentEmailInput.value.trim();
            
            if (!studentId || !studentEmail) {
                alert("Please enter both your Student ID and Email before uploading.");
                return;
            }

            if (selectedFile) {
                fileNameDisplay.textContent = selectedFile.name;
                uploadAndScanFile(selectedFile, studentId, studentEmail);
            } else {
                alert("Please select a file first.");
            }
        });
    }

    // Drag and drop event listeners
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            
            // Validate file type
            const validTypes = [
                'application/pdf',
                'text/plain',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];
            if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|txt|doc|docx)$/i)) {
                alert("Please upload a .pdf, .txt, .doc or .docx file.");
                return;
            }
            
            selectedFile = file;
            if (selectedFileDisplay && submitAssignmentBtn) {
                selectedFileDisplay.textContent = 'Selected File: ' + file.name;
                selectedFileDisplay.classList.remove('hidden');
                submitAssignmentBtn.classList.remove('hidden');
            }
        }
    }

    async function uploadAndScanFile(file, studentId, studentEmail) {
        // Hide drop zone, show progress
        dropZone.classList.add('hidden');
        uploadProgress.classList.remove('hidden');
        
        const bar = document.getElementById('progress-bar');
        bar.style.width = '30%';
        statusText.textContent = 'Uploading...';

        const formData = new FormData();
        formData.append('file', file);
        formData.append('studentId', studentId);
        formData.append('studentEmail', studentEmail);

        try {
            bar.style.width = '60%';
            statusText.textContent = 'Scanning for plagiarism...';

            const response = await fetch('/api/scan', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server error');
            }

            const data = await response.json();
            
            bar.style.width = '100%';
            statusText.textContent = 'Scan Complete!';
            
            setTimeout(() => {
                showResults(data);
            }, 500);

        } catch (error) {
            console.error('Upload Error:', error);
            statusText.textContent = 'Error: ' + error.message;
            bar.style.backgroundColor = 'var(--danger-color)';
        }
    }

    function showResults(data) {
        uploadSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        
        const totalScore = data.score;
        const { internet, publications, students } = data.breakdown;

        // Animate score text and circle
        animateValue(scoreText, 0, totalScore, 1500);
        
        document.getElementById('internet-score').textContent = `${internet}%`;
        document.getElementById('publication-score').textContent = `${publications}%`;
        document.getElementById('student-score').textContent = `${students}%`;

        // Display the top match source if similarity is found
        const resultsHeader = document.querySelector('.results-header h2');
        if (totalScore > 0 && data.topMatch) {
            resultsHeader.innerHTML = `Originality Report <span style="font-size: 0.5em; display: block; color: var(--text-secondary); margin-top: 5px;">Closest Match: ${data.topMatch}</span>`;
        } else {
            resultsHeader.innerHTML = `Originality Report <span style="font-size: 0.5em; display: block; color: var(--success-color); margin-top: 5px;">No significant matches found.</span>`;
        }

        // Update circle color and stroke dasharray
        setTimeout(() => {
            scoreCircle.setAttribute('stroke-dasharray', `${totalScore}, 100`);
            
            scoreCircle.classList.remove('safe', 'warning', 'danger');
            if (totalScore <= 15) {
                scoreCircle.classList.add('safe');
            } else if (totalScore <= 30) {
                scoreCircle.classList.add('warning');
            } else {
                scoreCircle.classList.add('danger');
            }
        }, 100);

        // Enable download button (server returns `id` and `fileUrl`)
        const downloadBtn = document.getElementById('download-file-btn');
        if (downloadBtn) {
            if (data && data.id) {
                downloadBtn.classList.remove('hidden');
                downloadBtn.onclick = () => {
                    window.open(`/api/submissions/${data.id}/download`, '_blank');
                };
            } else {
                downloadBtn.classList.add('hidden');
                downloadBtn.onclick = null;
            }
        }
    }

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start) + '%';
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    submitAnotherBtn.addEventListener('click', () => {
        // Reset UI
        resultsSection.classList.add('hidden');
        uploadProgress.classList.add('hidden');
        dropZone.classList.remove('hidden');
        uploadSection.classList.remove('hidden');
        
        document.getElementById('progress-bar').style.width = '0%';
        document.getElementById('progress-bar').style.backgroundColor = ''; // Reset error color if any
        scoreCircle.setAttribute('stroke-dasharray', `0, 100`);
        fileInput.value = '';
        document.getElementById('student-id').value = ''; // Reset student ID
        document.getElementById('student-email').value = ''; // Reset student email
        
        selectedFile = null;
        if (selectedFileDisplay && submitAssignmentBtn) {
            selectedFileDisplay.textContent = '';
            selectedFileDisplay.classList.add('hidden');
            submitAssignmentBtn.classList.add('hidden');
        }
        
        const resultsHeader = document.querySelector('.results-header h2');
        resultsHeader.innerHTML = 'Originality Report';
    });

        // Mobile nav toggle: open/close collapsed nav-links
        const menuToggles = document.querySelectorAll('.menu-toggle');
        menuToggles.forEach(btn => {
            btn.addEventListener('click', () => {
                const nav = btn.closest('.navbar');
                if (!nav) return;
                const links = nav.querySelector('.nav-links');
                if (!links) return;
                links.classList.toggle('open');
                // re-run icon rendering for any changed icons (lucide)
                try { lucide.createIcons(); } catch (e) { /* ignore */ }
            });
        });

        // Close mobile menu when resizing to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                document.querySelectorAll('.nav-links.open').forEach(n => n.classList.remove('open'));
            }
        });
});
