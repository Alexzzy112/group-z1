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
        const studentIdInput = document.getElementById('student-id');
        const studentEmailInput = document.getElementById('student-email');
        const studentId = studentIdInput.value.trim();
        const studentEmail = studentEmailInput.value.trim();
        
        if (!studentId || !studentEmail) {
            alert("Please enter both your Student ID and Email before uploading.");
            return;
        }

        if (files.length > 0) {
            const file = files[0];
            
            // Validate file type
            const validTypes = ['application/pdf', 'text/plain'];
            if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
                alert("Please upload a .pdf or .txt file.");
                return;
            }
            
            fileNameDisplay.textContent = file.name;
            uploadAndScanFile(file, studentId, studentEmail);
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
        
        const resultsHeader = document.querySelector('.results-header h2');
        resultsHeader.innerHTML = 'Originality Report';
    });
});
