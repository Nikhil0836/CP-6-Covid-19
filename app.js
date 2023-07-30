const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initialize = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Success"));
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initialize();

//API1

const convertStateDbObjToResponseObj = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const getAllStateQuery = `
    SELECT
    *
    FROM
    state;`;
  const stateArray = await db.all(getAllStateQuery);
  response.send(stateArray.map((i) => convertStateDbObjToResponseObj(i)));
});

//API2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateIdQuery = `
    SELECT
    *
    FROM
    state
    WHERE
    state_id = ${stateId};`;
  const stateIdArray = await db.get(getStateIdQuery);
  response.send(convertStateDbObjToResponseObj(stateIdArray));
});

//API 3

app.post("/districts/", async (request, response) => {
  const details = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = details;
  const postDistrictsQuery = `
  INSERT INTO 
  district (district_name, state_id, cases, cured, active, deaths)
  VALUES
  ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  await db.run(postDistrictsQuery);
  response.send("District Successfully Added");
});

//API 4

const districtObjToResponseObj = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
    SELECT
    *
    FROM
    district
    WHERE
    district_id = ${districtId};`;
  const responseQuery = await db.get(getDistrictIdQuery);
  response.send(districtObjToResponseObj(responseQuery));
});

//API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictIdQuery = `
    DELETE FROM district WHERE district_id = ${districtId};`;
  await db.run(deleteDistrictIdQuery);
  response.send("District Removed");
});

//API 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const details = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = details;
  const updateQuery = `
    UPDATE
        district
    SET
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE
        district_id = ${districtId};`;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

//API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getDistrictStateQuery = `
    SELECT
    SUM(cases) as totalCases,
    SUM(cured) as totalCured,
    SUM(active) as totalActive,
    SUM(deaths) as totalDeaths
    FROM
    district
    WHERE
    state_id = ${stateId};`;
  const stateArray = await db.get(getDistrictStateQuery);
  response.send(stateArray);
});

//API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
    select state_id from district
    where district_id = ${districtId};
    `;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  const getStateNameQuery = `
    select state_name as stateName from state
    where state_id = ${getDistrictIdQueryResponse.state_id};
    `;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
