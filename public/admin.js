document.addEventListener('DOMContentLoaded', () => {
    // -----------------------------------------
    // Login Logic (admin-login.html)
    // -----------------------------------------
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMsg = document.getElementById('login-error');

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                if (data.success) {
                    // Save token and redirect
                    localStorage.setItem('adminToken', data.token);
                    window.location.href = 'admin.html';
                } else {
                    errorMsg.style.display = 'block';
                }
            } catch (err) {
                errorMsg.textContent = 'Server error. Please try again.';
                errorMsg.style.display = 'block';
            }
        });
    }

    // -----------------------------------------
    // Dashboard Logic (admin.html)
    // -----------------------------------------
    const submissionsBody = document.getElementById('submissions-table-body');
    if (submissionsBody) {
        // Protect route
        if (!localStorage.getItem('adminToken')) {
            window.location.href = 'admin-login.html';
            return;
        }

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('adminToken');
            window.location.href = 'admin-login.html';
        });

        // Modal Logic
        const modal = document.getElementById('report-modal');
        document.getElementById('close-modal').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        // Fetch and display submissions
        window.fetchSubmissions = async function() {
            document.getElementById('loading-state').classList.remove('hidden');
            document.getElementById('empty-state').classList.add('hidden');
            submissionsBody.innerHTML = '';

            try {
                const response = await fetch('/api/submissions');
                const data = await response.json();
                
                document.getElementById('loading-state').classList.add('hidden');

                updateStats(data.submissions);

                if (data.submissions.length === 0) {
                    document.getElementById('empty-state').classList.remove('hidden');
                    return;
                }

                data.submissions.forEach(sub => {
                    const row = document.createElement('tr');
                    
                    const date = new Date(sub.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                    
                    let badgeClass = 'safe';
                    if (sub.score > 15) badgeClass = 'warning';
                    if (sub.score > 30) badgeClass = 'danger';

                    const fileLinkHTML = sub.fileUrl 
                        ? `<a href="${sub.fileUrl}" target="_blank" style="color: var(--text-primary); text-decoration: none; border-bottom: 1px dashed var(--text-secondary); transition: color 0.3s ease;" onmouseover="this.style.color='var(--primary-color)'" onmouseout="this.style.color='var(--text-primary)'">${sub.fileName}</a>`
                        : `<span style="color: var(--text-secondary); cursor: not-allowed;" title="File was not saved to disk (Older submission)">${sub.fileName} (Not Saved)</span>`;

                    row.innerHTML = `
                        <td style="font-weight: 500;">
                            <span style="display: block; color: var(--primary-color); font-weight: 700; font-size: 1.1em; margin-bottom: 4px; letter-spacing: 0.5px;">${sub.studentId || 'N/A'}</span>
                            <i data-lucide="file-text" style="width: 16px; margin-right: 8px; vertical-align: middle;"></i>
                            ${fileLinkHTML}
                        </td>
                        <td style="color: var(--text-secondary);">${date}</td>
                        <td style="color: var(--text-secondary); font-size: 0.9em;">${sub.topMatch || 'None'}</td>
                        <td><span class="score-badge ${badgeClass}">${sub.score}%</span></td>
                        <td>
                            <button class="btn-text view-btn" data-id="${sub.id}">View Report</button>
                            <a href="mailto:${sub.studentEmail}?subject=Regarding your PlagScan Submission (${sub.fileName})" class="btn-icon" title="Email Student" style="color: var(--primary-color); margin-left: 0.5rem; text-decoration: none;"><i data-lucide="mail"></i></a>
                            <button class="btn-icon delete-btn" data-id="${sub.id}" title="Delete Submission" style="color: var(--danger-color); margin-left: 0.5rem;"><i data-lucide="trash-2"></i></button>
                        </td>
                    `;
                    submissionsBody.appendChild(row);
                });

                // Attach view events
                document.querySelectorAll('.view-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.getAttribute('data-id') || e.target.closest('.view-btn').getAttribute('data-id');
                        const submission = data.submissions.find(s => s.id === id);
                        openModal(submission);
                    });
                });

                // Attach delete events
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const id = e.target.getAttribute('data-id') || e.target.closest('.delete-btn').getAttribute('data-id');
                        if (confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
                            try {
                                const delResponse = await fetch('/api/submissions/' + id, { method: 'DELETE' });
                                const delData = await delResponse.json();
                                if (delData.success) {
                                    fetchSubmissions(); // Refresh table
                                } else {
                                    alert('Failed to delete: ' + delData.error);
                                }
                            } catch (err) {
                                console.error('Delete error:', err);
                                alert('Error deleting submission.');
                            }
                        }
                    });
                });

                // Re-initialize icons for new DOM elements
                if (typeof lucide !== 'undefined') lucide.createIcons();

            } catch (err) {
                console.error('Failed to fetch submissions:', err);
                document.getElementById('loading-state').textContent = 'Error loading data.';
            }
        };

        // Initial fetch
        fetchSubmissions();
    }

    function updateStats(submissions) {
        document.getElementById('total-submissions').textContent = submissions.length;
        
        const totalScore = submissions.reduce((sum, sub) => sum + sub.score, 0);
        const avg = submissions.length > 0 ? Math.round(totalScore / submissions.length) : 0;
        document.getElementById('avg-score').textContent = `${avg}%`;

        const flagged = submissions.filter(sub => sub.score > 30).length;
        document.getElementById('flagged-count').textContent = flagged;
    }

    function openModal(sub) {
        const modal = document.getElementById('report-modal');
        const scoreCircle = document.getElementById('modal-score-circle');
        
        document.getElementById('modal-score-text').textContent = `${sub.score}%`;
        document.getElementById('modal-match-text').textContent = sub.topMatch ? `Closest Match: ${sub.topMatch}` : 'No significant matches.';
        document.getElementById('modal-internet').textContent = `${sub.breakdown.internet}%`;
        document.getElementById('modal-publications').textContent = `${sub.breakdown.publications}%`;
        document.getElementById('modal-students').textContent = `${sub.breakdown.students}%`;

        // Update circle
        scoreCircle.setAttribute('stroke-dasharray', `${sub.score}, 100`);
        scoreCircle.classList.remove('safe', 'warning', 'danger');
        if (sub.score <= 15) scoreCircle.classList.add('safe');
        else if (sub.score <= 30) scoreCircle.classList.add('warning');
        else scoreCircle.classList.add('danger');

        modal.classList.remove('hidden');
    }
});
