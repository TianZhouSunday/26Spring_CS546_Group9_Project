/**
 * Helper functions for the Map View
 * Handles Popup HTML generation and Logic separation
 */

const MapHelpers = {
    /**
     * Generates HTML for the User Post Popup
     */
    generatePostPopupHtml: function (post, commentsHtml, ratingForm, commentForm, sensitiveWarning) {
        return `
            <div class="post-preview" style="max-width:300px;">
                <h3 style="margin:0 0 10px 0; font-size:16px;">${post.title}</h3>
                ${sensitiveWarning}
                <p style="margin:5px 0; font-size:13px;">${post.body || ''}</p>
                <p style="margin:5px 0; font-size:11px; color:#666;"><small>Date: ${new Date(post.date).toLocaleDateString()}</small></p>
                ${ratingForm}
                ${commentsHtml}
                ${commentForm}
                <a href="/posts/${post._id}" style="display:block; margin-top:10px; text-align:center; font-size:12px;">View Full Details</a>
            </div>
        `;
    },

    /**
     * Generates HTML for the NYC Incident Popup
     */
    generateNycPopupHtml: function (incident, ratingSection, createDiscussionForm, commentsHtml = '', commentForm = '') {
        return `
            <div class="incident-preview" style="max-width:300px;">
                <h3 style="color: #d32f2f; margin:0 0 10px 0; font-size:16px;">NYC Shooting Incident</h3>
                <p style="margin:3px 0; font-size:12px;"><strong>Date:</strong> ${incident.occur_date}</p>
                <p style="margin:3px 0; font-size:12px;"><strong>Time:</strong> ${incident.occur_time}</p>
                <p style="margin:3px 0; font-size:12px;"><strong>Boro:</strong> ${incident.boro}</p>
                <p style="margin:3px 0; font-size:12px;"><strong>Location:</strong> ${incident.location_desc || 'Street'}</p>
                <p style="margin:5px 0; font-size:10px; color:#666;"><small>Source: NYC Open Data</small></p>
                ${ratingSection ? ratingSection : ''}
                ${commentsHtml ?
                `<div style="margin-top:10px; padding-top:10px; border-top:1px solid #ccc;">
                        <p style="font-size:12px; margin:5px 0;"><strong>Community Discussion:</strong></p>
                        <a href="/posts/${incident._id}" style="font-size:11px; color:#2b82cb;">View Full Discussion</a>
                    </div>`
                : ''}
                ${commentsHtml}
                ${commentForm ? commentForm : (createDiscussionForm || '')}
            </div>
        `;
    },

    /**
     * Generates simple preview HTML for NYC Incident (Loading state)
     */
    generateIncidentPreviewHtml: function (incident) {
        return `
            <div class="incident-preview" style="max-width:300px;">
                <h3 style="color: #d32f2f; margin:0 0 10px 0; font-size:16px;">NYC Shooting Incident</h3>
                <p style="margin:3px 0; font-size:12px;"><strong>Date:</strong> ${incident.occur_date}</p>
                <p style="margin:3px 0; font-size:12px;"><strong>Time:</strong> ${incident.occur_time}</p>
                <p style="margin:3px 0; font-size:12px;"><strong>Boro:</strong> ${incident.boro}</p>
                <p style="margin:3px 0; font-size:12px;"><strong>Location:</strong> ${incident.location_desc || 'Street'}</p>
                <p style="margin:5px 0; font-size:10px; color:#666;"><small>Source: NYC Open Data</small></p>
                <p style="font-style:italic; color:#666; font-size:12px; margin-top:10px;">Loading discussion...</p>
            </div>
        `;
    },

    /**
     * Generates HTML for Comments List
     */
    generateCommentsHtml: function (comments, currentUserId, postId) {
        if (!comments || comments.length === 0) {
            return '<div style="margin-top:10px; border-top:1px solid #ccc; padding-top:10px;"><p style="font-style:italic; color:#666; font-size:12px;">No comments yet</p></div>';
        }

        let html = '<div style="margin-top:10px; border-top:1px solid #ccc; padding-top:10px;"><strong>Comments:</strong><ul style="margin:5px 0; padding-left:20px; max-height:100px; overflow-y:auto; font-size:12px;">';

        comments.forEach(comment => {
            const isOwner = comment.user === currentUserId;
            // Use global deleteMapComment function
            const deleteBtn = isOwner ? `<button onclick="deleteMapComment('${postId}', '${comment._id}', '${postId}')" style="margin-left:5px; padding:2px 5px; font-size:10px; background:#dc3545; color:white; border:none; cursor:pointer; border-radius:3px;">Delete</button>` : '';
            html += `<li style="margin-bottom:3px;" id="comment-${comment._id}">${comment.text} <small>(Score: ${comment.score})</small> ${deleteBtn}</li>`;
        });

        html += '</ul></div>';
        return html;
    },

    /**
     * Generates Rating Form HTML
     */
    generateRatingForm: function (postId, avgRating, ratingCount, type = 'community', incidentData = null) {
        const ratingCountText = ratingCount > 0 ? ` <span style="font-size:11px; color:#999;">(${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'})</span>` : '';
        const color = type === 'community' ? '#2b82cb' : '#cb2b3e';
        const bgColor = type === 'community' ? '#f8f9fa' : '#fff3cd';
        const borderColor = type === 'community' ? '#ddd' : '#ffc107';
        const textColor = type === 'community' ? '#333' : '#856404';

        // Rate buttons logic
        let buttonsHtml = '';
        if (type === 'community') {
            buttonsHtml = [1, 2, 3, 4, 5].map(r =>
                `<button type="button" onclick="window.ratePost('${postId}', ${r}, '${postId}')" style="flex:1; padding:6px; background:#fff; border:2px solid ${color}; color:${color}; cursor:pointer; font-size:12px; font-weight:bold; border-radius:3px; transition:all 0.2s;" onmouseover="this.style.background='${color}'; this.style.color='#fff';" onmouseout="this.style.background='#fff'; this.style.color='${color}';">${r}</button>`
            ).join('');
        } else if (type === 'nyc' && incidentData) {
            // For NYC incidents, we need to pass a lot of params to rateNYCIncident
            // incidentData = { id, lat, lng, date, boro, time, locationDesc }
            const params = `'${incidentData.id}', \${r}, ${incidentData.lat}, ${incidentData.lng}, '${incidentData.date}', '${incidentData.boro}', '${incidentData.time}', '${(incidentData.locationDesc || 'Street').replace(/'/g, "\\'")}'`;
            buttonsHtml = [1, 2, 3, 4, 5].map(r =>
                `<button type="button" onclick="rateNYCIncident(${params.replace('${r}', r)})" style="flex:1; padding:6px; background:#fff; border:2px solid ${color}; color:${color}; cursor:pointer; font-size:12px; font-weight:bold; border-radius:3px; transition:all 0.2s;" onmouseover="this.style.background='${color}'; this.style.color='#fff';" onmouseout="this.style.background='#fff'; this.style.color='${color}';">${r}</button>`
            ).join('');
        }

        return `
            <div style="margin-top:10px; padding:10px; background:${bgColor}; border:1px solid ${borderColor}; border-radius:5px;">
                <strong style="font-size:13px; color:${textColor};">Rate This Incident:</strong>
                <p style="margin:5px 0; font-size:12px; color:${type === 'community' ? '#666' : textColor};">Usefulness: <strong id="map-avg-rating-${postId}">${avgRating}</strong>/5.0${ratingCountText}</p>
                <div style="display:flex; gap:5px; margin-top:8px;">
                    ${buttonsHtml}
                </div>
            </div>
        `;
    },

    /**
     * Generates Comment Form HTML
     */
    generateCommentForm: function (postId, color = '#2b82cb') {
        return `
            <div style="margin-top:10px; border-top:2px solid #ccc; padding-top:10px;">
                <strong style="font-size:12px;">Add a Comment:</strong>
                <form id="comment-form-${postId}" style="margin-top:5px;">
                    <textarea name="text" rows="2" placeholder="Write your comment..." required style="width:100%; padding:5px; box-sizing:border-box; font-size:11px;"></textarea>
                    
                    <button type="submit" style="width:100%; margin-top:5px; padding:5px; background:${color}; color:white; border:none; cursor:pointer; font-size:11px;">Post Comment</button>
                </form>
            </div>
        `;
    },

    /**
     * Initialize Comment Form Listener
     */
    initCommentFormListener: function (postId, callback) {
        setTimeout(() => {
            const form = document.getElementById(`comment-form-${postId}`);
            if (form) {
                form.addEventListener('submit', function (e) {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const text = formData.get('text');

                    if (!text || text.trim().length === 0) {
                        alert('Please enter a comment');
                        return;
                    }

                    // Call the API
                    fetch(`/api/posts/${postId}/comments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ text: text.trim() })
                    })
                        .then(response => {
                            if (response.ok) {
                                return response.json().then(data => {
                                    if (callback) callback();
                                });
                            } else {
                                // Error handling
                                return response.json().then(data => {
                                    alert('Error: ' + (data.error || 'Failed to post comment.'));
                                }).catch(() => alert('Error: Failed to post comment.'));
                            }
                        })
                        .catch(err => {
                            alert('Error posting comment: ' + err.message);
                        });
                });
            }
        }, 100); // 100ms delay to ensure DOM is ready
    },

    /**
     * Generate Create Discussion Form HTML
     */
    generateCreateDiscussionForm: function (incidentId) {
        return `
            <div style="margin-top:10px; border-top:1px solid #ccc; padding-top:10px;">
                <p style="font-size:12px; margin:5px 0;"><strong>Start Discussion:</strong></p>
                <form id="create-discussion-${incidentId}" style="margin-top:5px;">
                    <textarea name="comment" rows="2" placeholder="Add your comment or context..." required style="width:100%; padding:5px; box-sizing:border-box; font-size:11px;"></textarea>
                    
                    <button type="submit" style="width:100%; margin-top:5px; padding:5px; background:#cb2b3e; color:white; border:none; cursor:pointer; font-size:11px;">Create Discussion & Comment</button>
                </form>
            </div>
        `;
    },

    /**
     * Initialize Create Discussion Form Listener
     */
    initCreateDiscussionFormListener: function (incidentId, incidentData, successCallback) {
        setTimeout(() => {
            const form = document.getElementById(`create-discussion-${incidentId}`);
            if (form) {
                form.addEventListener('submit', function (e) {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const comment = formData.get('comment');

                    if (!comment || comment.trim().length === 0) {
                        alert('Please enter a comment');
                        return;
                    }

                    const title = `NYC Shooting Incident - ${incidentData.date} - ${incidentData.boro}`;
                    const body = `Official NYC Shooting Incident\n\nDate: ${incidentData.date}\nTime: ${incidentData.time}\nBorough: ${incidentData.boro}\nLocation: ${incidentData.locationDesc || 'Street'}\n\nCommunity Comment: ${comment.trim()}`;

                    // Create Post
                    fetch('/api/posts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            title: title,
                            body: body,
                            location: { latitude: incidentData.lat, longitude: incidentData.lng },
                            photo: null,
                            sensitive: false
                        })
                    })
                        .then(response => {
                            if (!response.ok) throw new Error('Failed to create discussion');
                            return response.json();
                        })
                        .then(post => {
                            // Create Comment
                            return fetch(`/api/posts/${post._id}/comments`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ text: comment.trim() })
                            });
                        })
                        .then(response => {
                            if (response.ok) {
                                if (successCallback) successCallback();
                            } else {
                                throw new Error('Failed to post comment');
                            }
                        })
                        .catch(err => {
                            alert('Error: ' + err.message);
                        });
                });
            }
        }, 100);
    },

    /**
     * Generate Main Report Form HTML
     */
    generateReportFormHtml: function (lat, lng) {
        return `
            <div class="popup-form">
                <h3>Report Incident Here</h3>
                <form action="/posts" method="POST" enctype="multipart/form-data">
                    <input type="hidden" name="latitude" value="${lat}">
                    <input type="hidden" name="longitude" value="${lng}">
                    
                    <label>Title:</label>
                    <input type="text" name="title" required placeholder="Short title...">
                    
                    <label>Borough:</label>
                    <select name="borough" required style="width: 100%; margin-bottom: 8px; padding: 5px;">
                        <option value="Manhattan">Manhattan</option>
                        <option value="Brooklyn">Brooklyn</option>
                        <option value="Queens">Queens</option>
                        <option value="The Bronx">The Bronx</option>
                        <option value="Staten Island">Staten Island</option>
                    </select>
                    
                    <label>Description:</label>
                    <textarea name="body" rows="3" placeholder="What happened?"></textarea>
                    
                    <label>Photo (Optional):</label>
                    <input type="file" name="photo" accept="image/*">
                    
                    <label>
                        <input type="checkbox" name="sensitive"> 
                        Contains Sensitive Content?
                    </label>
                    
                    <label>
                        <input type="checkbox" name="anonymous">
                        Post Anonymously
                    </label>

                    <button type="submit" class="button-primary" style="width:100%; margin-top:5px;">Create Post</button>
                </form>
            </div>
        `;
    },

    /**
     * Generate Legend HTML
     */
    generateLegendHtml: function () {
        return `
            <strong>Legend</strong><br>
            <i style="background: #2b82cb"></i> Community Posts<br>
            <i style="background: #cb2b3e"></i> NYC Shooting Data<br>
            <br>
            <strong>Heatmap Intensity</strong>
            <div class="heatmap-gradient"></div>
            <div class="gradient-labels">
                <span>Low</span>
                <span>High</span>
            </div>
        `;
    }
};
