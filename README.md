# NYC Danger Map
### CS 546 - Group 9 Project

### Team Members:
* Tian Zhou
* Justin Carnemolla
* Carlihanny Sanchez
* Michelle Elias Flores

### Introduction/Description:
Our team talked about different datasets and different approaches we wanted to take for this project and we all decided to focus on safety and helping other people new and local to the NYC area to log in and alert other people about safety issues in different parts of the city.

This will serve as a forum where all users can log in and log different concerns and happenings within different locations in New York City. The main goal of this project is to be informative and spread awareness about different spots in the city and help the community stay alert with a user-friendly UI.

Our site also aims to show the frequency of the crimes in the area for different areas based on user input. This will allow for more accurate results and general areas to look out for when users are planning out their routes for their journeys. 

Our data source is the NYPD Crime Data from 2020-2024: https://data.cityofnewyork.us/Public-Safety/NYPD-Shooting-Incident-Data-Historic-/833y-fsy8/about_data. (api link: https://data.cityofnewyork.us/api/v3/views/833y-fsy8/query.json)
### How to Run:
**Prerequisites**:
*   Node.js (v14 or higher recommended)
*   MongoDB installed and running locally on port `27017`.

**1. Clone the repository:**
```bash
git clone https://github.com/TianZhouSunday/26Spring_CS546_Group9_Project.git
cd 26Spring_CS546_Group9_Project
```

**2. Setup and Run:**
Navigate to the server directory, install dependencies, and start the application.

```bash
cd server
npm install
npm start
```
*The application will be accessible at [http://localhost:3000](http://localhost:3000).*

**3. Database Configuration:**
The application connects to a MongoDB database named `nyc_danger_map`. Ensure your MongoDB service is running before starting the server. Configuration can be found in `server/config/settings.js`.
