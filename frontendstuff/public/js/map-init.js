
document.addEventListener('DOMContentLoaded', () => {
    // Initialize map centered on NYC
    // Bounds are a bit broader so that users can see the full post details
    const bounds = [
        [40.300, -74.300], // Southwest coordinates
        [41.100, -73.600]  // Northeast coordinates
    ];

    window.map = L.map('map', {
        maxBounds: bounds,
        maxBoundsViscosity: 1.0
    }).setView([40.7128, -74.0060], 11);
    const map = window.map;

    map.invalidateSize();

    L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '© Google Maps'
    }).addTo(map);

    // Define custom marker icons
    const blueIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [18, 30],
        iconAnchor: [9, 30],
        popupAnchor: [1, -25],
        shadowSize: [30, 30]
    });

    const redIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [18, 30],
        iconAnchor: [9, 30],
        popupAnchor: [1, -25],
        shadowSize: [30, 30]
    });

    // Layer groups for markers
    const communityMarkers = L.layerGroup().addTo(map);
    const nycMarkers = L.layerGroup().addTo(map);

    // Store all markers for filtering
    let allCommunityMarkers = [];
    let allNycMarkers = [];

    //  Heatmap data arrays
    let communityHeatData = [];
    let nycHeatData = [];
    let heatLayer = null;

    let heatConfig = {
        radius: 25,
        blur: 35,
        maxZoom: 12,
        max: 0.5,
        minOpacity: 0.4,
        gradient: {
            0.0: 'blue',
            0.25: 'cyan',
            0.5: 'lime',
            0.75: 'yellow',
            1.0: 'red'
        }
    };

    // Function to update heatmap
    function updateHeatmap() {
        const showCommunity = document.getElementById('toggleCommunity').checked;
        const showNYC = document.getElementById('toggleNYC').checked;
        const showHeatmap = document.getElementById('toggleHeatmap').checked;

        // Remove existing heatmap
        if (heatLayer) {
            map.removeLayer(heatLayer);
            heatLayer = null;
        }

        if (!showHeatmap) return;

        // Combine heat data based on toggles
        let combinedData = [];
        if (showCommunity) {
            combinedData = combinedData.concat(communityHeatData);
        }
        if (showNYC) {
            combinedData = combinedData.concat(nycHeatData);
        }

        if (combinedData.length > 0) {
            heatLayer = L.heatLayer(combinedData, heatConfig).addTo(map);
        }
    }

    // Fetch and display internal posts from database (Blue markers)
    // Check if initialPosts are provided via window config (SSR optimization)
    if (window.MapConfig && window.MapConfig.initialPosts) {
        processInternalPosts(window.MapConfig.initialPosts);
    } else {
        fetch('/api/posts')
            .then(response => {
                if (!response.ok) throw new Error("Failed to fetch internal posts");
                return response.json();
            })
            .then(posts => processInternalPosts(posts))
            .catch(err => console.error("Error loading posts:", err));
    }

    function processInternalPosts(posts) {
        posts.forEach(post => {
            if (post.location && post.location.latitude && post.location.longitude) {
                const lat = post.location.latitude;
                const lng = post.location.longitude;
                communityHeatData.push([lat, lng, 0.5]);

                const postId = post._id;
                const marker = L.marker([lat, lng], {
                    icon: blueIcon,
                    borough: post.borough || "Unknown",
                    score: post.post_score || 0
                });
                allCommunityMarkers.push(marker);
                marker.addTo(communityMarkers);

                const sensitiveWarning = post.sensitive ? '<p style="color:red;font-weight:bold; font-size:12px;">Sensitive Content</p>' : '';

                // Function to refresh popup content (comments, ratings)
                const loadCommentsAndUpdatePopup = function () {
                    fetch(`/api/posts/${postId}/comments`)
                        .then(response => response.json())
                        .then(comments => {
                            // Generate HTML components using Helper
                            const commentsHtml = MapHelpers.generateCommentsHtml(comments, window.MapConfig.currentUserId, postId);

                            const avgRating = post.post_score ? post.post_score.toFixed(1) : '0.0';
                            const ratingCount = post.ratings ? post.ratings.length : 0;

                            const ratingForm = MapHelpers.generateRatingForm(postId, avgRating, ratingCount, 'community');
                            const commentForm = MapHelpers.generateCommentForm(postId);

                            // Assemble full popup
                            const fullContent = MapHelpers.generatePostPopupHtml(post, commentsHtml, ratingForm, commentForm, sensitiveWarning);

                            marker.setPopupContent(fullContent);

                            // Attach Event Listeners
                            MapHelpers.initCommentFormListener(postId, loadCommentsAndUpdatePopup); // Callback reloads popup
                        })
                        .catch(err => {
                            console.error("Error loading comments:", err);
                            const errorContent = MapHelpers.generatePostPopupHtml(post, '', '', '', sensitiveWarning + '<p style="color:red; font-size:12px;">Error loading comments</p>');
                            marker.setPopupContent(errorContent);
                        });
                };

                marker.on('popupopen', function () {
                    loadCommentsAndUpdatePopup();
                });

                // Initial Content (Loading state)
                const initialContent = MapHelpers.generatePostPopupHtml(post, '<p style="font-style:italic; color:#666; font-size:12px; margin-top:10px;">Loading comments...</p>', '', '', sensitiveWarning);
                marker.bindPopup(initialContent, { maxWidth: 350 }).addTo(communityMarkers);
            }
        });
        updateHeatmap();
    }

    // Fetch and display NYC Official Shooting Data (Red markers)
    // Using SODA API endpoint to get JSON data directly
    const nycApiUrl = "https://data.cityofnewyork.us/resource/833y-fsy8.json?$limit=500&$order=occur_date DESC"; // historical data is limited to 500

    fetch(nycApiUrl)
        .then(response => response.json())
        .then(data => {
            data.forEach(incident => {
                if (incident.latitude && incident.longitude) {
                    const lat = parseFloat(incident.latitude);
                    const lng = parseFloat(incident.longitude);

                    nycHeatData.push([lat, lng, 1.0]);

                    const incidentId = incident.incident_key || `${incident.occur_date}-${lat}-${lng}`;
                    const marker = L.marker([incident.latitude, incident.longitude], {
                        icon: redIcon,
                        borough: incident.boro, // e.g. "BROOKLYN"
                        score: 0
                    });
                    allNycMarkers.push(marker);

                    const loadDiscussionPost = function () {
                        fetch(`/api/posts?latitude=${lat}&longitude=${lng}&radius=0.001`)
                            .then(response => response.json())
                            .then(posts => {
                                const discussionPost = posts.find(p =>
                                    p.title && p.title.includes('NYC Shooting Incident') &&
                                    Math.abs(p.location.latitude - lat) < 0.0001 &&
                                    Math.abs(p.location.longitude - lng) < 0.0001
                                );

                                if (discussionPost) {
                                    // Case 1: Discussion Exists
                                    Promise.all([
                                        fetch(`/api/posts/${discussionPost._id}/comments`).then(r => r.json()),
                                        fetch(`/api/posts/${discussionPost._id}`).then(r => r.json())
                                    ])
                                        .then(([comments, updatedPost]) => {
                                            const postIdStr = String(updatedPost._id);

                                            // Generate Components
                                            const commentsHtml = MapHelpers.generateCommentsHtml(comments, window.MapConfig.currentUserId, postIdStr);

                                            const avgRating = updatedPost.post_score ? updatedPost.post_score.toFixed(1) : '0.0';
                                            const ratingCount = updatedPost.ratings ? updatedPost.ratings.length : 0;

                                            const ratingForm = MapHelpers.generateRatingForm(postIdStr, avgRating, ratingCount, 'community');
                                            const commentForm = MapHelpers.generateCommentForm(postIdStr, '#cb2b3e'); // Red button for NYC context

                                            // Assemble Popup
                                            const fullContent = MapHelpers.generateNycPopupHtml(incident, ratingForm, null, commentsHtml, commentForm);

                                            marker.setPopupContent(fullContent);

                                            // Listeners
                                            MapHelpers.initCommentFormListener(postIdStr, loadDiscussionPost);
                                        })
                                        .catch(err => console.error("Error loading discussion details:", err));
                                } else {
                                    // If No Discussion Yet
                                    // Generate Components
                                    const ratingSection = MapHelpers.generateRatingForm(incidentId, "0.0", 0, 'nyc', {
                                        id: incidentId, lat, lng,
                                        date: incident.occur_date,
                                        boro: incident.boro,
                                        time: incident.occur_time,
                                        locationDesc: incident.location_desc
                                    });

                                    const createDiscussionForm = MapHelpers.generateCreateDiscussionForm(incidentId);

                                    // Assemble Popup
                                    const fullContent = MapHelpers.generateNycPopupHtml(incident, ratingSection, createDiscussionForm);

                                    marker.setPopupContent(fullContent);

                                    // Listeners
                                    const incidentData = { lat, lng, date: incident.occur_date, boro: incident.boro, time: incident.occur_time, locationDesc: incident.location_desc };
                                    MapHelpers.initCreateDiscussionFormListener(incidentId, incidentData, () => {
                                        marker.closePopup();
                                        setTimeout(() => {
                                            marker.openPopup(); // Re-open to trigger loadDiscussionPost (which will find the new post)
                                        }, 100);
                                    });
                                }
                            })
                            .catch(err => console.error("Error loading discussion:", err));
                    };

                    marker.on('popupopen', function () {
                        loadDiscussionPost();
                    });


                    const initialContent = MapHelpers.generateIncidentPreviewHtml(incident);

                    marker.bindPopup(initialContent, { maxWidth: 350 }).addTo(nycMarkers);
                }
            });
            updateHeatmap();
        })
        .catch(err => console.error("Error loading NYC data:", err));

    // Click event to create a new Post
    map.on('click', function (e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        // Check bounds (Double check client side)
        if (lat < 40.496 || lat > 40.916 || lng < -74.258 || lng > -73.699) {
            alert("Location is outside of NYC.");
            return;
        }

        const popupContent = MapHelpers.generateReportFormHtml(lat, lng);

        L.popup()
            .setLatLng(e.latlng)
            .setContent(popupContent)
            .openOn(map);
    });
    document.getElementById('toggleHeatmap').addEventListener('change', function () {
        updateHeatmap();

        // Auto interaction: If Heatmap ON, turn Markers OFF for clarity
        const markersToggle = document.getElementById('toggleMarkers');
        if (this.checked && markersToggle.checked) {
            markersToggle.checked = false;
            markersToggle.dispatchEvent(new Event('change')); // Trigger marker logic
        }
    });

    document.getElementById('toggleMarkers').addEventListener('change', function () {
        if (this.checked) {
            if (document.getElementById('toggleCommunity').checked) {
                map.addLayer(communityMarkers);
            }
            if (document.getElementById('toggleNYC').checked) {
                map.addLayer(nycMarkers);
            }
        } else {
            map.removeLayer(communityMarkers);
            map.removeLayer(nycMarkers);
        }
    });

    document.getElementById('toggleCommunity').addEventListener('change', function () {
        if (this.checked && document.getElementById('toggleMarkers').checked) {
            map.addLayer(communityMarkers);
        } else {
            map.removeLayer(communityMarkers);
        }
        updateHeatmap();
    });

    document.getElementById('toggleNYC').addEventListener('change', function () {
        if (this.checked && document.getElementById('toggleMarkers').checked) {
            map.addLayer(nycMarkers);
        } else {
            map.removeLayer(nycMarkers);
        }
        updateHeatmap();
    });

    // Filter Logic
    const filterBorough = document.getElementById('filterBorough');
    const filterMinScore = document.getElementById('filterMinScore');
    const minScoreVal = document.getElementById('minScoreVal');

    function applyMapFilters() {
        const borough = filterBorough.value;
        const minScore = parseFloat(filterMinScore.value);
        minScoreVal.textContent = minScore;

        // Clear current markers from groups
        communityMarkers.clearLayers();
        nycMarkers.clearLayers();

        // Re-add matches for Community Markers
        allCommunityMarkers.forEach(marker => {
            let visible = true;
            // Borough check
            if (borough !== "All") {
                const b = marker.options.borough || "";
                if (b.toLowerCase() !== borough.toLowerCase()) visible = false;
            }
            // Score check
            const score = marker.options.score || 0;
            if (score < minScore) visible = false;

            if (visible) {
                marker.addTo(communityMarkers);
            }
        });

        // Re-add matches for NYC Markers
        allNycMarkers.forEach(marker => {
            let visible = true;
            // Borough check
            if (borough !== "All") {
                const b = marker.options.borough || "";
                if (b.toLowerCase() !== borough.toLowerCase()) visible = false;
            }

            const score = marker.options.score || 0;
            if (score < minScore) visible = false;

            if (visible) {
                marker.addTo(nycMarkers);
            }
        });

    }

    filterBorough.addEventListener('change', applyMapFilters);
    filterMinScore.addEventListener('input', applyMapFilters);

    document.getElementById('heatRadius').addEventListener('input', function () {
        heatConfig.radius = parseInt(this.value);
        document.getElementById('radiusValue').textContent = this.value;
        updateHeatmap();
    });

    document.getElementById('heatIntensity').addEventListener('input', function () {
        heatConfig.max = parseFloat(this.value);
        document.getElementById('intensityValue').textContent = this.value;
        updateHeatmap();
    });

    // Add Legend
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'legend');
        div.innerHTML = MapHelpers.generateLegendHtml();
        return div;
    };
    legend.addTo(map);
});

function deleteMapComment(postId, commentId, refreshPostId) {
    if (!confirm('Are you sure you want to delete this comment?')) {
        return;
    }

    fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
    })
        .then(response => {
            if (response.ok) {
                const commentElement = document.getElementById(`comment-${commentId}`);
                if (commentElement) {
                    commentElement.remove();
                }
                if (window.map) {
                    const allMarkers = [];
                    window.map.eachLayer(layer => {
                        if (layer instanceof L.Marker && layer.isPopupOpen()) {
                            allMarkers.push(layer);
                        }
                    });
                    if (allMarkers.length > 0) {
                        const openMarker = allMarkers[0];
                        openMarker.fire('popupopen');
                    }
                }
            } else {
                return response.json().then(data => {
                    alert('Error: ' + (data.error || 'Failed to delete comment'));
                });
            }
        })
        .catch(err => {
            alert('Error deleting comment: ' + err.message);
            console.error(err);
        });
}

window.ratePost = function (postId, rating, refreshPostId) {
    const avgRatingElement = document.getElementById(`map-avg-rating-${refreshPostId || postId}`);
    if (!avgRatingElement) {
        console.error('Rating element not found:', `map-avg-rating-${refreshPostId || postId}`);
    }

    return fetch(`/api/posts/${postId}/rate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ rating: rating })
    })
        .then(response => {
            if (response.ok) {
                return response.json().then(data => {
                    if (avgRatingElement) {
                        avgRatingElement.textContent = data.averageRating.toFixed(1);
                    } else {
                        const retryElement = document.getElementById(`map-avg-rating-${refreshPostId || postId}`);
                        if (retryElement) {
                            retryElement.textContent = data.averageRating.toFixed(1);
                        }
                    }
                    return data;
                });
            } else {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to rate post');
                });
            }
        })
        .catch(err => {
            alert('Error rating post: ' + err.message);
            console.error(err);
            throw err;
        });
};

window.rateNYCIncident = function (incidentId, rating, lat, lng, occurDate, boro, occurTime, locationDesc) {
    fetch(`/api/posts?latitude=${lat}&longitude=${lng}&radius=0.001`, { credentials: 'include' })
        .then(response => response.json())
        .then(posts => {
            let discussionPost = posts.find(p =>
                p.title && p.title.includes('NYC Shooting Incident') &&
                Math.abs(p.location.latitude - lat) < 0.0001 &&
                Math.abs(p.location.longitude - lng) < 0.0001
            );

            if (!discussionPost) {
                const title = `NYC Shooting Incident - ${occurDate} - ${boro}`;
                const body = `Official NYC Shooting Incident\n\nDate: ${occurDate}\nTime: ${occurTime}\nBorough: ${boro}\nLocation: ${locationDesc}`;

                return fetch('/api/posts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        title: title,
                        body: body,
                        location: {
                            latitude: lat,
                            longitude: lng
                        },
                        photo: null,
                        sensitive: false
                    })
                })
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        } else {
                            return response.json().then(data => {
                                throw new Error(data.error || 'Failed to create discussion');
                            });
                        }
                    })
                    .then(post => {
                        discussionPost = post;
                        return window.ratePost(post._id, rating, post._id).then(() => {
                            if (window.map) {
                                window.map.eachLayer(layer => {
                                    if (layer instanceof L.Marker && layer.isPopupOpen()) {
                                        const popupContent = layer.getPopup().getContent();
                                        if (popupContent && popupContent.includes(incidentId)) {
                                            layer.fire('popupopen');
                                        }
                                    }
                                });
                            }
                        });
                    });
            } else {
                return window.ratePost(discussionPost._id, rating, discussionPost._id);
            }
        })
        .catch(err => {
            alert('Error rating incident: ' + err.message);
            console.error(err);
        });
};
