const express = require('express')
const app = express()

app.get('/patients',getPatients)

//Gives all patient info in either JSON or HTML form
function getPatients(req, res) {
  if(req.headers['accept'].includes('text/html')) {
    //Send patient info as HTML
  } else if(req.headers['accept'].includes('application/json')) {
    //Send patient info as JSON
  } else {
    //An unsupported request
  }
  res.send("GET Patients");
}

app.post('/patients',addPatient)

//Adds the patient to the database
function addPatient(req, res) {
  res.send("ADD Patients");
}

app.get('/patients/:patientID',getPatient)

//Returns the info for a single patient
function getPatient(req, res) {
  if(req.headers['accept'].includes('text/html')) {
    //Send patient info as HTML
  } else if(req.headers['accept'].includes('application/json')) {
    //Send patient info as JSON
  } else {
    //An unsupported request
  }
  res.send("GET Patient " + req.params['patientID']);
}

app.delete('/patients/:patientID',deletePatient)

//Deletes this patient from the database
function deletePatient(req, res) {
  res.send("DELETE Patient " + req.params['patientID']);
}

app.get('/patients/:patientID/sessions',getPatientSessions)

//Returns the info for a patients activity sessions
function getPatientSessions(req, res) {
  if(req.headers['accept'].includes('text/html')) {
    //Send patient info as HTML
  } else if(req.headers['accept'].includes('application/json')) {
    //Send patient info as JSON
  } else {
    //An unsupported request
  }
  res.send("GET Sessions For Patient " + req.params['patientID']);
}

app.post('/patients/:patientID/sessions',addPatientSession)

//Adds the session for the given patient to the database
function addPatientSession(req, res) {
  res.send("Add Patient Session for Patient " + req.params['patientID']);
}

app.get('/patients/:patientID/sessions/:sessionID',getSession)

//Returns the info for a single patient session
function getSession(req, res) {
  if(req.headers['accept'].includes('text/html')) {
    //Send patient info as HTML
  } else if(req.headers['accept'].includes('application/json')) {
    //Send patient info as JSON
  } else {
    //An unsupported request
  }
  res.send("GET Patient Session for Patient" + req.params['patientID'] + " At Session ID " + req.params['sessionID']);
}

app.delete('/patients/:patientID/sessions/:sessionID',deletePatientSession)

//Deletes this patient session from the database
function deletePatientSession(req, res) {
  res.send("DELETE Patient Session for Patient" + req.params['patientID'] + " At Session ID " + req.params['sessionID']);
}

app.get('/therapists',getAllTherapists)

//Gives all therapist info in either JSON or HTML form
function getAllTherapists(req, res) {
  if(req.headers['accept'].includes('text/html')) {
    //Send therapist info as HTML
  } else if(req.headers['accept'].includes('application/json')) {
    //Send therapist info as JSON
  } else {
    //An unsupported request
  }
  res.send("GET Therapists");
}

app.post('/therapists',addTherapist)

//Adds the therapist to the database
function addTherapist(req, res) {
  res.send("ADD Therapist");
}

app.get('/patients/:therapistID',getTherapist)

//Returns the info for a single therapist
function getTherapist(req, res) {
  if(req.headers['accept'].includes('text/html')) {
    //Send therapist info as HTML
  } else if(req.headers['accept'].includes('application/json')) {
    //Send therapist info as JSON
  } else {
    //An unsupported request
  }
  res.send("GET Therapist " + req.params['therapistID']);
}

app.delete('/patients/:therapistID',deleteTherpist)

//Deletes this therapist from the database
function deleteTherpist(req, res) {
  res.send("DELETE Therapist " + req.params['therapistID']);
}

app.get('/patients/:therapistID/patients',getTherapistPatients)

//Returns the info for all patients of this therapist
function getTherapistPatients(req, res) {
  if(req.headers['accept'].includes('text/html')) {
    //Send therapist-patient info as HTML
  } else if(req.headers['accept'].includes('application/json')) {
    //Send therapist-patient info as JSON
  } else {
    //An unsupported request
  }
  res.send("GET Patients for Therapist " + req.params['therapistID']);
}


app.listen(3000, () => console.log('Example app listening on port 3000!'))