//Returns the info for a patients activity sessions
// Request Response PatientDB -> Void
exports.getPatientSessions = function (req, res) {
    req.patientDB.get_patient_sessions(req.params.patientID).then(sessions => {
            req.responder.report_sucess(req, res, sessions, 'patient/patient-session-overview', {
                username: req.params.patientID,
                sessions: sessions
            });
    }).catch(error => {
        req.responder.report_not_found(req, res);
    });
}

//Adds the session for the given patient to the database
// Request Response PatientDB -> Void
exports.addPatientSession = function (req, res) {
    req.patientDB.add_patient_session(req.params.patientID, req.body).then(() => {
        req.responder.report_sucess_no_info(req, res);
    }).catch(error => {
        throw error;
        req.responder.report_not_found(req, res);
    })
}