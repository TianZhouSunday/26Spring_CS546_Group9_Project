import React from 'react';

function Home() {
  return (
    <div className="page">
      <h1>Welcome to NYC Danger Map</h1>
      <p>Stay informed about safety incidents in your neighborhood.</p>
      
      <div className="feature-section">
        <h2>Recent Incidents</h2>
        <div className="incident-list">
          {/* This is where posts will go later */}
          <div className="incident-placeholder">
            <p>No incidents to display yet.</p>
            <p>Check back later or report an incident!</p>
          </div>
        </div>
      </div>

      <div className="feature-section">
        <h2>Report an Incident</h2>
        <div className="form-placeholder">
          {/* Post form will go here later */}
          <p>Post form coming soon...</p>
        </div>
      </div>
    </div>
  );
}

export default Home;